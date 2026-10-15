output "state_bucket" {
  value = aws_s3_bucket.state.bucket
}

output "plan_role_arn" {
  value = aws_iam_role.plan.arn
}

output "deploy_role_arn" {
  value = aws_iam_role.deploy.arn
}

output "boundary_arn" {
  value = aws_iam_policy.boundary.arn
}

# `tofu output -raw backend_hcl > ../backend.hcl` — shared by every stack's `tofu init`.
output "backend_hcl" {
  value = <<-EOT
    bucket       = "${aws_s3_bucket.state.bucket}"
    region       = "${var.region}"
    use_lockfile = true
    encrypt      = true
  EOT
}
