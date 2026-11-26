import { beforeEach, describe, expect, it } from 'vitest';
import { createMockApi } from '../../js/api/mock-api.js';

beforeEach(() => {
  localStorage.clear();
});

const customer = {
  name: 'Adaeze Obi',
  phone: '0803 123 4567',
  email: 'ada@example.com',
};

describe('MockApi order creation', () => {
  it('creates a pickup order with snapshots and an order number', async () => {
    const api = createMockApi({ now: () => new Date('2026-11-26T10:00:00') });

    const order = await api.createOrder({
      customer,
      fulfilment: 'pickup',
      items: [{ productId: 'turkey', quantity: 1 }],
    });

    expect(order.id).toBe('FF-20261126-001');
    expect(order.status).toBe('new');
    expect(order.paymentStatus).toBe('unpaid');
    expect(order.paymentProvider).toBeNull();
    expect(order.items).toEqual([
      {
        productId: 'turkey',
        name: 'Turkey',
        unit: 'per bird',
        unitPrice: 28000,
        quantity: 1,
        lineTotal: 28000,
      },
    ]);
    expect(order.subtotal).toBe(28000);
    expect(order.deliveryFee).toBe(0);
    expect(order.total).toBe(28000);
    expect(order.deliveryAddress).toBeUndefined();
  });

  it('adds the flat delivery fee for delivery orders', async () => {
    const api = createMockApi();

    const order = await api.createOrder({
      customer,
      fulfilment: 'delivery',
      deliveryAddress: '14 Farm Road, Ibadan',
      items: [
        { productId: 'turkey', quantity: 2 },
        { productId: 'palm-oil-3l', quantity: 1 },
      ],
    });

    expect(order.subtotal).toBe(28000 * 2 + 8500);
    expect(order.deliveryFee).toBe(2500);
    expect(order.total).toBe(28000 * 2 + 8500 + 2500);
    expect(order.deliveryAddress).toBe('14 Farm Road, Ibadan');
  });

  it('recomputes prices and ignores client-supplied totals', async () => {
    const api = createMockApi();
    await api.updateProduct('turkey', { price: 30000 });

    const order = await api.createOrder({
      customer,
      fulfilment: 'pickup',
      items: [{ productId: 'turkey', quantity: 1 }],
      total: 1,
      subtotal: 1,
    });

    expect(order.items[0].unitPrice).toBe(30000);
    expect(order.total).toBe(30000);
  });

  it('sequences order numbers per day', async () => {
    const api = createMockApi({ now: () => new Date('2026-11-26T10:00:00') });
    const first = await api.createOrder({
      customer,
      fulfilment: 'pickup',
      items: [{ productId: 'turkey', quantity: 1 }],
    });
    const second = await api.createOrder({
      customer,
      fulfilment: 'pickup',
      items: [{ productId: 'turkey', quantity: 1 }],
    });

    expect(first.id).toBe('FF-20261126-001');
    expect(second.id).toBe('FF-20261126-002');
  });

  it('rejects sold-out products, including a mid-shop race', async () => {
    const api = createMockApi();
    await expect(
      api.createOrder({
        customer,
        fulfilment: 'pickup',
        items: [{ productId: 'garri', quantity: 1 }],
      }),
    ).rejects.toMatchObject({ code: 'sold_out' });

    await api.setProductAvailability('turkey', false);
    const error = await api
      .createOrder({
        customer,
        fulfilment: 'pickup',
        items: [{ productId: 'turkey', quantity: 1 }],
      })
      .catch((e) => e);

    expect(error.code).toBe('sold_out');
    expect(error.message).toContain('Turkey');
  });

  it('rejects unknown products and empty or out-of-range carts', async () => {
    const api = createMockApi();

    await expect(
      api.createOrder({ customer, fulfilment: 'pickup', items: [] }),
    ).rejects.toMatchObject({ code: 'validation_error' });

    await expect(
      api.createOrder({
        customer,
        fulfilment: 'pickup',
        items: [{ productId: 'nope', quantity: 1 }],
      }),
    ).rejects.toMatchObject({ code: 'not_found' });

    await expect(
      api.createOrder({
        customer,
        fulfilment: 'pickup',
        items: [{ productId: 'turkey', quantity: 100 }],
      }),
    ).rejects.toMatchObject({ code: 'validation_error' });
  });

  it('rejects invalid customer details with field errors', async () => {
    const api = createMockApi();

    const error = await api
      .createOrder({
        customer: { name: 'A', phone: '123' },
        fulfilment: 'delivery',
        deliveryAddress: '',
        items: [{ productId: 'turkey', quantity: 1 }],
      })
      .catch((e) => e);

    expect(error.code).toBe('validation_error');
    expect(error.details.field).toBe('name');
  });

  it('persists orders so they can be retrieved later', async () => {
    const api = createMockApi();
    const created = await api.createOrder({
      customer,
      fulfilment: 'pickup',
      items: [{ productId: 'turkey', quantity: 1 }],
    });

    expect(await api.getOrder(created.id)).toEqual(created);
    expect((await api.listOrders()).map((o) => o.id)).toContain(created.id);
  });
});
