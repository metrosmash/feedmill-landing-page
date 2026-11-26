import { formatNgn } from '../domain/money.js';
import { h } from './dom.js';

/**
 * @param {number} count
 * @param {string} singular
 * @param {string} [plural]
 */
function pluralise(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

/**
 * Mount the live order summary. The returned `update` method changes only the
 * dynamic parts, so focused fulfilment radios are not rebuilt.
 *
 * @param {HTMLElement} container
 * @param {{ onFulfilmentChange?: (fulfilment: 'pickup' | 'delivery') => void }} [options]
 */
export function mountOrderSummary(container, { onFulfilmentChange } = {}) {
  let expanded = false;

  const itemList = h('ul', { class: 'summary-items', 'data-summary-items': '' });
  const empty = h('p', {
    class: 'summary-empty',
    'data-summary-empty': '',
    text: 'Your order is empty. Add something from the farm.',
  });

  const subtotalValue = h('dd', {
    'data-summary-subtotal': '',
    text: formatNgn(0),
  });
  const deliveryValue = h('dd', {
    'data-summary-delivery': '',
    text: 'Free',
  });
  const totalValue = h('dd', {
    'data-summary-total': '',
    text: formatNgn(0),
  });
  const barTotal = h('span', {
    'data-summary-bar-total': '',
    text: formatNgn(0),
  });
  const barCount = h('span', {
    'data-summary-bar-count': '',
    text: '0 items',
  });
  const deliveryFeeLabel = h('span', {
    class: 'fulfilment__fee',
    'data-summary-delivery-fee': '',
    text: 'Free',
  });

  const pickupInput = h('input', {
    type: 'radio',
    name: 'fulfilment',
    value: 'pickup',
    checked: true,
  });
  const deliveryInput = h('input', {
    type: 'radio',
    name: 'fulfilment',
    value: 'delivery',
  });

  pickupInput.addEventListener('change', () => {
    if (pickupInput.checked) onFulfilmentChange?.('pickup');
  });
  deliveryInput.addEventListener('change', () => {
    if (deliveryInput.checked) onFulfilmentChange?.('delivery');
  });

  const toggle = h(
    'button',
    {
      type: 'button',
      class: 'order-summary__toggle',
      'aria-expanded': 'false',
      'aria-controls': 'order-summary-body',
    },
    'View order',
  );

  /**
   * @param {boolean} next
   */
  function setExpanded(next) {
    expanded = next;
    root.dataset.open = String(expanded);
    toggle.setAttribute('aria-expanded', String(expanded));
    toggle.textContent = expanded ? 'Close' : 'View order';
  }

  toggle.addEventListener('click', () => setExpanded(!expanded));

  const root = h(
    'aside',
    {
      class: 'order-summary',
      'data-order-summary': '',
      'data-open': 'false',
      'aria-label': 'Order summary',
    },
    h(
      'div',
      { class: 'order-summary__bar' },
      h(
        'div',
        { class: 'order-summary__bar-copy' },
        h('p', { class: 'order-summary__eyebrow', text: 'Your order' }),
        h(
          'p',
          { class: 'order-summary__bar-total' },
          barCount,
          h('span', { 'aria-hidden': 'true', text: ' · ' }),
          barTotal,
        ),
      ),
      toggle,
    ),
    h(
      'div',
      { class: 'order-summary__body', id: 'order-summary-body' },
      itemList,
      empty,
      h(
        'fieldset',
        { class: 'fulfilment' },
        h('legend', { text: 'How would you like it?' }),
        h(
          'label',
          { class: 'fulfilment__option' },
          pickupInput,
          h('span', { text: 'Pickup' }),
          h('span', { class: 'fulfilment__fee', text: 'Free' }),
        ),
        h(
          'label',
          { class: 'fulfilment__option' },
          deliveryInput,
          h('span', { text: 'Delivery' }),
          deliveryFeeLabel,
        ),
      ),
      h(
        'dl',
        { class: 'totals' },
        h(
          'div',
          { class: 'totals__row' },
          h('dt', { text: 'Subtotal' }),
          subtotalValue,
        ),
        h(
          'div',
          { class: 'totals__row' },
          h('dt', { text: 'Delivery' }),
          deliveryValue,
        ),
        h(
          'div',
          { class: 'totals__row totals__row--grand' },
          h('dt', { text: 'Total' }),
          totalValue,
        ),
      ),
      h('p', {
        class: 'order-summary__note',
        text: 'Checkout and the delivery address arrive in the next step.',
      }),
    ),
  );

  root.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && expanded) {
      setExpanded(false);
      toggle.focus();
    }
  });

  container.replaceChildren(root);

  /**
   * @param {{
   *   summary: ReturnType<import('../domain/cart.js').buildOrderSummary>,
   *   fulfilment: 'pickup' | 'delivery',
   *   deliveryFee: number,
   * }} state
   */
  function update({ summary, fulfilment, deliveryFee }) {
    itemList.replaceChildren();

    summary.items.forEach((item) => {
      itemList.append(
        h(
          'li',
          { class: 'summary-item', 'data-summary-item': item.productId },
          h(
            'div',
            { class: 'summary-item__copy' },
            h('span', { class: 'summary-item__name', text: item.name }),
            h('span', {
              class: 'summary-item__meta',
              text: `${item.quantity} × ${formatNgn(item.unitPrice)}`,
            }),
          ),
          h('span', {
            class: 'summary-item__total',
            text: formatNgn(item.lineTotal),
          }),
        ),
      );
    });

    const isEmpty = summary.items.length === 0;
    itemList.hidden = isEmpty;
    empty.hidden = !isEmpty;

    barCount.textContent = pluralise(summary.itemCount, 'item');
    barTotal.textContent = formatNgn(summary.total);
    subtotalValue.textContent = formatNgn(summary.subtotal);
    deliveryValue.textContent =
      summary.deliveryFee === 0 ? 'Free' : formatNgn(summary.deliveryFee);
    totalValue.textContent = formatNgn(summary.total);
    deliveryFeeLabel.textContent =
      deliveryFee > 0 ? formatNgn(deliveryFee) : 'Free';

    pickupInput.checked = fulfilment === 'pickup';
    deliveryInput.checked = fulfilment === 'delivery';
    root.dataset.empty = String(isEmpty);
  }

  update({
    summary: {
      items: [],
      itemCount: 0,
      subtotal: 0,
      deliveryFee: 0,
      total: 0,
    },
    fulfilment: 'pickup',
    deliveryFee: 0,
  });

  return { root, update, setExpanded };
}
