---
name: ci-cd
description: >-
  CI/CD preferences for the user. Use when creating or changing workflows, investigating failed CI,
  or adding deployment and end-to-end verification stages.
---

# CI/CD

Use the defaults below unless the user or the repository specifies otherwise. Keep the workflow
small enough to understand; completion requires evidence for the exact commit being checked.

## 1. Establish the checks

Read repository instructions, existing workflows, manifests, and lockfiles. Identify the actual
test, lint, and build commands, supported runtimes, and any deployment environments. Reuse existing
checks rather than introducing tools merely to fill out a pipeline.

Complete when each proposed job has a known command, runtime, trigger, and purpose.

## 2. Apply the user's preferences


- For GitHub Actions, use `ubuntu-latest` unless the project needs another runner.
- If it is a private repo then a private github actions runner is usually preferred over a gh one 
that will incurr cost.
- Run CI on every push and on pull requests. 
- Once CI is green, if there is an e2e environment, deploy to it 
- If there is an e2e environment, after deployment, run e2e tests
- Production/Package releases will occur on the back of proper tag push and not automatically following
succesul e2e
- Prefer the current major-version tags for GitHub's official actions, rather than commit hashes.
- Cancel outdated test runs using a concurrency group containing both `github.workflow` and
  `github.ref`, with `cancel-in-progress: true`. Different refs remain independent.
- Use a matrix for genuine variations such as supported Python versions or separate checks.
  Set `fail-fast: false` so one failure does not cancel the remaining matrix jobs.
  Verify the latest release and what its major tag resolves to; use that tag, not a guessed
  `@latest`. This receives compatible updates, not automatic upgrades to the next major version.
- Audit before adding or deliberately upgrading dependencies, including actions. Record the
  resolved release/commit and any advisories. A movable tag's future updates are outside that
  point-in-time audit; state this limitation rather than claiming immutable or audited future code.
- Use minimal token permissions, normally `contents: read`, and `persist-credentials: false` for
  checkout. Grant additional permissions only to jobs that actually require them.
- Prefer pytest for new Python test setups. Existing unittest suites can remain; migration needs
  agreement. Follow the TDD skill for test changes and confirm the public test boundaries first.
- Install through the project's existing package manager and lockfile when needed. For a
  dependency-free Python suite, running tests from `src` needs no package installation or cache.

Consult the Context7 skill for action/tool usage; use official-docs-fallback when unavailable.
Complete when the workflow matches these defaults or each necessary exception is explained.

## 3. Verify the exact commit

Validate workflow syntax and run the relevant commands locally. Local success does not establish
hosted CI success. When the user authorizes commit/push or a run, inspect the resulting workflow:

- Match the run's head SHA, workflow, and event to the intended commit.
- Check every required matrix job and its test/check step. Read failed-job logs before fixing.
- After corrections, verify a new run for the corrected SHA. Old green runs prove nothing about it.

Complete when all required checks for that exact commit pass, or report the failed, cancelled,
skipped, queued, or unavailable checks as incomplete. Include the commit and run link in the result.
PR-event and cancellation behaviour needs separate evidence; a passing push run proves neither.

## Deployment and E2E branch

When deployment is in scope, place it after merge, with E2E execution after successful deployment.
Choose deployment concurrency for the environment's safety; test-run cancellation is not a blanket
rule for interrupting deployments. Preserve repository approval and environment requirements.

Identify the deployed revision and the E2E run that tested it. For multiple repositories, identify
the deployed combination, not just one workflow's source SHA. Merge alone is not deployment or E2E
success. Complete only when both stages pass for the intended revisions; otherwise report the
blocker and keep verification work open. In a factory-managed repository, follow FACTORY.md for
agent ownership and failure follow-up responsibilities.
