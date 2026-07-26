import { saveSTKTransaction } from '../../../src/database/transactionRepository.js';
import { json } from '../../../src/utils/http.js';
import { logError } from '../../../src/utils/logger.js';

export default async function handler(req, res) {
  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return json(res, 405, {
        success: false,
        message: 'Method not allowed'
      });
    }

    // Extract STK callback
    const callback = req.body?.Body?.stkCallback;

    // Always acknowledge the callback
    if (!callback) {
      return json(res, 200, {
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
     * Only save successful transactions.
     *
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
      /*
       * Payment was cancelled or failed.
       * Do not insert it as a successful transaction.
       */
      console.log(
        `[STK_CALLBACK] Payment failed: ${callback.ResultCode} - ${callback.ResultDesc}`
      );
    }

    /*
     * Safaricom expects a successful callback response.
     */
    return json(res, 200, {
      ResultCode: 0,
      ResultDesc: 'Accepted'
    });

  } catch (error) {
    logError('STK_CALLBACK', error);

    /*
     * Always acknowledge the callback to avoid
     * unnecessary callback retries.
     */
    return json(res, 200, {
      ResultCode: 0,
      ResultDesc: 'Accepted'
    });
  }
}
