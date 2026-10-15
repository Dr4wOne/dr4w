# Rule on dr4w-bus → the consumer project's Lambda (its createLambdaHandler dispatches by
# source + detail-type). Plan fails unless the provider exposes `events` to the consumer.

variable "project" {
  description = "Consumer project."
  type        = string
}

variable "env" {
  type = string
}

variable "provider_project" {
  description = "Project that publishes the events (source = dr4w.<provider_project>)."
  type        = string
}

variable "detail_types" {
  description = "e.g. [\"Note.Created.v1\"]"
  type        = list(string)
}

variable "function_arn" {
  description = "Consumer Lambda (module.api.function_arn)."
  type        = string
}

variable "function_name" {
  type = string
}

locals {
  provider_manifest = jsondecode(file("${path.module}/../../../apps/${var.provider_project}/project.json"))
  granted           = contains(lookup(local.provider_manifest.exposes, var.project, []), "events")
  name              = "dr4w-${var.project}-${var.env}-from-${var.provider_project}"
}

resource "aws_cloudwatch_event_rule" "this" {
  name           = local.name
  event_bus_name = "dr4w-bus"
  event_pattern = jsonencode({
    source        = ["dr4w.${var.provider_project}"]
    "detail-type" = var.detail_types
  })

  lifecycle {
    precondition {
      condition     = local.granted
      error_message = "apps/${var.provider_project}/project.json must expose \"events\" to \"${var.project}\"."
    }
  }
}

resource "aws_cloudwatch_event_target" "this" {
  rule           = aws_cloudwatch_event_rule.this.name
  event_bus_name = "dr4w-bus"
  arn            = var.function_arn

  retry_policy {
    maximum_event_age_in_seconds = 3600
    maximum_retry_attempts       = 10
  }
}

resource "aws_lambda_permission" "this" {
  statement_id  = "AllowFrom-${var.provider_project}"
  action        = "lambda:InvokeFunction"
  function_name = var.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.this.arn
}

output "rule_arn" {
  value = aws_cloudwatch_event_rule.this.arn
}
