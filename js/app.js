import { createMockApi } from './api/index.js';
import { mountStorefront } from './storefront.js';

mountStorefront({ api: createMockApi() });
