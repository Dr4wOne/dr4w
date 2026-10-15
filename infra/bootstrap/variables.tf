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

# The repo uses GitHub's immutable OIDC subjects ("use_immutable_subject": true), so tokens carry
# repo:<owner>@<owner_id>/<repo>@<repo_id>:… — a deleted+recreated repo with the same name won't match.
# Check: gh api repos/Dr4wOne/dr4w/actions/oidc/customization/sub
variable "github_owner_id" {
  type    = number
  default = 279559492
}

variable "github_repo_id" {
  type    = number
  default = 1420042428
}
