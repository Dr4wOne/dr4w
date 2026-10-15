# Optional shared Aurora Serverless v2 PostgreSQL (one database per project, via pg-database).
# Scales to 0 ACU after 5 idle minutes; first request after a pause waits ~15 s (longer after 24 h).
# Lambdas use the RDS Data API, so no VPC, NAT or connection pooling is needed.

data "aws_rds_engine_version" "pg" {
  count   = var.enable_shared_postgres ? 1 : 0
  engine  = "aurora-postgresql"
  version = var.pg_major_version
  latest  = true
}

data "aws_vpc" "default" {
  count   = var.enable_shared_postgres ? 1 : 0
  default = true
}

data "aws_subnets" "default" {
  count = var.enable_shared_postgres ? 1 : 0
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default[0].id]
  }
}

resource "aws_db_subnet_group" "pg" {
  count      = var.enable_shared_postgres ? 1 : 0
  name       = "dr4w-pg"
  subnet_ids = data.aws_subnets.default[0].ids
}

resource "aws_rds_cluster" "pg" {
  count                       = var.enable_shared_postgres ? 1 : 0
  cluster_identifier          = "dr4w-pg"
  engine                      = "aurora-postgresql"
  engine_mode                 = "provisioned"
  engine_version              = data.aws_rds_engine_version.pg[0].version_actual
  database_name               = "dr4w"
  master_username             = "dr4w_admin"
  manage_master_user_password = true
  enable_http_endpoint        = true # RDS Data API
  db_subnet_group_name        = aws_db_subnet_group.pg[0].name
  storage_encrypted           = true
  deletion_protection         = true
  backup_retention_period     = 7
  copy_tags_to_snapshot       = true
  skip_final_snapshot         = false
  final_snapshot_identifier   = "dr4w-pg-final"

  serverlessv2_scaling_configuration {
    min_capacity             = 0
    max_capacity             = var.pg_max_acu
    seconds_until_auto_pause = 300
  }

  lifecycle {
    # Minor versions are upgraded by AWS; don't fight it on every plan.
    ignore_changes = [engine_version]
  }
}

resource "aws_rds_cluster_instance" "pg" {
  count               = var.enable_shared_postgres ? 1 : 0
  identifier          = "dr4w-pg-1"
  cluster_identifier  = aws_rds_cluster.pg[0].id
  instance_class      = "db.serverless"
  engine              = aws_rds_cluster.pg[0].engine
  engine_version      = aws_rds_cluster.pg[0].engine_version
  publicly_accessible = false
}
