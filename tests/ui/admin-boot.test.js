import { describe, expect, it } from 'vitest';

/**
 * Regression test: the admin page must boot by itself. js/admin.js only
 * defines mountAdmin; without a boot call the page sits on "Loading the CMS".
 */
describe('admin boot', () => {
  it('mounts the login gate automatically when the skeleton exists', async () => {
    document.body.innerHTML = `
      <p data-admin-status>Loading the CMS&hellip;</p>
      <div data-admin-login></div>
      <div data-admin-app hidden>
        <div role="tablist" aria-label="CMS sections">
          <button type="button" role="tab" data-admin-tab="products">Products</button>
          <button type="button" role="tab" data-admin-tab="orders">Orders</button>
          <button type="button" role="tab" data-admin-tab="settings">Settings</button>
        </div>
        <section data-admin-panel="products"></section>
        <section data-admin-panel="orders" hidden></section>
        <section data-admin-panel="settings" hidden></section>
      </div>
      <button type="button" data-admin-logout hidden>Log out</button>
      <dialog data-admin-dialog aria-labelledby="admin-dialog-title"></dialog>
    `;

    await import('../../js/admin.js');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(
      document.querySelector('[data-admin-status]').hidden,
    ).toBe(true);
    expect(
      document.querySelector('#admin-login-heading')?.textContent,
    ).toContain('Sign in');
  });
});
