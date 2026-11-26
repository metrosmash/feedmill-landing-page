/**
 * @param {unknown} value
 */
function digitsOnly(value) {
  return String(value ?? '').replace(/\D/g, '');
}

/**
 * @param {string} phone
 */
function telHref(phone) {
  const raw = String(phone ?? '').trim();
  const prefix = raw.startsWith('+') ? '+' : '';
  return `tel:${prefix}${digitsOnly(raw)}`;
}

/**
 * @param {string} number
 */
function whatsappHref(number) {
  let digits = digitsOnly(number);
  if (digits.startsWith('0')) digits = `234${digits.slice(1)}`;
  return `https://wa.me/${digits}`;
}

/**
 * @param {ParentNode} root
 * @param {string} selector
 * @param {(element: HTMLElement) => void} apply
 */
function each(root, selector, apply) {
  root.querySelectorAll(selector).forEach((element) => apply(element));
}

/**
 * Apply public settings to the storefront shell. Ticket 07 makes these values
 * editable; the read path and rendering contract are established here.
 *
 * @param {import('../api/types.js').Settings} settings
 * @param {ParentNode} [root]
 */
export function renderShell(settings, root = document) {
  if (!settings) return;

  each(root, '[data-brand]', (element) => {
    element.textContent = settings.brandName;
  });

  each(root, '[data-tagline]', (element) => {
    element.textContent = settings.tagline;
  });

  each(root, '[data-contact-phone]', (element) => {
    element.textContent = settings.contactPhone;
    if (element instanceof HTMLAnchorElement) {
      element.href = telHref(settings.contactPhone);
    }
  });

  each(root, '[data-contact-email]', (element) => {
    element.textContent = settings.email;
    if (element instanceof HTMLAnchorElement) {
      element.href = `mailto:${settings.email}`;
    }
  });

  each(root, '[data-whatsapp]', (element) => {
    if (element instanceof HTMLAnchorElement) {
      element.href = whatsappHref(settings.whatsappNumber);
    }
  });

  each(root, '[data-address]', (element) => {
    element.textContent = settings.address;
  });

  each(root, '[data-pickup-address]', (element) => {
    element.textContent = settings.pickupAddress;
  });

  each(root, '[data-footer-year]', (element) => {
    element.textContent = String(new Date().getFullYear());
  });

  if (root === document) {
    document.title = `${settings.brandName} — Farm-fresh produce`;
  }
}
