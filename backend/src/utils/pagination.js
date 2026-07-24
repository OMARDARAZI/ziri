function getPagination(query) { const page = Math.max(1, Number.parseInt(query.page, 10) || 1); const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 20)); return { page, limit, offset: (page - 1) * limit }; }
function limitOffsetClause(limit, offset) {
  if (!Number.isSafeInteger(limit) || limit < 1 || !Number.isSafeInteger(offset) || offset < 0) throw new TypeError('Pagination values must be safe non-negative integers');
  return `LIMIT ${limit} OFFSET ${offset}`;
}
function metadata(page, limit, total) { return { page, limit, total, pages: Math.ceil(total / limit) }; }
module.exports = { getPagination, limitOffsetClause, metadata };
