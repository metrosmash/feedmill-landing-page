import { createMockApi } from './api/index.js';
import { createStore } from './store/store.js';
import { renderProductGrid } from './ui/product-grid.js';
import { renderShell } from './ui/shell.js';

const api = createMockApi();

const store = createStore({
  status: 'loading',
  settings: null,
  products: [],
  error: null,
});

const grid = document.querySelector('[data-product-grid]');
const status = document.querySelector('[data-grid-status]');

/**
 * @param {ReturnType<typeof store.getState>} state
 */
function render(state) {
  if (state.settings) {
    renderShell(state.settings);
  }

  if (state.status === 'loading') {
    status.hidden = false;
    status.classList.remove('grid-status--error');
    status.textContent = 'Loading the shop…';
    return;
  }

  if (state.status === 'error') {
    status.hidden = false;
    status.classList.add('grid-status--error');
    status.textContent = 'We could not load the shop. Please refresh the page.';
    grid.replaceChildren();
    return;
  }

  status.hidden = true;
  renderProductGrid(state.products, grid);
}

store.subscribe(render);

async function load() {
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
}

load();
