import { describe, expect, it } from 'vitest';
import { seedProducts } from '../../js/data/seed.js';
import { formatNgn } from '../../js/domain/money.js';
import {
  createProductCard,
  renderProductGrid,
  syncProductGrid,
} from '../../js/ui/product-grid.js';

describe('formatNgn', () => {
  it('formats naira without decimals', () => {
    expect(formatNgn(28000)).toBe('₦28,000');
    expect(formatNgn(1500)).toBe('₦1,500');
    expect(formatNgn(0)).toBe('₦0');
  });
});

describe('storefront product grid', () => {
  it('renders one card per seeded product with name, unit, and NGN price', () => {
    const container = document.createElement('div');
    renderProductGrid(seedProducts, container);

    expect(container.querySelectorAll('.product-card')).toHaveLength(5);

    const text = container.textContent;
    for (const product of seedProducts) {
      expect(text).toContain(product.name);
      expect(text).toContain(product.unit);
      expect(text).toContain(formatNgn(product.price));
    }
  });

  it('gives every product image descriptive alt text and a source', () => {
    const container = document.createElement('div');
    renderProductGrid(seedProducts, container);

    const images = [...container.querySelectorAll('img')];
    expect(images).toHaveLength(5);

    images.forEach((image, index) => {
      expect(image.getAttribute('src')).toBe(seedProducts[index].imageUrl);
      expect(image.getAttribute('alt')).toContain(seedProducts[index].name);
      expect(image.getAttribute('alt')).toContain(
        seedProducts[index].description,
      );
    });
  });

  it('renders accessible quantity controls for available products', () => {
    const card = createProductCard(seedProducts[0]);
    const group = card.querySelector('.qty');
    const decrease = card.querySelector('[data-qty-action="decrease"]');
    const increase = card.querySelector('[data-qty-action="increase"]');

    expect(group.getAttribute('role')).toBe('group');
    expect(group.getAttribute('aria-label')).toBe('Turkey quantity');
    expect(decrease.getAttribute('aria-label')).toBe(
      'Decrease quantity of Turkey',
    );
    expect(increase.getAttribute('aria-label')).toBe(
      'Increase quantity of Turkey',
    );
    expect(card.querySelector('[data-qty-value]').textContent).toBe('0');
    expect(decrease.disabled).toBe(true);
    expect(increase.disabled).toBe(false);
  });

  it('marks sold-out products with a ribbon and disabled controls', () => {
    const garri = seedProducts.find((product) => product.id === 'garri');
    const card = createProductCard(garri);

    expect(card.dataset.available).toBe('false');
    expect(card.classList.contains('product-card--sold-out')).toBe(true);
    expect(card.textContent).toContain('SOLD OUT');
    expect(card.querySelector('[data-qty-action="decrease"]').disabled).toBe(
      true,
    );
    expect(card.querySelector('[data-qty-action="increase"]').disabled).toBe(
      true,
    );
  });

  it('syncs quantity values and disables the bounds in place', () => {
    const container = document.createElement('div');
    renderProductGrid(seedProducts, container);

    syncProductGrid(seedProducts, container, { turkey: 99 });
    const card = container.querySelector('[data-product-id="turkey"]');

    expect(card.querySelector('[data-qty-value]').textContent).toBe('99');
    expect(card.dataset.quantity).toBe('99');
    expect(card.classList.contains('product-card--in-cart')).toBe(true);
    expect(card.querySelector('[data-qty-action="increase"]').disabled).toBe(
      true,
    );
    expect(card.querySelector('[data-qty-action="decrease"]').disabled).toBe(
      false,
    );

    syncProductGrid(seedProducts, container, {});
    expect(card.querySelector('[data-qty-value]').textContent).toBe('0');
    expect(card.querySelector('[data-qty-action="decrease"]').disabled).toBe(
      true,
    );
    expect(card.querySelector('[data-qty-action="increase"]').disabled).toBe(
      false,
    );
  });

  it('shows an empty state when the catalogue is empty', () => {
    const container = document.createElement('div');
    renderProductGrid([], container);

    expect(container.querySelector('.empty-state')).not.toBeNull();
    expect(container.querySelectorAll('.product-card')).toHaveLength(0);
  });
});
