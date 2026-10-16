variable "project" {
  type = string
}

variable "env" {
  type = string
}

variable "dist_dir" {
  description = "esbuild output of apps/<p>/api (pnpm build) — must contain lambda.mjs."
  type        = string
}

variable "handler" {
  type    = string
  default = "lambda.handler"
}

variable "environment" {
  description = "Extra Lambda env vars (resource names). Null values are dropped."
  type        = map(string)
  default     = {}
}

variable "iam_statements" {
  description = "Least-privilege statements from other modules (e.g. dynamo-table.iam_statements)."
  type = list(object({
    sid       = string
    actions   = list(string)
    resources = list(string)
  }))
  default = []
}

variable "publishes_events" {
  description = "Grant events:PutEvents on dr4w-bus and set BUS_NAME."
  type        = bool
  default     = false
}

variable "memory_mb" {
  type    = number
  default = 512
}

variable "timeout_s" {
  type    = number
  default = 10
}

variable "reserved_concurrency" {
  description = "Max concurrent executions for this project; null = unreserved. Projects set 10 (ADR 0009)."
  type        = number
  default     = null
}

variable "throttle_rate" {
  type    = number
  default = 50
}

variable "throttle_burst" {
  type    = number
  default = 100
}

variable "log_retention_days" {
  type    = number
  default = 14
  validation {
    condition     = var.log_retention_days <= 14
    error_message = "Cost guardrail: log retention must be ≤ 14 days."
  }
}
