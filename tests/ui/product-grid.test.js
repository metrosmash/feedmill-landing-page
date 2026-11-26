import { describe, expect, it } from 'vitest';
import { seedProducts } from '../../js/data/seed.js';
import { formatNgn } from '../../js/domain/money.js';
import {
  createProductCard,
  renderProductGrid,
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

  it('marks sold-out products with a badge and availability flag', () => {
    const garri = seedProducts.find((product) => product.id === 'garri');
    const card = createProductCard(garri);

    expect(card.dataset.available).toBe('false');
    expect(card.classList.contains('product-card--sold-out')).toBe(true);
    expect(card.textContent).toContain('Sold out');
  });

  it('shows an empty state when the catalogue is empty', () => {
    const container = document.createElement('div');
    renderProductGrid([], container);

    expect(container.querySelector('.empty-state')).not.toBeNull();
    expect(container.querySelectorAll('.product-card')).toHaveLength(0);
  });
});
