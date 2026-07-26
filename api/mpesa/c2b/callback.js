import { saveC2BTransaction } from '../../../src/database/transactionRepository.js';
import { logError } from '../../../src/utils/logger.js';
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ResultCode: 1, ResultDesc: 'Method not allowed' });
  try {
    const result = await saveC2BTransaction(req.body || {});
    return res.status(200).json({ ResultCode: 0, ResultDesc: result.duplicate ? 'Duplicate transaction accepted' : 'Accepted' });
  } catch (e) {
    logError('C2B_CALLBACK', e);
    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
}
