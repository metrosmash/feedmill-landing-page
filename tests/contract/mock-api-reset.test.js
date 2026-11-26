import { beforeEach, describe, expect, it } from 'vitest';
import { createMockApi } from '../../js/api/mock-api.js';

beforeEach(() => {
  localStorage.clear();
});

describe('MockApi demo reset', () => {
  it('clears orders and reseeds the original catalogue and settings', async () => {
    const api = createMockApi();
    await api.createOrder({
      customer: { name: 'Adaeze Obi', phone: '08031234567' },
      fulfilment: 'pickup',
      items: [{ productId: 'turkey', quantity: 1 }],
    });
    await api.deleteProduct('turkey');
    await api.updateSettings({ brandName: 'Changed', deliveryFee: 9999 });

    await api.resetDemo();

    expect(await api.listOrders()).toEqual([]);

    const products = await api.listProducts();
    expect(products).toHaveLength(5);
    expect(products.map((p) => p.id)).toEqual([
      'turkey',
      'broiler-chicken',
      'garri',
      'palm-oil-3l',
      'palm-oil-5l',
    ]);

    const garri = products.find((p) => p.id === 'garri');
    expect(garri.available).toBe(false);

    const settings = await api.getSettings();
    expect(settings.brandName).toBe('Feedmill Farms');
    expect(settings.deliveryFee).toBe(2500);
  });

  it('only clears the demo namespace', async () => {
    localStorage.setItem('other-app:key', 'keep me');
    const api = createMockApi();
    await api.resetDemo();

    expect(localStorage.getItem('other-app:key')).toBe('keep me');
  });
});
