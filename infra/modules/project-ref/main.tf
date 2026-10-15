# Read another project's outputs (/dr4w/<provider>/<env>/*) and get least-privilege IAM
# statements for exactly what the provider exposes to this consumer in its project.json.

variable "provider_project" {
  type = string
}

variable "consumer" {
  description = "The project using this module."
  type        = string
}

variable "env" {
  type    = string
  default = "prod"
}

data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}
data "aws_region" "current" {}

locals {
  manifest = jsondecode(file("${path.module}/../../../apps/${var.provider_project}/project.json"))
  grants   = lookup(local.manifest.exposes, var.consumer, [])
  prefix   = "/dr4w/${var.provider_project}/${var.env}/"
  arn      = "arn:${data.aws_partition.current.partition}"
  region   = data.aws_region.current.region
  acct     = data.aws_caller_identity.current.account_id
}

data "aws_ssm_parameters_by_path" "outputs" {
  path            = local.prefix
  with_decryption = false

  lifecycle {
    precondition {
      condition     = length(local.grants) > 0
      error_message = "apps/${var.provider_project}/project.json has no exposes entry for \"${var.consumer}\"."
    }
  }
}

locals {
  # SecureStrings (e.g. origin_secret) are never handed to other projects.
  outputs = {
    for i, name in data.aws_ssm_parameters_by_path.outputs.names :
    trimprefix(name, local.prefix) => nonsensitive(data.aws_ssm_parameters_by_path.outputs.values[i])
    if nonsensitive(data.aws_ssm_parameters_by_path.outputs.types[i]) == "String"
  }
  table  = lookup(local.outputs, "table_main_name", null)
  bucket = lookup(local.outputs, "bucket_main_name", null)
  queue  = lookup(local.outputs, "queue_main_arn", null)

  statements = concat(
    contains(local.grants, "table:read") && local.table != null ? [{
      sid       = "Read${title(var.provider_project)}Table"
      actions   = ["dynamodb:GetItem", "dynamodb:BatchGetItem", "dynamodb:Query", "dynamodb:Scan"]
      resources = ["${local.arn}:dynamodb:${local.region}:${local.acct}:table/${local.table}", "${local.arn}:dynamodb:${local.region}:${local.acct}:table/${local.table}/index/*"]
    }] : [],
    contains(local.grants, "table:write") && local.table != null ? [{
      sid       = "Write${title(var.provider_project)}Table"
      actions   = ["dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:DeleteItem", "dynamodb:BatchWriteItem"]
      resources = ["${local.arn}:dynamodb:${local.region}:${local.acct}:table/${local.table}"]
    }] : [],
    contains(local.grants, "bucket:read") && local.bucket != null ? [{
      sid       = "Read${title(var.provider_project)}Bucket"
      actions   = ["s3:GetObject", "s3:ListBucket"]
      resources = ["${local.arn}:s3:::${local.bucket}", "${local.arn}:s3:::${local.bucket}/*"]
    }] : [],
    contains(local.grants, "queue:send") && local.queue != null ? [{
      sid       = "SendTo${title(var.provider_project)}Queue"
      actions   = ["sqs:SendMessage"]
      resources = [local.queue]
    }] : [],
  )
}

output "outputs" {
  description = "Provider's String outputs, e.g. api_url, table_main_name."
  value       = local.outputs
}

output "grants" {
  value = local.grants
}

output "iam_statements" {
  value = local.statements
}
