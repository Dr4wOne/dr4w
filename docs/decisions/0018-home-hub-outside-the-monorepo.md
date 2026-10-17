# 0018 · dr4w home lives outside the monorepo; the `tv` app is superseded

**Date:** 2026-10-17

## Context
The `tv` idea (branch `idea/tv`, never merged) controlled the living-room TV through a bridge on the
home network. It grew into a general home hub that other people should be able to run. That hub has
no AWS part, runs on a home machine, and must be publishable without anything from the owner's home.

## Decision
The hub is a separate public repository, [Dr4wOne/dr4w-home](https://github.com/Dr4wOne/dr4w-home)
(MIT), started with fresh history. Its showcase is a static Cloudflare Worker at `home.dr4w.io`, a
subdomain as [ADR 0016](0016-subdomains-only.md) requires. The owner's own hub runs from that kit with
a private local config ([guides/my-home-hub.md](../guides/my-home-hub.md)); remote access is through a
private VPN (Tailscale), never a public endpoint. The `tv` app and its planned cloud relay and
`tv.dr4w.io` are dropped; `idea/tv` stays local and is never pushed (it holds raw device identifiers).

## Consequences
- The monorepo keeps its rules for AWS projects; the kit follows them where they apply and records each
  difference in its own [dr4w-directives.md](https://github.com/Dr4wOne/dr4w-home/blob/main/docs/dr4w-directives.md).
- `packages/android-tv-remote` and `apps/tv` exist only on `idea/tv`; the maintained code is the kit's
  `adapter-android-tv`.

## Status
Accepted.
