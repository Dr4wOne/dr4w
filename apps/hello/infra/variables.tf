variable "env" {
  type    = string
  default = "prod"
}

variable "region" {
  type    = string
  default = "us-east-1"
}

variable "protect_data" {
  description = "Deletion protection on data stores. Only .github/workflows/destroy.yml sets it to false."
  type        = bool
  default     = true
}
