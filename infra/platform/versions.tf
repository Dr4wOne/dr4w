terraform {
  required_version = "~> 1.13"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.69"
    }
  }

  # tofu init -backend-config=../backend.hcl
  backend "s3" {
    key = "platform/terraform.tfstate"
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      project      = "platform"
      env          = "prod"
      "managed-by" = "opentofu"
    }
  }
}
