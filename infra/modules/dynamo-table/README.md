# dynamo-table

PAY_PER_REQUEST table `dr4w-<project>-<env>-<key>` from one `tables.json` entry, deletion
protection on by default. Writes `/dr4w/<project>/<env>/table_<key>_name`.
`iam_statements` → pass to `project-api` for read/write access.
