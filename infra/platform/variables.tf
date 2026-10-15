variable "region" {
  type    = string
  default = "us-east-1"
}

variable "alert_email" {
  description = "Receives alarm and budget emails (confirm the SNS subscription once)."
  type        = string
  default     = "dr4wone@gmail.com"
}

variable "monthly_budget_usd" {
  type    = number
  default = 10
}

variable "enable_shared_postgres" {
  description = "Shared Aurora Serverless v2 PG. Costs storage (+ ~$0.40/mo master secret) even while paused."
  type        = bool
  default     = false
}

variable "pg_major_version" {
  description = "Aurora PostgreSQL major version; latest minor is picked at create time."
  type        = string
  default     = "17"
}

variable "pg_max_acu" {
  type    = number
  default = 2
}
