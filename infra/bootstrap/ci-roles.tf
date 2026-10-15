# Two roles assumed by GitHub Actions via OIDC — no AWS keys in GitHub.
#   dr4w-ci-plan   : PRs + branch pushes. Read-only + state lock files.
#   dr4w-ci-deploy : ONLY jobs in the `production` environment (deploy.yml, platform.yml).

locals {
  oidc_aud = "token.actions.githubusercontent.com:aud"
  oidc_sub = "token.actions.githubusercontent.com:sub"
  region   = var.region
  boundary = aws_iam_policy.boundary.arn
}

data "aws_iam_policy_document" "trust_plan" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [data.aws_iam_openid_connect_provider.github.arn]
    }
    condition {
      test     = "StringEquals"
      variable = local.oidc_aud
      values   = ["sts.amazonaws.com"]
    }
    condition {
      test     = "StringLike"
      variable = local.oidc_sub
      values   = ["${local.repo}:pull_request", "${local.repo}:ref:refs/heads/*"]
    }
  }
}

data "aws_iam_policy_document" "trust_deploy" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [data.aws_iam_openid_connect_provider.github.arn]
    }
    condition {
      test     = "StringEquals"
      variable = local.oidc_aud
      values   = ["sts.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = local.oidc_sub
      values   = ["${local.repo}:environment:production"]
    }
  }
}

# ── Plan role ────────────────────────────────────────────────────────────────
resource "aws_iam_role" "plan" {
  name                 = "dr4w-ci-plan"
  assume_role_policy   = data.aws_iam_policy_document.trust_plan.json
  max_session_duration = 3600
}

resource "aws_iam_role_policy_attachment" "plan_readonly" {
  role       = aws_iam_role.plan.name
  policy_arn = "arn:${local.partition}:iam::aws:policy/ReadOnlyAccess"
}

data "aws_iam_policy_document" "plan_state_lock" {
  statement {
    sid       = "StateLockFilesOnly"
    actions   = ["s3:PutObject", "s3:DeleteObject"]
    resources = ["${aws_s3_bucket.state.arn}/*.tflock"]
  }
}

resource "aws_iam_role_policy" "plan_state_lock" {
  name   = "state-lock"
  role   = aws_iam_role.plan.id
  policy = data.aws_iam_policy_document.plan_state_lock.json
}

# ── Deploy role ──────────────────────────────────────────────────────────────
resource "aws_iam_role" "deploy" {
  name                 = "dr4w-ci-deploy"
  assume_role_policy   = data.aws_iam_policy_document.trust_deploy.json
  max_session_duration = 3600
}

# Project stacks: what infra/modules/* create. Resources are always named dr4w-*.
data "aws_iam_policy_document" "deploy_projects" {
  statement {
    sid       = "State"
    actions   = ["s3:ListBucket", "s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
    resources = [aws_s3_bucket.state.arn, "${aws_s3_bucket.state.arn}/*"]
  }

  statement {
    sid     = "ProjectResources"
    actions = ["lambda:*", "dynamodb:*", "sqs:*", "events:*", "scheduler:*", "ssm:*", "logs:*", "s3:*"]
    resources = [
      "${local.arn_prefix}:lambda:${local.region}:${local.acct}:function:dr4w-*",
      "${local.arn_prefix}:dynamodb:${local.region}:${local.acct}:table/dr4w-*",
      "${local.arn_prefix}:sqs:${local.region}:${local.acct}:dr4w-*",
      "${local.arn_prefix}:events:${local.region}:${local.acct}:event-bus/dr4w-*",
      "${local.arn_prefix}:events:${local.region}:${local.acct}:rule/dr4w-*",
      "${local.arn_prefix}:events:${local.region}:${local.acct}:rule/dr4w-*/dr4w-*",
      "${local.arn_prefix}:events:${local.region}:${local.acct}:archive/dr4w-*",
      "${local.arn_prefix}:scheduler:${local.region}:${local.acct}:schedule/default/dr4w-*",
      "${local.arn_prefix}:scheduler:${local.region}:${local.acct}:schedule-group/dr4w-*",
      "${local.arn_prefix}:scheduler:${local.region}:${local.acct}:schedule/dr4w-*/*",
      "${local.arn_prefix}:ssm:${local.region}:${local.acct}:parameter/dr4w/*",
      "${local.arn_prefix}:logs:${local.region}:${local.acct}:log-group:/aws/lambda/dr4w-*",
      "${local.arn_prefix}:logs:${local.region}:${local.acct}:log-group:/aws/lambda/dr4w-*:*",
      "${local.arn_prefix}:s3:::dr4w-*",
    ]
  }

  statement {
    sid = "HttpApis" # HTTP API ARNs carry ids, not names
    actions = ["apigateway:GET", "apigateway:POST", "apigateway:PUT", "apigateway:PATCH",
    "apigateway:DELETE", "apigateway:TagResource", "apigateway:UntagResource"]
    resources = [
      "${local.arn_prefix}:apigateway:${local.region}::/apis",
      "${local.arn_prefix}:apigateway:${local.region}::/apis/*",
      "${local.arn_prefix}:apigateway:${local.region}::/tags/*",
    ]
  }

  statement {
    sid = "Alarms"
    actions = ["cloudwatch:PutMetricAlarm", "cloudwatch:DeleteAlarms", "cloudwatch:DescribeAlarms",
    "cloudwatch:ListTagsForResource", "cloudwatch:TagResource", "cloudwatch:UntagResource"]
    resources = ["${local.arn_prefix}:cloudwatch:${local.region}:${local.acct}:alarm:dr4w-*"]
  }

  statement {
    sid = "ListAndDescribe" # these actions do not support resource-level permissions
    actions = ["lambda:CreateEventSourceMapping", "lambda:GetEventSourceMapping",
      "lambda:UpdateEventSourceMapping", "lambda:DeleteEventSourceMapping",
      "lambda:ListEventSourceMappings", "lambda:TagResource", "lambda:ListTags",
      "logs:DescribeLogGroups", "ssm:DescribeParameters", "cloudwatch:DescribeAlarms",
    "events:ListRules", "scheduler:ListSchedules", "dynamodb:ListTables", "sqs:ListQueues"]
    resources = ["*"]
  }

  statement {
    sid = "WorkloadRolesNeedBoundary"
    actions = ["iam:CreateRole", "iam:PutRolePolicy", "iam:AttachRolePolicy",
    "iam:DetachRolePolicy", "iam:DeleteRolePolicy", "iam:PutRolePermissionsBoundary"]
    resources = ["${local.arn_prefix}:iam::${local.acct}:role/dr4w-*"]
    condition {
      test     = "StringEquals"
      variable = "iam:PermissionsBoundary"
      values   = [local.boundary]
    }
  }

  statement {
    sid = "WorkloadRolesManage"
    actions = ["iam:GetRole", "iam:GetRolePolicy", "iam:ListRolePolicies",
      "iam:ListAttachedRolePolicies", "iam:ListInstanceProfilesForRole", "iam:DeleteRole",
    "iam:TagRole", "iam:UntagRole", "iam:UpdateRole", "iam:UpdateAssumeRolePolicy"]
    resources = ["${local.arn_prefix}:iam::${local.acct}:role/dr4w-*"]
  }

  statement {
    sid       = "PassWorkloadRoles"
    actions   = ["iam:PassRole"]
    resources = ["${local.arn_prefix}:iam::${local.acct}:role/dr4w-*"]
    condition {
      test     = "StringEquals"
      variable = "iam:PassedToService"
      values   = ["lambda.amazonaws.com", "scheduler.amazonaws.com", "events.amazonaws.com"]
    }
  }

  statement {
    sid     = "NeverTouchCiRolesOrBoundary"
    effect  = "Deny"
    actions = ["iam:*"]
    resources = [
      "${local.arn_prefix}:iam::${local.acct}:role/dr4w-ci-*",
      local.boundary,
    ]
  }

  statement {
    sid    = "StateBucketIsBootstrapOnly" # objects yes, bucket settings no
    effect = "Deny"
    actions = ["s3:DeleteBucket", "s3:PutBucketPolicy", "s3:DeleteBucketPolicy",
      "s3:PutBucketVersioning", "s3:PutLifecycleConfiguration", "s3:PutBucketPublicAccessBlock",
    "s3:PutEncryptionConfiguration", "s3:PutBucketOwnershipControls", "s3:PutBucketAcl"]
    resources = [aws_s3_bucket.state.arn]
  }

  statement {
    sid       = "NeverRemoveBoundaries"
    effect    = "Deny"
    actions   = ["iam:DeleteRolePermissionsBoundary"]
    resources = ["*"]
  }
}

# Platform stack: alerts, budget, optional shared Aurora.
data "aws_iam_policy_document" "deploy_platform" {
  statement {
    sid       = "Alerts"
    actions   = ["sns:*"]
    resources = ["${local.arn_prefix}:sns:${local.region}:${local.acct}:dr4w-*"]
  }

  statement {
    sid = "Budget"
    actions = ["budgets:ViewBudget", "budgets:ModifyBudget", "budgets:ListTagsForResource",
    "budgets:TagResource", "budgets:UntagResource"]
    resources = ["${local.arn_prefix}:budgets::${local.acct}:budget/dr4w-*"]
  }

  statement {
    sid     = "SharedPostgres"
    actions = ["rds:*", "rds-data:*"]
    resources = [
      "${local.arn_prefix}:rds:${local.region}:${local.acct}:cluster:dr4w-*",
      "${local.arn_prefix}:rds:${local.region}:${local.acct}:db:dr4w-*",
      "${local.arn_prefix}:rds:${local.region}:${local.acct}:subgrp:dr4w-*",
      "${local.arn_prefix}:rds:${local.region}:${local.acct}:cluster-snapshot:dr4w-*",
    ]
  }

  statement {
    sid     = "PostgresSecrets" # RDS-managed master secret + per-project DB secrets
    actions = ["secretsmanager:*"]
    resources = [
      "${local.arn_prefix}:secretsmanager:${local.region}:${local.acct}:secret:rds!*",
      "${local.arn_prefix}:secretsmanager:${local.region}:${local.acct}:secret:dr4w-*",
    ]
  }

  statement {
    sid = "DescribeOnly"
    actions = ["rds:Describe*", "rds:ListTagsForResource", "ec2:Describe*", "sns:ListTopics",
    "budgets:DescribeBudgets", "kms:DescribeKey", "secretsmanager:ListSecrets"]
    resources = ["*"]
  }

  statement {
    sid       = "RdsServiceLinkedRole"
    actions   = ["iam:CreateServiceLinkedRole"]
    resources = ["*"]
    condition {
      test     = "StringEquals"
      variable = "iam:AWSServiceName"
      values   = ["rds.amazonaws.com"]
    }
  }
}

resource "aws_iam_policy" "deploy_projects" {
  name   = "dr4w-ci-deploy-projects"
  policy = data.aws_iam_policy_document.deploy_projects.json
}

resource "aws_iam_policy" "deploy_platform" {
  name   = "dr4w-ci-deploy-platform"
  policy = data.aws_iam_policy_document.deploy_platform.json
}

resource "aws_iam_role_policy_attachment" "deploy_projects" {
  role       = aws_iam_role.deploy.name
  policy_arn = aws_iam_policy.deploy_projects.arn
}

resource "aws_iam_role_policy_attachment" "deploy_platform" {
  role       = aws_iam_role.deploy.name
  policy_arn = aws_iam_policy.deploy_platform.arn
}
