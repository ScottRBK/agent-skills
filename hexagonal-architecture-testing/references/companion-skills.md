# When companion skills are unavailable

Use the agent's advertised skill inventory to locate Context7, official-docs-fallback, TDD, and
CI/CD instructions. In Scott's environment, skills commonly live in `~/.agents/skills/` or
`~/.pi/agent/skills/`; each skill has a `SKILL.md`. Other agents may advertise different paths.
Load only the relevant instructions. If a companion skill is absent, use its fallback below.

## Current tool documentation

Use available Context7 tools or an already installed CLI to resolve the actual checker and fetch
its contract/configuration documentation. If unavailable, missing the tool, or rate-limited, use
that tool's official documentation for the selected release. Tell the user which source was used.
Verify indirect-path behaviour and configuration syntax rather than relying on remembered APIs.

## Dependency audit

Before installing or upgrading a checker, verify the official distribution, release/version,
license, supported runtime, transitive dependencies, and known security advisories. Record sources,
findings, and unresolved risks in the repository's dependency audit or validation document.
Select a development-only installation matching the existing package manager. Missing audit
information is a reported gap, not evidence of safety; obtain approval for unresolved concerns.

## Test-first contract proofs

Confirm the checker boundary and fixture scope with the user. Write an expectation that a forbidden
fixture must fail, observe it fail as a test while the missing contract still allows the fixture,
then add the contract and observe the expectation pass. Confirm the clean/allowed fixture passes
as well. Follow the main skill's isolation and evidence requirements for each contract.

## CI enforcement

Reuse the repository's workflow conventions, package manager, and supported runtime. Install the
checker as development tooling and run its documented command as a required successful job step;
avoid ignored exit codes or `continue-on-error`. Keep service credentials and model calls out.

For a new GitHub workflow, use push and pull-request triggers, `ubuntu-latest`, read-only contents
permission, and non-persisted checkout credentials. Cancel superseded test runs per workflow/ref.
Verify and audit official action versions before adding them; respect explicit repository choices.

Run locally first. Commit/push only with authorization; then verify required checks for the exact
head SHA. Report unrun, queued, failed, or unavailable hosted checks as incomplete.
