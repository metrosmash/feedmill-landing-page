import { createSeed, SCHEMA_VERSION } from '../data/seed.js';
import { NotImplementedError } from './errors.js';
import { createSafeStorage } from './safe-storage.js';

export const STORAGE_PREFIX = 'feedmill:v1';

export const STORAGE_KEYS = {
  products: `${STORAGE_PREFIX}:products`,
  settings: `${STORAGE_PREFIX}:settings`,
  orders: `${STORAGE_PREFIX}:orders`,
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isProductList(value) {
  return Array.isArray(value) && value.every((product) => product && typeof product.id === 'string');
}

function isSettings(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Create the localStorage-backed Api adapter used by the demo.
 *
 * Ticket 01 implements the public read path. The remaining contract methods
 * are present and reject with a typed NotImplementedError until their tickets
 * land, so the UI and tests can rely on one stable surface.
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

  function readProducts() {
    return readSlice(STORAGE_KEYS.products, seed.products, isProductList);
  }

  function readSettings() {
    return readSlice(STORAGE_KEYS.settings, seed.settings, isSettings);
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
    createOrder: notImplemented('createOrder'),

    // Admin authentication (ticket 04).
    login: notImplemented('login'),
    logout: notImplemented('logout'),

    // Product management (ticket 04).
    createProduct: notImplemented('createProduct'),
    updateProduct: notImplemented('updateProduct'),
    deleteProduct: notImplemented('deleteProduct'),
    setProductAvailability: notImplemented('setProductAvailability'),

    // Order management (ticket 05).
    listOrders: notImplemented('listOrders'),
    getOrder: notImplemented('getOrder'),
    updateOrderStatus: notImplemented('updateOrderStatus'),
    updateOrderPaymentStatus: notImplemented('updateOrderPaymentStatus'),

    // Settings (ticket 07).
    getSettings: notImplemented('getSettings'),
    updateSettings: notImplemented('updateSettings'),

    // Exports (ticket 06).
    exportOrders: notImplemented('exportOrders'),

    // Digest (ticket 08).
    getDigestPreview: notImplemented('getDigestPreview'),
    sendDigestNow: notImplemented('sendDigestNow'),

    // Demo lifecycle (ticket 09).
    resetDemo: notImplemented('resetDemo'),

    // Exposed for diagnostics and future tickets.
    now,
  };
}
