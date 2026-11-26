/**
 * Shared API types. These are documentation-only JSDoc definitions; the demo
 * ships plain JavaScript with no build step.
 *
 * @typedef {Object} Product
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {number} price
 * @property {string} currency
 * @property {string} unit
 * @property {string} imageUrl
 * @property {boolean} available
 * @property {number} sortOrder
 * @property {string} createdAt
 * @property {string} updatedAt
 *
 * @typedef {Object} Settings
 * @property {string} brandName
 * @property {string} tagline
 * @property {string} logoUrl
 * @property {string} contactPhone
 * @property {string} whatsappNumber
 * @property {string} email
 * @property {string} address
 * @property {string} pickupAddress
 * @property {string} bankName
 * @property {string} accountName
 * @property {string} accountNumber
 * @property {string} paymentInstructions
 * @property {number} deliveryFee
 * @property {string} currency
 * @property {string} digestTime
 * @property {string} digestRecipient
 * @property {string | null} lastDigestAt
 * @property {boolean} demoMode
 *
 * @typedef {Object} OrderItem
 * @property {string} productId
 * @property {string} name
 * @property {string} unit
 * @property {number} unitPrice
 * @property {number} quantity
 * @property {number} lineTotal
 *
 * @typedef {Object} Order
 * @property {string} id
 * @property {string} createdAt
 * @property {{ name: string, phone: string, email?: string, notes?: string }} customer
 * @property {'pickup' | 'delivery'} fulfilment
 * @property {string} [deliveryAddress]
 * @property {OrderItem[]} items
 * @property {number} subtotal
 * @property {number} deliveryFee
 * @property {number} total
 * @property {'new' | 'confirmed' | 'delivered' | 'cancelled'} status
 * @property {'unpaid' | 'paid' | 'refunded'} paymentStatus
 * @property {string | null} paymentProvider
 * @property {string | null} paymentReference
 * @property {string | null} notifiedAt
 *
 * @typedef {Object} ExportFile
 * @property {string} filename
 * @property {string} mimeType
 * @property {string} content
 *
 * @typedef {Object} DigestPreview
 * @property {string} subject
 * @property {string} body
 * @property {Order[]} orders
 * @property {string | null} since
 *
 * @typedef {Object} DigestResult
 * @property {string} sentAt
 * @property {number} orderCount
 */

export {};
