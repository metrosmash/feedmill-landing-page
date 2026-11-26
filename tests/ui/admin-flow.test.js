import { beforeEach, describe, expect, it } from 'vitest';
import { mountAdmin } from '../../js/admin.js';
import { createMockApi, DEMO_PASSWORD } from '../../js/api/mock-api.js';

function createFixture() {
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

describe('admin CMS', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = '';
  });

  it('gates the CMS behind the demo password', async () => {
    const root = createFixture();
    mountAdmin({ api: createMockApi(), root });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(root.querySelector('[data-admin-app]').hidden).toBe(true);
    expect(root.querySelector('[data-admin-login]').textContent).toContain(
      DEMO_PASSWORD,
    );

    root.querySelector('#admin-password').value = 'wrong';
    await root.querySelector('[data-admin-login] form').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(root.querySelector('[data-admin-app]').hidden).toBe(true);
    expect(root.querySelector('.field-error').textContent).toContain(
      'not correct',
    );

    await signIn(root);

    expect(root.querySelector('[data-admin-app]').hidden).toBe(false);
    expect(root.querySelector('[data-admin-logout]').hidden).toBe(false);
    expect(root.querySelectorAll('[data-product-row]')).toHaveLength(5);
  });

  it('toggles availability and reflects it in the product row', async () => {
    const root = createFixture();
    mountAdmin({ api: createMockApi(), root });
    await new Promise((resolve) => setTimeout(resolve, 0));
    await signIn(root);

    const row = root.querySelector('[data-product-row="turkey"]');
    const toggle = [...row.querySelectorAll('button')].find((button) =>
      button.textContent.includes('sold out'),
    );
    toggle.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(
      root.querySelector('[data-product-row="turkey"]').textContent,
    ).toContain('Sold out');
  });

  it('previews the image URL live in the product form', async () => {    const root = createFixture();
    mountAdmin({ api: createMockApi(), root });
    await new Promise((resolve) => setTimeout(resolve, 0));
    await signIn(root);

    root.querySelector('.admin-section-head .button').click();
    const dialog = root.querySelector('[data-admin-dialog]');
    const urlInput = dialog.querySelector('#product-imageUrl');

    urlInput.value = 'image/preview.jpg';
    urlInput.dispatchEvent(new Event('input', { bubbles: true }));

    const preview = dialog.querySelector('.admin-form img');
    expect(preview.hidden).toBe(false);
    expect(preview.getAttribute('src')).toBe('image/preview.jpg');
  });

  it('lists orders, updates status, and offers exports', async () => {
    const api = createMockApi();
    await api.createOrder({
      customer: { name: 'Adaeze Obi', phone: '08031234567' },
      fulfilment: 'pickup',
      items: [{ productId: 'turkey', quantity: 1 }],
    });

    const root = createFixture();
    mountAdmin({ api, root });
    await new Promise((resolve) => setTimeout(resolve, 0));
    await signIn(root);

    root.querySelector('[data-admin-tab="orders"]').click();

    expect(root.querySelectorAll('[data-order-row]')).toHaveLength(1);
    expect(root.querySelector('[data-order-row]').textContent).toContain('Adaeze Obi');

    const statusSelect = root.querySelector('[data-order-row] select');
    statusSelect.value = 'confirmed';
    statusSelect.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect((await api.listOrders())[0].status).toBe('confirmed');
    expect(root.querySelector('[data-admin-panel="orders"]').textContent).toContain(
      'Download JSON',
    );
    expect(root.querySelector('[data-admin-panel="orders"]').textContent).toContain(
      'Download CSV',
    );
  });

  it('shows an empty state when there are no orders', async () => {
    const root = createFixture();
    mountAdmin({ api: createMockApi(), root });
    await new Promise((resolve) => setTimeout(resolve, 0));
    await signIn(root);

    root.querySelector('[data-admin-tab="orders"]').click();

    expect(root.querySelector('[data-admin-panel="orders"]').textContent).toContain(
      'No orders yet',
    );
  });

  it('persists the session and logs out', async () => {
    const root = createFixture();
    mountAdmin({ api: createMockApi(), root });
    await new Promise((resolve) => setTimeout(resolve, 0));
    await signIn(root);

    expect(sessionStorage.getItem('feedmill:admin-auth')).toBe('1');

    root.querySelector('[data-admin-logout]').click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(root.querySelector('[data-admin-app]').hidden).toBe(true);
    expect(sessionStorage.getItem('feedmill:admin-auth')).toBeNull();
  });

  it('saves the product on a plain submit, like a real browser', async () => {
    // Browsers only set dialog.returnValue *after* the submit event, so the
    // handler must not depend on it. Submitting with the default empty
    // returnValue must still save.
    const api = createMockApi();
    const root = createFixture();
    mountAdmin({ api, root });
    await new Promise((resolve) => setTimeout(resolve, 0));
    await signIn(root);

    root.querySelector('.admin-section-head .button').click();
    const dialog = root.querySelector('[data-admin-dialog]');

    dialog.querySelector('#product-name').value = 'Yam';
    dialog.querySelector('#product-price').value = '3000';
    dialog.querySelector('#product-unit').value = 'per tuber';
    expect(dialog.returnValue ?? '').toBe('');

    dialog.querySelector('.admin-form').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));

    const saved = (await api.listProducts()).find((p) => p.name === 'Yam');
    expect(saved).toBeDefined();
    expect(saved.price).toBe(3000);
  });

  it('accepts local image paths in the product form', async () => {
    const api = createMockApi();
    const root = createFixture();
    mountAdmin({ api, root });
    await new Promise((resolve) => setTimeout(resolve, 0));
    await signIn(root);

    root.querySelector('.admin-section-head .button').click();
    const dialog = root.querySelector('[data-admin-dialog]');
    const urlInput = dialog.querySelector('#product-imageUrl');

    // Native type=url inputs reject relative paths before app validation
    // runs, so the field must stay a plain text input.
    expect(urlInput.type).not.toBe('url');

    dialog.querySelector('#product-name').value = 'Chicken 2';
    dialog.querySelector('#product-price').value = '12000';
    dialog.querySelector('#product-unit').value = 'per bird';
    urlInput.value = 'image/chicken 2.jpg';
    urlInput.dispatchEvent(new Event('input', { bubbles: true }));

    dialog.returnValue = 'save';
    dialog.querySelector('.admin-form').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));

    const saved = (await api.listProducts()).find((p) => p.name === 'Chicken 2');
    expect(saved).toBeDefined();
    expect(saved.imageUrl).toBe('image/chicken 2.jpg');
  });
});
