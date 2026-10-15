# A database + login role for one project inside the shared Aurora cluster
# (infra/platform, enable_shared_postgres = true). Lambdas talk to it through the RDS Data API,
# so no VPC/NAT. Costs: the per-project Secrets Manager secret (~$0.40/month).
# The SQL runs via `aws rds-data` (AWS CLI on the runner) using the cluster's master secret.

variable "project" {
  type = string
}

variable "env" {
  type = string
}

data "aws_ssm_parameter" "cluster_arn" {
  name = "/dr4w/platform/pg_cluster_arn"
}

data "aws_ssm_parameter" "master_secret_arn" {
  name = "/dr4w/platform/pg_secret_arn"
}

locals {
  db_name     = replace("${var.project}_${var.env}", "-", "_")
  user        = "${local.db_name}_app"
  cluster_arn = nonsensitive(data.aws_ssm_parameter.cluster_arn.value) # an ARN, not a secret
}

resource "random_password" "app" {
  length  = 40
  special = false
}

resource "aws_secretsmanager_secret" "app" {
  name                    = "dr4w-${var.project}-${var.env}-pg"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "app" {
  secret_id = aws_secretsmanager_secret.app.id
  secret_string = jsonencode({
    username = local.user
    password = random_password.app.result
    dbname   = local.db_name
    engine   = "postgres"
  })
}

# Idempotent: CREATE … only if missing; password is re-applied when it changes.
resource "terraform_data" "database" {
  triggers_replace = [local.db_name, random_password.app.id]

  provisioner "local-exec" {
    interpreter = ["bash", "-c"]
    environment = {
      CLUSTER  = local.cluster_arn
      SECRET   = data.aws_ssm_parameter.master_secret_arn.value
      DB       = local.db_name
      APP_USER = local.user
      APP_PW   = random_password.app.result
    }
    command = <<-EOT
      set -euo pipefail
      sql() { aws rds-data execute-statement --resource-arn "$CLUSTER" --secret-arn "$SECRET" --database "$${2:-dr4w}" --sql "$1" >/dev/null; }
      exists=$(aws rds-data execute-statement --resource-arn "$CLUSTER" --secret-arn "$SECRET" --database dr4w \
        --sql "SELECT 1 FROM pg_database WHERE datname = '$DB'" --query 'length(records)' --output text)
      [ "$exists" = 1 ] || sql "CREATE DATABASE \"$DB\""
      sql "DO \$\$BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$APP_USER') THEN CREATE ROLE \"$APP_USER\" LOGIN; END IF; END\$\$"
      sql "ALTER ROLE \"$APP_USER\" WITH PASSWORD '$APP_PW'"
      sql "GRANT ALL ON DATABASE \"$DB\" TO \"$APP_USER\""
      sql "GRANT ALL ON SCHEMA public TO \"$APP_USER\"" "$DB"
    EOT
  }
}

resource "aws_ssm_parameter" "outputs" {
  for_each = {
    pg_database   = local.db_name
    pg_secret_arn = aws_secretsmanager_secret.app.arn
  }
  name  = "/dr4w/${var.project}/${var.env}/${each.key}"
  type  = "String"
  value = each.value
}

output "database" {
  value = local.db_name
}

output "cluster_arn" {
  value = local.cluster_arn
}

output "secret_arn" {
  value = aws_secretsmanager_secret.app.arn
}

# Pass to project-api (plus env PG_CLUSTER_ARN / PG_SECRET_ARN / PG_DATABASE).
output "iam_statements" {
  value = [
    {
      sid       = "PgDataApi"
      actions   = ["rds-data:ExecuteStatement", "rds-data:BatchExecuteStatement", "rds-data:BeginTransaction", "rds-data:CommitTransaction", "rds-data:RollbackTransaction"]
      resources = [local.cluster_arn]
    },
    {
      sid       = "PgSecret"
      actions   = ["secretsmanager:GetSecretValue"]
      resources = [aws_secretsmanager_secret.app.arn]
    },
  ]
}
