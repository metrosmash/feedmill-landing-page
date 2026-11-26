export const MIN_QUANTITY = 0;
export const MAX_QUANTITY = 99;

export const FULFILMENTS = Object.freeze(['pickup', 'delivery']);

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isFulfilment(value) {
  return FULFILMENTS.includes(value);
}

/**
 * Coerce a quantity to a whole number between 0 and 99.
 *
 * @param {unknown} value
 * @returns {number}
 */
export function normaliseQuantity(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return MIN_QUANTITY;
  return Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, Math.trunc(number)));
}

/**
 * Set a product quantity. Zero removes the product from the cart entirely.
 *
 * @param {Record<string, number>} quantities
 * @param {string} productId
 * @param {unknown} quantity
 * @returns {Record<string, number>}
 */
export function withQuantity(quantities, productId, quantity) {
  const next = { ...quantities };
  const normalised = normaliseQuantity(quantity);

  if (normalised === MIN_QUANTITY) {
    delete next[productId];
  } else {
    next[productId] = normalised;
  }

  return next;
}

/**
 * Move a product quantity by a delta, clamped to the allowed bounds.
 *
 * @param {Record<string, number>} quantities
 * @param {string} productId
 * @param {number} delta
 * @returns {Record<string, number>}
 */
export function changeQuantity(quantities, productId, delta) {
  const current = normaliseQuantity(quantities[productId] ?? MIN_QUANTITY);
  return withQuantity(quantities, productId, current + delta);
}

/**
 * Build the live order summary from current products and cart state.
 *
 * Sold-out products are ignored even if a stale quantity is present, so the
 * summary can never price an item the customer cannot order.
 *
 * @param {{
 *   products: Array<import('../api/types.js').Product>,
 *   quantities: Record<string, number>,
 *   fulfilment: 'pickup' | 'delivery',
 *   deliveryFee?: number,
 * }} input
 */
export function buildOrderSummary({
  products,
  quantities,
  fulfilment,
  deliveryFee = 0,
}) {
  const items = [];
  let itemCount = 0;
  let subtotal = 0;

  for (const product of products) {
    if (product.available === false) continue;

    const quantity = normaliseQuantity(quantities[product.id] ?? MIN_QUANTITY);
    if (quantity === MIN_QUANTITY) continue;

    const lineTotal = product.price * quantity;
    items.push({
      productId: product.id,
      name: product.name,
      unit: product.unit,
      unitPrice: product.price,
      quantity,
      lineTotal,
    });
    itemCount += quantity;
    subtotal += lineTotal;
  }

  const fee =
    fulfilment === 'delivery' && items.length > 0
      ? normaliseFee(deliveryFee)
      : 0;

  return {
    items,
    itemCount,
    subtotal,
    deliveryFee: fee,
    total: subtotal + fee,
  };
}

/**
 * @param {unknown} value
 * @returns {number}
 */
function normaliseFee(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}
