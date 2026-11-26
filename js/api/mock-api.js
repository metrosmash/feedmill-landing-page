import { createSeed, SCHEMA_VERSION } from '../data/seed.js';
import { formatNgn } from '../domain/money.js';
import {
  normalisePhone,
  validateCustomer,
  validateProduct,
  validateSettings,
} from '../domain/validation.js';
import { ApiError, NotImplementedError } from './errors.js';
import { createSafeStorage } from './safe-storage.js';

export const STORAGE_PREFIX = 'feedmill:v1';

export const STORAGE_KEYS = {
  products: `${STORAGE_PREFIX}:products`,
  settings: `${STORAGE_PREFIX}:settings`,
  orders: `${STORAGE_PREFIX}:orders`,
};

export const DEMO_PASSWORD = 'feedmill2026';

export const ORDER_STATUSES = Object.freeze(['new', 'confirmed', 'delivered', 'cancelled']);
export const PAYMENT_STATUSES = Object.freeze(['unpaid', 'paid', 'refunded']);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isProductList(value) {
  return (
    Array.isArray(value) &&
    value.every((product) => product && typeof product.id === 'string')
  );
}

function isSettings(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isOrderList(value) {
  return (
    Array.isArray(value) &&
    value.every((order) => order && typeof order.id === 'string')
  );
}

/**
 * @param {string} name
 * @returns {string}
 */
function slugify(name) {
  const slug = String(name ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return slug || 'product';
}

/**
 * @param {Date} date
 * @returns {string} YYYYMMDD in local time
 */
function dateStamp(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * @param {Date} date
 * @returns {string} YYYY-MM-DD in local time
 */
function isoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Escape one CSV field per RFC 4180.
 *
 * @param {unknown} value
 * @returns {string}
 */
function csvField(value) {
  const text = value == null ? '' : String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export const CSV_HEADERS = Object.freeze([
  'order_id',
  'created_at',
  'customer_name',
  'phone',
  'email',
  'fulfilment',
  'delivery_address',
  'items',
  'subtotal',
  'delivery_fee',
  'total',
  'order_status',
  'payment_status',
  'payment_provider',
  'payment_reference',
  'notes',
]);

/**
 * Create the localStorage-backed Api adapter used by the demo.
 *
 * Tickets 01–06 are implemented. Tickets 07–09 remain as typed
 * NotImplementedError rejections behind the same stable surface.
 *
 * @param {{
 *   storage?: Storage,
 *   seed?: { products: unknown[], settings: unknown },
 *   now?: () => Date,
 * }} [options]
 */
export function createMockApi({
  storage,
  seed = createSeed(),
  now = () => new Date(),
} = {}) {
  const safeStorage = createSafeStorage(storage);

  /**
   * Read a versioned slice, seeding it on first use or when the stored payload
   * is corrupt or from an incompatible schema version.
   *
   * @param {string} key
   * @param {unknown} fallback
   * @param {(value: unknown) => boolean} isValid
   */
  function readSlice(key, fallback, isValid) {
    const raw = safeStorage.getItem(key);
    if (raw != null) {
      try {
        const parsed = JSON.parse(raw);
        if (
          parsed &&
          parsed.schemaVersion === SCHEMA_VERSION &&
          isValid(parsed.data)
        ) {
          return parsed.data;
        }
      } catch {
        // Corrupt payload: fall through and reseed this slice.
      }
    }

    const seeded = clone(fallback);
    safeStorage.setItem(
      key,
      JSON.stringify({ schemaVersion: SCHEMA_VERSION, data: seeded }),
    );
    return seeded;
  }

  /**
   * @param {string} key
   * @param {unknown} data
   */
  function writeSlice(key, data) {
    safeStorage.setItem(
      key,
      JSON.stringify({ schemaVersion: SCHEMA_VERSION, data: clone(data) }),
    );
  }

  function readProducts() {
    return readSlice(STORAGE_KEYS.products, seed.products, isProductList);
  }

  function readSettings() {
    return readSlice(STORAGE_KEYS.settings, seed.settings, isSettings);
  }

  function readOrders() {
    return readSlice(STORAGE_KEYS.orders, [], isOrderList);
  }

  /**
   * @param {string} method
   * @returns {(...args: unknown[]) => Promise<never>}
   */
  function notImplemented(method) {
    return async () => {
      throw new NotImplementedError(method);
    };
  }

  /**
   * Next human-readable order id for the current local day.
   *
   * @param {Array<{ id: string }>} orders
   * @param {Date} date
   * @returns {string}
   */
  function nextOrderId(orders, date) {
    const stamp = dateStamp(date);
    const prefix = `FF-${stamp}-`;
    let max = 0;
    for (const order of orders) {
      if (typeof order.id === 'string' && order.id.startsWith(prefix)) {
        const sequence = Number(order.id.slice(prefix.length));
        if (Number.isInteger(sequence) && sequence > max) max = sequence;
      }
    }
    return `${prefix}${String(max + 1).padStart(3, '0')}`;
  }

  /**
   * Build a readable one-line summary of order items for CSV export.
   *
   * @param {Array<{ name: string, quantity: number, unitPrice: number, lineTotal: number }>} items
   * @returns {string}
   */
  function itemSummary(items) {
    return items
      .map(
        (item) =>
          `${item.name} ×${item.quantity} @ ${formatNgn(item.unitPrice)} = ${formatNgn(item.lineTotal)}`,
      )
      .join('; ');
  }

  /**
   * Shared digest selection so preview and send can never disagree.
   */
  function buildDigestPreview() {
    const settings = readSettings();
    const orders = readOrders();
    const since = settings.lastDigestAt ?? null;

    const included = orders
      .filter(
        (order) =>
          order.notifiedAt == null &&
          (since == null || String(order.createdAt) > since),
      )
      .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));

    const total = included.reduce((sum, order) => sum + order.total, 0);
    const dayLabel = now().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const subject =
      `${settings.brandName} — orders for ${dayLabel} ` +
      `(${included.length} ${included.length === 1 ? 'order' : 'orders'}, ${formatNgn(total)})`;

    const lines = [
      `Hello, here are the orders since ${since == null ? 'the beginning (first digest)' : since}.`,
      '',
    ];
    for (const order of included) {
      lines.push(
        `${order.id} — ${order.customer.name} (${order.customer.phone})`,
        `  Items: ${itemSummary(order.items)}`,
        `  Total: ${formatNgn(order.total)} · ${order.fulfilment} · ${order.status}`,
        '',
      );
    }
    if (included.length === 0) {
      lines.push('No new orders since the last digest.', '');
    } else {
      lines.push(
        `Total across ${included.length} ${included.length === 1 ? 'order' : 'orders'}: ${formatNgn(total)}`,
        '',
      );
    }
    lines.push(`Digest recipient: ${settings.digestRecipient} at ${settings.digestTime}.`);

    return {
      subject,
      body: lines.join('\n'),
      orders: clone(included),
      since,
    };
  }

  return {
    // Public read path (ticket 01).
    async getPublicSettings() {
      return clone(readSettings());
    },

    async listProducts() {
      const products = [...readProducts()].sort((a, b) => {
        const byOrder = Number(a.sortOrder) - Number(b.sortOrder);
        return byOrder || String(a.name).localeCompare(String(b.name));
      });
      return clone(products);
    },

    // Order creation (ticket 03).
    async createOrder(input = {}) {
      const { customer = {}, fulfilment = 'pickup', deliveryAddress = '', items = [] } =
        input ?? {};

      if (!Array.isArray(items) || items.length === 0) {
        throw new ApiError('validation_error', 'Add at least one item to your order.', {
          field: 'items',
        });
      }

      const { ok, errors } = validateCustomer({
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        fulfilment,
        deliveryAddress,
        notes: customer.notes,
      });

      if (!ok) {
        const [field] = Object.keys(errors);
        throw new ApiError('validation_error', errors[field], {
          field,
          errors,
        });
      }

      if (fulfilment !== 'pickup' && fulfilment !== 'delivery') {
        throw new ApiError('validation_error', 'Choose pickup or delivery.', {
          field: 'fulfilment',
        });
      }

      const products = readProducts();
      const settings = readSettings();
      const byId = new Map(products.map((product) => [product.id, product]));

      const snapshots = [];
      let subtotal = 0;

      for (const entry of items) {
        const product = byId.get(entry?.productId);
        if (!product) {
          throw new ApiError(
            'not_found',
            'One of the products in your order no longer exists.',
            { productId: entry?.productId },
          );
        }
        if (product.available === false) {
          throw new ApiError(
            'sold_out',
            `${product.name} is sold out and cannot be ordered.`,
            { productId: product.id, productName: product.name },
          );
        }

        const quantity = Number(entry?.quantity);
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
          throw new ApiError(
            'validation_error',
            `Choose a quantity from 1 to 99 for ${product.name}.`,
            { field: 'items', productId: product.id },
          );
        }

        const lineTotal = product.price * quantity;
        subtotal += lineTotal;
        snapshots.push({
          productId: product.id,
          name: product.name,
          unit: product.unit,
          unitPrice: product.price,
          quantity,
          lineTotal,
        });
      }

      const deliveryFee =
        fulfilment === 'delivery' ? Math.max(0, Number(settings.deliveryFee) || 0) : 0;
      const createdAt = now().toISOString();
      const orders = readOrders();
      const id = nextOrderId(orders, now());

      const order = {
        id,
        createdAt,
        customer: {
          name: String(customer.name).trim(),
          phone: normalisePhone(customer.phone),
          ...(String(customer.email ?? '').trim()
            ? { email: String(customer.email).trim() }
            : {}),
          ...(String(customer.notes ?? '').trim()
            ? { notes: String(customer.notes).trim() }
            : {}),
        },
        fulfilment,
        ...(fulfilment === 'delivery'
          ? { deliveryAddress: String(deliveryAddress).trim() }
          : {}),
        items: snapshots,
        subtotal,
        deliveryFee,
        total: subtotal + deliveryFee,
        status: 'new',
        paymentStatus: 'unpaid',
        paymentProvider: null,
        paymentReference: null,
        notifiedAt: null,
      };

      orders.push(order);
      writeSlice(STORAGE_KEYS.orders, orders);
      return clone(order);
    },

    // Admin authentication (ticket 04).
    async login(password) {
      if (password !== DEMO_PASSWORD) {
        throw new ApiError('unauthorized', 'That password is not correct.', {
          hint: 'The demo password is shown on the login screen.',
        });
      }
      return { authenticated: true };
    },

    async logout() {
      return undefined;
    },

    // Product management (ticket 04).
    async createProduct(input = {}) {
      const { ok, errors } = validateProduct(input);
      if (!ok) {
        const [field] = Object.keys(errors);
        throw new ApiError('validation_error', errors[field], { field, errors });
      }

      const products = readProducts();
      const existing = new Set(products.map((product) => product.id));
      let id = slugify(input.name);
      let suffix = 2;
      while (existing.has(id)) {
        id = `${slugify(input.name)}-${suffix}`;
        suffix += 1;
      }

      const timestamp = now().toISOString();
      const product = {
        id,
        name: String(input.name).trim(),
        description: String(input.description ?? '').trim(),
        price: Number(input.price),
        currency: 'NGN',
        unit: String(input.unit).trim(),
        imageUrl: String(input.imageUrl ?? '').trim(),
        available: input.available !== false,
        sortOrder: Number(input.sortOrder ?? products.length + 1),
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      products.push(product);
      writeSlice(STORAGE_KEYS.products, products);
      return clone(product);
    },

    async updateProduct(id, patch = {}) {
      const products = readProducts();
      const index = products.findIndex((product) => product.id === id);
      if (index === -1) {
        throw new ApiError('not_found', 'That product no longer exists.', {
          productId: id,
        });
      }

      const merged = { ...products[index], ...patch, id: products[index].id };
      const { ok, errors } = validateProduct(merged);
      if (!ok) {
        const [field] = Object.keys(errors);
        throw new ApiError('validation_error', errors[field], { field, errors });
      }

      merged.name = String(merged.name).trim();
      merged.description = String(merged.description ?? '').trim();
      merged.unit = String(merged.unit).trim();
      merged.imageUrl = String(merged.imageUrl ?? '').trim();
      merged.price = Number(merged.price);
      merged.sortOrder = Number(merged.sortOrder);
      merged.available = merged.available !== false;
      merged.updatedAt = now().toISOString();

      products[index] = merged;
      writeSlice(STORAGE_KEYS.products, products);
      return clone(merged);
    },

    async deleteProduct(id) {
      const products = readProducts();
      const index = products.findIndex((product) => product.id === id);
      if (index === -1) {
        throw new ApiError('not_found', 'That product no longer exists.', {
          productId: id,
        });
      }
      products.splice(index, 1);
      writeSlice(STORAGE_KEYS.products, products);
      return undefined;
    },

    async setProductAvailability(id, available) {
      const products = readProducts();
      const index = products.findIndex((product) => product.id === id);
      if (index === -1) {
        throw new ApiError('not_found', 'That product no longer exists.', {
          productId: id,
        });
      }
      products[index] = {
        ...products[index],
        available: available !== false,
        updatedAt: now().toISOString(),
      };
      writeSlice(STORAGE_KEYS.products, products);
      return clone(products[index]);
    },

    // Order management (ticket 05).
    async listOrders() {
      const orders = readOrders();
      return clone(
        [...orders].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))),
      );
    },

    async getOrder(id) {
      const order = readOrders().find((entry) => entry.id === id);
      if (!order) {
        throw new ApiError('not_found', 'That order no longer exists.', {
          orderId: id,
        });
      }
      return clone(order);
    },

    async updateOrderStatus(id, status) {
      if (!ORDER_STATUSES.includes(status)) {
        throw new ApiError('validation_error', 'Choose a valid order status.', {
          field: 'status',
        });
      }
      const orders = readOrders();
      const index = orders.findIndex((entry) => entry.id === id);
      if (index === -1) {
        throw new ApiError('not_found', 'That order no longer exists.', {
          orderId: id,
        });
      }
      orders[index] = { ...orders[index], status };
      writeSlice(STORAGE_KEYS.orders, orders);
      return clone(orders[index]);
    },

    async updateOrderPaymentStatus(id, paymentStatus) {
      if (!PAYMENT_STATUSES.includes(paymentStatus)) {
        throw new ApiError('validation_error', 'Choose a valid payment status.', {
          field: 'paymentStatus',
        });
      }
      const orders = readOrders();
      const index = orders.findIndex((entry) => entry.id === id);
      if (index === -1) {
        throw new ApiError('not_found', 'That order no longer exists.', {
          orderId: id,
        });
      }
      orders[index] = { ...orders[index], paymentStatus };
      writeSlice(STORAGE_KEYS.orders, orders);
      return clone(orders[index]);
    },

    // Settings (ticket 07 owns writes; reads are available now).
    async getSettings() {
      return clone(readSettings());
    },

    async updateSettings(patch = {}) {
      const settings = readSettings();
      const allowed = [
        'brandName',
        'tagline',
        'logoUrl',
        'contactPhone',
        'whatsappNumber',
        'email',
        'address',
        'pickupAddress',
        'bankName',
        'accountName',
        'accountNumber',
        'paymentInstructions',
        'deliveryFee',
        'digestTime',
        'digestRecipient',
      ];
      const merged = { ...settings };
      for (const key of allowed) {
        if (patch[key] !== undefined) merged[key] = patch[key];
      }
      if (typeof merged.deliveryFee !== 'number') {
        merged.deliveryFee = Number(merged.deliveryFee);
      }

      const { ok, errors } = validateSettings(merged);
      if (!ok) {
        const [field] = Object.keys(errors);
        throw new ApiError('validation_error', errors[field], { field, errors });
      }

      for (const key of allowed) {
        if (typeof merged[key] === 'string') merged[key] = merged[key].trim();
      }
      if (typeof merged.deliveryFee !== 'number' || Number.isNaN(merged.deliveryFee)) {
        merged.deliveryFee = 0;
      }

      writeSlice(STORAGE_KEYS.settings, merged);
      return clone(merged);
    },

    // Exports (ticket 06).
    async exportOrders(format) {
      if (format !== 'json' && format !== 'csv') {
        throw new ApiError('validation_error', 'Export format must be json or csv.', {
          field: 'format',
        });
      }

      const orders = [...readOrders()].sort((a, b) =>
        String(a.createdAt).localeCompare(String(b.createdAt)),
      );
      const stamp = isoDate(now());

      if (format === 'json') {
        const payload = {
          schemaVersion: SCHEMA_VERSION,
          exportedAt: now().toISOString(),
          count: orders.length,
          orders,
        };
        return {
          filename: `feedmill-orders-${stamp}.json`,
          mimeType: 'application/json',
          content: `${JSON.stringify(payload, null, 2)}\n`,
        };
      }

      const rows = [CSV_HEADERS.join(',')];
      for (const order of orders) {
        rows.push(
          [
            order.id,
            order.createdAt,
            order.customer?.name ?? '',
            order.customer?.phone ?? '',
            order.customer?.email ?? '',
            order.fulfilment,
            order.deliveryAddress ?? '',
            itemSummary(order.items ?? []),
            order.subtotal,
            order.deliveryFee,
            order.total,
            order.status,
            order.paymentStatus,
            order.paymentProvider ?? '',
            order.paymentReference ?? '',
            order.customer?.notes ?? '',
          ]
            .map(csvField)
            .join(','),
        );
      }

      return {
        filename: `feedmill-orders-${stamp}.csv`,
        mimeType: 'text/csv',
        content: '\uFEFF' + rows.join('\r\n') + '\r\n',
      };
    },

    // Digest (ticket 08).
    async getDigestPreview() {
      return buildDigestPreview();
    },

    async sendDigestNow() {
      // Same selection as the preview, so the two can never disagree.
      const fresh = buildDigestPreview();
      const sentAt = now().toISOString();

      const settings = readSettings();
      settings.lastDigestAt = sentAt;
      writeSlice(STORAGE_KEYS.settings, settings);

      if (fresh.orders.length > 0) {
        const ids = new Set(fresh.orders.map((order) => order.id));
        const orders = readOrders().map((order) =>
          ids.has(order.id) ? { ...order, notifiedAt: sentAt } : order,
        );
        writeSlice(STORAGE_KEYS.orders, orders);
      }

      return { sentAt, orderCount: fresh.orders.length };
    },

    // Demo lifecycle (ticket 09).
    resetDemo: notImplemented('resetDemo'),

    // Exposed for diagnostics and future tickets.
    now,
  };
}
