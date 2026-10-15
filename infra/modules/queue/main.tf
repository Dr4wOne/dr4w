# SQS queue + DLQ, optionally consumed by the project's Lambda (event source mapping).

variable "project" {
  type = string
}

variable "env" {
  type = string
}

variable "key" {
  description = "Queue key; queue is dr4w-<project>-<env>-<key>."
  type        = string
  default     = "main"
}

variable "consumer_function_name" {
  description = "Lambda that processes messages (module.api.function_name); null = no consumer."
  type        = string
  default     = null
}

variable "batch_size" {
  type    = number
  default = 10
}

variable "visibility_timeout_s" {
  description = "Must be ≥ the consumer Lambda timeout."
  type        = number
  default     = 60
}

variable "max_receive_count" {
  type    = number
  default = 5
}

locals {
  name = "dr4w-${var.project}-${var.env}-${var.key}"
}

resource "aws_sqs_queue" "dlq" {
  name                      = "${local.name}-dlq"
  message_retention_seconds = 1209600 # 14 days
  sqs_managed_sse_enabled   = true
}

resource "aws_sqs_queue" "this" {
  name                       = local.name
  visibility_timeout_seconds = var.visibility_timeout_s
  sqs_managed_sse_enabled    = true
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = var.max_receive_count
  })
}

resource "aws_lambda_event_source_mapping" "this" {
  count                   = var.consumer_function_name == null ? 0 : 1
  event_source_arn        = aws_sqs_queue.this.arn
  function_name           = var.consumer_function_name
  batch_size              = var.batch_size
  function_response_types = ["ReportBatchItemFailures"]
}

resource "aws_ssm_parameter" "outputs" {
  for_each = {
    "queue_${var.key}_url" = aws_sqs_queue.this.url
    "queue_${var.key}_arn" = aws_sqs_queue.this.arn
  }
  name  = "/dr4w/${var.project}/${var.env}/${each.key}"
  type  = "String"
  value = each.value
}

output "url" {
  value = aws_sqs_queue.this.url
}

output "arn" {
  value = aws_sqs_queue.this.arn
}

# Pass to project-api: send + (if consumed) receive/delete.
output "iam_statements" {
  value = [{
    sid       = "Queue${title(replace(var.key, "-", ""))}"
    actions   = ["sqs:SendMessage", "sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:ChangeMessageVisibility", "sqs:GetQueueAttributes"]
    resources = [aws_sqs_queue.this.arn]
  }]
}
