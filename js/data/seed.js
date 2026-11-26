/**
 * Seed data for the Feedmill Farms demo.
 *
 * All prices, contact details, and bank details are placeholders. They are
 * editable in the CMS and must never be presented as the client's real data.
 */

export const SCHEMA_VERSION = 1;

const SEED_TIMESTAMP = '2026-01-01T00:00:00.000Z';

export const seedProducts = [
  {
    id: 'turkey',
    name: 'Turkey',
    description: 'Whole farm-raised turkey, cleaned and ready to cook.',
    price: 28000,
    currency: 'NGN',
    unit: 'per bird',
    imageUrl: 'image/stock/turkey.jpg',
    available: true,
    sortOrder: 1,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: 'broiler-chicken',
    name: 'Broiler Chicken',
    description: 'Fresh broiler chicken, cleaned and packed for pickup or delivery.',
    price: 9500,
    currency: 'NGN',
    unit: 'per bird',
    imageUrl: 'image/chicken%20image.webp',
    available: true,
    sortOrder: 2,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: 'garri',
    name: 'Garri',
    description: 'Fresh cassava garri, finely sieved and ready to soak.',
    price: 1500,
    currency: 'NGN',
    unit: 'per kg',
    imageUrl: 'image/garri1.jpg',
    available: false,
    sortOrder: 3,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: 'palm-oil-3l',
    name: '3L Palm Oil',
    description: 'Pure red palm oil in a 3 litre bottle.',
    price: 8500,
    currency: 'NGN',
    unit: 'per 3L',
    imageUrl: 'image/stock/palm-oil-3l.jpg',
    available: true,
    sortOrder: 4,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: 'palm-oil-5l',
    name: '5L Palm Oil',
    description: 'Pure red palm oil in a 5 litre bottle.',
    price: 13000,
    currency: 'NGN',
    unit: 'per 5L',
    imageUrl: 'image/stock/palm-oil-5l.jpg',
    available: true,
    sortOrder: 5,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
];

export const seedSettings = {
  brandName: 'Feedmill Farms',
  tagline: 'Farm-fresh produce, delivered with care.',
  logoUrl: '',
  contactPhone: '+234 800 000 0000',
  whatsappNumber: '+234 800 000 0001',
  email: 'hello@feedmillfarms.example',
  address: '12 Market Road, Ibadan, Oyo State',
  pickupAddress: 'Feedmill Farms pickup point, 12 Market Road, Ibadan',
  bankName: 'Demo Bank',
  accountName: 'Feedmill Farms Demo',
  accountNumber: '0000000000',
  paymentInstructions:
    'Transfer to the account above, then send your receipt on WhatsApp so we can confirm your order.',
  deliveryFee: 2500,
  currency: 'NGN',
  digestTime: '20:00',
  digestRecipient: 'owner@feedmillfarms.example',
  lastDigestAt: null,
  demoMode: true,
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function createSeed() {
  return {
    products: clone(seedProducts),
    settings: clone(seedSettings),
  };
}
