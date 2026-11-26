import { beforeEach, describe, expect, it } from 'vitest';
import { StorageError, createMockApi } from '../../js/api/index.js';
import { mountAdmin } from '../../js/admin.js';
import { mountStorefront } from '../../js/storefront.js';

function createAdminFixture() {
  document.body.innerHTML = `
    <p data-admin-status></p>
    <div data-admin-login></div>
    <div data-admin-app hidden>
      <p class="notice notice--demo"><strong>Demo mode — changes stay in this browser only.</strong></p>
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

function createStorefrontFixture() {
  const root = document.createElement('div');
  root.innerHTML = `
    <p data-grid-status></p>
    <p data-retry-wrap hidden><button type="button" data-retry>Try again</button></p>
    <div data-product-grid></div>
    <div data-order-summary></div>
    <section data-checkout-section><div data-checkout></div></section>
    <section data-confirmation-section hidden><div data-confirmation></div></section>
  `;
  document.body.append(root);
  return root;
}

async function signIn(root) {
  root.querySelector('#admin-password').value = 'feedmill2026';
  await root.querySelector('[data-admin-login] form').dispatchEvent(
    new Event('submit', { bubbles: true, cancelable: true }),
  );
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('demo reset', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = '';
  });

  it('resets to the seed shop after confirmation', async () => {
    const api = createMockApi();
    await api.deleteProduct('turkey');
    await api.updateSettings({ brandName: 'Changed' });

    const root = createAdminFixture();
    mountAdmin({ api, root });
    await new Promise((resolve) => setTimeout(resolve, 0));
    await signIn(root);

    root.querySelector('[data-admin-tab="settings"]').click();
    const dialog = root.querySelector('[data-admin-dialog]');
    root.querySelector('.danger-zone .button').click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(dialog.textContent).toContain('Reset demo data?');

    dialog.returnValue = 'confirm';
    dialog.dispatchEvent(new Event('close'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));

    const panel = root.querySelector('[data-admin-panel="settings"]');
    expect(panel.querySelector('#settings-brandName').value).toBe('Feedmill Farms');
    expect(panel.textContent).toContain('Demo reset');
    expect(
      root.querySelector('[data-admin-panel="products"]').textContent,
    ).toContain('Turkey');
    expect(
      (await api.listProducts()).find((p) => p.id === 'garri').available,
    ).toBe(false);
  });

  it('keeps the demo-mode notice visible across tabs and after reset', async () => {
    const api = createMockApi();
    const root = createAdminFixture();
    mountAdmin({ api, root });
    await new Promise((resolve) => setTimeout(resolve, 0));
    await signIn(root);

    for (const tab of ['orders', 'digest', 'settings', 'products']) {
      root.querySelector(`[data-admin-tab="${tab}"]`).click();
      expect(root.querySelector('[data-admin-app]').textContent).toContain(
        'Demo mode',
      );
    }
  });
});

describe('storefront empty and error states', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = '';
  });

  it('shows an empty state when no products are available', async () => {
    const base = createMockApi();
    await base.resetDemo();
    const api = { ...base, listProducts: async () => [] };
    const root = createStorefrontFixture();
    const { ready } = mountStorefront({ api, root });
    await ready;

    expect(root.querySelector('.empty-state')).not.toBeNull();
    expect(root.querySelector('[data-order-summary]').textContent).toContain(
      'Your order is empty.',
    );
  });

  it('names the all-sold-out case distinctly from the empty shop', async () => {
    const api = createMockApi();
    for (const product of await api.listProducts()) {
      await api.setProductAvailability(product.id, false);
    }

    const root = createStorefrontFixture();
    const { ready } = mountStorefront({ api, root });
    await ready;

    expect(root.querySelectorAll('.product-card')).toHaveLength(5);
    expect(root.querySelector('.soldout-note').textContent).toContain(
      'Everything is sold out',
    );
    expect(root.querySelector('.empty-state')).toBeNull();
  });

  it('shows a recoverable error and retries successfully', async () => {
    const base = createMockApi();
    let down = true;
    const api = {
      ...base,
      getPublicSettings: async () => {
        if (down) throw new Error('network down');
        return base.getPublicSettings();
      },
      listProducts: async () => {
        if (down) throw new Error('network down');
        return base.listProducts();
      },
    };

    const root = createStorefrontFixture();
    mountStorefront({ api, root });
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(root.querySelector('[data-grid-status]').hidden).toBe(false);
    expect(root.querySelector('[data-retry-wrap]').hidden).toBe(false);

    down = false;
    root.querySelector('[data-retry]').click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(root.querySelectorAll('.product-card')).toHaveLength(5);
    expect(root.querySelector('[data-retry-wrap]').hidden).toBe(true);
  });

  it('surfaces adapter failures on sign-in instead of an empty dashboard', async () => {
    const base = createMockApi();
    const api = {
      ...base,
      listProducts: async () => {
        throw new StorageError('Browser storage is unavailable.');
      },
    };
    const root = createAdminFixture();
    mountAdmin({ api, root });
    await new Promise((resolve) => setTimeout(resolve, 0));
    await signIn(root);

    expect(root.querySelector('[data-admin-panel="products"]').textContent).toContain(
      'could not reach its data',
    );
  });
});
