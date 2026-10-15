# ── Shared event bus (cross-project async contract, docs/architecture.md §6) ──
resource "aws_cloudwatch_event_bus" "main" {
  name = "dr4w-bus"
}

resource "aws_cloudwatch_event_archive" "main" {
  name             = "dr4w-bus-archive"
  event_source_arn = aws_cloudwatch_event_bus.main.arn
  retention_days   = 7
}

# ── Alerts ───────────────────────────────────────────────────────────────────
resource "aws_sns_topic" "alerts" {
  name = "dr4w-alerts"
}

resource "aws_sns_topic_subscription" "alerts_email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# ── Budget ───────────────────────────────────────────────────────────────────
resource "aws_budgets_budget" "monthly" {
  name         = "dr4w-monthly"
  budget_type  = "COST"
  limit_amount = tostring(var.monthly_budget_usd)
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  dynamic "notification" {
    for_each = [50, 80, 100]
    content {
      comparison_operator        = "GREATER_THAN"
      threshold                  = notification.value
      threshold_type             = "PERCENTAGE"
      notification_type          = "ACTUAL"
      subscriber_email_addresses = [var.alert_email]
    }
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = [var.alert_email]
  }
}

# ── Outputs for projects: /dr4w/platform/* ───────────────────────────────────
locals {
  ssm_outputs = merge(
    {
      bus_name         = aws_cloudwatch_event_bus.main.name
      bus_arn          = aws_cloudwatch_event_bus.main.arn
      alerts_topic_arn = aws_sns_topic.alerts.arn
    },
    var.enable_shared_postgres ? {
      pg_cluster_arn = aws_rds_cluster.pg[0].arn
      pg_secret_arn  = aws_rds_cluster.pg[0].master_user_secret[0].secret_arn
    } : {},
  )
}

resource "aws_ssm_parameter" "outputs" {
  for_each = local.ssm_outputs
  name     = "/dr4w/platform/${each.key}"
  type     = "String"
  value    = each.value
}
