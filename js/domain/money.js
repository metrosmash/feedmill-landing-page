const nairaFormatter = new Intl.NumberFormat('en-NG', {
  maximumFractionDigits: 0,
});

/**
 * Format an amount in Nigerian naira, e.g. 28000 -> "₦28,000".
 *
 * @param {number} amount
 * @returns {string}
 */
export function formatNgn(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return '₦0';
  const sign = value < 0 ? '-' : '';
  return `${sign}₦${nairaFormatter.format(Math.abs(value))}`;
}
