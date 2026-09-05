# Library Error Contracts

Use a typed boundary: callers should receive a stable error contract expressed in the library's own vocabulary.

## Shape the contract

- Define related failure conditions as variants of a domain error `enum`. A long coherent enum is preferable to several arbitrary error types; create another enum when it represents a genuinely different contract.
- Give the type an `Error` suffix when its role is not otherwise obvious.
- For an externally consumed error enum that may gain variants, use `#[non_exhaustive]`. This makes downstream matches include a wildcard and turns future variants into a compatible extension. Treat omission as an intentional semver decision.
- Return the library's error type from its public API. Convert implementation-dependency failures into domain variants so replacing a dependency does not change the public contract.
- Expose a standard-library or common ecosystem error directly only when its semantics and ecosystem coupling are deliberately part of the public contract.
- Store caller-useful, stable data in variants. Preserve an underlying source when it improves diagnostics without undermining the intended boundary.

## Implement the type

Prefer `thiserror` when dependencies are acceptable:

```rust
#[derive(Debug, thiserror::Error)]
#[non_exhaustive]
pub enum PuzzleError {
    #[error("piece {index} is missing")]
    MissingPiece { index: usize },

    #[error("invalid puzzle data at byte {offset}")]
    InvalidData { offset: usize },

    // Keep this only when I/O is intentionally part of the public contract.
    #[error("could not read puzzle data")]
    Read(#[from] std::io::Error),
}
```

`Debug` plus `thiserror::Error` supplies the standard `Display` and `Error` implementations from the `#[error(...)]` annotations. Implement those traits manually when custom behavior or a dependency constraint justifies the extra code.

Use `#[from]` or an explicit `From` implementation when one source error has one unambiguous domain meaning. Use `map_err` when conversion needs operation-specific data or when the same source error can mean different things. Keep the original error as `#[source]` when its chain should remain inspectable.

## Boundary check

The library branch is complete when:

- every public failure is represented in the library's vocabulary;
- dependency error types appear publicly only by deliberate contract choice;
- callers can inspect meaningful variants or fields without parsing display text;
- foreseeable new variants do not force an accidental breaking release;
- caller-controlled failures return `Result` rather than terminate the process.
