# Permissions boundary for every IAM role the deploy role creates (Lambda, Scheduler, …).
# It caps what workload roles can ever do, even if a module grants too much:
# only data-plane access to dr4w-* resources, never IAM/STS/Organizations.

locals {
  arn_prefix = "arn:${local.partition}"
  acct       = local.account_id
}

data "aws_iam_policy_document" "boundary" {
  statement {
    sid = "DataPlaneOnDr4wResources"
    actions = [
      "dynamodb:BatchGetItem",
      "dynamodb:BatchWriteItem",
      "dynamodb:ConditionCheckItem",
      "dynamodb:DeleteItem",
      "dynamodb:DescribeStream",
      "dynamodb:GetItem",
      "dynamodb:GetRecords",
      "dynamodb:GetShardIterator",
      "dynamodb:ListStreams",
      "dynamodb:PutItem",
      "dynamodb:Query",
      "dynamodb:Scan",
      "dynamodb:UpdateItem",
      "events:PutEvents",
      "lambda:InvokeFunction",
      "s3:DeleteObject",
      "s3:GetObject",
      "s3:ListBucket",
      "s3:PutObject",
      "sqs:ChangeMessageVisibility",
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes",
      "sqs:ReceiveMessage",
      "sqs:SendMessage",
      "ssm:GetParameter",
      "ssm:GetParameters",
      "ssm:GetParametersByPath",
    ]
    resources = [
      "${local.arn_prefix}:dynamodb:*:${local.acct}:table/dr4w-*",
      "${local.arn_prefix}:events:*:${local.acct}:event-bus/dr4w-*",
      "${local.arn_prefix}:lambda:*:${local.acct}:function:dr4w-*",
      "${local.arn_prefix}:s3:::dr4w-*",
      "${local.arn_prefix}:sqs:*:${local.acct}:dr4w-*",
      "${local.arn_prefix}:ssm:*:${local.acct}:parameter/dr4w/*",
    ]
  }

  statement {
    sid       = "OwnLogs"
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["${local.arn_prefix}:logs:*:${local.acct}:log-group:/aws/lambda/dr4w-*"]
  }

  statement {
    sid       = "SharedPostgresDataApi"
    actions   = ["rds-data:ExecuteStatement", "rds-data:BatchExecuteStatement", "rds-data:BeginTransaction", "rds-data:CommitTransaction", "rds-data:RollbackTransaction"]
    resources = ["${local.arn_prefix}:rds:*:${local.acct}:cluster:dr4w-*"]
  }

  statement {
    sid       = "PostgresCredentials"
    actions   = ["secretsmanager:GetSecretValue"]
    resources = ["${local.arn_prefix}:secretsmanager:*:${local.acct}:secret:dr4w-*"]
  }

  statement {
    sid       = "DecryptSecureStringsViaSsm"
    actions   = ["kms:Decrypt"]
    resources = ["*"]
    condition {
      test     = "StringEquals"
      variable = "kms:ViaService"
      values   = ["ssm.${var.region}.amazonaws.com", "secretsmanager.${var.region}.amazonaws.com"]
    }
  }
}

resource "aws_iam_policy" "boundary" {
  name        = "dr4w-boundary"
  description = "Permissions boundary for all roles created by dr4w-ci-deploy"
  policy      = data.aws_iam_policy_document.boundary.json
}
