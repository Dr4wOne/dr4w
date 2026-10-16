# Roll back a deploy

**Goal:** get production back to the last good state after a bad merge.

## Steps

**Preferred — revert and redeploy (code and infra together):**
```bash
git checkout main && git pull
git checkout -b revert/<what>
git revert <bad-merge-sha>
git push -u origin revert/<what>      # see docs/conventions.md → Git for the push command
gh pr create --fill                   # CI plans it; merging runs deploy.yml with the old state
```

**Fastest — re-run an older successful deploy:** GitHub → Actions → *deploy* → open the last
good run → *Re-run all jobs*. A re-run uses **that run's commit**, so the Lambda, the infra and
the Worker all go back together — including **deleting** any resources added after that commit. Afterwards revert on `main` as well, or the next merge brings
the bad code back.

**Frontend only:** Cloudflare dashboard → Workers → `dr4w-<project>` → *Deployments* → roll back
to an earlier version. The Lambda and API stay as they are.

## Verify
```bash
curl -s https://<subdomain>.dr4w.io/api/health      # {"ok":true,…}
gh run list --workflow deploy.yml --limit 3          # the latest run is green
```

## Common mistakes
- Re-running an old deploy and forgetting to revert `main` — the next merge re-deploys the bug.
- Expecting data to roll back. No rollback restores DynamoDB items; point-in-time recovery is
  off by default (cost). Enable it per table first if a project needs it.
