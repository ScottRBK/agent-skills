---
name: tdd
description: Test-driven development. Use when the user wants to build features or fix bugs test-first, mentions "red-green-refactor", or wants integration tests.
---

## Test-Driven Development

- **Test-first always**: No production code without a failing test. Write code before the test? Delete it.
- **Integration-first**: E2E and integration tests are favoured over unit tests. Validate 
real functionality, simulating actual user behaviour and not not code coverage.
- **Red-Green-Refactor**: Write failing test → verify it fails correctly → minimal code to pass → 
verify all green → refactor.
- **Real dependencies over mocks**: Only mock external services you don't control. Never test 
mock behaviour.
- **AAA pattern**: All tests must follow Arrange, Act, Assert.
- **Bug fixes**: Always reproduce with a failing test first, then fix.

## What a good test 

Tests verify behaviour through public interfaces, not implementation details. Code can change 
entirely; tests shouldn't. A good test reads like a specification - "user can checkout with valid 
cart" tells you exactly what capabilityh exists and survives refactors because it doesn't care about
internal structure.

see [tests.md](tests.md) for examples and [mocking.md](mocking.md) for mocking guidelines

## Seams - where tests go

A *seam** is the public boundary tests at: the interface where you observe behaviour without reaching
inside. Tests live at seams, never against internals.

**Test only at pre-agreed seams.** Before writing any test, write down the seems under test and confirm
them with the user. No test is written at an unconfirmed seam. You can't test everything - agreeing
the seams up front is how testing effort lands on the critical paths and complex logic instead of
every edge case. 

Suggest which seams to test but wait for the user to validate before going ahead.

## Anti-patterns
- **Implementation-coupled** mocks internal collaborators, tests private methods, or verifies through a 
side channel (query the datrabase instead of using the interface). The tell: the test breaks when you
refactor but behaviour hasn't changed. 
- **Tautological** — the assertion recomputes the expected value the way the code does 
(`expect(add(a, b)).toBe(a + b)`, a snapshot derived by hand the same way, a constant asserted 
equal to itself), so it passes by construction and can never disagree with the code. 
Expected values must come from an independent source of truth — a known-good literal, a worked example, the spec.
- **Horizontal slicing** — writing all tests first, then all implementation. Bulk tests verify 
_imagined_ behavior: you test the _shape_ of things rather than user-facing behavior, the tests go 
insensitive to real changes, and you commit to test structure before understanding the implementation. 
Work in **vertical slices** instead — one test → one implementation → repeat, each test a 
**tracer bullet** that responds to what the last cycle taught you.

