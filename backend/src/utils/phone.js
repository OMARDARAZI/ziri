function normalizePhone(phone, defaultCountryCode = '+961') {
  const clean = String(phone || '').trim();
  if (clean.includes('@')) return clean.toLowerCase();
  const cleanPhone = clean.replace(/[\s().-]/g, '');
  if (!cleanPhone) return null;
  if (cleanPhone.startsWith('+')) {
    if (!/^\+[1-9]\d{6,14}$/.test(cleanPhone)) return null;
    return cleanPhone;
  }
  let digits = cleanPhone.replace(/^0+/, '');
  if (digits.startsWith('961') && digits.length >= 10) {
    digits = digits.slice(3);
  }
  if (!/^\d{6,14}$/.test(digits)) return null;
  return `${defaultCountryCode}${digits}`;
}

function maskPhone(phone) {
  const value = String(phone || '');
  return value.length <= 4 ? '••••' : `${'•'.repeat(Math.max(4, value.length - 4))}${value.slice(-4)}`;
}

module.exports = { normalizePhone, maskPhone };

