# project-api

One Hono Lambda (nodejs24.x, arm64) behind an HTTP API `$default` route, with throttling,
a 14-day log group, Errors/5xx alarms → `dr4w-alerts`, and an origin secret in SSM.
The role carries `dr4w-boundary`; extra permissions come in via `iam_statements`.

Outputs to SSM `/dr4w/<project>/<env>/`: `api_url`, `function_name`, `function_arn`, `role_name`,
`origin_secret` (SecureString).
