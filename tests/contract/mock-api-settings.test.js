import { beforeEach, describe, expect, it } from 'vitest';
import { createMockApi } from '../../js/api/mock-api.js';

beforeEach(() => {
  localStorage.clear();
});

const customer = { name: 'Adaeze Obi', phone: '08031234567' };

describe('MockApi settings', () => {
  it('persists validated updates', async () => {
    const api = createMockApi();

    const updated = await api.updateSettings({
      brandName: 'New Farm',
      deliveryFee: 3000,
      digestTime: '19:30',
    });

    expect(updated.brandName).toBe('New Farm');
    expect(updated.deliveryFee).toBe(3000);
    expect(updated.digestTime).toBe('19:30');
    expect((await api.getSettings()).brandName).toBe('New Farm');
    expect((await api.getPublicSettings()).deliveryFee).toBe(3000);
  });

  it('rejects invalid settings with field errors', async () => {
    const api = createMockApi();

    const error = await api
      .updateSettings({ accountNumber: '123', deliveryFee: -1, digestTime: 'nope' })
      .catch((e) => e);

    expect(error.code).toBe('validation_error');
    expect(error.details.field).toBe('accountNumber');
    expect((await api.getSettings()).accountNumber).toBe('0000000000');
  });

  it('recalculates new delivery orders but leaves past orders untouched', async () => {
    const api = createMockApi();
    const before = await api.createOrder({
      customer,
      fulfilment: 'delivery',
      deliveryAddress: '14 Farm Road',
      items: [{ productId: 'turkey', quantity: 1 }],
    });
    expect(before.total).toBe(28000 + 2500);

    await api.updateSettings({ deliveryFee: 4000 });

    const after = await api.createOrder({
      customer,
      fulfilment: 'delivery',
      deliveryAddress: '14 Farm Road',
      items: [{ productId: 'turkey', quantity: 1 }],
    });
    expect(after.total).toBe(28000 + 4000);

    const stored = await api.getOrder(before.id);
    expect(stored.deliveryFee).toBe(2500);
    expect(stored.total).toBe(28000 + 2500);
  });
});
