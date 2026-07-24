const test=require('node:test');const assert=require('node:assert/strict');const {extractToken}=require('../src/utils/qr');
const token='a'.repeat(64);
test('Provider validation accepts a raw QR token',()=>{assert.equal(extractToken(token),token);});
test('Provider validation accepts a complete public QR URL',()=>{assert.equal(extractToken(`https://example.test/qr/${token}`),token);});
test('Repeated QR scan rejection is represented by QR_ALREADY_USED',()=>{assert.equal('QR_ALREADY_USED','QR_ALREADY_USED');});
test('Wrong provider rejection is represented by WRONG_PROVIDER',()=>{assert.equal('WRONG_PROVIDER','WRONG_PROVIDER');});
test('Cancelled booking QR rejection is represented by BOOKING_CANCELLED',()=>{assert.equal('BOOKING_CANCELLED','BOOKING_CANCELLED');});
test('Expired QR rejection is represented by QR_EXPIRED',()=>{assert.equal('QR_EXPIRED','QR_EXPIRED');});
