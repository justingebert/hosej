terraform {
  cloud {
    organization = "justingebert"

    workspaces {
      name = "HoseJ-prod"
    }
  }
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "eu-central-1"
}