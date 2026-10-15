# echo infrastructure. Add resources with `/resource echo <table|queue|bucket|cron|event>`.

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
  iam_statements = flatten([for t in module.tables : t.iam_statements])
}

# ── Cross-project wiring (docs/guides/connect-projects.md) ───────────────────────
# Async: hello's Note.Created.v1 events → this project's Lambda (src/events.ts).
module "from_hello" {
  source           = "../../../infra/modules/event-subscription"
  project          = local.project.name
  env              = var.env
  provider_project = "hello"
  detail_types     = ["Note.Created.v1"]
  function_arn     = module.api.function_arn
  function_name    = module.api.function_name
}

# Sync: read hello's published outputs (only what hello exposes to echo is granted).
module "hello" {
  source           = "../../../infra/modules/project-ref"
  provider_project = "hello"
  consumer         = local.project.name
  env              = var.env
}
