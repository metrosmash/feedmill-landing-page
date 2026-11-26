export const NAME_MIN = 2;
export const NAME_MAX = 80;
export const EMAIL_MAX = 120;
export const ADDRESS_MIN = 5;
export const ADDRESS_MAX = 200;
export const NOTES_MAX = 500;

export const PRODUCT_NAME_MIN = 2;
export const PRODUCT_NAME_MAX = 80;
export const PRODUCT_DESCRIPTION_MAX = 300;
export const PRODUCT_PRICE_MIN = 1;
export const PRODUCT_PRICE_MAX = 10000000;
export const PRODUCT_UNIT_MIN = 1;
export const PRODUCT_UNIT_MAX = 20;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Strip spaces, dashes, and parentheses so users can type natural numbers.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function normalisePhone(value) {
  return String(value ?? '').replace(/[\s\-()]/g, '');
}

/**
 * Nigerian phone: +234 / 234 / 0 prefix with 70/71/80/81/90/91 networks.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isValidPhone(value) {
  return /^(?:\+?234|0)(7[01]|8[01]|9[01])\d{8}$/.test(normalisePhone(value));
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isValidEmail(value) {
  const email = String(value ?? '').trim();
  return email.length > 0 && email.length <= EMAIL_MAX && EMAIL_PATTERN.test(email);
}

/**
 * Validate the checkout customer fields.
 *
 * @param {{
 *   name?: unknown,
 *   phone?: unknown,
 *   email?: unknown,
 *   fulfilment?: unknown,
 *   deliveryAddress?: unknown,
 *   notes?: unknown,
 * }} input
 * @returns {{ ok: boolean, errors: Record<string, string> }}
 */
export function validateCustomer(input) {
  const errors = {};
  const name = String(input.name ?? '').trim();
  const phone = String(input.phone ?? '').trim();
  const email = String(input.email ?? '').trim();
  const notes = String(input.notes ?? '');
  const address = String(input.deliveryAddress ?? '').trim();

  if (name.length < NAME_MIN || name.length > NAME_MAX) {
    errors.name = `Enter your full name (${NAME_MIN}–${NAME_MAX} characters).`;
  }

  if (!isValidPhone(phone)) {
    errors.phone = 'Enter a valid Nigerian phone number, e.g. 0803 123 4567.';
  }

  if (email.length > 0 && !isValidEmail(email)) {
    errors.email = 'Enter a valid email address or leave it blank.';
  }

  if (input.fulfilment === 'delivery') {
    if (address.length < ADDRESS_MIN || address.length > ADDRESS_MAX) {
      errors.deliveryAddress = `Enter your delivery address (${ADDRESS_MIN}–${ADDRESS_MAX} characters).`;
    }
  }

  if (notes.length > NOTES_MAX) {
    errors.notes = `Keep notes under ${NOTES_MAX} characters.`;
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

/**
 * Validate admin product input.
 *
 * @param {Record<string, unknown>>} input
 * @returns {{ ok: boolean, errors: Record<string, string> }}
 */
export function validateProduct(input) {
  const errors = {};
  const name = String(input.name ?? '').trim();
  const description = String(input.description ?? '').trim();
  const unit = String(input.unit ?? '').trim();
  const imageUrl = String(input.imageUrl ?? '').trim();
  const price = Number(input.price);
  const sortOrder = Number(input.sortOrder ?? 0);

  if (name.length < PRODUCT_NAME_MIN || name.length > PRODUCT_NAME_MAX) {
    errors.name = `Name must be ${PRODUCT_NAME_MIN}–${PRODUCT_NAME_MAX} characters.`;
  }

  if (description.length > PRODUCT_DESCRIPTION_MAX) {
    errors.description = `Keep the description under ${PRODUCT_DESCRIPTION_MAX} characters.`;
  }

  if (!Number.isInteger(price) || price < PRODUCT_PRICE_MIN || price > PRODUCT_PRICE_MAX) {
    errors.price = `Price must be a whole naira amount from ₦${PRODUCT_PRICE_MIN.toLocaleString('en-NG')} to ₦${PRODUCT_PRICE_MAX.toLocaleString('en-NG')}.`;
  }

  if (unit.length < PRODUCT_UNIT_MIN || unit.length > PRODUCT_UNIT_MAX) {
    errors.unit = `Unit must be ${PRODUCT_UNIT_MIN}–${PRODUCT_UNIT_MAX} characters, e.g. per bird.`;
  }

  if (imageUrl.length > 0 && !isValidImageUrl(imageUrl)) {
    errors.imageUrl = 'Image URL must start with https://, http://, or be a relative path like image/photo.jpg.';
  }

  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    errors.sortOrder = 'Sort order must be a whole number of 0 or more.';
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

/**
 * @param {string} value
 * @returns {boolean}
 */
export function isValidImageUrl(value) {
  const url = String(value).trim();
  if (!url) return true;
  if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) return true;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url)) {
    return url.startsWith('https://') || url.startsWith('http://');
  }
  return true;
}

/**
 * Normalise a WhatsApp number to bare digits with a 234 country prefix.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function normaliseWhatsapp(value) {
  let digits = String(value ?? '').replace(/\D/g, '');
  if (digits.startsWith('0')) digits = `234${digits.slice(1)}`;
  return digits;
}

export const ACCOUNT_NUMBER_LENGTH = 10;
export const DELIVERY_FEE_MIN = 0;
export const DELIVERY_FEE_MAX = 100000;

const DIGEST_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const SETTINGS_TEXT_BOUNDS = {
  brandName: [2, 60],
  tagline: [0, 120],
  address: [0, 200],
  pickupAddress: [5, 200],
  bankName: [2, 60],
  accountName: [2, 80],
  paymentInstructions: [0, 500],
  logoUrl: [0, 500],
};

/**
 * Validate admin settings input (full object: merge the patch first).
 *
 * @param {Record<string, unknown>} input
 * @returns {{ ok: boolean, errors: Record<string, string> }}
 */
export function validateSettings(input) {
  const errors = {};

  /**
   * @param {string} name
   * @returns {string}
   */
  function text(name) {
    return String(input[name] ?? '').trim();
  }

  for (const [name, [min, max]] of Object.entries(SETTINGS_TEXT_BOUNDS)) {
    const value = text(name);
    if (value.length < min || value.length > max) {
      const label = min === 0 ? `under ${max} characters` : `${min}–${max} characters`;
      errors[name] = `Keep this ${label}.`;
    }
  }

  if (!isValidPhone(text('contactPhone'))) {
    errors.contactPhone = 'Enter a valid Nigerian phone number, e.g. 0803 123 4567.';
  }

  if (!isValidPhone(text('whatsappNumber'))) {
    errors.whatsappNumber = 'Enter a valid Nigerian WhatsApp number.';
  }

  const email = text('email');
  if (email.length > 0 && !isValidEmail(email)) {
    errors.email = 'Enter a valid email address or leave it blank.';
  }

  if (!/^\d{10}$/.test(text('accountNumber').replace(/[\s\-]/g, ''))) {
    errors.accountNumber = 'Account number must be exactly 10 digits.';
  }

  const deliveryFee = Number(input.deliveryFee);
  if (!Number.isInteger(deliveryFee) || deliveryFee < DELIVERY_FEE_MIN || deliveryFee > DELIVERY_FEE_MAX) {
    errors.deliveryFee = `Delivery fee must be a whole naira amount from ₦${DELIVERY_FEE_MIN.toLocaleString('en-NG')} to ₦${DELIVERY_FEE_MAX.toLocaleString('en-NG')}.`;
  }

  if (!DIGEST_TIME_PATTERN.test(text('digestTime'))) {
    errors.digestTime = 'Digest time must be HH:MM in 24-hour format.';
  }

  if (!isValidEmail(text('digestRecipient'))) {
    errors.digestRecipient = 'Enter a valid digest recipient email.';
  }

  return { ok: Object.keys(errors).length === 0, errors };
}
