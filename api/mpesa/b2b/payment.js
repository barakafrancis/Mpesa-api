import { initiateB2B } from '../../../src/mpesa/b2b.service.js';
import { json, methodNotAllowed, requireApiKey } from '../../../src/utils/http.js';
import { logError } from '../../../src/utils/logger.js';
export default async function handler(req, res) {
  if (methodNotAllowed(req, res) || !requireApiKey(req, res)) return;
  try { return json(res, 200, { success: true, data: await initiateB2B(req.body) }); }
  catch (e) { logError('B2B_PAYMENT', e); return json(res, 500, { success: false, error: e.response?.data || e.message }); }
}
