import { describe, expect, it } from 'vitest';
import {
  buildOrderSummary,
  changeQuantity,
  normaliseQuantity,
  withQuantity,
} from '../../js/domain/cart.js';
import { seedProducts, seedSettings } from '../../js/data/seed.js';

describe('quantity rules', () => {
  it('clamps to whole numbers between 0 and 99', () => {
    expect(normaliseQuantity(-5)).toBe(0);
    expect(normaliseQuantity(0)).toBe(0);
    expect(normaliseQuantity(1.9)).toBe(1);
    expect(normaliseQuantity(99)).toBe(99);
    expect(normaliseQuantity(100)).toBe(99);
    expect(normaliseQuantity('not a number')).toBe(0);
  });

  it('removes a product when its quantity reaches zero', () => {
    const quantities = withQuantity({ turkey: 2, garri: 1 }, 'turkey', 0);

    expect(quantities).toEqual({ garri: 1 });
    expect('turkey' in quantities).toBe(false);
  });

  it('increments and decrements with bounds', () => {
    expect(changeQuantity({ turkey: 1 }, 'turkey', 1)).toEqual({ turkey: 2 });
    expect(changeQuantity({ turkey: 1 }, 'turkey', -1)).toEqual({});
    expect(changeQuantity({ turkey: 99 }, 'turkey', 1)).toEqual({ turkey: 99 });
    expect(changeQuantity({}, 'turkey', -1)).toEqual({});
  });
});

describe('order summary', () => {
  it('prices available items and ignores sold-out products', () => {
    const summary = buildOrderSummary({
      products: seedProducts,
      quantities: { turkey: 2, garri: 3 },
      fulfilment: 'pickup',
      deliveryFee: seedSettings.deliveryFee,
    });

    expect(summary.items.map((item) => item.productId)).toEqual(['turkey']);
    expect(summary.items[0]).toMatchObject({
      name: 'Turkey',
      unit: 'per bird',
      unitPrice: 28000,
      quantity: 2,
      lineTotal: 56000,
    });
    expect(summary.itemCount).toBe(2);
    expect(summary.subtotal).toBe(56000);
    expect(summary.deliveryFee).toBe(0);
    expect(summary.total).toBe(56000);
  });

  it('adds the configured flat delivery fee for delivery orders', () => {
    const summary = buildOrderSummary({
      products: seedProducts,
      quantities: { turkey: 2 },
      fulfilment: 'delivery',
      deliveryFee: seedSettings.deliveryFee,
    });

    expect(summary.subtotal).toBe(56000);
    expect(summary.deliveryFee).toBe(2500);
    expect(summary.total).toBe(58500);
  });

  it('does not charge delivery for an empty cart', () => {
    const summary = buildOrderSummary({
      products: seedProducts,
      quantities: {},
      fulfilment: 'delivery',
      deliveryFee: seedSettings.deliveryFee,
    });

    expect(summary.items).toEqual([]);
    expect(summary.itemCount).toBe(0);
    expect(summary.subtotal).toBe(0);
    expect(summary.deliveryFee).toBe(0);
    expect(summary.total).toBe(0);
  });
});
