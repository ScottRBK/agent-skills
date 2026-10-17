# Python: Import Linter contracts

## Reuse the verified setup

Verified on 2026-10-17 with Import Linter 2.15, Grimp 3.17, and Python 3.12.
Use the repository's existing version and configuration first; this reference records a working
baseline, not a requirement to downgrade or upgrade a project.

For an unchanged setup, run the checker and retained proofs. Refresh documentation when the
checker version changes, a needed option is not covered here, or observed results disagree with
this reference. A new repository still needs its own agreed dependency graph and coverage check.
Keep any required Context7 lookup focused on the missing detail instead of repeating the whole
Import Linter investigation.

For a new uv setup, audit the selected version and its resolved dependencies before installation:

```bash
uv add --dev import-linter==2.15 grimp==3.17
uv run lint-imports --version
uv run lint-imports --no-cache
```

Declare Grimp directly when the coverage test below imports its API.
Use the project's lockfile in CI (`uv sync --locked --dev`). Import Linter and its graph dependency,
Grimp, are development tooling; neither needs service credentials or model calls to scan source.
Refresh advisory information when installing/upgrading, not on every unchanged test run.

For a `src/` layout, make the package importable, for example:

```bash
PYTHONPATH=src uv run lint-imports --no-cache
```

## Map the repository's actual boundaries

This example uses `forgetful_factory` with `domain`, `application`, `adapters`, and `cli` packages.
`cli.bootstrap` and a public `configuration` facade construct implementations. Those entry points
may import adapters; domain/application code must not import them.

Add the agreed contracts to `pyproject.toml`:

```toml
[tool.importlinter]
root_package = "forgetful_factory"
include_external_packages = true
exclude_type_checking_imports = false

[[tool.importlinter.contracts]]
id = "domain"
name = "Domain stays independent"
type = "forbidden"
source_modules = ["forgetful_factory.domain"]
forbidden_modules = [
    "forgetful_factory.application",
    "forgetful_factory.adapters",
    "forgetful_factory.cli",
    "forgetful_factory.configuration",
]

[[tool.importlinter.contracts]]
id = "application"
name = "Application uses contracts, not adapters"
type = "forbidden"
source_modules = ["forgetful_factory.application"]
forbidden_modules = [
    "forgetful_factory.adapters",
    "forgetful_factory.cli",
    "forgetful_factory.configuration",
]

[[tool.importlinter.contracts]]
id = "adapters"
name = "Adapters cannot depend on the CLI"
type = "forbidden"
source_modules = ["forgetful_factory.adapters"]
forbidden_modules = ["forgetful_factory.cli"]
```

Application may import domain contracts; adapters may implement those contracts. This example
also permits adapter-to-application imports: tighten it only if the agreed architecture requires
that. Lists above are not exhaustive allowlists; classify new source areas and entry points.

Verified option behaviour:

- Forbidden contracts cover descendants and indirect imports by default; preserve both defaults.
- External restrictions need `include_external_packages = true` and top-level names such as
  `sqlalchemy`, `openai`, or `subprocess`, not `sqlalchemy.orm`.
- `exclude_type_checking_imports = false` includes imports guarded by `TYPE_CHECKING`.
- Imports inside functions and re-exports contribute dependency paths; retain proofs for them.
- `ignore_imports` defaults to an error for unmatched entries. Prefer fixing an unwanted import
  over adding an exception; explain any agreed exceptions.
- `--contract application` isolates a contract by its `id`; `--no-cache` ensures fresh graphs.
- Broken contracts exit nonzero and report the rule and dependency paths. Missing source modules
  and syntax errors also fail, so exit status alone is insufficient proof of a boundary rejection.
- Missing forbidden module names are silently skipped. Verify that every configured internal
  forbidden name exists in the graph; a typo can otherwise disable a restriction. External
  modules appear only when imported, so their absence alone is not evidence of a typo.

## Check source coverage

Grimp's package discovery can omit directories without `__init__.py`. In Forgetful, three missing
package markers hid 19 files, including SQLite repositories. A green checker did not mean every
source file had been checked. Compare the intended source inventory with the graph:

```python
from pathlib import Path
import grimp

package_dir = Path("src/forgetful_factory")
graph = grimp.build_graph("forgetful_factory", cache_dir=None)
expected = set()
for path in package_dir.rglob("*.py"):
    parts = list(path.relative_to(package_dir.parent).with_suffix("").parts)
    if parts[-1] == "__init__":
        parts.pop()
    expected.add(".".join(parts))
assert expected <= graph.modules, sorted(expected - graph.modules)
```

Add package markers where appropriate and repeat the coverage check. With the verified version,
a standalone `main.py` cannot be a root package (`NotATopLevelModule`). Explicitly agree whether
it stays under manual review or belongs in an importable package. Record exclusions such as tests,
migrations, and evaluation harnesses; source discovery does not assign architectural roles.

## Retain meaningful proofs

Use the main skill's absent-rule → rejection → restored-pass loop for each contract. Fixtures
should consume the real configuration, so weakening that configuration can fail the proof.
Isolate one contract if overlapping rules reject the same violation.

For indirect imports, put the helper outside both endpoint areas:

```text
forgetful_factory.application.workflow
  → forgetful_factory.boundary_probe.bridge
    → forgetful_factory.adapters.storage
```

Require the failure to name the intended contract and all three modules. A helper inside
`application` would itself create a direct violation and would not prove indirect checking.
Run each changed fixture in a fresh process with its own package path and `--no-cache`.
Also retain allowed cases for service-to-contract imports and startup wiring. Put CLI startup
exceptions in a separate CLI contract if HTTP/MCP handlers must remain unable to reach bootstrap
through CLI code; an exception shared with the handler rule could hide that indirect path.

Import checks inspect static dependencies. They do not detect runtime attribute access such as
`service.repository.provider`, dynamic imports, or every file/network operation. Keep those in
code review and behaviour tests; importing `pathlib`, for example, does not reveal every file write.

## Worked example: Forgetful

Use this example when applying Import Linter to a layered Python application. These links point
at merged commit `7e9293e`, so the rules and proofs stay aligned as the project changes.
Adapt the approach to the target repository's agreed boundaries.

In Forgetful, `app.models.memory_models` must not import `app.services.memory_service`.
The rules declare that restriction; a proof test inserts the import into a temporary package
and checks that the intended rule rejects it. The CI command runs those proofs and checks the
actual repository together:

```bash
uv run --frozen pytest tests/architecture/ -v
```

| What to reuse | Example |
| --- | --- |
| Six rules, including a separate CLI rule with two startup exceptions | [Configuration][rules] |
| Proof fixtures, source coverage and misspelled-target checks | [Tests][proofs] |
| Lockfile installation and a required architecture-check step | [CI workflow][workflow] |
| Behaviour coverage before refactoring, checker limits and results | [Validation][validation] |

[rules]: https://github.com/ScottRBK/forgetful/blob/7e9293e/pyproject.toml#L84
[proofs]: https://github.com/ScottRBK/forgetful/blob/7e9293e/tests/architecture/test_contracts.py
[workflow]: https://github.com/ScottRBK/forgetful/blob/7e9293e/.github/workflows/ci.yml
[validation]: https://github.com/ScottRBK/forgetful/blob/7e9293e/docs/dev/architecture-tests.md

## Sources

Context7 library: `/seddonym/import-linter`.

- [Configuration](https://import-linter.readthedocs.io/en/stable/get_started/configure/)
- [Forbidden contracts](https://import-linter.readthedocs.io/en/stable/contract_types/forbidden/)
- [CLI usage](https://import-linter.readthedocs.io/en/stable/get_started/run/)
- [Grimp usage](https://grimp.readthedocs.io/en/latest/usage.html)

The reference is a verified starting point; the target repository's passing proofs establish its
actual enforcement and source coverage.
