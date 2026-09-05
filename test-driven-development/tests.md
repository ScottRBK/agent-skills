# Good and Bad Tests

## Good Tests

**Integration-style**: Test through real interfaces, not mocks of internal parts.

Good tests still use the **AAA pattern**:

- **Arrange** the real state and inputs needed for the behaviour.
- **Act** through the public interface once.
- **Assert** the observable outcome users/callers care about.

```typescript
// GOOD: Tests observable behavior through Arrange, Act, Assert
test("user can checkout with valid cart", async () => {
  // Arrange
  const cart = createCart();
  cart.add(product);

  // Act
  const result = await checkout(cart, paymentMethod);

  // Assert
  expect(result.status).toBe("confirmed");
});
```

Characteristics:

- Tests behavior users/callers care about
- Uses public API only
- Survives internal refactors
- Describes WHAT, not HOW
- Has clear Arrange, Act, and Assert phases
- One logical assertion per test

## Bad Tests

**Implementation-detail tests**: Coupled to internal structure.

```typescript
// BAD: Tests implementation details, even if it appears to follow AAA
test("checkout calls paymentService.process", async () => {
  // Arrange
  const mockPayment = jest.mock(paymentService);

  // Act
  await checkout(cart, payment);

  // Assert
  expect(mockPayment.process).toHaveBeenCalledWith(cart.total);
});
```

AAA makes a test readable, but it does not make an implementation-coupled test good.
The Assert phase must verify observable behaviour, not internal calls.

Red flags:

- Mocking internal collaborators
- Testing private methods
- Asserting on call counts/order
- Test breaks when refactoring without behavior change
- Test name describes HOW not WHAT
- Verifying through external means instead of interface

```typescript
// BAD: Bypasses interface to verify
test("createUser saves to database", async () => {
  // Arrange
  const input = { name: "Alice" };

  // Act
  await createUser(input);

  // Assert
  const row = await db.query("SELECT * FROM users WHERE name = ?", ["Alice"]);
  expect(row).toBeDefined();
});

// GOOD: Verifies through interface
test("createUser makes user retrievable", async () => {
  // Arrange
  const input = { name: "Alice" };

  // Act
  const user = await createUser(input);
  const retrieved = await getUser(user.id);

  // Assert
  expect(retrieved.name).toBe("Alice");
});
```

**Tautological tests**: Expected value restates the implementation, so the test passes by
construction.

```typescript
// BAD: Expected value is recomputed the way the code computes it
test("calculateTotal sums line items", () => {
  // Arrange
  const items = [{ price: 10 }, { price: 5 }];
  const expected = items.reduce((sum, i) => sum + i.price, 0);

  // Act
  const total = calculateTotal(items);

  // Assert
  expect(total).toBe(expected);
});

// GOOD: Expected value is an independent, known literal
test("calculateTotal sums line items", () => {
  // Arrange
  const items = [{ price: 10 }, { price: 5 }];

  // Act
  const total = calculateTotal(items);

  // Assert
  expect(total).toBe(15);
});
```
