import { describe, expect, it } from 'vitest';
import { createMockApi } from '../../js/api/mock-api.js';
import { mountStorefront } from '../../js/storefront.js';

function createFixture() {
  const root = document.createElement('div');
  root.innerHTML = `
    <p data-grid-status></p>
    <div data-product-grid></div>
    <div data-order-summary></div>
  `;
  return root;
}

function selectFulfilment(summary, value) {
  const input = summary.querySelector(`input[value="${value}"]`);
  input.checked = true;
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('storefront cart flow', () => {
  it('updates the summary as quantities and fulfilment change', async () => {
    const root = createFixture();
    const { ready } = mountStorefront({ api: createMockApi(), root });
    await ready;

    const turkey = root.querySelector('[data-product-id="turkey"]');
    const increase = turkey.querySelector('[data-qty-action="increase"]');
    const decrease = turkey.querySelector('[data-qty-action="decrease"]');
    const summary = root.querySelector('[data-order-summary]');

    expect(summary.querySelector('[data-summary-empty]').hidden).toBe(false);

    increase.click();
    increase.click();

    expect(turkey.querySelector('[data-qty-value]').textContent).toBe('2');
    expect(summary.querySelector('[data-summary-item="turkey"]').textContent).toContain(
      '2 × ₦28,000',
    );
    expect(summary.querySelector('[data-summary-subtotal]').textContent).toBe(
      '₦56,000',
    );
    expect(summary.querySelector('[data-summary-delivery]').textContent).toBe(
      'Free',
    );
    expect(summary.querySelector('[data-summary-total]').textContent).toBe(
      '₦56,000',
    );

    selectFulfilment(summary, 'delivery');
    expect(summary.querySelector('[data-summary-delivery]').textContent).toBe(
      '₦2,500',
    );
    expect(summary.querySelector('[data-summary-total]').textContent).toBe(
      '₦58,500',
    );

    decrease.click();
    decrease.click();

    expect(turkey.querySelector('[data-qty-value]').textContent).toBe('0');
    expect(decrease.disabled).toBe(true);
    expect(summary.querySelector('[data-summary-items]').hidden).toBe(true);
    expect(summary.querySelector('[data-summary-empty]').hidden).toBe(false);
  });

  it('keeps sold-out products out of the order', async () => {
    const root = createFixture();
    const { ready } = mountStorefront({ api: createMockApi(), root });
    await ready;

    const garri = root.querySelector('[data-product-id="garri"]');
    const increase = garri.querySelector('[data-qty-action="increase"]');
    const summary = root.querySelector('[data-order-summary]');

    expect(garri.textContent).toContain('SOLD OUT');
    expect(increase.disabled).toBe(true);

    increase.click();

    expect(summary.querySelector('[data-summary-item="garri"]')).toBeNull();
    expect(summary.querySelector('[data-summary-empty]').hidden).toBe(false);
  });

  it('caps a product at 99 and removes it at zero', async () => {
    const root = createFixture();
    const { ready, setQuantity } = mountStorefront({
      api: createMockApi(),
      root,
    });
    await ready;

    const turkey = root.querySelector('[data-product-id="turkey"]');
    const summary = root.querySelector('[data-order-summary]');

    setQuantity('turkey', 200);
    expect(turkey.querySelector('[data-qty-value]').textContent).toBe('99');
    expect(turkey.querySelector('[data-qty-action="increase"]').disabled).toBe(
      true,
    );

    setQuantity('turkey', 0);
    expect(turkey.querySelector('[data-qty-value]').textContent).toBe('0');
    expect(summary.querySelector('[data-summary-items]').hidden).toBe(true);
  });
});
