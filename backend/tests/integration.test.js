const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');
const request = require('supertest');
const bcrypt = require('bcrypt');

const enabled = Boolean(process.env.TEST_DB_NAME);
if (!enabled) {
  test.skip('MySQL integration suite (set TEST_DB_NAME to run against a separate test database)', () => {});
} else {
  let connection; let app; let providerOne; let providerTwo; let providerOneToken; let providerTwoToken; let customerToken; let unconfiguredProviderPhone;
  const testDatabase = process.env.TEST_DB_NAME;
  if (!/^zeere(?:[_-]test|_test)/i.test(testDatabase)) throw new Error('TEST_DB_NAME must begin with zeere_test to protect non-test databases');
  const config = { host: process.env.TEST_DB_HOST || 'localhost', port: Number(process.env.TEST_DB_PORT || 3306), user: process.env.TEST_DB_USER || 'root', password: process.env.TEST_DB_PASSWORD || '', multipleStatements: true };
  const bookingPayload = (overrides = {}) => ({ offering_id: 1, scheduled_at: new Date().toISOString(), currency: 'USD', include_customer: true, participants: [], ...overrides });
  async function createConfirmedBooking(overrides = {}) { const response = await request(app).post('/api/v1/bookings').set('Authorization', `Bearer ${customerToken}`).send(bookingPayload(overrides)).expect(201); const booking = response.body.data; await connection.execute("UPDATE bookings SET status='CONFIRMED' WHERE id=?", [booking.id]); const [rows] = await connection.execute('SELECT q.public_token FROM participant_qr_codes q JOIN booking_participants p ON p.id=q.participant_id WHERE p.booking_id=? ORDER BY q.id LIMIT 1', [booking.id]); return { booking, token: rows[0].public_token }; }

  test.before(async () => {
    process.env.NODE_ENV = 'test'; process.env.DB_HOST = config.host; process.env.DB_PORT = String(config.port); process.env.DB_NAME = testDatabase; process.env.DB_USER = config.user; process.env.DB_PASSWORD = config.password; process.env.JWT_ACCESS_SECRET ||= 'test_access_secret'; process.env.JWT_REFRESH_SECRET ||= 'test_refresh_secret'; process.env.SESSION_SECRET ||= 'test_session_secret';
    const root = await mysql.createConnection(config); await root.query(`DROP DATABASE IF EXISTS \`${testDatabase}\``); await root.query(`CREATE DATABASE \`${testDatabase}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`); await root.end();
    connection = await mysql.createConnection({ ...config, database: testDatabase }); const schema = fs.readFileSync(path.join(__dirname, '..', 'database', 'schema.sql'), 'utf8').replace(/CREATE DATABASE[\s\S]*?USE zeere;\s*/i, ''); await connection.query(schema);
    const hash = await bcrypt.hash('Provider123!', 10); const [one] = await connection.execute("INSERT INTO users(role,full_name,phone,password_hash,is_active) VALUES ('PROVIDER','Provider One','+96170000002',?,1)", [hash]); const [two] = await connection.execute("INSERT INTO users(role,full_name,phone,password_hash,is_active) VALUES ('PROVIDER','Provider Two','+96170000003',?,1)", [hash]); await connection.execute("INSERT INTO users(role,full_name,phone,password_hash,is_active) VALUES ('PROVIDER','Unconfigured Provider','+96170000004',?,1)", [hash]); await connection.execute("INSERT INTO users(role,full_name,phone,password_hash,is_active) VALUES ('ADMIN','Dashboard Admin','+96170000001',?,1)", [await bcrypt.hash('Admin123!', 10)]); unconfiguredProviderPhone='+96170000004';
    await connection.execute("INSERT INTO providers(user_id,business_name,phone,is_active) VALUES (?, 'Provider One', '+96170000002', 1)", [one.insertId]); await connection.execute("INSERT INTO providers(user_id,business_name,phone,is_active) VALUES (?, 'Provider Two', '+96170000003', 1)", [two.insertId]); const [providers] = await connection.execute('SELECT * FROM providers ORDER BY id'); providerOne = providers[0]; providerTwo = providers[1]; await connection.execute("INSERT INTO offerings(provider_id,type,title,description,image,price_usd,price_lbp,is_active) VALUES (?, 'SERVICE','Test boat tour','Test offering','/images/placeholder.svg',35,3100000,1)", [providerOne.id]);
    app = require('../src/app'); const { signAccess } = require('../src/utils/token'); providerOneToken = signAccess({ id: one.insertId, role: 'PROVIDER', phone: '+96170000002' }); providerTwoToken = signAccess({ id: two.insertId, role: 'PROVIDER', phone: '+96170000003' });
  });
  test.after(async () => { const { pool } = require('../src/config/database'); await pool.end(); await connection.end(); });

  test('Customer registration, login, duplicate rejection, and protected access', async () => {
    const phone = '+96170123456'; const registration = await request(app).post('/api/v1/auth/register').send({ full_name: 'Integration Customer', phone, password: 'Customer123!', password_confirmation: 'Customer123!' }).expect(201); customerToken = registration.body.data.tokens.access_token;
    await request(app).post('/api/v1/auth/login').send({ phone, password: 'Customer123!' }).expect(200); await request(app).post('/api/v1/auth/register').send({ full_name: 'Duplicate', phone, password: 'Customer123!', password_confirmation: 'Customer123!' }).expect(409); await request(app).get('/api/v1/bookings').expect(401);
  });
  test('Bookings support owner-only, guests-only, and mixed participant groups with correct snapshots', async () => {
    const owner = await request(app).post('/api/v1/bookings').set('Authorization', `Bearer ${customerToken}`).send(bookingPayload()).expect(201); assert.equal(owner.body.data.participants.length, 1); assert.equal(owner.body.data.total_amount, 35);
    const guests = await request(app).post('/api/v1/bookings').set('Authorization', `Bearer ${customerToken}`).send(bookingPayload({ include_customer: false, participants: [{ full_name: 'Guest A', phone: '+96171111111' }, { full_name: 'Guest B', phone: '+96172222222' }] })).expect(201); assert.equal(guests.body.data.participants.length, 2); assert.equal(guests.body.data.total_amount, 70);
    const mixed = await request(app).post('/api/v1/bookings').set('Authorization', `Bearer ${customerToken}`).send(bookingPayload({ participants: [{ full_name: 'Guest C', phone: '+96173333333' }], currency: 'LBP' })).expect(201); assert.equal(mixed.body.data.participants.length, 2); assert.equal(mixed.body.data.total_amount, 6200000); const [qrs] = await connection.execute('SELECT id FROM participant_qr_codes q JOIN booking_participants p ON p.id=q.participant_id WHERE p.booking_id=?', [mixed.body.data.id]); assert.equal(qrs.length, 2);
  });
  test('Provider validates once and rejects repeat, wrong-provider, cancelled, and expired QR scans', async () => {
    const valid = await createConfirmedBooking(); await request(app).post('/api/v1/provider/qr/validate').set('Authorization', `Bearer ${providerOneToken}`).send({ token: valid.token }).expect(200); const repeat = await request(app).post('/api/v1/provider/qr/validate').set('Authorization', `Bearer ${providerOneToken}`).send({ token: valid.token }).expect(422); assert.match(repeat.body.message, /already been used/i);
    const wrong = await createConfirmedBooking(); const wrongResponse = await request(app).post('/api/v1/provider/qr/validate').set('Authorization', `Bearer ${providerTwoToken}`).send({ token: wrong.token }).expect(403); assert.match(wrongResponse.body.message, /another provider/i);
    const cancelled = await createConfirmedBooking(); await connection.execute("UPDATE bookings SET status='CANCELLED' WHERE id=?", [cancelled.booking.id]); await request(app).post('/api/v1/provider/qr/validate').set('Authorization', `Bearer ${providerOneToken}`).send({ token: cancelled.token }).expect(422);
    const expired = await createConfirmedBooking(); await connection.execute("UPDATE participant_qr_codes SET valid_until=DATE_SUB(NOW(), INTERVAL 1 MINUTE) WHERE public_token=?", [expired.token]); await request(app).post('/api/v1/provider/qr/validate').set('Authorization', `Bearer ${providerOneToken}`).send({ token: expired.token }).expect(422);
    const [logs] = await connection.execute('SELECT result_code FROM qr_scan_logs ORDER BY id'); assert(logs.some((row) => row.result_code === 'VALIDATED')); assert(logs.some((row) => row.result_code === 'QR_ALREADY_USED')); assert(logs.some((row) => row.result_code === 'WRONG_PROVIDER')); assert(logs.some((row) => row.result_code === 'QR_EXPIRED'));
  });
  test('Dashboard search resources and invalid dashboard actions never return server errors', async () => {
    const agent = request.agent(app); const login = await agent.post('/api/v1/dashboard/admin/login').send({ phone: '+96170000001', password: 'Admin123!' }).expect(200); const csrf = login.body.data.csrf_token;
    for (const resource of ['stories','news','events','safety-tips','weather','providers','provider-users','offerings','customers','bookings','participants','qr-codes','scan-logs','settings']) await agent.get(`/api/v1/dashboard/admin/${resource}`).query({ search: 'missing' }).expect(200);
    const invalidId = await agent.get('/api/v1/dashboard/admin/bookings/not-an-id').expect(422); assert.equal(invalidId.body.code,'VALIDATION_ERROR');
    const invalidAction = await agent.post('/api/v1/dashboard/admin/bookings/99999/action').set('X-CSRF-Token',csrf).send({ action: 'archive' }).expect(422); assert.equal(invalidAction.body.code,'VALIDATION_ERROR');
    const invalidProvider = await agent.post('/api/v1/dashboard/admin/providers').set('X-CSRF-Token',csrf).send({ user_id: 99999, business_name: 'Invalid Provider', phone: '+96179999999', is_active: true }).expect(422); assert.equal(invalidProvider.body.code,'VALIDATION_ERROR');
    const invalidOffering = await agent.post('/api/v1/dashboard/admin/offerings').set('X-CSRF-Token',csrf).send({ provider_id: 99999, type: 'SERVICE', title: 'Invalid link', description: 'Invalid provider link', price_usd: 1, price_lbp: 1 }).expect(422); assert.equal(invalidOffering.body.code,'VALIDATION_ERROR');
    const providerUser = await agent.post('/api/v1/dashboard/admin/provider-users').set('X-CSRF-Token',csrf).send({ full_name: 'Duplicate Profile User', phone: '+96170000111', password: 'Provider123!', is_active: true }).expect(200);
    const providerPayload = { user_id: providerUser.body.data.id, business_name: 'Duplicate Profile', phone: '+96170000111', is_active: true };
    await agent.post('/api/v1/dashboard/admin/providers').set('X-CSRF-Token',csrf).send(providerPayload).expect(200);
    const duplicateProvider = await agent.post('/api/v1/dashboard/admin/providers').set('X-CSRF-Token',csrf).send(providerPayload).expect(409); assert.equal(duplicateProvider.body.code,'CONFLICT');
    const invalidSettingKey = await agent.get('/api/v1/dashboard/admin/settings/not a valid key').expect(422); assert.equal(invalidSettingKey.body.code,'VALIDATION_ERROR');
    await agent.post('/api/v1/dashboard/admin/settings').set('X-CSRF-Token',csrf).send({ setting_key: 'test.setting', setting_value: 'enabled' }).expect(200);
    const duplicateSetting = await agent.post('/api/v1/dashboard/admin/settings').set('X-CSRF-Token',csrf).send({ setting_key: 'test.setting', setting_value: 'enabled' }).expect(409); assert.equal(duplicateSetting.body.code,'CONFLICT');
    const protectedDelete = await agent.delete(`/api/v1/dashboard/admin/providers/${providerOne.id}`).set('X-CSRF-Token',csrf).expect(409); assert.equal(protectedDelete.body.code,'RELATIONSHIP_CONFLICT');
    const missingBooking = await agent.post('/api/v1/dashboard/admin/bookings/99999/action').set('X-CSRF-Token',csrf).send({ action: 'cancel' }).expect(404); assert.equal(missingBooking.body.code,'NOT_FOUND');
    const missingQr = await agent.post('/api/v1/dashboard/admin/qr-codes/99999/cancel').set('X-CSRF-Token',csrf).expect(404); assert.equal(missingQr.body.code,'NOT_FOUND');
  });
  test('An unconfigured provider receives a setup-required response instead of a server error', async () => {
    const agent = request.agent(app); const login = await agent.post('/api/v1/dashboard/provider/login').send({ phone: unconfiguredProviderPhone, password: 'Provider123!' }).expect(200); const csrf = login.body.data.csrf_token;
    for (const path of ['/summary','/bookings','/profile','/scan-history']) { const response = await agent.get(`/api/v1/dashboard/provider${path}`).expect(403); assert.equal(response.body.code,'PROVIDER_PROFILE_REQUIRED'); }
    const update = await agent.patch('/api/v1/dashboard/provider/profile').set('X-CSRF-Token',csrf).send({ business_name: 'Attempt', phone: '+96170000004' }).expect(403); assert.equal(update.body.code,'PROVIDER_PROFILE_REQUIRED');
    const validation = await agent.post('/api/v1/dashboard/provider/qr/validate').set('X-CSRF-Token',csrf).send({ token: 'a'.repeat(64) }).expect(403); assert.equal(validation.body.code,'PROVIDER_PROFILE_REQUIRED');
  });
}
