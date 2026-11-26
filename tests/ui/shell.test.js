import { describe, expect, it } from 'vitest';
import { seedSettings } from '../../js/data/seed.js';
import { renderShell } from '../../js/ui/shell.js';

describe('storefront shell', () => {
  it('applies brand, contact, and address settings', () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <span data-brand></span>
      <span data-tagline></span>
      <a data-contact-phone></a>
      <a data-contact-email></a>
      <a data-whatsapp></a>
      <span data-address></span>
      <span data-footer-year></span>
    `;

    renderShell(seedSettings, root);

    expect(root.querySelector('[data-brand]').textContent).toBe(
      'Feedmill Farms',
    );
    expect(root.querySelector('[data-tagline]').textContent).toBe(
      seedSettings.tagline,
    );
    expect(root.querySelector('[data-contact-phone]').textContent).toBe(
      seedSettings.contactPhone,
    );
    expect(root.querySelector('[data-contact-phone]').getAttribute('href')).toBe(
      'tel:+2348000000000',
    );
    expect(root.querySelector('[data-contact-email]').getAttribute('href')).toBe(
      `mailto:${seedSettings.email}`,
    );
    expect(root.querySelector('[data-whatsapp]').getAttribute('href')).toBe(
      'https://wa.me/2348000000001',
    );
    expect(root.querySelector('[data-address]').textContent).toBe(
      seedSettings.address,
    );
    expect(root.querySelector('[data-footer-year]').textContent).toBe(
      String(new Date().getFullYear()),
    );
  });
});
