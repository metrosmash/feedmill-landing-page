import { describe, expect, it } from 'vitest';
import {
  isValidEmail,
  isValidPhone,
  normalisePhone,
  normaliseWhatsapp,
  validateCustomer,
  validateProduct,
  validateSettings,
} from '../../js/domain/validation.js';
import { seedSettings } from '../../js/data/seed.js';

describe('phone validation', () => {
  it('accepts Nigerian mobile formats', () => {
    expect(isValidPhone('0803 123 4567')).toBe(true);
    expect(isValidPhone('+2348031234567')).toBe(true);
    expect(isValidPhone('234 803 123 4567')).toBe(true);
    expect(isValidPhone('(0901) 234-5678')).toBe(true);
  });

  it('rejects non-Nigerian or short numbers', () => {
    expect(isValidPhone('')).toBe(false);
    expect(isValidPhone('080312345')).toBe(false);
    expect(isValidPhone('+1 555 123 4567')).toBe(false);
    expect(isValidPhone('0603 123 4567')).toBe(false);
  });

  it('strips spaces, dashes, and parentheses before matching', () => {
    expect(normalisePhone('(0803) 123-4567')).toBe('08031234567');
  });

  it('normalises WhatsApp numbers to the 234 prefix', () => {
    expect(normaliseWhatsapp('+234 800 000 0001')).toBe('2348000000001');
    expect(normaliseWhatsapp('08000000001')).toBe('2348000000001');
  });
});

describe('email validation', () => {
  it('accepts normal addresses and rejects bad ones', () => {
    expect(isValidEmail('ada@example.com')).toBe(true);
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});

describe('validateCustomer', () => {
  const valid = {
    name: 'Adaeze Obi',
    phone: '0803 123 4567',
    email: 'ada@example.com',
    fulfilment: 'pickup',
    deliveryAddress: '',
    notes: '',
  };

  it('passes for a complete pickup order', () => {
    expect(validateCustomer(valid)).toEqual({ ok: true, errors: {} });
  });

  it('allows a blank optional email', () => {
    expect(validateCustomer({ ...valid, email: '' }).ok).toBe(true);
  });

  it('requires name, phone, and a valid email when present', () => {
    const result = validateCustomer({ ...valid, name: 'A', phone: '123', email: 'bad' });
    expect(result.ok).toBe(false);
    expect(Object.keys(result.errors).sort()).toEqual(['email', 'name', 'phone']);
  });

  it('requires a delivery address only for delivery orders', () => {
    expect(
      validateCustomer({ ...valid, fulfilment: 'delivery', deliveryAddress: '' }).ok,
    ).toBe(false);
    expect(
      validateCustomer({ ...valid, fulfilment: 'delivery', deliveryAddress: '14 Farm Road, Ibadan' }).ok,
    ).toBe(true);
  });

  it('bounds notes length', () => {
    expect(validateCustomer({ ...valid, notes: 'x'.repeat(501) }).ok).toBe(false);
    expect(validateCustomer({ ...valid, notes: 'x'.repeat(500) }).ok).toBe(true);
  });
});

describe('validateProduct', () => {
  const valid = {
    name: 'Turkey',
    description: 'Whole bird.',
    price: 28000,
    unit: 'per bird',
    imageUrl: 'image/turkey.jpg',
    sortOrder: 1,
  };

  it('passes for a complete product', () => {
    expect(validateProduct(valid)).toEqual({ ok: true, errors: {} });
  });

  it('rejects bad names, prices, units, image URLs, and sort orders', () => {
    const result = validateProduct({
      ...valid,
      name: 'x',
      price: 0,
      unit: '',
      imageUrl: 'ftp://example.com/x.jpg',
      sortOrder: -1,
    });
    expect(result.ok).toBe(false);
    expect(Object.keys(result.errors).sort()).toEqual([
      'imageUrl',
      'name',
      'price',
      'sortOrder',
      'unit',
    ]);
  });

  it('allows relative image paths and blank image URLs', () => {
    expect(validateProduct({ ...valid, imageUrl: '' }).ok).toBe(true);
    expect(validateProduct({ ...valid, imageUrl: 'image/photo.jpg' }).ok).toBe(true);
    expect(validateProduct({ ...valid, imageUrl: 'https://example.com/x.jpg' }).ok).toBe(true);
  });
});

describe('validateSettings', () => {
  it('passes for the seed settings', () => {
    expect(validateSettings(seedSettings)).toEqual({ ok: true, errors: {} });
  });

  it('rejects missing required fields and bad formats', () => {
    const result = validateSettings({
      ...seedSettings,
      brandName: '',
      contactPhone: '123',
      whatsappNumber: 'abc',
      accountNumber: '12345',
      deliveryFee: -5,
      digestTime: '25:00',
      digestRecipient: 'not-an-email',
    });

    expect(result.ok).toBe(false);
    expect(Object.keys(result.errors).sort()).toEqual([
      'accountNumber',
      'brandName',
      'contactPhone',
      'deliveryFee',
      'digestRecipient',
      'digestTime',
      'whatsappNumber',
    ]);
  });

  it('bounds the delivery fee and tolerates blank optionals', () => {
    expect(validateSettings({ ...seedSettings, deliveryFee: 100001 }).ok).toBe(false);
    expect(validateSettings({ ...seedSettings, deliveryFee: 100000 }).ok).toBe(true);
    expect(
      validateSettings({ ...seedSettings, tagline: '', email: '', paymentInstructions: '' }).ok,
    ).toBe(true);
    expect(validateSettings({ ...seedSettings, email: 'bad' }).ok).toBe(false);
  });
});
