variable "project" {
  type = string
}

variable "env" {
  type = string
}

variable "key" {
  description = "Table key in tables.json (e.g. \"main\"); table is named dr4w-<project>-<env>-<key>."
  type        = string
}

variable "spec" {
  description = "One entry of apps/<p>/infra/tables.json (same schema the local seed script uses)."
  type = object({
    hashKey    = string
    rangeKey   = optional(string)
    attributes = map(string)
    globalSecondaryIndexes = optional(list(object({
      name     = string
      hashKey  = string
      rangeKey = optional(string)
    })), [])
    ttlAttribute = optional(string)
  })
}

variable "deletion_protection" {
  description = "Turn off (apply) before destroying a project — see docs/guides/destroy-project.md."
  type        = bool
  default     = true
}
