import { beforeEach, describe, expect, it } from 'vitest';
import {
  createMockApi,
  STORAGE_KEYS,
  STORAGE_PREFIX,
} from '../../js/api/mock-api.js';
import { SCHEMA_VERSION } from '../../js/data/seed.js';

beforeEach(() => {
  localStorage.clear();
});

describe('MockApi contract: public reads', () => {
  it('lists the five seeded products in catalogue order', async () => {
    const api = createMockApi();
    const products = await api.listProducts();

    expect(products).toHaveLength(5);
    expect(products.map((product) => product.id)).toEqual([
      'turkey',
      'broiler-chicken',
      'garri',
      'palm-oil-3l',
      'palm-oil-5l',
    ]);
    expect(products.map((product) => product.name)).toEqual([
      'Turkey',
      'Broiler Chicken',
      'Garri',
      '3L Palm Oil',
      '5L Palm Oil',
    ]);

    expect(products[0]).toMatchObject({
      price: 28000,
      currency: 'NGN',
      unit: 'per bird',
      available: true,
      sortOrder: 1,
      imageUrl: 'image/stock/turkey.jpg',
    });
    expect(typeof products[0].createdAt).toBe('string');
    expect(typeof products[0].updatedAt).toBe('string');
  });

  it('keeps garri visible but sold out', async () => {
    const api = createMockApi();
    const garri = (await api.listProducts()).find(
      (product) => product.id === 'garri',
    );

    expect(garri).toBeDefined();
    expect(garri.available).toBe(false);
  });

  it('returns the seeded public settings', async () => {
    const api = createMockApi();
    const settings = await api.getPublicSettings();

    expect(settings).toMatchObject({
      brandName: 'Feedmill Farms',
      currency: 'NGN',
      deliveryFee: 2500,
      demoMode: true,
      bankName: 'Demo Bank',
      accountNumber: '0000000000',
      digestTime: '20:00',
      lastDigestAt: null,
    });
    expect(settings.contactPhone).toContain('000');
    expect(settings.email).toContain('.example');

    const requiredKeys = [
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
      'currency',
      'digestTime',
      'digestRecipient',
      'lastDigestAt',
      'demoMode',
    ];
    for (const key of requiredKeys) {
      expect(settings, `settings.${key} should exist`).toHaveProperty(key);
    }
  });

  it('persists versioned slices to storage', async () => {
    const api = createMockApi();
    await api.listProducts();
    await api.getPublicSettings();

    for (const key of [STORAGE_KEYS.products, STORAGE_KEYS.settings]) {
      const raw = localStorage.getItem(key);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw);
      expect(parsed.schemaVersion).toBe(SCHEMA_VERSION);
    }

    expect(STORAGE_KEYS.products.startsWith(STORAGE_PREFIX)).toBe(true);
  });

  it('returns defensive copies', async () => {
    const api = createMockApi();
    const first = await api.listProducts();
    first[0].name = 'Changed';

    const second = await api.listProducts();
    expect(second[0].name).toBe('Turkey');
  });

  it('reseeds a corrupt or version-mismatched slice', async () => {
    localStorage.setItem(STORAGE_KEYS.products, '{not json');

    const afterCorruption = await createMockApi().listProducts();
    expect(afterCorruption).toHaveLength(5);

    localStorage.setItem(
      STORAGE_KEYS.products,
      JSON.stringify({ schemaVersion: 999, data: [] }),
    );

    const afterMismatch = await createMockApi().listProducts();
    expect(afterMismatch).toHaveLength(5);
  });

  it('exposes the whole adapter surface', () => {
    const api = createMockApi();
    const methods = [
      'getPublicSettings',
      'listProducts',
      'createOrder',
      'login',
      'logout',
      'createProduct',
      'updateProduct',
      'deleteProduct',
      'setProductAvailability',
      'listOrders',
      'getOrder',
      'updateOrderStatus',
      'updateOrderPaymentStatus',
      'getSettings',
      'updateSettings',
      'exportOrders',
      'getDigestPreview',
      'sendDigestNow',
      'resetDemo',
    ];

    for (const method of methods) {
      expect(typeof api[method], `${method} should be a function`).toBe(
        'function',
      );
    }
  });

  it('wraps unavailable storage in a typed storage error', async () => {
    const api = createMockApi({
      storage: {
        getItem() {
          throw new Error('storage blocked');
        },
      },
    });

    await expect(api.listProducts()).rejects.toMatchObject({
      name: 'StorageError',
      code: 'storage_unavailable',
    });
  });
});
