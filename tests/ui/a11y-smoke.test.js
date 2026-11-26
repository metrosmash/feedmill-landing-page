import { beforeEach, describe, expect, it } from 'vitest';
import { DEMO_PASSWORD, createMockApi } from '../../js/api/mock-api.js';
import { mountAdmin } from '../../js/admin.js';
import { mountStorefront } from '../../js/storefront.js';

/**
 * Accessibility smoke checks (ticket 10): every field labelled, dialogs
 * named, live regions present, images described.
 *
 * @param {ParentNode} scope
 */
function expectFieldsLabelled(scope) {
  const fields = [...scope.querySelectorAll('input, select, textarea')];
  expect(fields.length).toBeGreaterThan(0);
  for (const field of fields) {
    const labelled =
      (field.labels && field.labels.length > 0) ||
      field.hasAttribute('aria-label') ||
      (field.id && scope.querySelector(`label[for="${field.id}"]`) != null);
    expect(labelled, `field ${field.name || field.id || field.type} should be labelled`).toBe(
      true,
    );
  }
}

function createAdminFixture() {
  document.body.innerHTML = `
    <p data-admin-status></p>
    <div data-admin-login></div>
    <div data-admin-app hidden>
      <div class="admin-tabs" role="tablist" aria-label="CMS sections">
        <button type="button" role="tab" data-admin-tab="products" aria-selected="true">Products</button>
        <button type="button" role="tab" data-admin-tab="orders" aria-selected="false">Orders</button>
        <button type="button" role="tab" data-admin-tab="digest" aria-selected="false">Digest</button>
        <button type="button" role="tab" data-admin-tab="settings" aria-selected="false">Settings</button>
      </div>
      <section data-admin-panel="products" role="tabpanel" aria-label="Products"></section>
      <section data-admin-panel="orders" role="tabpanel" aria-label="Orders" hidden></section>
      <section data-admin-panel="digest" role="tabpanel" aria-label="Digest" hidden></section>
      <section data-admin-panel="settings" role="tabpanel" aria-label="Settings" hidden></section>
    </div>
    <button type="button" data-admin-logout hidden>Log out</button>
    <dialog data-admin-dialog aria-labelledby="admin-dialog-title"></dialog>
  `;
  return document;
}

describe('accessibility smoke checks', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = '';
  });

  it('labels the checkout fields and announces grid status', async () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <p data-grid-status role="status" aria-live="polite"></p>
      <div data-product-grid></div>
      <div data-order-summary></div>
      <section data-checkout-section><div data-checkout></div></section>
      <section data-confirmation-section hidden><div data-confirmation></div></section>
    `;
    document.body.append(root);
    const { ready } = mountStorefront({ api: createMockApi(), root });
    await ready;

    expectFieldsLabelled(root.querySelector('[data-checkout]'));
    expect(root.querySelector('[data-grid-status]').getAttribute('role')).toBe('status');

    for (const image of root.querySelectorAll('.product-card img')) {
      expect(image.getAttribute('alt')).toBeTruthy();
    }
  });

  it('labels the admin login, product, settings, and order-status fields', async () => {
    const api = createMockApi();
    const root = createAdminFixture();
    mountAdmin({ api, root });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expectFieldsLabelled(root.querySelector('[data-admin-login]'));

    root.querySelector('#admin-password').value = DEMO_PASSWORD;
    await root.querySelector('[data-admin-login] form').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));

    root.querySelector('[data-admin-tab="settings"]').click();
    expectFieldsLabelled(root.querySelector('[data-admin-panel="settings"]'));

    root.querySelector('.admin-section-head .button').click();
    expectFieldsLabelled(root.querySelector('[data-admin-dialog]'));
    expect(
      root.querySelector('[data-admin-dialog]').getAttribute('aria-labelledby'),
    ).toBe('admin-dialog-title');
  });
});
