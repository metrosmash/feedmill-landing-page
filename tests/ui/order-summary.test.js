import { describe, expect, it, vi } from 'vitest';
import { buildOrderSummary } from '../../js/domain/cart.js';
import { seedProducts, seedSettings } from '../../js/data/seed.js';
import { mountOrderSummary } from '../../js/ui/order-summary.js';

function summaryFor(quantities, fulfilment) {
  return buildOrderSummary({
    products: seedProducts,
    quantities,
    fulfilment,
    deliveryFee: seedSettings.deliveryFee,
  });
}

describe('live order summary', () => {
  it('starts empty and shows the zero total', () => {
    const container = document.createElement('div');
    mountOrderSummary(container);

    expect(container.textContent).toContain('Your order is empty.');
    expect(container.querySelector('[data-summary-total]').textContent).toBe(
      '₦0',
    );
    expect(
      container.querySelector('[data-summary-bar-count]').textContent,
    ).toBe('0 items');
  });

  it('lists items, quantities, line totals, and pickup totals', () => {
    const container = document.createElement('div');
    const summary = mountOrderSummary(container);

    summary.update({
      summary: summaryFor({ turkey: 2, garri: 1 }, 'pickup'),
      fulfilment: 'pickup',
      deliveryFee: seedSettings.deliveryFee,
    });

    const turkey = container.querySelector('[data-summary-item="turkey"]');
    expect(turkey.textContent).toContain('Turkey');
    expect(turkey.textContent).toContain('2 × ₦28,000');
    expect(turkey.textContent).toContain('₦56,000');
    expect(container.querySelector('[data-summary-item="garri"]')).toBeNull();

    expect(container.querySelector('[data-summary-subtotal]').textContent).toBe(
      '₦56,000',
    );
    expect(container.querySelector('[data-summary-delivery]').textContent).toBe(
      'Free',
    );
    expect(container.querySelector('[data-summary-total]').textContent).toBe(
      '₦56,000',
    );
    expect(
      container.querySelector('[data-summary-bar-count]').textContent,
    ).toBe('2 items');
  });

  it('adds the delivery fee and reports fulfilment changes', () => {
    const container = document.createElement('div');
    const onFulfilmentChange = vi.fn();
    const summary = mountOrderSummary(container, { onFulfilmentChange });

    summary.update({
      summary: summaryFor({ turkey: 2 }, 'delivery'),
      fulfilment: 'delivery',
      deliveryFee: seedSettings.deliveryFee,
    });

    expect(container.querySelector('[data-summary-delivery]').textContent).toBe(
      '₦2,500',
    );
    expect(container.querySelector('[data-summary-total]').textContent).toBe(
      '₦58,500',
    );

    const delivery = container.querySelector('input[value="delivery"]');
    expect(delivery.checked).toBe(true);

    delivery.checked = true;
    delivery.dispatchEvent(new Event('change', { bubbles: true }));
    expect(onFulfilmentChange).toHaveBeenCalledWith('delivery');
  });

  it('removes items and shows the empty state when the cart empties', () => {
    const container = document.createElement('div');
    const summary = mountOrderSummary(container);

    summary.update({
      summary: summaryFor({ turkey: 1 }, 'pickup'),
      fulfilment: 'pickup',
      deliveryFee: seedSettings.deliveryFee,
    });
    expect(container.querySelector('[data-summary-items]').hidden).toBe(false);

    summary.update({
      summary: summaryFor({}, 'pickup'),
      fulfilment: 'pickup',
      deliveryFee: seedSettings.deliveryFee,
    });

    expect(container.querySelector('[data-summary-items]').hidden).toBe(true);
    expect(container.querySelector('[data-summary-empty]').hidden).toBe(false);
    expect(container.querySelector('[data-summary-total]').textContent).toBe(
      '₦0',
    );
  });

  it('toggles the mobile sheet with aria-expanded and Escape', () => {
    const container = document.createElement('div');
    mountOrderSummary(container);

    const root = container.querySelector('[data-order-summary]');
    const toggle = container.querySelector('.order-summary__toggle');

    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    toggle.click();
    expect(root.dataset.open).toBe('true');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.textContent).toBe('Close');

    root.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    expect(root.dataset.open).toBe('false');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.textContent).toBe('View order');
  });
});
