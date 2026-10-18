terraform {
  required_version = "~> 1.13"
  required_providers {
    aws     = { source = "hashicorp/aws", version = "~> 6.69" }
    archive = { source = "hashicorp/archive", version = "~> 2.8" }
    random  = { source = "hashicorp/random", version = "~> 3.9" }
  }

  # tofu init -backend-config=../../../infra/backend.hcl
  # OpenTofu evaluates var.env early, so PR previews get their own state (M5).
  backend "s3" {
    key = "projects/concept/${var.env}/terraform.tfstate"
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      project      = local.project.name
      env          = var.env
      "managed-by" = "opentofu"
    }
  }
}
