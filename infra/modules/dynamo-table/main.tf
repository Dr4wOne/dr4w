# On-demand DynamoDB table: $0 when idle. Key schema comes from tables.json.

locals {
  name = "dr4w-${var.project}-${var.env}-${var.key}"
}

resource "aws_dynamodb_table" "this" {
  name                        = local.name
  billing_mode                = "PAY_PER_REQUEST"
  hash_key                    = var.spec.hashKey
  range_key                   = var.spec.rangeKey
  deletion_protection_enabled = var.deletion_protection

  dynamic "attribute" {
    for_each = var.spec.attributes
    content {
      name = attribute.key
      type = attribute.value
    }
  }

  dynamic "global_secondary_index" {
    for_each = var.spec.globalSecondaryIndexes
    content {
      name            = global_secondary_index.value.name
      hash_key        = global_secondary_index.value.hashKey
      range_key       = global_secondary_index.value.rangeKey
      projection_type = "ALL"
    }
  }

  dynamic "ttl" {
    for_each = var.spec.ttlAttribute == null ? [] : [var.spec.ttlAttribute]
    content {
      attribute_name = ttl.value
      enabled        = true
    }
  }
}

resource "aws_ssm_parameter" "name" {
  name  = "/dr4w/${var.project}/${var.env}/table_${var.key}_name"
  type  = "String"
  value = aws_dynamodb_table.this.name
}
