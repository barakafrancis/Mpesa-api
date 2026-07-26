import { saveSTKTransaction } from '../../../src/database/transactionRepository.js';
import { logError } from '../../../src/utils/logger.js';

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      ResultCode: 1,
      ResultDesc: 'Method not allowed'
    });
  }

  try {
    // Extract STK callback
    const callback = req.body?.Body?.stkCallback;

    // Always acknowledge malformed/empty callbacks
    if (!callback) {
      return res.status(200).json({
        ResultCode: 0,
        ResultDesc: 'Accepted'
      });
    }

    // Extract callback metadata
    const metadata = Object.fromEntries(
      (callback.CallbackMetadata?.Item || []).map(item => [
        item.Name,
        item.Value ?? null
      ])
    );

    console.log('[STK_CALLBACK]', {
      resultCode: callback.ResultCode,
      resultDesc: callback.ResultDesc,
      merchantRequestId: callback.MerchantRequestID,
      checkoutRequestId: callback.CheckoutRequestID,
      metadata
    });

    /*
     * Save only successful transactions.
     * ResultCode 0 = Successful
     */
    if (callback.ResultCode === 0) {
      await saveSTKTransaction({
        resultCode: callback.ResultCode,

        resultDesc: callback.ResultDesc,

        merchantRequestId:
          callback.MerchantRequestID,

        checkoutRequestId:
          callback.CheckoutRequestID,

        amount:
          metadata.Amount,

        mpesaReceiptNumber:
          metadata.MpesaReceiptNumber,

        transactionDate:
          metadata.TransactionDate,

        phoneNumber:
          metadata.PhoneNumber
      });

      console.log(
        `[STK_CALLBACK] Successful transaction saved: ${metadata.MpesaReceiptNumber}`
      );
    } else {
      console.log(
        `[STK_CALLBACK] Payment failed: ${callback.ResultCode} - ${callback.ResultDesc}`
      );
    }

    // Acknowledge callback to Safaricom
    return res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'Accepted'
    });

  } catch (e) {
    logError('STK_CALLBACK', e);

    /*
     * Always acknowledge the callback.
     * This prevents unnecessary callback retries.
     */
    return res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'Accepted'
    });
  }
}
