import {
saveSTKTransaction,
saveC2BTransaction
} from '../../../src/database/transactionRepository.js';

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
 * ==========================================
 * C2B CALLBACK
 * ==========================================
 */

if (body?.TransID) {
  console.log('[C2B_CALLBACK]', body);

  await saveC2BTransaction({
    TransactionType: body.TransactionType,
    TransID: body.TransID,
    TransTime: body.TransTime,
    TransAmount: body.TransAmount,
    BusinessShortCode: body.BusinessShortCode,
    BillRefNumber: body.BillRefNumber,
    OrgAccountBalance: body.OrgAccountBalance,
    MSISDN: body.MSISDN,
    FirstName: body.FirstName,
    MiddleName: body.MiddleName,
    LastName: body.LastName
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
 * ==========================================
 * STK PUSH CALLBACK
 * ==========================================
 */

const callback = body?.Body?.stkCallback;

// Unknown or malformed callback
if (!callback) {
  console.log(
    '[MPESA_CALLBACK] Unknown callback format:',
    body
  );

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
 * Save only successful STK transactions
 */
if (callback.ResultCode === 0) {
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

  console.log(
    `[STK_CALLBACK] Successful transaction saved: ${metadata.MpesaReceiptNumber}`
  );
} else {
  console.log(
    `[STK_CALLBACK] Payment failed: ${callback.ResultCode} - ${callback.ResultDesc}`
  );
}

return res.status(200).json({
  ResultCode: 0,
  ResultDesc: 'Accepted'
});
```

} catch (e) {
logError('MPESA_CALLBACK', e);

```
// Always acknowledge the callback
return res.status(200).json({
  ResultCode: 0,
  ResultDesc: 'Accepted'
});
```

}
}
