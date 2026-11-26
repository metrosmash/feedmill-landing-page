import { createMockApi, DEMO_PASSWORD } from './api/index.js';
import { validateProduct, validateSettings } from './domain/validation.js';
import { formatNgn } from './domain/money.js';
import { h } from './ui/dom.js';
import { renderShell } from './ui/shell.js';

export const ADMIN_AUTH_KEY = 'feedmill:admin-auth';

const ORDER_STATUSES = ['new', 'confirmed', 'delivered', 'cancelled'];
const PAYMENT_STATUSES = ['unpaid', 'paid', 'refunded'];

/**
 * @param {string} iso
 * @returns {string}
 */
function formatDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * @param {Array<{ name: string, quantity: number }>} items
 * @returns {string}
 */
function summariseItems(items) {
  return items.map((item) => `${item.name} ×${item.quantity}`).join('; ');
}

/**
 * Download an export file produced by the adapter.
 *
 * @param {{ filename: string, mimeType: string, content: string }} file
 */
function downloadExport(file) {
  const blob = new Blob([file.content], { type: `${file.mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Mount the owner CMS: demo login gate, product management, order review,
 * and JSON/CSV exports.
 *
 * @param {{
 *   api?: ReturnType<import('./api/index.js').createMockApi>,
 *   root?: Document | ParentNode,
 * }} [options]
 */
export function mountAdmin({ api = createMockApi(), root = document } = {}) {
  const status = root.querySelector('[data-admin-status]');
  const loginMount = root.querySelector('[data-admin-login]');
  const app = root.querySelector('[data-admin-app]');
  const logoutButton = root.querySelector('[data-admin-logout]');
  const dialog = root.querySelector('[data-admin-dialog]');
  const panels = {
    products: root.querySelector('[data-admin-panel="products"]'),
    orders: root.querySelector('[data-admin-panel="orders"]'),
    digest: root.querySelector('[data-admin-panel="digest"]'),
    settings: root.querySelector('[data-admin-panel="settings"]'),
  };
  const tabs = [...root.querySelectorAll('[data-admin-tab]')];

  const state = {
    authed: false,
    tab: 'products',
    products: [],
    orders: [],
    settings: null,
    digestPreview: null,
    digestNotice: '',
    loginError: '',
    notice: '',
    settingsNotice: '',
  };

  const isAuthed = () => {
    try {
      return sessionStorage.getItem(ADMIN_AUTH_KEY) === '1';
    } catch {
      return state.authed;
    }
  };

  const setAuthed = (value) => {
    state.authed = value;
    try {
      if (value) sessionStorage.setItem(ADMIN_AUTH_KEY, '1');
      else sessionStorage.removeItem(ADMIN_AUTH_KEY);
    } catch {
      // Storage blocked: keep the flag in memory for this visit.
    }
  };

  /**
   * Open the shared dialog. Returns the dialog element for wiring.
   *
   * @param {string} title
   * @param {...unknown} body
   * @returns {HTMLDialogElement}
   */
  function openDialog(title, ...body) {
    dialog.replaceChildren(
      h(
        'form',
        { method: 'dialog', class: 'admin-dialog__inner' },
        h('h2', { id: 'admin-dialog-title', text: title }),
        ...body,
      ),
    );
    if (typeof dialog.showModal === 'function' && !dialog.open) {
      dialog.showModal();
    }
    const first = dialog.querySelector('input, select, textarea, button');
    first?.focus();
    return dialog;
  }

  function closeDialog() {
    if (dialog.open) dialog.close();
  }

  /**
   * Ask for explicit confirmation before a destructive action.
   *
   * @param {{ title: string, message: string, confirmLabel: string }} options
   * @returns {Promise<boolean>}
   */
  function confirmAction({ title, message, confirmLabel }) {
    return new Promise((resolve) => {
      const form = h(
        'form',
        { method: 'dialog', class: 'admin-dialog__inner' },
        h('h2', { id: 'admin-dialog-title', text: title }),
        h('p', { text: message }),
        h(
          'div',
          { class: 'admin-dialog__actions' },
          h('button', { type: 'submit', value: 'cancel', class: 'button button--ghost', text: 'Cancel' }),
          h(
            'button',
            {
              type: 'submit',
              value: 'confirm',
              class: 'button button--danger',
              dataset: { confirm: '' },
            },
            confirmLabel,
          ),
        ),
      );

      dialog.replaceChildren(form);
      if (typeof dialog.showModal === 'function' && !dialog.open) dialog.showModal();
      dialog.querySelector('[data-confirm]')?.focus();

      const onClose = () => {
        dialog.removeEventListener('close', onClose);
        resolve(dialog.returnValue === 'confirm');
      };
      dialog.addEventListener('close', onClose);
    });
  }

  async function refresh() {
    const [products, orders, settings] = await Promise.all([
      api.listProducts(),
      api.listOrders(),
      api.getSettings(),
    ]);
    state.products = products;
    state.orders = orders;
    state.settings = settings;
  }

  function render() {
    status.hidden = true;

    if (!state.authed) {
      loginMount.replaceChildren(renderLogin());
      app.hidden = true;
      logoutButton.hidden = true;
      return;
    }

    loginMount.replaceChildren();
    app.hidden = false;
    logoutButton.hidden = false;

    for (const tab of tabs) {
      const selected = tab.dataset.adminTab === state.tab;
      tab.setAttribute('aria-selected', String(selected));
    }
    panels.products.hidden = state.tab !== 'products';
    panels.orders.hidden = state.tab !== 'orders';
    panels.digest.hidden = state.tab !== 'digest';
    panels.settings.hidden = state.tab !== 'settings';

    renderProducts();
    renderOrders();
    renderDigest();
    renderSettings();
  }

  function renderLogin() {
    const password = h('input', {
      type: 'password',
      id: 'admin-password',
      name: 'password',
      autocomplete: 'current-password',
      required: true,
    });
    const error = state.loginError
      ? h('p', { class: 'field-error', role: 'alert', text: state.loginError })
      : null;

    return h(
      'section',
      { class: 'admin-login', 'aria-labelledby': 'admin-login-heading' },
      h('p', { class: 'eyebrow', text: 'Owner CMS' }),
      h('h1', { id: 'admin-login-heading', text: 'Sign in to manage the shop' }),
      h(
        'p',
        { class: 'notice notice--demo' },
        h('strong', { text: 'Demo-only login — not real security. ' }),
        `The demo password is ${DEMO_PASSWORD}. Anyone with this page can sign in; ` +
          'changes stay in this browser.',
      ),
      h(
        'form',
        {
          class: 'checkout-form',
          onsubmit: async (event) => {
            event.preventDefault();
            try {
              await api.login(password.value);
              setAuthed(true);
              state.loginError = '';
              state.tab = 'products';
              await refresh();
            } catch {
              state.loginError = 'That password is not correct. Hint: it is shown above.';
            }
            render();
          },
        },
        h(
          'div',
          { class: 'field' },
          h('label', { for: 'admin-password', text: 'Demo password' }),
          password,
        ),
        error,
        h('button', { type: 'submit', class: 'button button--primary', text: 'Sign in' }),
      ),
    );
  }

  // Products -----------------------------------------------------------

  function renderProducts() {
    const rows = state.products.map((product) =>
      h(
        'li',
        { class: 'admin-product', 'data-product-row': product.id },
        h('img', {
          src: product.imageUrl,
          alt: '',
          loading: 'lazy',
          width: 72,
          height: 72,
          onerror: function () {
            this.style.visibility = 'hidden';
          },
        }),
        h(
          'div',
          { class: 'admin-product__copy' },
          h('p', { class: 'admin-product__name' }, product.name),
          h(
            'p',
            { class: 'admin-product__meta' },
            `${formatNgn(product.price)} · ${product.unit} · `,
            product.available ? 'Available' : 'Sold out',
          ),
        ),
        h(
          'div',
          { class: 'admin-product__actions' },
          h(
            'button',
            {
              type: 'button',
              class: 'button button--ghost',
              onclick: () => openProductForm(product),
            },
            'Edit',
          ),
          h(
            'button',
            {
              type: 'button',
              class: 'button button--ghost',
              onclick: async () => {
                const next = !product.available;
                await api.setProductAvailability(product.id, next);
                await refresh();
                render();
              },
            },
            product.available ? 'Mark sold out' : 'Mark available',
          ),
          h(
            'button',
            {
              type: 'button',
              class: 'button button--danger-ghost',
              onclick: async () => {
                const confirmed = await confirmAction({
                  title: `Delete ${product.name}?`,
                  message:
                    'The product disappears from the storefront. Past orders keep their snapshots.',
                  confirmLabel: 'Delete product',
                });
                if (!confirmed) return;
                await api.deleteProduct(product.id);
                await refresh();
                render();
              },
            },
            'Delete',
          ),
        ),
      ),
    );

    panels.products.replaceChildren(
      h(
        'div',
        { class: 'admin-section-head' },
        h('h2', { text: 'Products' }),
        h(
          'button',
          {
            type: 'button',
            class: 'button button--primary',
            onclick: () => openProductForm(null),
          },
          'Add product',
        ),
      ),
      state.notice ? h('p', { class: 'admin-notice', role: 'status', text: state.notice }) : null,
      h('ul', { class: 'admin-products' }, ...rows),
    );
  }

  /**
   * @param {import('./api/types.js').Product | null} product
   */
  function openProductForm(product) {
    const isEdit = product != null;
    const values = {
      name: product?.name ?? '',
      description: product?.description ?? '',
      price: product?.price ?? '',
      unit: product?.unit ?? '',
      imageUrl: product?.imageUrl ?? '',
      sortOrder: product?.sortOrder ?? state.products.length + 1,
      available: product?.available ?? true,
    };

    const fieldErrors = {};
    const inputs = {};

    /**
     * @param {string} name
     * @param {string} label
     * @param {Record<string, unknown>} attrs
     */
    function productField(name, label, attrs = {}) {
      const input = h('input', { id: `product-${name}`, name, ...attrs });
      input.value = String(values[name] ?? '');
      inputs[name] = input;
      fieldErrors[name] = h('p', { class: 'field-error', hidden: true });
      input.setAttribute('aria-describedby', `product-${name}-error`);
      fieldErrors[name].id = `product-${name}-error`;
      return h(
        'div',
        { class: 'field' },
        h('label', { for: `product-${name}`, text: label }),
        input,
        fieldErrors[name],
      );
    }

    const imagePreview = h('img', {
      src: values.imageUrl || '',
      alt: 'Image preview',
      width: 160,
      height: 120,
      hidden: !values.imageUrl,
    });
    const imageFallback = h(
      'p',
      { class: 'field-hint', hidden: !!values.imageUrl },
      values.imageUrl ? '' : 'No image URL yet — a preview appears here.',
    );

    const availableInput = h('input', {
      type: 'checkbox',
      id: 'product-available',
      name: 'available',
      checked: values.available !== false,
    });

    const form = h(
      'form',
      { method: 'dialog', class: 'admin-dialog__inner admin-form', novalidate: true },
      h('h2', { id: 'admin-dialog-title', text: isEdit ? `Edit ${product.name}` : 'Add product' }),
      productField('name', 'Name', { type: 'text', required: true, maxlength: 80 }),
      h(
        'div',
        { class: 'field' },
        h('label', { for: 'product-description', text: 'Description' }),
        (() => {
          const area = h('textarea', {
            id: 'product-description',
            name: 'description',
            rows: 2,
            maxlength: 300,
          });
          area.value = values.description;
          inputs.description = area;
          return area;
        })(),
        (() => {
          fieldErrors.description = h('p', { class: 'field-error', hidden: true });
          fieldErrors.description.id = 'product-description-error';
          return fieldErrors.description;
        })(),
      ),
      productField('price', 'Price (₦, whole naira)', { type: 'number', min: 1, step: 1, required: true }),
      productField('unit', 'Unit (e.g. per bird)', { type: 'text', required: true, maxlength: 20 }),
      productField('imageUrl', 'Image URL or local path', {
        type: 'text',
        inputmode: 'url',
        placeholder: 'https://… or image/chicken 2.jpg',
        maxlength: 500,
      }),
      h(
        'div',
        { class: 'field' },
        h('p', { class: 'field-hint', text: 'Live preview — broken links show the fallback note.' }),
        imagePreview,
        imageFallback,
      ),
      productField('sortOrder', 'Sort order', { type: 'number', min: 0, step: 1 }),
      h(
        'div',
        { class: 'field field--check' },
        availableInput,
        h('label', { for: 'product-available', text: 'Available (untick for sold out)' }),
      ),
      h(
        'div',
        { class: 'admin-dialog__actions' },
        h(
          'button',
          {
            type: 'button',
            class: 'button button--ghost',
            text: 'Cancel',
            onclick: () => closeDialog(),
          },
        ),
        h('button', {
          type: 'submit',
          value: 'save',
          class: 'button button--primary',
          dataset: { save: '' },
          text: isEdit ? 'Save changes' : 'Add product',
        }),
      ),
    );

    inputs.imageUrl.addEventListener('input', () => {
      const url = inputs.imageUrl.value.trim();
      imagePreview.hidden = !url;
      imagePreview.src = url;
      imageFallback.hidden = !!url;
      imageFallback.textContent = url ? '' : 'No image URL yet — a preview appears here.';
    });
    imagePreview.addEventListener('error', () => {
      imageFallback.hidden = false;
      imageFallback.textContent = 'That image could not load. Check the URL before saving.';
    });

    dialog.replaceChildren(form);
    if (typeof dialog.showModal === 'function' && !dialog.open) dialog.showModal();
    inputs.name.focus();

    form.addEventListener('submit', (event) => {
      // method="dialog" would close the dialog natively; always intercept so
      // validation errors keep it open and saving is explicit. returnValue is
      // only set *after* submit in real browsers, so it cannot gate saving.
      event.preventDefault();
      saveProduct();
    });

    async function saveProduct() {
      const payload = {
        name: inputs.name.value.trim(),
        description: inputs.description.value.trim(),
        price: Number(inputs.price.value),
        unit: inputs.unit.value.trim(),
        imageUrl: inputs.imageUrl.value.trim(),
        sortOrder: Number(inputs.sortOrder.value),
        available: availableInput.checked,
      };

      const { ok, errors } = validateProduct(payload);
      for (const [name, node] of Object.entries(fieldErrors)) {
        node.textContent = errors[name] ?? '';
        node.hidden = !errors[name];
        inputs[name]?.toggleAttribute?.('aria-invalid', Boolean(errors[name]));
        if (errors[name]) inputs[name]?.setAttribute('aria-invalid', 'true');
        else inputs[name]?.removeAttribute('aria-invalid');
      }
      if (!ok) {
        const first = Object.keys(errors)[0];
        inputs[first]?.focus();
        return;
      }

      try {
        if (isEdit) await api.updateProduct(product.id, payload);
        else await api.createProduct(payload);
      } catch (error) {
        const field = error.details?.field;
        if (field && fieldErrors[field]) {
          fieldErrors[field].textContent = error.message;
          fieldErrors[field].hidden = false;
          inputs[field]?.focus();
        } else {
          state.notice = error.message;
        }
        return;
      }

      state.notice = isEdit ? `Saved ${payload.name}.` : `Added ${payload.name}.`;
      closeDialog();
      await refresh();
      render();
    }
  }

  // Orders -------------------------------------------------------------

  function renderOrders() {
    const head = h(
      'div',
      { class: 'admin-section-head' },
      h('h2', { text: `Orders (${state.orders.length})` }),
      h(
        'div',
        { class: 'admin-exports' },
        h(
          'button',
          {
            type: 'button',
            class: 'button button--ghost',
            onclick: async () => {
              const file = await api.exportOrders('json');
              downloadExport(file);
            },
          },
          'Download JSON',
        ),
        h(
          'button',
          {
            type: 'button',
            class: 'button button--ghost',
            onclick: async () => {
              const file = await api.exportOrders('csv');
              downloadExport(file);
            },
          },
          'Download CSV',
        ),
      ),
    );

    if (state.orders.length === 0) {
      panels.orders.replaceChildren(
        head,
        h('p', { class: 'empty-state', text: 'No orders yet. New orders appear here as customers submit them.' }),
      );
      return;
    }

    const rows = state.orders.map((order) =>
      h(
        'tr',
        { 'data-order-row': order.id },
        h('td', {}, formatDate(order.createdAt)),
        h('td', {}, order.customer.name),
        h('td', {}, order.customer.phone),
        h('td', {}, summariseItems(order.items)),
        h('td', {}, order.fulfilment),
        h('td', { class: 'numeric', text: formatNgn(order.total) }),
        h('td', {}, statusSelect(order, 'status')),
        h('td', {}, statusSelect(order, 'payment')),
        h(
          'td',
          {},
          h(
            'button',
            {
              type: 'button',
              class: 'button button--ghost button--small',
              onclick: () => openOrderDetail(order.id),
            },
            'View',
          ),
        ),
      ),
    );

    panels.orders.replaceChildren(
      head,
      h(
        'div',
        { class: 'table-wrap' },
        h(
          'table',
          { class: 'admin-table' },
          h(
            'thead',
            {},
            h(
              'tr',
              {},
              h('th', { scope: 'col', text: 'Date' }),
              h('th', { scope: 'col', text: 'Customer' }),
              h('th', { scope: 'col', text: 'Phone' }),
              h('th', { scope: 'col', text: 'Items' }),
              h('th', { scope: 'col', text: 'Fulfilment' }),
              h('th', { scope: 'col', text: 'Total' }),
              h('th', { scope: 'col', text: 'Status' }),
              h('th', { scope: 'col', text: 'Payment' }),
              h('th', { scope: 'col' }, h('span', { class: 'visually-hidden', text: 'Details' })),
            ),
          ),
          h('tbody', {}, ...rows),
        ),
      ),
    );
  }

  // Digest -------------------------------------------------------------

  function renderDigest() {
    const preview = state.digestPreview;

    const orderRows = (preview?.orders ?? []).map((order) =>
      h(
        'li',
        { class: 'digest-order' },
        h('p', { class: 'digest-order__head' }, `${order.id} — ${order.customer.name}`),
        h(
          'p',
          { class: 'digest-order__meta' },
          `${summariseItems(order.items)} · ${formatNgn(order.total)} · ${order.fulfilment} · ${order.status}`,
        ),
      ),
    );

    panels.digest.replaceChildren(
      h(
        'div',
        { class: 'admin-section-head' },
        h('h2', { text: 'Daily digest' }),
      ),
      h(
        'p',
        { class: 'field-hint', text: 'A preview of the end-of-day email: every order placed since the last digest. Demo only — no email is sent.' },
      ),
      h(
        'div',
        { class: 'admin-exports' },
        h(
          'button',
          {
            type: 'button',
            class: 'button button--ghost',
            onclick: async () => {
              state.digestPreview = await api.getDigestPreview();
              state.digestNotice = '';
              render();
            },
          },
          'Preview digest',
        ),
        h(
          'button',
          {
            type: 'button',
            class: 'button button--primary',
            onclick: async () => {
              // "Send" opens the same preview first, then asks for confirmation.
              state.digestPreview = await api.getDigestPreview();
              state.digestNotice = '';
              render();
              const confirmed = await confirmAction({
                title: 'Send digest now?',
                message:
                  state.digestPreview.orders.length === 0
                    ? 'There are no new orders. Sending still records the digest time.'
                    : `This marks ${state.digestPreview.orders.length} ${state.digestPreview.orders.length === 1 ? 'order' : 'orders'} as notified and updates the last-digest time. No email is sent in the demo.`,
                confirmLabel: 'Send digest (demo)',
              });
              if (!confirmed) return;
              const result = await api.sendDigestNow();
              state.digestPreview = null;
              state.digestNotice =
                result.orderCount === 0
                  ? `Digest recorded at ${result.sentAt}. No new orders — no email was sent.`
                  : `Digest recorded at ${result.sentAt}: ${result.orderCount} ${result.orderCount === 1 ? 'order' : 'orders'} marked as notified. No email was sent.`;
              await refresh();
              render();
            },
          },
          'Send digest now',
        ),
      ),
      state.digestNotice
        ? h('p', { class: 'admin-notice', role: 'status', text: state.digestNotice })
        : null,
      preview
        ? h(
            'div',
            { class: 'digest-preview' },
            h('h3', { text: 'Subject' }),
            h('p', { class: 'digest-subject', text: preview.subject }),
            h('h3', { text: 'Body' }),
            h('pre', { class: 'digest-body', text: preview.body }),
            preview.orders.length === 0
              ? h('p', { class: 'empty-state', text: 'No new orders since the last digest.' })
              : h('ul', { class: 'digest-orders' }, ...orderRows),
          )
        : h('p', { class: 'field-hint', text: 'Preview the digest to see what the email would contain.' }),
    );
  }

  // Settings -----------------------------------------------------------

  const SETTINGS_FIELDS = [
    { name: 'brandName', label: 'Brand name', type: 'text', required: true, maxlength: 60 },
    { name: 'tagline', label: 'Tagline (optional)', type: 'text', maxlength: 120 },
    { name: 'contactPhone', label: 'Contact phone', type: 'tel', required: true, hint: 'Shown in the footer; Nigerian format.' },
    { name: 'whatsappNumber', label: 'WhatsApp number', type: 'tel', required: true },
    { name: 'email', label: 'Email (optional)', type: 'email', maxlength: 120 },
    { name: 'address', label: 'Address (optional)', type: 'text', maxlength: 200 },
    { name: 'pickupAddress', label: 'Pickup address', type: 'text', required: true, maxlength: 200, hint: 'Shown on pickup confirmations.' },
    { name: 'bankName', label: 'Bank name', type: 'text', required: true, maxlength: 60 },
    { name: 'accountName', label: 'Account name', type: 'text', required: true, maxlength: 80 },
    { name: 'accountNumber', label: 'Account number', type: 'text', required: true, inputmode: 'numeric', maxlength: 14, hint: 'Exactly 10 digits.' },
    { name: 'deliveryFee', label: 'Delivery fee (₦)', type: 'number', required: true, min: 0, max: 100000, step: 1, hint: 'Applies to new delivery orders only.' },
    { name: 'digestTime', label: 'Digest time', type: 'time', required: true },
    { name: 'digestRecipient', label: 'Digest recipient', type: 'email', required: true, maxlength: 120 },
  ];

  function renderSettings() {
    const settings = state.settings;
    if (!settings) {
      panels.settings.replaceChildren(h('p', { text: 'Settings are unavailable.' }));
      return;
    }

    const inputs = {};
    const fieldErrors = {};

    const fields = SETTINGS_FIELDS.map((field) => {
      const input = h('input', {
        id: `settings-${field.name}`,
        name: field.name,
        type: field.type,
        value: String(settings[field.name] ?? ''),
        required: field.required === true,
        ...(field.maxlength ? { maxlength: field.maxlength } : {}),
        ...(field.min != null ? { min: field.min } : {}),
        ...(field.max != null ? { max: field.max } : {}),
        ...(field.step != null ? { step: field.step } : {}),
        ...(field.inputmode ? { inputmode: field.inputmode } : {}),
      });
      input.addEventListener('input', () => {
        input.removeAttribute('aria-invalid');
        if (fieldErrors[field.name]) {
          fieldErrors[field.name].textContent = '';
          fieldErrors[field.name].hidden = true;
        }
      });
      inputs[field.name] = input;
      fieldErrors[field.name] = h('p', {
        class: 'field-error',
        id: `settings-${field.name}-error`,
        hidden: true,
      });
      input.setAttribute('aria-describedby', `settings-${field.name}-error`);

      return h(
        'div',
        { class: 'field' },
        h(
          'label',
          { for: `settings-${field.name}` },
          `${field.label}${field.required ? ' *' : ''}`,
        ),
        field.hint ? h('p', { class: 'field-hint', text: field.hint }) : null,
        input,
        fieldErrors[field.name],
      );
    });

    const notesInput = h('textarea', {
      id: 'settings-paymentInstructions',
      name: 'paymentInstructions',
      rows: 3,
      maxlength: 500,
    });
    notesInput.value = settings.paymentInstructions ?? '';
    notesInput.setAttribute('aria-describedby', 'settings-paymentInstructions-error');
    inputs.paymentInstructions = notesInput;
    fieldErrors.paymentInstructions = h('p', {
      class: 'field-error',
      id: 'settings-paymentInstructions-error',
      hidden: true,
    });

    const feedback = h('p', {
      class: 'admin-notice',
      role: 'status',
      hidden: !state.settingsNotice,
      text: state.settingsNotice,
    });

    const form = h(
      'form',
      {
        class: 'checkout-form',
        novalidate: true,
        onsubmit: async (event) => {
          event.preventDefault();
          const payload = {};
          for (const field of SETTINGS_FIELDS) {
            payload[field.name] =
              field.type === 'number'
                ? Number(inputs[field.name].value)
                : inputs[field.name].value;
          }
          payload.paymentInstructions = inputs.paymentInstructions.value;

          const { ok, errors } = validateSettings({ ...settings, ...payload });
          for (const [name, node] of Object.entries(fieldErrors)) {
            node.textContent = errors[name] ?? '';
            node.hidden = !errors[name];
            if (errors[name]) inputs[name]?.setAttribute('aria-invalid', 'true');
            else inputs[name]?.removeAttribute('aria-invalid');
          }
          if (!ok) {
            state.settingsNotice = '';
            feedback.hidden = true;
            const first = [...SETTINGS_FIELDS, { name: 'paymentInstructions' }].find(
              (field) => errors[field.name],
            );
            inputs[first?.name]?.focus();
            return;
          }

          try {
            state.settings = await api.updateSettings(payload);
            state.settingsNotice = 'Settings saved. The storefront shows them on its next load.';
          } catch (error) {
            const field = error.details?.field;
            if (field && fieldErrors[field]) {
              fieldErrors[field].textContent = error.message;
              fieldErrors[field].hidden = false;
              inputs[field]?.focus();
              return;
            }
            state.settingsNotice = error.message || 'Could not save settings.';
          }
          render();
          panels.settings.querySelector('.admin-notice')?.focus?.();
        },
      },
      ...fields,
      h(
        'div',
        { class: 'field' },
        h('label', { for: 'settings-paymentInstructions', text: 'Payment instructions (optional)' }),
        notesInput,
        fieldErrors.paymentInstructions,
      ),
      feedback,
      h('button', { type: 'submit', class: 'button button--primary', text: 'Save settings' }),
    );

    panels.settings.replaceChildren(
      h(
        'div',
        { class: 'admin-section-head' },
        h('h2', { text: 'Settings' }),
      ),
      h(
        'p',
        { class: 'field-hint', text: 'Changes apply to the storefront, checkout, and new orders. Past orders keep their snapshots.' },
      ),
      form,
    );
  }

  /**
   * Inline status editor shared by the table and the detail view.
   *
   * @param {import('./api/types.js').Order} order
   * @param {'status' | 'payment'} kind
   */
  function statusSelect(order, kind) {
    const options = kind === 'status' ? ORDER_STATUSES : PAYMENT_STATUSES;
    const current = kind === 'status' ? order.status : order.paymentStatus;
    const label = kind === 'status' ? `Order status for ${order.id}` : `Payment status for ${order.id}`;

    const select = h(
      'select',
      { 'aria-label': label, 'data-order': order.id, 'data-kind': kind },
      ...options.map((value) =>
        h('option', { value, selected: value === current, text: value }),
      ),
    );

    select.addEventListener('change', async () => {
      const next = select.value;
      try {
        if (kind === 'status' && next === 'cancelled') {
          const confirmed = await confirmAction({
            title: `Cancel order ${order.id}?`,
            message: 'The customer keeps their reference. Use this for mistakes or duplicate orders.',
            confirmLabel: 'Cancel order',
          });
          if (!confirmed) {
            select.value = current;
            return;
          }
        }

        if (kind === 'status') await api.updateOrderStatus(order.id, next);
        else await api.updateOrderPaymentStatus(order.id, next);
        await refresh();
        render();
        if (dialog.open) openOrderDetail(order.id, { keepOpen: true });
      } catch {
        select.value = current;
      }
    });

    return select;
  }

  /**
   * @param {string} orderId
   * @param {{ keepOpen?: boolean }} [options]
   */
  async function openOrderDetail(orderId, { keepOpen = false } = {}) {
    let order;
    try {
      order = await api.getOrder(orderId);
    } catch {
      state.notice = 'That order could not be opened.';
      render();
      return;
    }

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
        h('span', { class: 'confirm-item__total', text: formatNgn(item.lineTotal) }),
      ),
    );

    dialog.replaceChildren(
      h(
        'div',
        { class: 'admin-dialog__inner' },
        h('h2', { id: 'admin-dialog-title', text: `Order ${order.id}` }),
        h(
          'dl',
          { class: 'order-detail' },
          h('div', {}, h('dt', { text: 'Placed' }), h('dd', { text: formatDate(order.createdAt) })),
          h('div', {}, h('dt', { text: 'Customer' }), h('dd', { text: order.customer.name })),
          h('div', {}, h('dt', { text: 'Phone' }), h('dd', { text: order.customer.phone })),
          order.customer.email
            ? h('div', {}, h('dt', { text: 'Email' }), h('dd', { text: order.customer.email }))
            : null,
          h('div', {}, h('dt', { text: 'Fulfilment' }), h('dd', { text: order.fulfilment })),
          order.deliveryAddress
            ? h('div', {}, h('dt', { text: 'Deliver to' }), h('dd', { text: order.deliveryAddress }))
            : null,
          order.customer.notes
            ? h('div', {}, h('dt', { text: 'Notes' }), h('dd', { text: order.customer.notes }))
            : null,
        ),
        h('h3', { text: 'Items' }),
        h('ul', { class: 'confirm-items' }, ...itemRows),
        h(
          'dl',
          { class: 'totals' },
          h('div', { class: 'totals__row' }, h('dt', { text: 'Subtotal' }), h('dd', { text: formatNgn(order.subtotal) })),
          h('div', { class: 'totals__row' }, h('dt', { text: 'Delivery' }), h('dd', { text: order.deliveryFee === 0 ? 'Free' : formatNgn(order.deliveryFee) })),
          h('div', { class: 'totals__row totals__row--grand' }, h('dt', { text: 'Total' }), h('dd', { text: formatNgn(order.total) })),
        ),
        h(
          'div',
          { class: 'order-status-row' },
          h('div', { class: 'field' }, h('span', { id: 'detail-status-label', text: 'Order status' }), statusSelect(order, 'status')),
          h('div', { class: 'field' }, h('span', { text: 'Payment status' }), statusSelect(order, 'payment')),
        ),
        h(
          'div',
          { class: 'admin-dialog__actions' },
          h(
            'button',
            {
              type: 'button',
              class: 'button button--primary',
              onclick: () => closeDialog(),
            },
            'Done',
          ),
        ),
      ),
    );

    if (!keepOpen && typeof dialog.showModal === 'function' && !dialog.open) {
      dialog.showModal();
    }
    dialog.querySelector('.button')?.focus();
  }

  // Wiring ---------------------------------------------------------------

  for (const tab of tabs) {
    tab.addEventListener('click', () => {
      state.tab = tab.dataset.adminTab;
      render();
    });
  }

  logoutButton.addEventListener('click', async () => {
    await api.logout();
    setAuthed(false);
    render();
  });

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) closeDialog();
  });

  const ready = (async () => {
    try {
      const settings = await api.getPublicSettings();
      renderShell(settings, root);
    } catch {
      // Brand stays static if storage fails; the gate still renders.
    }

    state.authed = isAuthed();
    if (state.authed) {
      try {
        await refresh();
      } catch (error) {
        console.error('Could not load the CMS', error);
      }
    }
    render();
  })();

  return { ready, state };
}

// Boot automatically on the real admin page, where the mount points exist.
// (Imported for its exports in tests, where the skeleton is absent.)
if (typeof document !== 'undefined' && document.querySelector('[data-admin-login]')) {
  mountAdmin();
}
