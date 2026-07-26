import { saveSTKTransaction } from '../../../src/database/transactionRepository.js';
import { json } from '../../../src/utils/http.js';
import { logError } from '../../../src/utils/logger.js';

export default async function handler(req, res) {
  try {
    const callback = req.body?.Body?.stkCallback;
    if (!callback) return json(res, 200, { ResultCode: 0, ResultDesc: 'Accepted' });

    const metadata = Object.fromEntries(
      (callback.CallbackMetadata?.Item || []).map(item => [item.Name, item.Value ?? null])
    );

    await saveSTKTransaction({
      resultCode: callback.ResultCode,
      resultDesc: callback.ResultDesc,
      merchantRequestId: callback.MerchantRequestID,
      checkoutRequestId: callback.CheckoutRequestID,
      amount: metadata.Amount,
      mpesaReceiptNumber: metadata.MpesaReceiptNumber,
      transactionDate: metadata.TransactionDate,
      phoneNumber: metadata.PhoneNumber
    });

    return json(res, 200, { ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (e) {
    logError('STK_CALLBACK', e);
    return json(res, 200, { ResultCode: 0, ResultDesc: 'Accepted' });
  }
}
