# EventBridge Scheduler → the project's Lambda. The payload is a bus-style envelope
# (source "dr4w.cron", detail-type "Cron.<name>.v1"), so it lands in ./events.ts like any event.

variable "project" {
  type = string
}

variable "env" {
  type = string
}

variable "name" {
  description = "Schedule name, e.g. \"daily-digest\"."
  type        = string
}

variable "schedule" {
  description = "e.g. \"rate(1 day)\" or \"cron(0 9 * * ? *)\""
  type        = string
}

variable "timezone" {
  type    = string
  default = "UTC"
}

variable "function_arn" {
  type = string
}

data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}

locals {
  full_name = "dr4w-${var.project}-${var.env}-${var.name}"
}

data "aws_iam_policy_document" "assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["scheduler.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [data.aws_caller_identity.current.account_id]
    }
  }
}

resource "aws_iam_role" "scheduler" {
  name                 = "${local.full_name}-cron"
  assume_role_policy   = data.aws_iam_policy_document.assume.json
  permissions_boundary = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:policy/dr4w-boundary"
}

resource "aws_iam_role_policy" "scheduler" {
  name = "invoke"
  role = aws_iam_role.scheduler.id
  policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [{ Effect = "Allow", Action = "lambda:InvokeFunction", Resource = var.function_arn }]
  })
}

resource "aws_scheduler_schedule" "this" {
  name                         = local.full_name
  schedule_expression          = var.schedule
  schedule_expression_timezone = var.timezone

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = var.function_arn
    role_arn = aws_iam_role.scheduler.arn
    input = jsonencode({
      id            = "<aws.scheduler.execution-id>"
      source        = "dr4w.cron"
      "detail-type" = "Cron.${var.name}.v1"
      time          = "<aws.scheduler.scheduled-time>"
      detail        = {}
    })
    retry_policy {
      maximum_retry_attempts = 3
    }
  }
}

output "schedule_arn" {
  value = aws_scheduler_schedule.this.arn
}
