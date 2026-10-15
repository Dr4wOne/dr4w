terraform {
  required_version = "~> 1.13"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.69"
    }
  }

  # First apply uses local state. Afterwards (docs/bootstrap.md step 5):
  #   mv backend.tf.after-bootstrap backend.tf && tofu init -migrate-state -backend-config=../backend.hcl
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      project      = "platform"
      env          = "bootstrap"
      "managed-by" = "opentofu"
    }
  }
}
