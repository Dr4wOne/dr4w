# Read by .github/workflows/deploy.yml.

output "api_url" {
  value = module.api.api_url
}

output "origin_secret" {
  value     = module.api.origin_secret
  sensitive = true
}

output "subdomain" {
  value = local.project.subdomain
}

output "hello_api_url" {
  description = "Example of reading another project's outputs via project-ref."
  value       = module.hello.outputs["api_url"]
}
