# hello infrastructure. Add resources with `/resource hello <table|queue|bucket|cron|event>`.

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

  environment = {
    TABLE_NAME = try(module.tables["main"].name, null)
  }
  iam_statements   = flatten([for t in module.tables : t.iam_statements])
  publishes_events = true # Note.Created.v1 → dr4w-bus
}
