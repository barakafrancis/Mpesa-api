import { saveSTKTransaction } from "../../../src/database/transactionRepository.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  try {
    const callback = req.body?.Body?.stkCallback;

    if (!callback) {
      return res.status(400).json({
        ResultCode: 1,
        ResultDesc: "Invalid callback"
      });
    }

    const metadata = {};

    for (const item of callback.CallbackMetadata?.Item || []) {
      metadata[item.Name] = item.Value ?? null;
    }

    const transaction = {
      TransactionType: "STK Push",

      TransID: metadata.MpesaReceiptNumber,

      TransTime: new Date().toISOString(),

      TransAmount: metadata.Amount,

      BusinessShortCode: process.env.MPESA_SHORTCODE,

      BillRefNumber: metadata.AccountReference,

      MSISDN: metadata.PhoneNumber,

      FirstName: null,

      MiddleName: null,

      LastName: null,

      paidtoaccount: metadata.AccountReference,

      syncid: callback.CheckoutRequestID
    };

    if (callback.ResultCode === 0) {
      await saveSTKTransaction(transaction);

      console.log(
        `[STK_CALLBACK] Transaction saved: ${transaction.TransID}`
      );
    }

    return res.status(200).json({
      ResultCode: 0,
      ResultDesc: "Accepted"
    });

  } catch (error) {
    console.error("[STK_CALLBACK] Error:", error);

    return res.status(200).json({
      ResultCode: 0,
      ResultDesc: "Accepted"
    });
  }
}
