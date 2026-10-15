variable "region" {
  type    = string
  default = "us-east-1"
}

variable "github_owner" {
  description = "GitHub org/user that owns the repo (OIDC trust)."
  type        = string
  default     = "Dr4wOne"
}

variable "github_repo" {
  type    = string
  default = "dr4w"
}
