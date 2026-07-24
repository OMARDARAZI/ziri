const test = require('node:test');
const assert = require('node:assert/strict');
const { getPagination, limitOffsetClause } = require('../src/utils/pagination');

test('pagination SQL contains only validated integer literals', () => {
  const { limit, offset } = getPagination({ page: '3', limit: '25' });
  assert.equal(limitOffsetClause(limit, offset), 'LIMIT 25 OFFSET 50');
});

test('pagination SQL rejects values that were not validated first', () => {
  assert.throws(() => limitOffsetClause(20, -1), /Pagination values/);
  assert.throws(() => limitOffsetClause(20, Number.NaN), /Pagination values/);
  assert.throws(() => limitOffsetClause('20', 0), /Pagination values/);
});
