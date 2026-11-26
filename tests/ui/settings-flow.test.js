import { beforeEach, describe, expect, it } from 'vitest';
import { DEMO_PASSWORD, createMockApi } from '../../js/api/mock-api.js';
import { mountAdmin } from '../../js/admin.js';
import { mountConfirmation } from '../../js/ui/confirmation.js';
import { mountStorefront } from '../../js/storefront.js';

function createAdminFixture() {
  document.body.innerHTML = `
    <p data-admin-status></p>
    <div data-admin-login></div>
    <div data-admin-app hidden>
      <div class="admin-tabs" role="tablist" aria-label="CMS sections">
        <button type="button" role="tab" data-admin-tab="products" aria-selected="true">Products</button>
        <button type="button" role="tab" data-admin-tab="orders" aria-selected="false">Orders</button>
        <button type="button" role="tab" data-admin-tab="settings" aria-selected="false">Settings</button>
      </div>
      <section data-admin-panel="products" role="tabpanel" aria-label="Products"></section>
      <section data-admin-panel="orders" role="tabpanel" aria-label="Orders" hidden></section>
      <section data-admin-panel="settings" role="tabpanel" aria-label="Settings" hidden></section>
    </div>
    <button type="button" data-admin-logout hidden>Log out</button>
    <dialog data-admin-dialog aria-labelledby="admin-dialog-title"></dialog>
  `;
  return document;
}

async function signIn(root) {
  root.querySelector('#admin-password').value = DEMO_PASSWORD;
  await root.querySelector('[data-admin-login] form').dispatchEvent(
    new Event('submit', { bubbles: true, cancelable: true }),
  );
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('settings editor', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = '';
  });

  it('renders every editable field and saves successfully', async () => {
    const api = createMockApi();
    const root = createAdminFixture();
    mountAdmin({ api, root });
    await new Promise((resolve) => setTimeout(resolve, 0));
    await signIn(root);

    root.querySelector('[data-admin-tab="settings"]').click();
    const panel = root.querySelector('[data-admin-panel="settings"]');

    for (const name of [
      'brandName',
      'contactPhone',
      'whatsappNumber',
      'pickupAddress',
      'bankName',
      'accountName',
      'accountNumber',
      'paymentInstructions',
      'deliveryFee',
      'digestTime',
      'digestRecipient',
    ]) {
      expect(
        panel.querySelector(`#settings-${name}`),
        `settings field ${name} should exist`,
      ).not.toBeNull();
    }

    panel.querySelector('#settings-brandName').value = 'New Farm';
    panel.querySelector('#settings-deliveryFee').value = '4000';
    await panel.querySelector('form').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect((await api.getSettings()).brandName).toBe('New Farm');
    expect(panel.textContent).toContain('Settings saved');
  });

  it('shows field errors and keeps the invalid values', async () => {
    const api = createMockApi();
    const root = createAdminFixture();
    mountAdmin({ api, root });
    await new Promise((resolve) => setTimeout(resolve, 0));
    await signIn(root);

    root.querySelector('[data-admin-tab="settings"]').click();
    const panel = root.querySelector('[data-admin-panel="settings"]');

    panel.querySelector('#settings-accountNumber').value = '123';
    await panel.querySelector('form').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(panel.querySelector('#settings-accountNumber-error').hidden).toBe(false);
    expect(panel.querySelector('#settings-accountNumber').value).toBe('123');
    expect((await api.getSettings()).accountNumber).toBe('0000000000');
  });
});

describe('live storefront wiring', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = '';
  });

  it('reloads brand, contact, and fees when another tab saves settings', async () => {
    const api = createMockApi();
    const root = document.createElement('div');
    root.innerHTML = `
      <span data-brand></span>
      <a data-contact-phone></a>
      <a data-whatsapp></a>
      <p data-grid-status></p>
      <div data-product-grid></div>
      <div data-order-summary></div>
      <section data-checkout-section><div data-checkout></div></section>
      <section data-confirmation-section hidden><div data-confirmation></div></section>
    `;
    document.body.append(root);
    const { ready, setQuantity, setFulfilment } = mountStorefront({ api, root });
    await ready;

    expect(root.querySelector('[data-brand]').textContent).toBe('Feedmill Farms');

    await api.updateSettings({
      brandName: 'New Farm',
      contactPhone: '09012345678',
      deliveryFee: 4000,
    });
    window.dispatchEvent(new StorageEvent('storage', { key: 'feedmill:v1:settings' }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(root.querySelector('[data-brand]').textContent).toBe('New Farm');
    expect(root.querySelector('[data-contact-phone]').getAttribute('href')).toBe(
      'tel:09012345678',
    );

    setQuantity('turkey', 1);
    setFulfilment('delivery');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(root.querySelector('[data-summary-delivery]').textContent).toBe('₦4,000');
    expect(root.querySelector('[data-summary-total]').textContent).toBe('₦32,000');
  });

  it('ignores storage events outside the demo namespace', async () => {
    const api = createMockApi();
    const root = document.createElement('div');
    root.innerHTML = `
      <span data-brand></span>
      <p data-grid-status></p>
      <div data-product-grid></div>
      <div data-order-summary></div>
    `;
    document.body.append(root);
    const { ready } = mountStorefront({ api, root });
    await ready;

    window.dispatchEvent(new StorageEvent('storage', { key: 'other-app:key' }));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(root.querySelector('[data-brand]').textContent).toBe('Feedmill Farms');
  });

  it('renders bank, instructions, and pickup address from current settings', async () => {
    const api = createMockApi();
    await api.updateSettings({
      bankName: 'New Bank',
      accountNumber: '1234567890',
      pickupAddress: 'New pickup point',
      deliveryFee: 1000,
    });
    const settings = await api.getSettings();
    const order = await api.createOrder({
      customer: { name: 'Adaeze Obi', phone: '08031234567' },
      fulfilment: 'pickup',
      items: [{ productId: 'turkey', quantity: 1 }],
    });

    const container = document.createElement('div');
    mountConfirmation(container).update(order, settings);

    expect(container.textContent).toContain('New Bank');
    expect(container.textContent).toContain('1234567890');
    expect(container.textContent).toContain('Pickup from: New pickup point');
    expect(container.querySelector('a[href*="wa.me/234"]').href).toContain('text=');
  });
});
