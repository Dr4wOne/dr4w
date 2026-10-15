output "bus_name" {
  value = aws_cloudwatch_event_bus.main.name
}

output "alerts_topic_arn" {
  value = aws_sns_topic.alerts.arn
}

output "pg_cluster_arn" {
  value = var.enable_shared_postgres ? aws_rds_cluster.pg[0].arn : null
}
