---
name: rust-error-handling
description: Handle Rust failures when implementing or reviewing recovery, propagation, panics, custom error types, or diagnostics across library and application boundaries.
---

# Rust Error Handling

Treat the API boundary as the design unit: reusable libraries expose stable typed failures; applications turn failures into actionable reports.

## Process

1. Map the affected failure sites. For each site, identify its consumer and classify the failure as 
an unrecoverable invariant, recoverable here, or owned by the caller. Classify the surrounding code 
as a public library boundary, application code, or an internal layer. This step is complete when 
every affected failure has a consumer, classification, and boundary.

2. Select the mechanism that expresses the classification:
   - Reserve `panic!`, `expect`, and `unwrap` for violated invariants where execution cannot proceed meaningfully. Give `expect` an invariant-focused message. Treat `catch_unwind` as process-boundary infrastructure rather than ordinary control flow.
   - Handle a recoverable failure locally with `match` or `if let` when behavior branches. Use a combinator when it states the policy directly, such as `unwrap_or` for a genuine default.
   - Propagate a caller-owned failure with `?`. Confirm that the enclosing return type deliberately accepts that error or converts it through `From`/`Into`.

   This step is complete when expected failures remain in `Result`, local recovery is explicit, and each propagation or panic expresses an intentional policy.

3. Follow the boundary branch:
   - Before designing or changing a reusable crate's public error surface, read [references/library-errors.md](references/library-errors.md).
   - Before introducing or changing `anyhow`, top-level reporting, or application error context, read [references/application-errors.md](references/application-errors.md).
   - In a mixed workspace, read both. Keep typed domain errors below the library boundary and assemble contextual reports in the application layer.

   This step is complete when the relevant branch reference has been applied and errors cross each boundary in its intended form.

4. Verify the behavior. Exercise one success path and every changed failure path; then run the narrowest relevant build, tests, formatting check, and Clippy check. Review changed public signatures for dependency leakage or accidental breaking changes, and inspect changed `unwrap`, `expect`, and `panic!` calls against the invariant rule. This step is complete when the checks pass or each remaining failure is reported with its exact cause, and every changed failure path is accounted for.
