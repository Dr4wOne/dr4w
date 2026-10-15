output "name" {
  value = aws_dynamodb_table.this.name
}

output "arn" {
  value = aws_dynamodb_table.this.arn
}

# Read/write data-plane access for the project's own Lambda (no table admin actions).
output "iam_statements" {
  value = [{
    sid = "Table${title(replace(var.key, "-", ""))}"
    actions = [
      "dynamodb:BatchGetItem", "dynamodb:BatchWriteItem", "dynamodb:ConditionCheckItem",
      "dynamodb:DeleteItem", "dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:Query",
      "dynamodb:Scan", "dynamodb:UpdateItem",
    ]
    resources = [aws_dynamodb_table.this.arn, "${aws_dynamodb_table.this.arn}/index/*"]
  }]
}
