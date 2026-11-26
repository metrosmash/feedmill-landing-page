import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';

function loadPage(filename) {
  const html = readFileSync(resolve(process.cwd(), filename), 'utf8');
  return new JSDOM(html).window.document;
}

describe('static page shell', () => {
  it('marks the storefront noindex and includes the demo notice', () => {
    const document = loadPage('index.html');

    expect(document.querySelector('meta[name="robots"]').content).toContain(
      'noindex',
    );
    expect(document.querySelector('.site-footer').textContent).toContain(
      'Independent concept demo',
    );
    expect(document.querySelector('.site-footer').textContent).toContain(
      'not affiliated',
    );
  });

  it('includes the header, hero, trust strip, shop, and CMS link', () => {
    const document = loadPage('index.html');

    expect(document.querySelector('.site-header')).not.toBeNull();
    expect(document.querySelector('.hero')).not.toBeNull();
    expect(document.querySelector('.trust')).not.toBeNull();
    expect(document.querySelector('.shop')).not.toBeNull();
    expect(document.querySelector('[data-product-grid]')).not.toBeNull();
    expect(document.querySelector('[data-order-summary]')).not.toBeNull();
    expect(document.querySelector('a[href="admin.html"]')).not.toBeNull();
  });

  it('marks the admin stub noindex and keeps the demo notice', () => {
    const document = loadPage('admin.html');

    expect(document.querySelector('meta[name="robots"]').content).toContain(
      'noindex',
    );
    expect(document.body.textContent).toContain('Independent concept demo');
    expect(document.body.textContent).toContain('not affiliated');
  });
});
