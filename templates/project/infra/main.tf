# __NAME__ infrastructure. Add resources with `/resource __NAME__ <table|queue|bucket|cron|event>`.

locals {
  project = jsondecode(file("${path.module}/../project.json"))
  tables  = jsondecode(file("${path.module}/tables.json"))
}

module "tables" {
  source   = "../../../infra/modules/dynamo-table"
  for_each = local.tables
  project  = local.project.name
  env      = var.env
  key      = each.key
  spec     = each.value

  deletion_protection = var.protect_data
}

module "api" {
  source   = "../../../infra/modules/project-api"
  project  = local.project.name
  env      = var.env
  dist_dir = "${path.module}/../api/dist"

  # Cost and blast-radius cap: at most 10 concurrent executions for this project (ADR 0009).
  reserved_concurrency = 10

  environment = {
    TABLE_NAME = try(module.tables["main"].name, null)
  }
  iam_statements = flatten([for t in module.tables : t.iam_statements])
}
