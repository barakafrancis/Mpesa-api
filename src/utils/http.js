export function json(res, status, body) {
  return res.status(status).json(body);
}

export function methodNotAllowed(req, res, allowed = ['POST']) {
  if (!allowed.includes(req.method)) {
    res.setHeader('Allow', allowed.join(', '));
    json(res, 405, { success: false, message: 'Method not allowed' });
    return true;
  }
  return false;
}

export function requireApiKey(req, res) {
  const expected = process.env.API_KEY;
  if (!expected) return true;
  const provided = req.headers['x-api-key'];
  if (provided !== expected) {
    json(res, 401, { success: false, message: 'Unauthorized' });
    return false;
  }
  return true;
}
