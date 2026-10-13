# Python: Import Linter contracts

This is a self-contained example of the Forgetful Factory layout:

```text
src/forgetful_factory/
├── domain/                 # Models and provider-independent service contracts
├── application/            # Workflows and ports
├── adapters/               # GitHub, filesystem, and AgentShell implementations
├── cli/
│   ├── main.py             # Arguments and user interaction
│   └── bootstrap.py        # Composition: constructs and connects adapters
└── configuration.py        # Public loader: constructs the storage adapter
```

Build the target repository's contracts from its agreed dependency graph; renaming this example
is insufficient when responsibilities differ. The modules named below must exist, and fixtures
need importable Python packages. Existing behavioural tests stay unchanged.

## Configuration

Add to `pyproject.toml`:

```toml
[tool.importlinter]
root_package = "forgetful_factory"

[[tool.importlinter.contracts]]
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
name = "Application uses contracts, not adapters"
type = "forbidden"
source_modules = ["forgetful_factory.application"]
forbidden_modules = [
    "forgetful_factory.adapters",
    "forgetful_factory.cli",
    "forgetful_factory.configuration",
]

[[tool.importlinter.contracts]]
name = "Adapters cannot depend on the CLI"
type = "forbidden"
source_modules = ["forgetful_factory.adapters"]
forbidden_modules = ["forgetful_factory.cli"]
```

Forbidden contracts check descendants and indirect imports by default. Retain those defaults
for this example.

This configuration intentionally permits:

- Application imports of domain services and its own ports.
- Adapter imports of domain models and application ports/configuration types.
- Shared utilities used by multiple adapters.
- `cli/bootstrap.py` constructing adapters and supplying them to workflows.
- The public `configuration.py` facade constructing the storage adapter.

The public facade constructs an adapter, so domain/application cannot import it. These are coarse
layer rules: adapters are allowed to import application workflows and the public configuration
facade, not just ports. If those dependencies should be prohibited, agree additional contracts.
Review rules when adding entry points; the forbidden lists are not exhaustive import allowlists.

## Local and CI commands

With Import Linter in the project's development environment, run from the repository root.
The `src/` package must be importable:

```bash
PYTHONPATH=src lint-imports
```

Use this command in CI too. Broken contracts return a nonzero exit status and show offending
import paths.

## Example enforcement cases

Apply the skill's contract-proof loop to these cases. Check the installed version's cache options
to ensure each changed fixture produces a fresh graph:

| Contract | Deliberate violation | Expected result |
| --- | --- | --- |
| Domain independence | A domain module imports an application module | Failure |
| Application independence | A workflow imports a concrete adapter | Failure |
| Adapter independence | An adapter imports a CLI module | Failure |
| Indirect dependency | A workflow reaches an adapter through a neutral helper | Failure |
| Allowed dependency | A workflow imports a domain service contract | Success |
| Composition | Bootstrap constructs an adapter and passes it to a workflow | Success |

For the indirect case, add a helper only in the disposable fixture, outside both `application`
and `adapters`:

```text
application/watch_factory.py
  → boundary_probe/bridge.py
    → adapters/github/work_tracking.py
```

Make `boundary_probe` an importable sibling package under `forgetful_factory`. Require the reported
path to include all three modules. A helper inside `application` would itself create a direct
application-to-adapter violation and would not isolate indirect-path enforcement.

For example, this import belongs in composition, not an application workflow:

```python
from forgetful_factory.adapters.github.work_tracking import GitHubWorkTracking
```

This workflow import is permitted:

```python
from forgetful_factory.domain.services.work_tracking import WorkTrackingService
```

## Optional integration restrictions

The three contracts above restrict internal dependencies. They do not prohibit all external
integration imports or file operations.

If agreed, add a separate forbidden contract for domain/application imports of integrations such
as `agent_shell`, `subprocess`, and `tomllib`. External checks require the documented top-level
`include_external_packages = true` option. Verify the selected version's treatment of standard
library modules and direct versus indirect external paths before claiming coverage.

## Documentation

Verified against Context7's `/seddonym/import-linter` documentation:

- [Configuration](https://import-linter.readthedocs.io/en/stable/get_started/configure.html)
- [Forbidden contracts][forbidden]

[forbidden]: https://import-linter.readthedocs.io/en/stable/contract_types/forbidden.html

This configuration example is not evidence that a target repository has installed or validated
Import Linter.
