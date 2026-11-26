import { normaliseWhatsapp } from '../domain/validation.js';
import { formatNgn } from '../domain/money.js';
import { h } from './dom.js';

/**
 * Build a prefilled WhatsApp message for an order.
 *
 * @param {import('../api/types.js').Order} order
 * @param {string} brandName
 * @returns {string}
 */
export function whatsappMessage(order, brandName) {
  const items = order.items
    .map((item) => `${item.name} ×${item.quantity}`)
    .join(', ');
  return (
    `Hello ${brandName}! I just placed order ${order.id} ` +
    `(${items}; total ${formatNgn(order.total)}). Name: ${order.customer.name}.`
  );
}

/**
 * @param {import('../api/types.js').Order} order
 * @param {import('../api/types.js').Settings} settings
 * @returns {string}
 */
export function whatsappHref(order, settings) {
  const digits = normaliseWhatsapp(settings.whatsappNumber);
  return `https://wa.me/${digits}?text=${encodeURIComponent(
    whatsappMessage(order, settings.brandName),
  )}`;
}

/**
 * Mount the order confirmation. Replaces the container contents per order.
 *
 * @param {HTMLElement} container
 * @param {{ onNewOrder?: () => void }} [options]
 */
export function mountConfirmation(container, { onNewOrder } = {}) {
  /**
   * @param {import('../api/types.js').Order | null} order
   * @param {import('../api/types.js').Settings | null} settings
   */
  function update(order, settings) {
    container.replaceChildren();
    if (!order || !settings) return;

    const isDelivery = order.fulfilment === 'delivery';

    const itemRows = order.items.map((item) =>
      h(
        'li',
        { class: 'confirm-item' },
        h(
          'div',
          { class: 'confirm-item__copy' },
          h('span', { class: 'confirm-item__name', text: item.name }),
          h('span', {
            class: 'confirm-item__meta',
            text: `${item.quantity} × ${formatNgn(item.unitPrice)}`,
          }),
        ),
        h('span', {
          class: 'confirm-item__total',
          text: formatNgn(item.lineTotal),
        }),
      ),
    );

    container.append(
      h(
        'div',
        { class: 'confirmation' },
        h('p', { class: 'eyebrow', text: 'Order confirmed' }),
        h('h2', { text: 'Thank you! Your order is in.' }),
        h(
          'p',
          { class: 'confirmation__number' },
          'Order number: ',
          h('strong', { text: order.id }),
        ),
        h(
          'ol',
          { class: 'confirmation__steps' },
          h('li', {}, 'Transfer ', h('strong', { text: formatNgn(order.total) }), ' to the account below.'),
          h('li', {}, 'Tap the WhatsApp button to send us your receipt.'),
          h('li', {}, 'We confirm your order and arrange pickup or delivery.'),
        ),
        h(
          'div',
          { class: 'confirmation__grid' },
          h(
            'section',
            { 'aria-label': 'Your items' },
            h('h3', { text: 'Your items' }),
            h('ul', { class: 'confirm-items' }, ...itemRows),
            h(
              'dl',
              { class: 'totals' },
              h('div', { class: 'totals__row' }, h('dt', { text: 'Subtotal' }), h('dd', { text: formatNgn(order.subtotal) })),
              h('div', { class: 'totals__row' }, h('dt', { text: 'Delivery' }), h('dd', { text: order.deliveryFee === 0 ? 'Free' : formatNgn(order.deliveryFee) })),
              h('div', { class: 'totals__row totals__row--grand' }, h('dt', { text: 'Total' }), h('dd', { text: formatNgn(order.total) })),
            ),
          ),
          h(
            'section',
            { 'aria-label': 'Payment details' },
            h('h3', { text: 'Pay by bank transfer' }),
            h(
              'dl',
              { class: 'bank-details' },
              h('div', {}, h('dt', { text: 'Bank' }), h('dd', { text: settings.bankName })),
              h('div', {}, h('dt', { text: 'Account name' }), h('dd', { text: settings.accountName })),
              h('div', {}, h('dt', { text: 'Account number' }), h('dd', { text: settings.accountNumber })),
            ),
            h('p', { class: 'bank-instructions', text: settings.paymentInstructions }),
            h(
              'a',
              {
                class: 'button button--primary',
                href: whatsappHref(order, settings),
                target: '_blank',
                rel: 'noopener',
              },
              'Confirm on WhatsApp',
            ),
          ),
        ),
        h(
          'p',
          { class: 'confirmation__address' },
          isDelivery
            ? `Delivering to: ${order.deliveryAddress}`
            : `Pickup from: ${settings.pickupAddress}`,
        ),
        h(
          'p',
          {},
          h(
            'button',
            {
              type: 'button',
              class: 'button button--ghost',
              onclick: () => onNewOrder?.(),
            },
            'Start a new order',
          ),
        ),
      ),
    );
  }

  function clear() {
    container.replaceChildren();
  }

  return { update, clear };
}
