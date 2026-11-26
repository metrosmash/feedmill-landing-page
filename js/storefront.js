import {
  buildOrderSummary,
  changeQuantity,
  isFulfilment,
  withQuantity,
} from './domain/cart.js';
import { createStore } from './store/store.js';
import { mountOrderSummary } from './ui/order-summary.js';
import { renderProductGrid, syncProductGrid } from './ui/product-grid.js';
import { renderShell } from './ui/shell.js';

/**
 * Wire the storefront: load public data, render the shell and grid, and keep
 * the live order summary in sync with the in-memory cart.
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
    error: null,
  });

  const grid = root.querySelector('[data-product-grid]');
  const status = root.querySelector('[data-grid-status]');
  const summaryContainer = root.querySelector('[data-order-summary]');

  let summary = null;
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

  const ready = (async () => {
    try {
      const [settings, products] = await Promise.all([
        api.getPublicSettings(),
        api.listProducts(),
      ]);
      store.setState({ status: 'ready', settings, products, error: null });
    } catch (error) {
      console.error('Could not load the storefront', error);
      store.setState({ status: 'error', error });
    }
  })();

  return { store, ready, setQuantity, setFulfilment };
}
