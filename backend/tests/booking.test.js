const test=require('node:test');const assert=require('node:assert/strict');const {totalForParticipants}=require('../src/utils/booking');const {randomToken}=require('../src/utils/token');const {publicUrl}=require('../src/utils/qr');
test('Booking for customer only has one participant',()=>{assert.equal(totalForParticipants(35,1),35);});
test('Booking for guests only totals every guest',()=>{assert.equal(totalForParticipants(35,3),105);});
test('Booking for customer plus guests totals all participants',()=>{assert.equal(totalForParticipants(35,4),140);});
test('Correct USD total is calculated from the selected snapshot',()=>{assert.equal(totalForParticipants(12.5,3),37.5);});
test('Correct LBP total is calculated from the selected snapshot',()=>{assert.equal(totalForParticipants(2200000,2),4400000);});
test('One QR is generated per participant with unique public links',()=>{const first=randomToken(),second=randomToken();assert.notEqual(first,second);assert.notEqual(publicUrl(first),publicUrl(second));});
