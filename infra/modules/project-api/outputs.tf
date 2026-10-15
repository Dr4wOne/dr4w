output "api_url" {
  value = aws_apigatewayv2_api.api.api_endpoint
}

output "function_name" {
  value = aws_lambda_function.api.function_name
}

output "function_arn" {
  value = aws_lambda_function.api.arn
}

output "role_name" {
  value = aws_iam_role.api.name
}

output "origin_secret" {
  value     = random_password.origin_secret.result
  sensitive = true
}
