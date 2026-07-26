import { initiateSTKPush } from '../../../src/mpesa/stk.service.js';
import { json, methodNotAllowed, requireApiKey } from '../../../src/utils/http.js';
import { logError } from '../../../src/utils/logger.js';

export default async function handler(req, res) {
  if (methodNotAllowed(req, res) || !requireApiKey(req, res)) return;

  try {
    const { amount, phoneNumber, accountReference, transactionDesc } = req.body || {};
    const data = await initiateSTKPush({ amount, phoneNumber, accountReference, transactionDesc });
    return json(res, 200, { success: true, data });
  } catch (e) {
    logError('STK_PUSH', e);
    return json(res, 500, {
      success: false,
      error: e.response?.data || e.message
    });
  }
}
