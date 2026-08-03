import {
  saveSTKTransaction,
  saveC2BTransaction,
  updateSTKSMSResponse
} from '../../../src/database/transactionRepository.js';

import { sendAcknowledgementSMS } from '../../../src/mpesa/sms.service.js';
import { logError } from '../../../src/utils/logger.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      ResultCode: 1,
      ResultDesc: 'Method not allowed'
    });
  }

  try {
    const body = req.body;

    /*C2B CALLBACK*/
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

    /*STK CALLBACK*/
    const callback = body?.Body?.stkCallback;

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

    /*Extract STK metadata*/
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

    /*SUCCESSFUL*/
    if (callback.ResultCode === 0) {

      console.log('[STK_CALLBACK] Payment successful');

      /*Save STK transaction*/
      const transaction = await saveSTKTransaction({
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

      /*SEND SMS*/

      if (!transaction?.duplicate && metadata.PhoneNumber) {

        const smsMessage =
          `Payment received successfully. ` +
          `Amount: KES ${metadata.Amount}. ` +
          `M-Pesa Ref: ${metadata.MpesaReceiptNumber}. ` +
          `Thank you.`;

        try {

          const smsResponse = await sendAcknowledgementSMS({
            mobile: metadata.PhoneNumber,
            message: smsMessage
          });

          console.log(
            '[STK_SMS] Response:',
            smsResponse
          );

          /*Save SMS response*/
          if (transaction?.id) {

            await updateSTKSMSResponse({
              id: transaction.id,
              mobile: metadata.PhoneNumber,
              response: smsResponse
            });

            console.log(
              '[STK_SMS] Response saved to database'
            );
          }

        } catch (smsError) {

          logError('STK_SMS', smsError);

          console.error(
            '[STK_SMS] Failed to send SMS:',
            smsError
          );
        }

      } else {

        console.log(
          '[STK_SMS] SMS not sent - duplicate transaction or missing phone number'
        );
      }

    } else {

      /*FAILED / CANCELLED PAYMENT*/

      console.log(
        `[STK_CALLBACK] Payment failed: ` +
        `${callback.ResultCode} - ${callback.ResultDesc}`
      );
    }
    return res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'Accepted'
    });

  } catch (e) {

    logError('MPESA_CALLBACK', e);

    console.error(
      '[MPESA_CALLBACK] ERROR:',
      e
    );

    /*acknowledge*/
    return res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'Accepted'
    });
  }
}
