import { beforeEach, describe, expect, it } from 'vitest';
import { createMockApi, DEMO_PASSWORD } from '../../js/api/mock-api.js';

beforeEach(() => {
  localStorage.clear();
});

const customer = { name: 'Adaeze Obi', phone: '08031234567' };

describe('MockApi admin auth', () => {
  it('accepts the demo password and rejects anything else', async () => {
    const api = createMockApi();

    await expect(api.login(DEMO_PASSWORD)).resolves.toEqual({
      authenticated: true,
    });
    await expect(api.login('wrong')).rejects.toMatchObject({
      code: 'unauthorized',
    });
    await expect(api.logout()).resolves.toBeUndefined();
  });
});

describe('MockApi product management', () => {
  it('adds, edits, and deletes products', async () => {
    const api = createMockApi();

    const created = await api.createProduct({
      name: 'Smoked Fish',
      description: 'Tasty smoked fish.',
      price: 4500,
      unit: 'per pack',
      imageUrl: 'image/fish.jpg',
      sortOrder: 6,
    });

    expect(created.id).toBe('smoked-fish');
    expect(created.available).toBe(true);
    expect((await api.listProducts()).map((p) => p.id)).toContain('smoked-fish');

    const updated = await api.updateProduct(created.id, { price: 5000 });
    expect(updated.price).toBe(5000);

    await api.deleteProduct(created.id);
    expect((await api.listProducts()).map((p) => p.id)).not.toContain(
      'smoked-fish',
    );
  });

  it('keeps order snapshots intact after product edits and deletes', async () => {
    const api = createMockApi();
    const order = await api.createOrder({
      customer,
      fulfilment: 'pickup',
      items: [{ productId: 'turkey', quantity: 1 }],
    });

    await api.updateProduct('turkey', { price: 99999, name: 'Changed' });
    await api.deleteProduct('turkey');

    const stored = await api.getOrder(order.id);
    expect(stored.items[0]).toMatchObject({
      name: 'Turkey',
      unitPrice: 28000,
      lineTotal: 28000,
    });
  });

  it('toggles availability and validates product input', async () => {
    const api = createMockApi();

    const soldOut = await api.setProductAvailability('turkey', false);
    expect(soldOut.available).toBe(false);
    expect(
      (await api.listProducts()).find((p) => p.id === 'turkey').available,
    ).toBe(false);

    await expect(api.createProduct({ name: 'x', price: 0, unit: '' })).rejects.toMatchObject({
      code: 'validation_error',
    });
    await expect(api.updateProduct('missing', {})).rejects.toMatchObject({
      code: 'not_found',
    });
  });
});

describe('MockApi order management', () => {
  it('lists newest first and updates status and payment', async () => {
    let tick = new Date('2026-11-26T10:00:00').getTime();
    const api = createMockApi({ now: () => new Date((tick += 1000)) });
    const first = await api.createOrder({
      customer,
      fulfilment: 'pickup',
      items: [{ productId: 'turkey', quantity: 1 }],
    });
    const second = await api.createOrder({
      customer,
      fulfilment: 'pickup',
      items: [{ productId: 'palm-oil-3l', quantity: 1 }],
    });

    expect((await api.listOrders()).map((o) => o.id)).toEqual([
      second.id,
      first.id,
    ]);

    expect((await api.updateOrderStatus(first.id, 'confirmed')).status).toBe(
      'confirmed',
    );
    expect(
      (await api.updateOrderPaymentStatus(first.id, 'paid')).paymentStatus,
    ).toBe('paid');

    await expect(api.updateOrderStatus(first.id, 'shipped')).rejects.toMatchObject({
      code: 'validation_error',
    });
    await expect(api.updateOrderPaymentStatus('FF-20261126-999', 'paid')).rejects.toMatchObject({
      code: 'not_found',
    });
  });
});

describe('MockApi order exports', () => {
  it('exports JSON with the full records and a versioned envelope', async () => {
    const api = createMockApi({ now: () => new Date('2026-11-26T10:00:00') });
    const order = await api.createOrder({
      customer,
      fulfilment: 'delivery',
      deliveryAddress: '14 Farm Road',
      items: [{ productId: 'turkey', quantity: 2 }],
    });

    const file = await api.exportOrders('json');

    expect(file.filename).toBe('feedmill-orders-2026-11-26.json');
    expect(file.mimeType).toBe('application/json');
    const payload = JSON.parse(file.content);
    expect(payload.schemaVersion).toBe(1);
    expect(payload.count).toBe(1);
    expect(payload.orders).toHaveLength(1);
    expect(payload.orders[0].id).toBe(order.id);
    expect(payload.orders[0].customer.name).toBe('Adaeze Obi');
  });

  it('exports CSV with headers, readable items, and correct escaping', async () => {
    const api = createMockApi({ now: () => new Date('2026-11-26T10:00:00') });
    await api.createOrder({
      customer: {
        name: 'Test, "Quoted"',
        phone: '08031234567',
        notes: 'Line one\nLine two',
      },
      fulfilment: 'delivery',
      deliveryAddress: '14, Farm Road',
      items: [{ productId: 'turkey', quantity: 1 }],
    });

    const file = await api.exportOrders('csv');

    expect(file.filename).toBe('feedmill-orders-2026-11-26.csv');
    expect(file.mimeType).toBe('text/csv');
    expect(file.content.charCodeAt(0)).toBe(0xfeff);
    expect(file.content).toContain('\r\n');

    const lines = file.content.replace(/^﻿/, '').split('\r\n').filter(Boolean);
    expect(lines[0]).toBe(
      'order_id,created_at,customer_name,phone,email,fulfilment,delivery_address,items,subtotal,delivery_fee,total,order_status,payment_status,payment_provider,payment_reference,notes',
    );
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('"Test, ""Quoted"""');
    expect(lines[1]).toContain('"14, Farm Road"');
    expect(lines[1]).toContain('"Line one\nLine two"');
    expect(lines[1]).toContain('Turkey ×1 @ ₦28,000 = ₦28,000');
  });

  it('exports valid empty files with headers and no rows', async () => {
    const api = createMockApi();

    const json = await api.exportOrders('json');
    expect(JSON.parse(json.content).orders).toEqual([]);

    const csv = await api.exportOrders('csv');
    const lines = csv.content.replace(/^﻿/, '').split('\r\n').filter(Boolean);
    expect(lines).toHaveLength(1);
  });

  it('rejects unknown export formats', async () => {
    const api = createMockApi();
    await expect(api.exportOrders('xlsx')).rejects.toMatchObject({
      code: 'validation_error',
    });
  });
});
