// Statutory Billing & Tax Engine compliant with Section 31 CGST Act and University Dining Rules

export const STATUTORY_CONFIG = {
  UNIVERSITY_NAME: 'Indian Institute of Technology & Advanced Sciences - Central Campus',
  CANTEEN_NAME: 'CampusBite North Canteen Food Court',
  GSTIN: '07AAATC9012E1Z8',
  FSSAI_LIC: '1001902200987',
  CGST_RATE: 0.025, // 2.5%
  SGST_RATE: 0.025, // 2.5%
  ECO_PACKAGING_FEE: 5.00,
  DEFAULT_WELFARE_SUBSIDY: 8.00,
  HACK50_MIN_ORDER: 199.00,
  HACK50_DISCOUNT: 50.00
};

export function calculateBilling({ items, discountCode = null, isStudent = true }) {
  // 1. Calculate itemized subtotal
  const subtotal = items.reduce((sum, item) => {
    const price = Number(item.price || item.unit_price || 0);
    const qty = Number(item.quantity || 1);
    return sum + (price * qty);
  }, 0);

  // 2. Calculate promotional discount
  let discountAmount = 0.00;
  let appliedDiscountCode = null;

  if (discountCode && discountCode.toUpperCase() === 'HACK50' && subtotal >= STATUTORY_CONFIG.HACK50_MIN_ORDER) {
    discountAmount = STATUTORY_CONFIG.HACK50_DISCOUNT;
    appliedDiscountCode = 'HACK50';
  } else if (discountCode && discountCode.toUpperCase() === 'CAMPUS20' && subtotal >= 100) {
    discountAmount = 20.00;
    appliedDiscountCode = 'CAMPUS20';
  } else if (subtotal >= STATUTORY_CONFIG.HACK50_MIN_ORDER) {
    // Auto-apply HACK50 if eligible and no code explicitly passed
    discountAmount = STATUTORY_CONFIG.HACK50_DISCOUNT;
    appliedDiscountCode = 'HACK50';
  }

  // 3. Welfare subsidy (applicable for enrolled students on meals)
  const subsidyAmount = isStudent ? STATUTORY_CONFIG.DEFAULT_WELFARE_SUBSIDY : 0.00;

  // 4. Net taxable subtotal after discounts & university subsidies
  const taxableBase = Math.max(0, subtotal - discountAmount - subsidyAmount);

  // 5. Statutory GST (2.5% CGST + 2.5% SGST)
  const cgstAmount = Number((taxableBase * STATUTORY_CONFIG.CGST_RATE).toFixed(2));
  const sgstAmount = Number((taxableBase * STATUTORY_CONFIG.SGST_RATE).toFixed(2));

  // 6. Mandatory eco-friendly bio-degradable packaging fee
  const packagingFee = STATUTORY_CONFIG.ECO_PACKAGING_FEE;

  // 7. Final net payable amount
  const finalAmount = Number((taxableBase + cgstAmount + sgstAmount + packagingFee).toFixed(2));

  return {
    subtotalAmount: Number(subtotal.toFixed(2)),
    discountAmount: Number(discountAmount.toFixed(2)),
    appliedDiscountCode,
    subsidyAmount: Number(subsidyAmount.toFixed(2)),
    taxableBase: Number(taxableBase.toFixed(2)),
    cgstAmount,
    sgstAmount,
    packagingFee,
    finalAmount
  };
}

export function generateOrderToken() {
  const num = Math.floor(100 + Math.random() * 900); // 3-digit token e.g. 412
  return `#TOKEN-${num}`;
}

export function generateSecurityPin() {
  return Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit PIN e.g. 8942
}

export function generateTransactionRef() {
  const timestamp = Date.now().toString().slice(-7);
  return `CB-TXN-9842${timestamp.slice(0, 3)}`;
}
