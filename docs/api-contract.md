# API contract

**Status:** v1 draft, established in ticket 01; order creation (03), admin
auth and products (04), order management (05), and exports (06) implemented.
**Adapter:** `js/api/mock-api.js` (demo), future `HttpApi`.
**Schema version:** `1`.

The storefront and admin talk to one `Api` surface. `MockApi` implements it
with versioned `localStorage` today; a future Flask or Node backend implements
the same surface over HTTP without the UI changing. Every method returns a
`Promise` and rejects with an `ApiError`.

## Error format

```js
{
  name: 'ApiError',
  code: 'validation_error',
  message: 'Phone number is not valid.',
  details: { field: 'phone' }
}
```

| Code                  | Meaning                                              | HTTP status |
| --------------------- | ---------------------------------------------------- | ----------- |
| `validation_error`    | Input failed a field or business rule                | 400         |
| `unauthorized`        | Admin session missing or invalid                     | 401         |
| `not_found`           | Product or order does not exist                      | 404         |
| `sold_out`            | Product is unavailable at submission time            | 409         |
| `conflict`            | Concurrent change or duplicate order sequence        | 409         |
| `storage_unavailable` | Browser storage failed (quota, disabled, corrupted)  | 503         |
| `not_implemented`     | Method is declared but not built yet                 | 501         |

The future HTTP API wraps the same object:

```json
{ "error": { "code": "validation_error", "message": "...", "details": {} } }
```

## Shared types

### Product

```ts
{
  id: string;              // stable, e.g. "broiler-chicken"
  name: string;
  description: string;
  price: number;           // integer, minor-unit-free naira
  currency: 'NGN';
  unit: string;            // e.g. "per bird", "per kg", "per 3L"
  imageUrl: string;        // absolute or site-relative
  available: boolean;
  sortOrder: number;
  createdAt: string;       // ISO 8601
  updatedAt: string;       // ISO 8601
}
```

### Settings

```ts
{
  brandName: string;
  tagline: string;
  logoUrl: string;
  contactPhone: string;
  whatsappNumber: string;
  email: string;
  address: string;
  pickupAddress: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  paymentInstructions: string;
  deliveryFee: number;     // integer naira, >= 0
  currency: 'NGN';
  digestTime: string;      // "HH:MM", 24-hour
  digestRecipient: string;
  lastDigestAt: string | null;
  demoMode: boolean;
}
```

### OrderItem

An immutable snapshot taken at order time, so editing or deleting a product
never rewrites history.

```ts
{
  productId: string;
  name: string;
  unit: string;
  unitPrice: number;
  quantity: number;        // integer, 1..99
  lineTotal: number;
}
```

### Order

```ts
{
  id: string;              // "FF-YYYYMMDD-NNN"
  createdAt: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
    notes?: string;
  };
  fulfilment: 'pickup' | 'delivery';
  deliveryAddress?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: 'new' | 'confirmed' | 'delivered' | 'cancelled';
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  paymentProvider: string | null;   // "paystack" later
  paymentReference: string | null;
  notifiedAt: string | null;        // set when included in a sent digest
}
```

### ExportFile

```ts
{
  filename: string;
  mimeType: string;
  content: string;
}
```

## Public methods

| Method                  | Returns             | Notes                                         |
| ----------------------- | ------------------- | --------------------------------------------- |
| `getPublicSettings()`   | `Promise<Settings>` | Brand, contact, bank, delivery, digest fields |
| `listProducts()`        | `Promise<Product[]>`| All products, including sold out, by sort order |
| `createOrder(input)`    | `Promise<Order>`    | Recomputes prices; rejects sold-out products  |

### `createOrder(input)`

```ts
{
  customer: { name: string, phone: string, email?: string, notes?: string },
  fulfilment: 'pickup' | 'delivery',
  deliveryAddress?: string,
  items: Array<{ productId: string, quantity: number }>
}
```

Rules:

- At least one item; quantity is an integer from 1 to 99.
- Every product must exist and be available at submission time.
- Unit prices, line totals, subtotal, delivery fee, and total are recomputed
  from current product and settings data. Client-supplied totals are ignored.
- Pickup has a zero delivery fee; delivery uses the configured flat fee.
- The order starts as `status: 'new'`, `paymentStatus: 'unpaid'`.
- `id` is `FF-YYYYMMDD-NNN`, with a per-day sequence.

## Admin methods

| Method                            | Returns                | Notes                                  |
| --------------------------------- | ---------------------- | -------------------------------------- |
| `login(password)`                 | `Promise<{ authenticated: true }>` | Demo gate only; not real security |
| `logout()`                        | `Promise<void>`        | Clear the demo session                 |
| `createProduct(input)`            | `Promise<Product>`     | Add to catalogue                       |
| `updateProduct(id, patch)`        | `Promise<Product>`     | Partial update                         |
| `deleteProduct(id)`               | `Promise<void>`        | Past order snapshots remain intact     |
| `setProductAvailability(id, available)` | `Promise<Product>` | One-click sold-out toggle         |
| `listOrders()`                    | `Promise<Order[]>`     | Newest first                           |
| `getOrder(id)`                    | `Promise<Order>`       | Full order detail                      |
| `updateOrderStatus(id, status)`   | `Promise<Order>`       | `new` / `confirmed` / `delivered` / `cancelled` |
| `updateOrderPaymentStatus(id, paymentStatus)` | `Promise<Order>` | `unpaid` / `paid` / `refunded` |
| `getSettings()`                   | `Promise<Settings>`    | Admin read                             |
| `updateSettings(patch)`           | `Promise<Settings>`    | Validated partial update               |
| `exportOrders(format)`            | `Promise<ExportFile>`  | `'json'` or `'csv'`; all orders         |
| `getDigestPreview()`              | `Promise<DigestPreview>` | Orders since `lastDigestAt`          |
| `sendDigestNow()`                 | `Promise<DigestResult>` | Demo only: stamps timestamps, no email |
| `resetDemo()`                     | `Promise<void>`        | Clear namespaced keys and reseed       |

### `getDigestPreview()`

```ts
{
  subject: string;
  body: string;
  orders: Order[];   // createdAt > lastDigestAt and notifiedAt == null
  since: string | null;
}
```

`sendDigestNow()` sets `lastDigestAt` and stamps `notifiedAt` on every included
order. It never sends email.

## Future HTTP endpoints

The same shapes, with the error object above.

### Public

| Method | Path                   | Body                | Response          |
| ------ | ---------------------- | ------------------- | ----------------- |
| GET    | `/api/settings/public` | —                   | `Settings`        |
| GET    | `/api/products`        | —                   | `Product[]`       |
| POST   | `/api/orders`          | `createOrder` input | `Order` (201)     |

### Admin

All admin routes require a server-side session cookie and CSRF token.

| Method | Path                                  | Body / query                  | Response              |
| ------ | ------------------------------------- | ----------------------------- | --------------------- |
| POST   | `/api/admin/login`                    | `{ password }`                | `{ authenticated: true }` |
| POST   | `/api/admin/logout`                   | —                             | `204`                 |
| GET    | `/api/admin/products`                 | —                             | `Product[]`           |
| POST   | `/api/admin/products`                 | product input                 | `Product` (201)       |
| PATCH  | `/api/admin/products/:id`             | partial product               | `Product`             |
| DELETE | `/api/admin/products/:id`             | —                             | `204`                 |
| PATCH  | `/api/admin/products/:id/availability`| `{ available }`               | `Product`             |
| GET    | `/api/admin/orders`                   | —                             | `Order[]`             |
| GET    | `/api/admin/orders/:id`               | —                             | `Order`               |
| PATCH  | `/api/admin/orders/:id/status`        | `{ status }`                  | `Order`               |
| PATCH  | `/api/admin/orders/:id/payment`       | `{ paymentStatus }`           | `Order`               |
| GET    | `/api/admin/settings`                 | —                             | `Settings`            |
| PATCH  | `/api/admin/settings`                 | partial settings              | `Settings`            |
| GET    | `/api/admin/orders/export`            | `?format=json\|csv`           | `ExportFile`          |
| GET    | `/api/admin/digest/preview`           | —                             | `DigestPreview`       |
| POST   | `/api/admin/digest/send`              | —                             | `DigestResult`        |
| POST   | `/api/admin/reset`                    | —                             | `204`                 |

## Storage keys (MockApi)

| Key                        | Payload                                      |
| -------------------------- | -------------------------------------------- |
| `feedmill:v1:products`     | `{ schemaVersion: 1, data: Product[] }`      |
| `feedmill:v1:settings`     | `{ schemaVersion: 1, data: Settings }`       |
| `feedmill:v1:orders`       | `{ schemaVersion: 1, data: Order[] }`        |

A missing, corrupt, or version-mismatched slice is reseeded. Reset removes only
`feedmill:`-prefixed keys; it never calls `localStorage.clear()`.

## Server-side rules for the future backend

The HTTP implementation must repeat, not trust, every rule:

- Authenticate admin routes and rate-limit login.
- Validate every field and quantity bound.
- Recompute prices, delivery fee, and totals from stored product/settings data.
- Reject sold-out or deleted products at submission time.
- Generate order ids atomically with a per-day sequence.
- Keep order item snapshots immutable.
- Persist products, orders, and settings as JSON with atomic writes and backups.
- Keep Paystack fields present so payment can be added without a schema change.
