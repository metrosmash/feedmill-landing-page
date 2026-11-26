import { formatNgn } from '../domain/money.js';
import { h } from './dom.js';

/**
 * @param {import('../api/types.js').Product} product
 */
export function createProductCard(product) {
  const soldOut = product.available === false;

  const media = h(
    'div',
    { class: 'product-card__media' },
    h('img', {
      src: product.imageUrl,
      alt: `${product.name} — ${product.description}`,
      loading: 'lazy',
      decoding: 'async',
    }),
    soldOut
      ? h('span', { class: 'product-card__badge', text: 'Sold out' })
      : null,
  );

  return h(
    'article',
    {
      class: `product-card${soldOut ? ' product-card--sold-out' : ''}`,
      'data-product-id': product.id,
      'data-available': String(!soldOut),
    },
    media,
    h(
      'div',
      { class: 'product-card__body' },
      h('h3', { class: 'product-card__name', text: product.name }),
      h('p', { class: 'product-card__description', text: product.description }),
      h(
        'div',
        { class: 'product-card__meta' },
        h('span', { class: 'product-card__unit', text: product.unit }),
        h('span', { class: 'product-card__price', text: formatNgn(product.price) }),
      ),
    ),
  );
}

/**
 * Render the product grid. Replaces the container's contents.
 *
 * @param {Array<import('../api/types.js').Product>} products
 * @param {HTMLElement} container
 */
export function renderProductGrid(products, container) {
  container.replaceChildren();

  if (!products.length) {
    container.append(
      h('p', {
        class: 'empty-state',
        text: 'No products are available right now.',
      }),
    );
    return;
  }

  const fragment = document.createDocumentFragment();
  products.forEach((product) => fragment.append(createProductCard(product)));
  container.append(fragment);
}
