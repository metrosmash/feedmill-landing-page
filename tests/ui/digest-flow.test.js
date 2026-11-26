import { beforeEach, describe, expect, it } from 'vitest';
import { DEMO_PASSWORD, createMockApi } from '../../js/api/mock-api.js';
import { mountAdmin } from '../../js/admin.js';

function createFixture() {
  document.body.innerHTML = `
    <p data-admin-status></p>
    <div data-admin-login></div>
    <div data-admin-app hidden>
      <p class="notice notice--demo"><strong>Demo mode</strong></p>
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

async function signIn(root) {
  root.querySelector('#admin-password').value = DEMO_PASSWORD;
  await root.querySelector('[data-admin-login] form').dispatchEvent(
    new Event('submit', { bubbles: true, cancelable: true }),
  );
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('digest tab', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = '';
  });

  it('previews the subject, body, and included orders', async () => {
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

    root.querySelector('[data-admin-tab="digest"]').click();
    const panel = root.querySelector('[data-admin-panel="digest"]');
    expect(panel.textContent).toContain('no email is sent');

    panel.querySelectorAll('button')[0].click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(panel.querySelector('.digest-subject').textContent).toContain('1 order');
    expect(panel.querySelector('.digest-body').textContent).toContain('Adaeze Obi');
    expect(panel.querySelector('.digest-order').textContent).toContain('pickup');
    expect(panel.textContent).toContain('₦28,000');
  });

  it('shows an empty message when there is nothing new', async () => {
    const api = createMockApi();
    const root = createFixture();
    mountAdmin({ api, root });
    await new Promise((resolve) => setTimeout(resolve, 0));
    await signIn(root);

    root.querySelector('[data-admin-tab="digest"]').click();
    const panel = root.querySelector('[data-admin-panel="digest"]');
    panel.querySelectorAll('button')[0].click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(panel.textContent).toContain('No new orders since the last digest.');
  });

  it('sends after confirmation and marks orders as notified', async () => {
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

    root.querySelector('[data-admin-tab="digest"]').click();
    const panel = root.querySelector('[data-admin-panel="digest"]');
    const dialog = root.querySelector('[data-admin-dialog]');

    panel.querySelectorAll('button')[1].click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(dialog.textContent).toContain('Send digest now?');

    dialog.returnValue = 'confirm';
    dialog.dispatchEvent(new Event('close'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));

    const orders = await api.listOrders();
    expect(orders[0].notifiedAt).not.toBeNull();
    expect((await api.getSettings()).lastDigestAt).toBe(orders[0].notifiedAt);
    expect(root.querySelector('[data-admin-panel="digest"]').textContent).toContain(
      'marked as notified',
    );
    expect(root.querySelector('[data-admin-panel="digest"]').textContent).toContain(
      'No email was sent',
    );
  });
});
