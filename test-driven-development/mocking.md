# When to Mock

Mock at **system boundaries** only:

- External APIs (payment, email, etc.)
- Databases (sometimes - prefer test DB)
- Time/randomness
- File system (sometimes)

Don't mock:

- Your own classes/modules
- Internal collaborators
- Anything you control

Mocks belong in the **Arrange** phase of AAA. Use them to make a system boundary predictable, then
**Act** through the public interface and **Assert** on observable behaviour. Do not assert that your
own internal code called another internal function unless that call is the external contract.

## Designing for Mockability

At system boundaries, design interfaces that are easy to mock:

**1. Use dependency injection**

Pass external dependencies in rather than creating them internally:

```typescript
// Easy to mock: the boundary dependency is supplied in Arrange
function processPayment(order, paymentClient) {
  return paymentClient.charge(order.total);
}

// Hard to mock: the boundary dependency is created inside the Act path
function processPayment(order) {
  const client = new StripeClient(process.env.STRIPE_KEY);
  return client.charge(order.total);
}
```

In a test, the mock is arranged once, the behaviour is exercised once, and the assertion stays about
what the caller can observe:

```typescript
test("paid order is marked as paid", async () => {
  // Arrange
  const paymentClient = { charge: async () => ({ status: "succeeded" }) };
  const order = createOrder({ total: 25 });

  // Act
  const paidOrder = await processPayment(order, paymentClient);

  // Assert
  expect(paidOrder.status).toBe("paid");
});
```

**2. Prefer SDK-style interfaces over generic fetchers**

Create specific functions for each external operation instead of one generic function with
conditional logic:

```typescript
// GOOD: Each function is independently mockable in Arrange
const api = {
  getUser: (id) => fetch(`/users/${id}`),
  getOrders: (userId) => fetch(`/users/${userId}/orders`),
  createOrder: (data) => fetch('/orders', { method: 'POST', body: data }),
};

// BAD: Mocking requires conditional logic inside the Arrange phase
const api = {
  fetch: (endpoint, options) => fetch(endpoint, options),
};
```

The SDK approach means:

- Each mock returns one specific shape
- No conditional logic in test setup
- Easier to see which endpoints a test exercises
- Type safety per endpoint
- Cleaner AAA structure because Arrange is simple and Act stays focused
