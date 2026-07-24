const { failure } = require('../utils/apiResponse');
const env = require('../config/environment');

function databaseError(error) {
  if (error.code === 'ER_DUP_ENTRY') return { status: 409, code: 'CONFLICT', message: 'A record with these values already exists' };
  if (['ER_NO_REFERENCED_ROW', 'ER_NO_REFERENCED_ROW_2', 'ER_ROW_IS_REFERENCED', 'ER_ROW_IS_REFERENCED_2'].includes(error.code)) return { status: 409, code: 'RELATIONSHIP_CONFLICT', message: 'This record is linked to another record and cannot be changed' };
  if (['ER_BAD_NULL_ERROR', 'ER_CHECK_CONSTRAINT_VIOLATED', 'ER_DATA_TOO_LONG', 'ER_TRUNCATED_WRONG_VALUE', 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD', 'ER_WARN_DATA_OUT_OF_RANGE', 'ER_DATA_OUT_OF_RANGE', 'ER_NO_DEFAULT_FOR_FIELD', 'ER_INVALID_JSON_TEXT', 'ER_INVALID_JSON_VALUE', 'WARN_DATA_TRUNCATED'].includes(error.code)) return { status: 422, code: 'VALIDATION_ERROR', message: 'One or more submitted values are invalid' };
  return null;
}

module.exports = (error, req, res, _next) => {
  const mapped = databaseError(error);
  const status = mapped?.status || error.statusCode || 500;
  const code = mapped?.code || (status >= 500 ? 'INTERNAL_ERROR' : error.code || 'ERROR');
  const message = mapped?.message || (status >= 500 ? 'An unexpected error occurred' : error.message || 'An unexpected error occurred');
  if (status >= 500 && env.nodeEnv !== 'test') console.error(error);
  if (req.originalUrl.startsWith('/api/')) return failure(res, message, status, undefined, code);
  if (res.headersSent) return;
  res.status(status).render('errors/error', { title: 'Error', message, status });
};
