import { beforeEach, describe, expect, it } from 'vitest';
import { createMockApi } from '../../js/api/mock-api.js';

const customer = { name: 'Adaeze Obi', phone: '08031234567' };

function tickingClock(start = '2026-11-26T10:00:00') {
  let time = new Date(start).getTime();
  return () => new Date((time += 1000));
}

async function seedTwoOrders(api) {
  const first = await api.createOrder({
    customer,
    fulfilment: 'pickup',
    items: [{ productId: 'turkey', quantity: 1 }],
  });
  const second = await api.createOrder({
    customer: { ...customer, name: 'Bola Ade' },
    fulfilment: 'delivery',
    deliveryAddress: '14 Farm Road',
    items: [{ productId: 'palm-oil-3l', quantity: 2 }],
  });
  return [first, second];
}

describe('MockApi digest', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('previews every order on the first run, oldest first', async () => {
    const api = createMockApi({ now: tickingClock() });
    const [first, second] = await seedTwoOrders(api);

    const preview = await api.getDigestPreview();

    expect(preview.since).toBeNull();
    expect(preview.orders.map((o) => o.id)).toEqual([first.id, second.id]);
    expect(preview.subject).toContain('(2 orders,');
    expect(preview.subject).toContain('Feedmill Farms');
    expect(preview.body).toContain(first.id);
    expect(preview.body).toContain('Adaeze Obi');
    expect(preview.body).toContain('Turkey ×1 @ ₦28,000 = ₦28,000');
    expect(preview.body).toContain('₦47,500');
    expect(preview.body).toContain('delivery');
  });

  it('labels cancelled orders and still includes them', async () => {
    const api = createMockApi({ now: tickingClock() });
    const [first] = await seedTwoOrders(api);
    await api.updateOrderStatus(first.id, 'cancelled');

    const preview = await api.getDigestPreview();

    expect(preview.orders).toHaveLength(2);
    expect(preview.body).toContain('cancelled');
  });

  it('sends, stamps timestamps, and excludes notified orders next time', async () => {
    const api = createMockApi({ now: tickingClock() });
    await seedTwoOrders(api);

    const result = await api.sendDigestNow();

    expect(result.orderCount).toBe(2);
    expect(typeof result.sentAt).toBe('string');
    expect((await api.getSettings()).lastDigestAt).toBe(result.sentAt);
    expect((await api.listOrders()).every((o) => o.notifiedAt === result.sentAt)).toBe(true);

    const next = await api.getDigestPreview();
    expect(next.orders).toEqual([]);
    expect(next.body).toContain('No new orders since the last digest.');
    expect(next.subject).toContain('(0 orders,');
  });

  it('only includes orders placed since the last digest', async () => {
    const api = createMockApi({ now: tickingClock() });
    await seedTwoOrders(api);
    await api.sendDigestNow();

    const third = await api.createOrder({
      customer,
      fulfilment: 'pickup',
      items: [{ productId: 'turkey', quantity: 1 }],
    });

    const preview = await api.getDigestPreview();
    expect(preview.orders.map((o) => o.id)).toEqual([third.id]);
    expect(preview.since).not.toBeNull();
  });

  it('previews an empty digest when there are no orders', async () => {
    const api = createMockApi();
    const preview = await api.getDigestPreview();

    expect(preview.orders).toEqual([]);
    expect(preview.body).toContain('No new orders since the last digest.');
  });
});
