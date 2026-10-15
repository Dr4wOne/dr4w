# Private S3 bucket for a project (uploads, exports…). Never public; TLS only.

variable "project" {
  type = string
}

variable "env" {
  type = string
}

variable "key" {
  type    = string
  default = "main"
}

variable "expire_after_days" {
  description = "Delete objects after N days; null = keep forever."
  type        = number
  default     = null
}

data "aws_caller_identity" "current" {}

locals {
  name = "dr4w-${var.project}-${var.env}-${var.key}-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket" "this" {
  bucket = local.name
}

resource "aws_s3_bucket_public_access_block" "this" {
  bucket                  = aws_s3_bucket.this.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "tls_only" {
  bucket = aws_s3_bucket.this.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "DenyInsecureTransport"
      Effect    = "Deny"
      Principal = "*"
      Action    = "s3:*"
      Resource  = [aws_s3_bucket.this.arn, "${aws_s3_bucket.this.arn}/*"]
      Condition = { Bool = { "aws:SecureTransport" = "false" } }
    }]
  })
  depends_on = [aws_s3_bucket_public_access_block.this]
}

resource "aws_s3_bucket_lifecycle_configuration" "this" {
  count  = var.expire_after_days == null ? 0 : 1
  bucket = aws_s3_bucket.this.id
  rule {
    id     = "expire"
    status = "Enabled"
    filter {}
    expiration {
      days = var.expire_after_days
    }
  }
}

resource "aws_ssm_parameter" "name" {
  name  = "/dr4w/${var.project}/${var.env}/bucket_${var.key}_name"
  type  = "String"
  value = aws_s3_bucket.this.bucket
}

output "name" {
  value = aws_s3_bucket.this.bucket
}

output "arn" {
  value = aws_s3_bucket.this.arn
}

output "iam_statements" {
  value = [{
    sid       = "Bucket${title(replace(var.key, "-", ""))}"
    actions   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket"]
    resources = [aws_s3_bucket.this.arn, "${aws_s3_bucket.this.arn}/*"]
  }]
}
