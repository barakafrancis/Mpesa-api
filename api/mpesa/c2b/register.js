import { registerC2BUrls } from '../../../src/mpesa/c2b.service.js';
import { json, methodNotAllowed, requireApiKey } from '../../../src/utils/http.js';
import { logError } from '../../../src/utils/logger.js';
export default async function handler(req, res) {
  if (methodNotAllowed(req, res) || !requireApiKey(req, res)) return;
  try { return json(res, 200, { success: true, data: await registerC2BUrls() }); }
  catch (e) { logError('C2B_REGISTER', e); return json(res, 500, { success: false, error: e.response?.data || e.message }); }
}
