import { h } from './dom.js';

const FIELDS = ['name', 'phone', 'email', 'deliveryAddress', 'notes'];

/**
 * Mount the Google-Form-style checkout. The form is built once; `update`
 * toggles the delivery address and preserves user input across renders.
 *
 * @param {HTMLElement} container
 * @param {{ onSubmit?: (values: Record<string, string>) => Promise<void> }} [options]
 */
export function mountCheckout(container, { onSubmit } = {}) {
  let submitting = false;

  const inputs = {};
  const errors = {};

  /**
   * @param {string} field
   * @param {string} label
   * @param {Record<string, unknown>} attrs
   * @param {string} [hint]
   */
  function field(field, label, attrs = {}, hint) {
    const input =
      field === 'notes'
        ? h('textarea', {
            id: `checkout-${field}`,
            name: field,
            rows: 3,
            maxlength: 500,
            ...attrs,
          })
        : h('input', {
            id: `checkout-${field}`,
            name: field,
            ...attrs,
          });

    input.addEventListener('input', () => {
      input.removeAttribute('aria-invalid');
      if (errors[field]) {
        errors[field].textContent = '';
        errors[field].hidden = true;
      }
      if (banner.dataset.visible === 'true') {
        banner.textContent = '';
        banner.hidden = true;
        banner.dataset.visible = 'false';
      }
    });

    inputs[field] = input;
    errors[field] = h('p', {
      class: 'field-error',
      id: `checkout-${field}-error`,
      hidden: true,
    });
    input.setAttribute('aria-describedby', `checkout-${field}-error`);

    return h(
      'div',
      { class: 'field', 'data-field': field },
      h('label', { for: `checkout-${field}` }, label),
      hint ? h('p', { class: 'field-hint', text: hint }) : null,
      input,
      errors[field],
    );
  }

  const banner = h('p', {
    class: 'form-banner',
    role: 'alert',
    hidden: true,
    dataset: { visible: 'false' },
  });

  const submitButton = h(
    'button',
    { type: 'submit', class: 'button button--primary' },
    'Place order',
  );

  const form = h(
    'form',
    { class: 'checkout-form', 'data-checkout-form': '', novalidate: true },
    banner,
    field('name', 'Full name', {
      type: 'text',
      autocomplete: 'name',
      required: true,
      maxlength: 80,
    }),
    field('phone', 'Phone number', {
      type: 'tel',
      autocomplete: 'tel',
      required: true,
      placeholder: '0803 123 4567',
    }),
    field('email', 'Email (optional)', {
      type: 'email',
      autocomplete: 'email',
      maxlength: 120,
    }),
    h(
      'div',
      { 'data-address-wrap': '' },
      field('deliveryAddress', 'Delivery address', {
        type: 'text',
        autocomplete: 'street-address',
        maxlength: 200,
      }),
    ),
    field('notes', 'Notes (optional)', {
      placeholder: 'Anything we should know?',
    }),
    h(
      'p',
      { class: 'checkout-submit-note', text: 'Pickup is free. Delivery adds the flat fee shown in your summary.' },
    ),
    submitButton,
  );

  const addressWrap = form.querySelector('[data-address-wrap]');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submitting) return;
    submitting = true;
    submitButton.disabled = true;

    const values = {};
    for (const name of FIELDS) values[name] = inputs[name].value;

    try {
      await onSubmit?.(values);
    } finally {
      submitting = false;
      submitButton.disabled = false;
    }
  });

  container.replaceChildren(form);

  /**
   * @param {{ fulfilment: 'pickup' | 'delivery', cartEmpty: boolean }} state
   */
  function update({ fulfilment, cartEmpty }) {
    const delivery = fulfilment === 'delivery';
    addressWrap.hidden = !delivery;
    inputs.deliveryAddress.required = delivery;
    submitButton.disabled = cartEmpty;
    submitButton.textContent = cartEmpty ? 'Add items to order' : 'Place order';
  }

  /**
   * Show field-level validation errors. Values are left untouched.
   *
   * @param {Record<string, string>} fieldErrors
   * @param {string} [topError]
   */
  function showErrors(fieldErrors = {}, topError) {
    let firstInvalid = null;

    for (const name of FIELDS) {
      const message = fieldErrors[name];
      errors[name].textContent = message ?? '';
      errors[name].hidden = !message;
      if (message) {
        inputs[name].setAttribute('aria-invalid', 'true');
        firstInvalid ??= inputs[name];
      } else {
        inputs[name].removeAttribute('aria-invalid');
      }
    }

    // A sold-out race surfaces as a top banner, not a field error.
    if (topError) {
      banner.textContent = topError;
      banner.hidden = false;
      banner.dataset.visible = 'true';
    } else if (banner.dataset.visible === 'true') {
      banner.textContent = '';
      banner.hidden = true;
      banner.dataset.visible = 'false';
    }

    if (firstInvalid) {
      const wrapHidden =
        firstInvalid === inputs.deliveryAddress && addressWrap.hidden;
      if (!wrapHidden) firstInvalid.focus();
      else banner.focus?.();
    } else if (topError) {
      banner.setAttribute('tabindex', '-1');
      banner.focus();
    }
  }

  function clearErrors() {
    showErrors({});
  }

  /**
   * @returns {Record<string, string>}
   */
  function getValues() {
    const values = {};
    for (const name of FIELDS) values[name] = inputs[name].value;
    return values;
  }

  return { root: form, update, showErrors, clearErrors, getValues, inputs };
}
