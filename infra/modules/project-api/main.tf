# One Lambda ("lambdalith", Hono) behind an HTTP API, reachable only via the project's Worker
# (origin secret, docs/architecture.md §2). Writes its outputs to /dr4w/<project>/<env>/*.

locals {
  name       = "dr4w-${var.project}-${var.env}-api"
  ssm_prefix = "/dr4w/${var.project}/${var.env}"
  bus_name   = "dr4w-bus"
}

data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}

data "aws_ssm_parameter" "alerts_topic_arn" {
  name = "/dr4w/platform/alerts_topic_arn"
}

data "aws_ssm_parameter" "bus_arn" {
  count = var.publishes_events ? 1 : 0
  name  = "/dr4w/platform/bus_arn"
}

# ── Origin secret (Worker → API) ─────────────────────────────────────────────
resource "random_password" "origin_secret" {
  length  = 48
  special = false
}

resource "aws_ssm_parameter" "origin_secret" {
  name  = "${local.ssm_prefix}/origin_secret"
  type  = "SecureString"
  value = random_password.origin_secret.result
}

# ── IAM ──────────────────────────────────────────────────────────────────────
data "aws_iam_policy_document" "assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "api" {
  name                 = local.name
  assume_role_policy   = data.aws_iam_policy_document.assume.json
  permissions_boundary = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:policy/dr4w-boundary"
}

data "aws_iam_policy_document" "api" {
  statement {
    sid       = "Logs"
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["${aws_cloudwatch_log_group.api.arn}:*"]
  }

  statement {
    sid       = "OriginSecret"
    actions   = ["ssm:GetParameter"]
    resources = [aws_ssm_parameter.origin_secret.arn]
  }

  dynamic "statement" {
    for_each = var.publishes_events ? [1] : []
    content {
      sid       = "PublishEvents"
      actions   = ["events:PutEvents"]
      resources = [data.aws_ssm_parameter.bus_arn[0].value]
    }
  }

  dynamic "statement" {
    for_each = var.iam_statements
    content {
      sid       = statement.value.sid
      actions   = statement.value.actions
      resources = statement.value.resources
    }
  }
}

resource "aws_iam_role_policy" "api" {
  name   = "app"
  role   = aws_iam_role.api.id
  policy = data.aws_iam_policy_document.api.json
}

# ── Lambda ───────────────────────────────────────────────────────────────────
resource "aws_cloudwatch_log_group" "api" {
  name              = "/aws/lambda/${local.name}"
  retention_in_days = var.log_retention_days
}

data "archive_file" "api" {
  type        = "zip"
  source_dir  = var.dist_dir
  output_path = "${path.root}/.build/${local.name}.zip"
}

resource "aws_lambda_function" "api" {
  function_name                  = local.name
  role                           = aws_iam_role.api.arn
  runtime                        = "nodejs24.x"
  architectures                  = ["arm64"]
  handler                        = var.handler
  filename                       = data.archive_file.api.output_path
  source_code_hash               = data.archive_file.api.output_base64sha256
  memory_size                    = var.memory_mb
  timeout                        = var.timeout_s
  reserved_concurrent_executions = coalesce(var.reserved_concurrency, -1)

  environment {
    variables = merge(
      {
        NODE_OPTIONS        = "--enable-source-maps"
        ORIGIN_SECRET_PARAM = aws_ssm_parameter.origin_secret.name
      },
      var.publishes_events ? { BUS_NAME = local.bus_name } : {},
      { for k, v in var.environment : k => v if v != null },
    )
  }

  depends_on = [aws_cloudwatch_log_group.api, aws_iam_role_policy.api]
}

# ── HTTP API ─────────────────────────────────────────────────────────────────
resource "aws_apigatewayv2_api" "api" {
  name          = local.name
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "api" {
  api_id                 = aws_apigatewayv2_api.api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.api.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "default" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.api.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.api.id
  name        = "$default"
  auto_deploy = true

  # Cost cap against abuse of the public execute-api URL.
  default_route_settings {
    throttling_rate_limit  = var.throttle_rate
    throttling_burst_limit = var.throttle_burst
  }
}

resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowHttpApi"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api.execution_arn}/*/*"
}

# ── Alarms → dr4w-alerts ─────────────────────────────────────────────────────
resource "aws_cloudwatch_metric_alarm" "errors" {
  alarm_name          = "${local.name}-errors"
  namespace           = "AWS/Lambda"
  metric_name         = "Errors"
  dimensions          = { FunctionName = aws_lambda_function.api.function_name }
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 1
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [data.aws_ssm_parameter.alerts_topic_arn.value]
}

resource "aws_cloudwatch_metric_alarm" "api_5xx" {
  alarm_name          = "${local.name}-5xx"
  namespace           = "AWS/ApiGateway"
  metric_name         = "5xx"
  dimensions          = { ApiId = aws_apigatewayv2_api.api.id, Stage = "$default" }
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 1
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [data.aws_ssm_parameter.alerts_topic_arn.value]
}

# ── Outputs for other projects: /dr4w/<project>/<env>/* ──────────────────────
resource "aws_ssm_parameter" "outputs" {
  for_each = {
    api_url       = aws_apigatewayv2_api.api.api_endpoint
    function_name = aws_lambda_function.api.function_name
    function_arn  = aws_lambda_function.api.arn
    role_name     = aws_iam_role.api.name
  }
  name  = "${local.ssm_prefix}/${each.key}"
  type  = "String"
  value = each.value
}
