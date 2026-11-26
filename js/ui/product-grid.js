import {
  MAX_QUANTITY,
  MIN_QUANTITY,
} from '../domain/cart.js';
import { formatNgn } from '../domain/money.js';
import { h } from './dom.js';

/**
 * @param {import('../api/types.js').Product} product
 * @param {number} [quantity]
 * @param {{ soldOut?: boolean }} [options]
 */
export function createStepper(product, quantity = 0, { soldOut = false } = {}) {
  return h(
    'div',
    {
      class: `qty${soldOut ? ' qty--disabled' : ''}`,
      role: 'group',
      'aria-label': `${product.name} quantity`,
    },
    h(
      'button',
      {
        type: 'button',
        class: 'qty__button',
        'data-qty-action': 'decrease',
        'aria-label': `Decrease quantity of ${product.name}`,
        disabled: soldOut || quantity <= MIN_QUANTITY,
      },
      '−',
    ),
    h(
      'span',
      {
        class: 'qty__value',
        'data-qty-value': '',
        'aria-live': 'polite',
        'aria-atomic': 'true',
      },
      String(quantity),
    ),
    h(
      'button',
      {
        type: 'button',
        class: 'qty__button',
        'data-qty-action': 'increase',
        'aria-label': `Increase quantity of ${product.name}`,
        disabled: soldOut || quantity >= MAX_QUANTITY,
      },
      '+',
    ),
  );
}

/**
 * @param {import('../api/types.js').Product} product
 * @param {{ quantity?: number }} [options]
 */
export function createProductCard(product, { quantity = 0 } = {}) {
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
      ? h('span', { class: 'product-card__ribbon', text: 'SOLD OUT' })
      : null,
  );

  return h(
    'article',
    {
      class: `product-card${soldOut ? ' product-card--sold-out' : ''}`,
      'data-product-id': product.id,
      'data-available': String(!soldOut),
      'data-quantity': String(quantity),
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
      createStepper(product, quantity, { soldOut }),
    ),
  );
}

/**
 * Render the product grid. Replaces the container's contents.
 *
 * @param {Array<import('../api/types.js').Product>} products
 * @param {HTMLElement} container
 * @param {Record<string, number>} [quantities]
 */
export function renderProductGrid(products, container, quantities = {}) {
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
  products.forEach((product) => {
    fragment.append(
      createProductCard(product, { quantity: quantities[product.id] ?? 0 }),
    );
  });
  container.append(fragment);

  if (products.length > 0 && products.every((product) => product.available === false)) {
    container.append(
      h('p', {
        class: 'soldout-note',
        role: 'status',
        text: 'Everything is sold out right now — check back soon.',
      }),
    );
  }
}

/**
 * Update existing cards in place. This keeps focus on a stepper button while
 * the summary re-renders, instead of rebuilding the grid on every click.
 *
 * @param {Array<import('../api/types.js').Product>} products
 * @param {HTMLElement} container
 * @param {Record<string, number>} [quantities]
 */
export function syncProductGrid(products, container, quantities = {}) {
  const byId = new Map(products.map((product) => [product.id, product]));

  container.querySelectorAll('[data-product-id]').forEach((card) => {
    const product = byId.get(card.dataset.productId);
    if (!product) return;

    const soldOut = product.available === false;
    const quantity = quantities[product.id] ?? 0;
    const value = card.querySelector('[data-qty-value]');
    const decrease = card.querySelector('[data-qty-action="decrease"]');
    const increase = card.querySelector('[data-qty-action="increase"]');
    const stepper = card.querySelector('.qty');

    if (value) value.textContent = String(quantity);
    if (decrease) decrease.disabled = soldOut || quantity <= MIN_QUANTITY;
    if (increase) increase.disabled = soldOut || quantity >= MAX_QUANTITY;
    if (stepper) stepper.classList.toggle('qty--disabled', soldOut);

    card.dataset.quantity = String(quantity);
    card.classList.toggle('product-card--in-cart', quantity > 0 && !soldOut);
  });
}
