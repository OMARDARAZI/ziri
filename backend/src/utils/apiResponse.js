function success(res, data = {}, message = 'Operation completed successfully', status = 200, pagination) { const body = { success: true, message, data }; if (pagination) body.pagination = pagination; return res.status(status).json(body); }
function failure(res, message, status = 400, errors, code) { const body = { success: false, message }; if (errors) body.errors = errors; if (code) body.code = code; return res.status(status).json(body); }
module.exports = { success, failure };
