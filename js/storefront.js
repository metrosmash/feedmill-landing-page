import { STORAGE_PREFIX } from './api/index.js';
import {
  buildOrderSummary,
  changeQuantity,
  isFulfilment,
  withQuantity,
} from './domain/cart.js';
import { createStore } from './store/store.js';
import { mountCheckout } from './ui/checkout.js';
import { mountConfirmation } from './ui/confirmation.js';
import { mountOrderSummary } from './ui/order-summary.js';
import { renderProductGrid, syncProductGrid } from './ui/product-grid.js';
import { renderShell } from './ui/shell.js';

export const LAST_ORDER_KEY = 'feedmill:last-order';

/**
 * @param {string} key
 * @returns {unknown | null}
 */
function readSession(key) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw == null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * @param {string} key
 * @param {unknown} value
 */
function writeSession(key, value) {
  try {
    if (value == null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode or disabled storage: the demo still works for this visit.
  }
}

/**
 * Wire the storefront: load public data, render the shell and grid, keep the
 * live order summary in sync with the in-memory cart, and handle checkout.
 *
 * @param {{
 *   api: ReturnType<import('./api/index.js').createMockApi>,
 *   root?: ParentNode & { querySelector: (selector: string) => Element | null },
 * }} options
 */
export function mountStorefront({ api, root = document } = {}) {
  if (!api) throw new Error('mountStorefront requires an api adapter.');

  const store = createStore({
    status: 'loading',
    settings: null,
    products: [],
    cart: { quantities: {}, fulfilment: 'pickup' },
    confirmation: null,
    error: null,
  });

  const grid = root.querySelector('[data-product-grid]');
  const status = root.querySelector('[data-grid-status]');
  const summaryContainer = root.querySelector('[data-order-summary]');
  const checkoutContainer = root.querySelector('[data-checkout]');
  const confirmationContainer = root.querySelector('[data-confirmation]');
  const checkoutSection = root.querySelector('[data-checkout-section]');
  const confirmationSection = root.querySelector('[data-confirmation-section]');

  let summary = null;
  let checkout = null;
  let confirmation = null;
  let renderedProducts = null;

  /**
   * @param {string} productId
   * @param {number} quantity
   */
  function setQuantity(productId, quantity) {
    store.setState((state) => ({
      ...state,
      cart: {
        ...state.cart,
        quantities: withQuantity(state.cart.quantities, productId, quantity),
      },
    }));
  }

  /**
   * @param {'pickup' | 'delivery'} fulfilment
   */
  function setFulfilment(fulfilment) {
    if (!isFulfilment(fulfilment)) return;
    store.setState((state) => ({
      ...state,
      cart: { ...state.cart, fulfilment },
    }));
  }

  function startNewOrder() {
    writeSession(LAST_ORDER_KEY, null);
    store.setState((state) => ({ ...state, confirmation: null }));
    checkoutSection?.removeAttribute('hidden');
    if (checkoutSection && typeof checkoutSection.scrollIntoView === 'function') {
      checkoutSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /**
   * @param {Record<string, string>} values
   */
  async function submitCheckout(values) {
    const state = store.getState();
    const summary = buildOrderSummary({
      products: state.products,
      quantities: state.cart.quantities,
      fulfilment: state.cart.fulfilment,
      deliveryFee: state.settings?.deliveryFee ?? 0,
    });

    if (summary.items.length === 0) {
      checkout?.showErrors({}, 'Your order is empty. Add something from the farm first.');
      return;
    }

    try {
      const order = await api.createOrder({
        customer: {
          name: values.name,
          phone: values.phone,
          email: values.email,
          notes: values.notes,
        },
        fulfilment: state.cart.fulfilment,
        deliveryAddress: values.deliveryAddress,
        items: summary.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });

      writeSession(LAST_ORDER_KEY, order);
      checkout?.clearErrors();
      store.setState((current) => ({
        ...current,
        confirmation: order,
        cart: { quantities: {}, fulfilment: 'pickup' },
      }));

      if (confirmationSection && typeof confirmationSection.scrollIntoView === 'function') {
        requestAnimationFrame(() => {
          confirmationSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
    } catch (error) {
      if (error?.code === 'validation_error') {
        const details = error.details ?? {};
        const fieldErrors =
          details.errors ??
          (details.field ? { [details.field]: error.message } : {});
        checkout?.showErrors(fieldErrors);
        return;
      }

      if (error?.code === 'sold_out' || error?.code === 'not_found') {
        // The catalogue changed under us: refresh it, drop the stale item,
        // and explain what happened without clearing the form.
        const productId = error.details?.productId;
        let products = null;
        try {
          products = await api.listProducts();
        } catch {
          products = null;
        }

        store.setState((current) => {
          const quantities = { ...current.cart.quantities };
          if (productId) delete quantities[productId];
          return {
            ...current,
            ...(products ? { products } : {}),
            cart: { ...current.cart, quantities },
          };
        });

        checkout?.showErrors({}, error.message);
        return;
      }

      console.error('Could not place the order', error);
      checkout?.showErrors(
        {},
        'We could not place your order. Please check your connection and try again.',
      );
    }
  }

  /**
   * @param {ReturnType<typeof store.getState>} state
   */
  function render(state) {
    if (state.settings) renderShell(state.settings, root);

    if (state.status === 'loading') {
      if (status) {
        status.hidden = false;
        status.classList.remove('grid-status--error');
        status.textContent = 'Loading the shop…';
      }
      return;
    }

    if (state.status === 'error') {
      if (status) {
        status.hidden = false;
        status.classList.add('grid-status--error');
        status.textContent =
          'We could not load the shop. Please refresh the page.';
      }
      if (grid) grid.replaceChildren();
      return;
    }

    if (status) status.hidden = true;

    if (grid) {
      if (renderedProducts !== state.products) {
        renderProductGrid(state.products, grid);
        renderedProducts = state.products;
      }
      syncProductGrid(state.products, grid, state.cart.quantities);
    }

    if (summaryContainer) {
      if (!summary) {
        summary = mountOrderSummary(summaryContainer, {
          onFulfilmentChange: setFulfilment,
        });
      }

      const deliveryFee = state.settings?.deliveryFee ?? 0;
      summary.update({
        summary: buildOrderSummary({
          products: state.products,
          quantities: state.cart.quantities,
          fulfilment: state.cart.fulfilment,
          deliveryFee,
        }),
        fulfilment: state.cart.fulfilment,
        deliveryFee,
      });
    }

    if (checkoutContainer && !checkout) {
      checkout = mountCheckout(checkoutContainer, { onSubmit: submitCheckout });
    }

    if (confirmationContainer && !confirmation) {
      confirmation = mountConfirmation(confirmationContainer, {
        onNewOrder: startNewOrder,
      });
    }

    const ordered = state.confirmation != null;
    if (checkoutSection) checkoutSection.hidden = ordered;
    if (confirmationSection) confirmationSection.hidden = !ordered;

    if (checkout) {
      const empty =
        buildOrderSummary({
          products: state.products,
          quantities: state.cart.quantities,
          fulfilment: state.cart.fulfilment,
          deliveryFee: state.settings?.deliveryFee ?? 0,
        }).items.length === 0;
      checkout.update({ fulfilment: state.cart.fulfilment, cartEmpty: empty });
    }

    if (confirmation) {
      confirmation.update(state.confirmation, state.settings);
    }
  }

  if (grid) {
    grid.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const button = target.closest('[data-qty-action]');
      if (!(button instanceof HTMLButtonElement) || button.disabled) return;

      const card = button.closest('[data-product-id]');
      if (!card) return;

      const productId = card.getAttribute('data-product-id');
      const state = store.getState();
      const product = state.products.find((item) => item.id === productId);
      if (!product || product.available === false) return;

      const delta = button.dataset.qtyAction === 'increase' ? 1 : -1;
      const next = changeQuantity(state.cart.quantities, productId, delta);
      store.setState({
        cart: { ...state.cart, quantities: next },
      });
    });
  }

  store.subscribe(render);

  /**
   * Reload public data when another tab (e.g. the CMS) writes to storage,
   * so brand, contact, bank, and delivery-fee changes appear live.
   */
  async function reload() {
    try {
      const [settings, products] = await Promise.all([
        api.getPublicSettings(),
        api.listProducts(),
      ]);
      store.setState((current) => ({ ...current, settings, products }));
    } catch {
      // Keep showing the current data if the reload fails.
    }
  }

  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('storage', (event) => {
      if (event.key && !event.key.startsWith(STORAGE_PREFIX)) return;
      reload();
    });
  }

  const ready = (async () => {
    try {
      const [settings, products] = await Promise.all([
        api.getPublicSettings(),
        api.listProducts(),
      ]);
      const restored = readSession(LAST_ORDER_KEY);
      const confirmation =
        restored &&
        typeof restored === 'object' &&
        typeof restored.id === 'string' &&
        Array.isArray(restored.items)
          ? restored
          : null;
      store.setState({
        status: 'ready',
        settings,
        products,
        error: null,
        confirmation,
      });
    } catch (error) {
      console.error('Could not load the storefront', error);
      store.setState({ status: 'error', error });
    }
  })();

  return { store, ready, setQuantity, setFulfilment, submitCheckout, startNewOrder };
}
