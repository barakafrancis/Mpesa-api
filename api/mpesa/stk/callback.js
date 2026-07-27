import { saveSTKTransaction, saveC2BTransaction } from '../../../src/database/transactionRepository.js';
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
const body = req.body;

```
/*
 * =====================================================
 * C2B CALLBACK
 * =====================================================
 *
 * Example:
 * {
 *   TransactionType: "Pay Bill",
 *   TransID: "QWTBDFE67379j",
 *   TransTime: "20260727130000",
 *   TransAmount: "30000",
 *   BusinessShortCode: "696459",
 *   BillRefNumber: "27477748",
 *   MSISDN: "254712345678"
 * }
 */

if (body?.TransID) {
  console.log('[C2B_CALLBACK]', body);

  await saveC2BTransaction({
    transId: body.TransID,
    transactionType: body.TransactionType,
    transTime: body.TransTime,
    transAmount: body.TransAmount,
    businessShortCode: body.BusinessShortCode,
    billRefNumber: body.BillRefNumber,
    orgAccountBalance: body.OrgAccountBalance,
    msisdn: body.MSISDN,
    firstName: body.FirstName,
    middleName: body.MiddleName,
    lastName: body.LastName
  });

  console.log(
    `[C2B_CALLBACK] Transaction saved successfully: ${body.TransID}`
  );

  return res.status(200).json({
    ResultCode: 0,
    ResultDesc: 'Accepted'
  });
}

/*
STK PUSH CALLBACK
 */

const callback = body?.Body?.stkCallback;

// Acknowledgement
if (!callback) {
  console.log('[MPESA_CALLBACK] Unknown callback format:', body);

  return res.status(200).json({
    ResultCode: 0,
    ResultDesc: 'Accepted'
  });
}

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
 * Save only successful STK transactions.
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
```

} catch (e) {
logError('MPESA_CALLBACK', e);

```
/*
 * Always acknowledge the callback.
 * This prevents unnecessary callback retries.
 */
return res.status(200).json({
  ResultCode: 0,
  ResultDesc: 'Accepted'
});
```

}
}
