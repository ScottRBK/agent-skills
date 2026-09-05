# Application Error Reports

Use a contextual report: application code usually consumes several typed error contracts and needs actionable diagnostics more than one public error enum.

## Propagate and enrich

- Use `anyhow::Result<T>` in application-facing functions that combine heterogeneous errors and do not expose a reusable public contract.
- Let `?` preserve the source error. Add context at semantic boundaries: state the operation, resource, or user intent that the lower-level error cannot know.
- Use `.context("...")` for static context and `.with_context(|| ...)` for context that formats runtime data. The closure keeps success paths from paying formatting or allocation cost.
- Add context where it changes diagnosis. A chain should read from high-level intent down to the root cause without adjacent layers restating one another.
- Handle a failure locally when the application has a recovery policy such as retrying, skipping, prompting, or applying a real default. Propagate when the caller owns that decision.

```rust
use anyhow::{Context, Result};
use std::{fs::File, path::Path};

fn load_puzzle(path: &Path) -> Result<Puzzle> {
    let file = File::open(path)
        .with_context(|| format!("could not open puzzle file {}", path.display()))?;

    Puzzle::from_reader(file).context("could not decode puzzle data")
}

fn main() -> Result<()> {
    let puzzle = load_puzzle(Path::new("puzzle.dat"))
        .context("could not load the first puzzle")?;
    run(puzzle)?;
    Ok(())
}
```

Returning `anyhow::Result<()>` from `main` is a concise top-level policy for a command-line program. Long-running services may instead report once at a process or request boundary and map failures to an exit status or response. Local handling remains explicit; a top-level report is the final destination, not a substitute for recovery decisions near the failure.

## Choose the trade-off deliberately

`anyhow` buys generic propagation, source chains, and ergonomic context while erasing the concrete error type at the return boundary. Keep typed errors where callers need to match variants. Introduce `anyhow` above that boundary, and keep it out of reusable public library signatures unless ecosystem coupling is an explicit API decision.

The application branch is complete when one representative failure report identifies the high-level operation, relevant resource, intermediate operation, and root cause; recoverable failures still follow their local policy; and application convenience has not leaked into a library contract.
