---
name: hexagonal-architecture-testing
description: >-
  Hexagonal architecture: use when adding dependency-boundary checks or diagnosing a layer
  violation; also when another skill needs ports-and-adapters enforcement.
---

# Hexagonal architecture testing

Enforce boundaries with declarative dependency contracts, alongside functional tests.
A port is an interface owned by the domain or application; an adapter supplies its concrete
implementation. Importing a port keeps a workflow independent of a specific provider.

## 1. Agree the dependency graph

Read repository instructions, architecture docs, imports, and CI. Map source areas to their roles:

- Domain: provider-independent concepts and contracts.
- Application: workflows using domain concepts and ports.
- Adapters: integrations implementing contracts.
- Composition: entry points constructing and connecting implementations.

Record permitted dependencies, including indirect paths, shared utilities, and composition facades
outside bootstrap directories. Adapters may depend on application ports; a blanket layer ordering
can incorrectly reject this. Raise conflicts between implementation and documented intent.

Agree whether proof fixtures will be committed regression checks or recorded demonstrations.
Prefer repeatable fixtures when later contract weakening is a realistic risk; keep the chosen
scope explicit rather than building a general test framework.

Complete when the user confirms the rules, proof retention, and coverage of every source area and
composition entry point. Checker exit status and dependency paths are the agreed test boundary.

## 2. Select the checker

Reuse a language-appropriate dependency checker rather than writing an import parser.
For Python, read [the Import Linter reference](references/python-import-linter.md)
for setup, coverage checks, and a worked Forgetful example.
For other languages, verify equivalent contracts against current tool documentation.

Locate companion skills in the agent's skill inventory; load their advertised instruction files.
If Context7, official-docs-fallback, TDD, or CI/CD instructions are unavailable, load
[the standalone fallback](references/companion-skills.md) for that missing capability.
Reuse verified reference details; consult current documentation for version changes, uncovered
features, or conflicting results. Audit dependencies before installing/upgrading tooling.
Record handling of submodules, indirect paths, re-exports, and conditional imports. State gaps
for dynamic imports and runtime operations: dependency checks are not a sandbox.

Complete when each agreed rule maps to supported configuration, with a local command and explicit
coverage limits.

## 3. Prove each contract

Use the TDD skill at the agreed boundary. Work one contract at a time in disposable source copies,
preserving the user's working tree:

1. Confirm the clean baseline passes with the currently configured rules.
2. Introduce one forbidden dependency with the target contract absent; confirm it passes.
3. Enable that contract; confirm failure names the intended contract and dependency path.
4. Remove the violation; confirm permitted dependencies and composition still pass.

If another contract rejects step 2, isolate the target contract in a minimal fixture and record
that isolation. A violation rejected by a different rule does not prove the target rule works.
For a new contract, step 2 demonstrates the enforcement gap before adding the rule.

Cover direct and indirect violations for every contract where those paths are in scope. For an
indirect proof, place the intermediary outside both endpoint areas and require the full path.
Use fresh graphs when fixtures change; syntax errors and missing modules do not prove enforcement.
Record the mutation, enabled rules, command, exit status, contract name, and dependency path.

Complete when every contract has rejection evidence and allowed cases pass. Save agreed fixtures
under the repository's tests/checks and evidence in its plan or validation document. Confirm the
actual repository passes with no deliberate violations left behind.

## 4. Make the check required

Document the local command and add it to CI using the ci-cd skill. Broken contracts must fail the
job; checking source should require no service credentials or model calls after tool installation.
Update architecture docs with enforced rules and exceptions, and record progress in the plan.

Complete when local checks pass and the workflow contains the check. Report hosted CI separately:
only a passing run for the exact pushed commit establishes hosted success.
