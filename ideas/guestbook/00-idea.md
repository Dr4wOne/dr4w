---
title: A tiny public guestbook where visitors leave a one-line message
status: dropped
project: guestbook
created: 2026-10-15
updated: 2026-10-15
---

## Problem
My personal sites feel static; visitors have no lightweight way to say hi without email or social accounts. (guess)

## User
A visitor of one of my projects who wants to leave a quick note — no sign-up.

## Why now
The platform makes a new small app nearly free to run; this is the cheapest end-to-end test of `/idea` → live.

## Riskiest assumption
People will leave messages without any login, and spam stays manageable at this scale. (guess)

## Smallest test
A page with name + message (≤ 280 chars) that shows the latest 20 entries; watch usage for a week.

> **Dry run (2026-10-15):** built and launched with the pipeline in 12 m 39 s (idea → verified live),
> `/endpoint` in ~30 s, then destroyed with `destroy.yml`. Kept as a worked example of the docs.
