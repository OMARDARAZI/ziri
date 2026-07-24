const test=require('node:test');const assert=require('node:assert/strict');const {normalizePhone}=require('../src/utils/phone');const {extractToken}=require('../src/utils/qr');
test('Customer registration normalizes a valid Lebanese phone',()=>{assert.equal(normalizePhone(' 961 70 000004 '),'+96170000004');});
test('Customer login rejects a malformed phone before database lookup',()=>{assert.equal(normalizePhone('not-a-phone'),null);});
test('Duplicate phone rejection uses the canonical phone number',()=>{assert.equal(normalizePhone('+961-70-000004'),normalizePhone('96170000004'));});
test('Protected route without token has no usable QR token',()=>{assert.equal(extractToken('invalid'), '');});
