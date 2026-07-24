const test = require('node:test');
const assert = require('node:assert/strict');
process.env.NODE_ENV = 'test';
const errorMiddleware = require('../src/middleware/error.middleware');

function response() {
  return {
    statusCode: 200,
    body: undefined,
    status(status) { this.statusCode = status; return this; },
    json(body) { this.body = body; return this; }
  };
}

test('maps duplicate and relationship database faults to safe conflicts', () => {
  for (const code of ['ER_DUP_ENTRY', 'ER_ROW_IS_REFERENCED_2']) {
    const res = response();
    errorMiddleware({ code, message: 'raw database detail' }, { originalUrl: '/api/v1/dashboard/admin/providers' }, res);
    assert.equal(res.statusCode, 409);
    assert.notEqual(res.body.message, 'raw database detail');
    assert.match(res.body.code, /CONFLICT/);
  }
});

test('maps malformed database input to a validation error', () => {
  const res = response();
  errorMiddleware({ code: 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD', message: 'raw database detail' }, { originalUrl: '/api/v1/dashboard/admin/offerings' }, res);
  assert.equal(res.statusCode, 422);
  assert.equal(res.body.code, 'VALIDATION_ERROR');
});

test('does not expose unexpected database messages through the API', () => {
  const res = response();
  errorMiddleware({ code: 'ER_BAD_FIELD_ERROR', message: 'Unknown column secret_token in where clause' }, { originalUrl: '/api/v1/dashboard/admin/weather' }, res);
  assert.equal(res.statusCode, 500);
  assert.equal(res.body.code, 'INTERNAL_ERROR');
  assert.equal(res.body.message, 'An unexpected error occurred');
});
