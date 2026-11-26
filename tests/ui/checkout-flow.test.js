import { beforeEach, describe, expect, it } from 'vitest';
import { createMockApi } from '../../js/api/mock-api.js';
import { mountStorefront } from '../../js/storefront.js';

function createFixture() {
  sessionStorage.clear();
  const root = document.createElement('div');
  root.innerHTML = `
    <p data-grid-status></p>
    <div data-product-grid></div>
    <div data-order-summary></div>
    <section data-checkout-section><div data-checkout></div></section>
    <section data-confirmation-section hidden><div data-confirmation></div></section>
  `;
  document.body.append(root);
  return root;
}

function fillCheckout(root, values) {
  for (const [name, value] of Object.entries(values)) {
    const input = root.querySelector(`#checkout-${name}`);
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

describe('checkout and confirmation', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = '';
  });

  it('shows inline errors and preserves input on validation failure', async () => {
    const root = createFixture();
    const { ready, setQuantity } = mountStorefront({
      api: createMockApi(),
      root,
    });
    await ready;

    setQuantity('turkey', 1);
    fillCheckout(root, { name: 'A', phone: '123', email: 'bad', notes: '' });

    await root.querySelector('[data-checkout-form]').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(root.querySelector('#checkout-name-error').hidden).toBe(false);
    expect(root.querySelector('#checkout-phone-error').hidden).toBe(false);
    expect(root.querySelector('#checkout-name').value).toBe('A');
    expect(root.querySelector('#checkout-phone').value).toBe('123');
    expect(root.querySelector('[data-confirmation]').textContent).toBe('');
  });

  it('requires a delivery address for delivery orders', async () => {
    const root = createFixture();
    const { ready, setQuantity, setFulfilment } = mountStorefront({
      api: createMockApi(),
      root,
    });
    await ready;

    setQuantity('turkey', 1);
    setFulfilment('delivery');
    fillCheckout(root, { name: 'Adaeze Obi', phone: '08031234567', deliveryAddress: '' });

    await root.querySelector('[data-checkout-form]').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(root.querySelector('#checkout-deliveryAddress-error').hidden).toBe(false);
    expect(root.querySelector('[data-confirmation]').textContent).toBe('');
  });

  it('places a pickup order and shows the confirmation', async () => {
    const root = createFixture();
    const api = createMockApi();
    const { ready, setQuantity } = mountStorefront({ api, root });
    await ready;

    setQuantity('turkey', 2);
    fillCheckout(root, { name: 'Adaeze Obi', phone: '0803 123 4567', email: '' });

    await root.querySelector('[data-checkout-form]').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));

    const confirmation = root.querySelector('[data-confirmation]');
    expect(confirmation.textContent).toContain('FF-');
    expect(confirmation.textContent).toContain('₦56,000');
    expect(confirmation.textContent).toContain('Demo Bank');
    expect(confirmation.textContent).toContain('Pickup from:');
    expect(confirmation.querySelector('a[href*="wa.me/234"]')).not.toBeNull();
    expect(confirmation.querySelector('a[href*="wa.me/234"]').href).toContain('text=');

    const stored = await api.listOrders();
    expect(stored).toHaveLength(1);
    expect(stored[0].status).toBe('new');
    expect(JSON.parse(sessionStorage.getItem('feedmill:last-order')).id).toBe(
      stored[0].id,
    );
  });

  it('shows a delivery confirmation with the delivery address', async () => {
    const root = createFixture();
    const { ready, setQuantity, setFulfilment } = mountStorefront({
      api: createMockApi(),
      root,
    });
    await ready;

    setQuantity('palm-oil-3l', 1);
    setFulfilment('delivery');
    fillCheckout(root, {
      name: 'Adaeze Obi',
      phone: '08031234567',
      deliveryAddress: '14 Farm Road, Ibadan',
    });

    await root.querySelector('[data-checkout-form]').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));

    const confirmation = root.querySelector('[data-confirmation]');
    expect(confirmation.textContent).toContain('Delivering to: 14 Farm Road, Ibadan');
    expect(confirmation.textContent).toContain('₦11,000');
  });

  it('recovers from a sold-out race with a named banner and cart correction', async () => {
    const root = createFixture();
    const api = createMockApi();
    const { ready, setQuantity } = mountStorefront({ api, root });
    await ready;

    setQuantity('turkey', 1);
    await api.setProductAvailability('turkey', false);
    fillCheckout(root, { name: 'Adaeze Obi', phone: '08031234567' });

    await root.querySelector('[data-checkout-form]').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));

    const banner = root.querySelector('.form-banner');
    expect(banner.hidden).toBe(false);
    expect(banner.textContent).toContain('Turkey');
    expect(root.querySelector('[data-order-summary]').textContent).toContain(
      'Your order is empty.',
    );
    expect(root.querySelector('#checkout-name').value).toBe('Adaeze Obi');
  });

  it('restores the confirmation after a refresh', async () => {
    const first = createFixture();
    const api = createMockApi();
    const mounted = mountStorefront({ api, root: first });
    await mounted.ready;

    mounted.setQuantity('turkey', 1);
    fillCheckout(first, { name: 'Adaeze Obi', phone: '08031234567' });
    await first.querySelector('[data-checkout-form]').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));

    const storedJson = sessionStorage.getItem('feedmill:last-order');
    const orderId = JSON.parse(storedJson).id;
    document.body.innerHTML = '';
    const second = createFixture();
    sessionStorage.setItem('feedmill:last-order', storedJson);
    const again = mountStorefront({ api, root: second });
    await again.ready;

    expect(second.querySelector('[data-confirmation]').textContent).toContain(
      orderId,
    );
  });
});
