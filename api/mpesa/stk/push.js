import { initiateSTKPush } from '../../../src/mpesa/stk.service.js';

import {
  json,
  methodNotAllowed,
  requireApiKey
} from '../../../src/utils/http.js';

import { logError } from '../../../src/utils/logger.js';

import { getPool, sql } from '../../../src/database/sqlserver.js';

function normalizePhone(phoneNumber) {

  if (!phoneNumber) {
    return null;
  }

  let phone = String(phoneNumber)
    .trim()
    .replace(/\s+/g, '')
    .replace(/-/g, '');

  if (phone.startsWith('+')) {
    phone = phone.substring(1);
  }

  if (/^07\d{8}$/.test(phone)) {
    return `254${phone.substring(1)}`;
  }

  if (/^01\d{8}$/.test(phone)) {
    return `254${phone.substring(1)}`;
  }

  if (/^254\d{9}$/.test(phone)) {
    return phone;
  }

  return null;
}

async function createPaymentRequest({
  phoneNumber,
  amount,
  initiator,
  accountReference,
  transactionDesc
}) {

  const pool = await getPool();

  const result = await pool
    .request()

    .input(
      'PhoneNumber',
      sql.VarChar(20),
      phoneNumber
    )

    .input(
      'Amount',
      sql.Decimal(18, 2),
      amount
    )

    .input(
      'Initiator',
      sql.VarChar(150),
      initiator
    )

    .input(
      'AccountReference',
      sql.VarChar(100),
      accountReference
    )

    .input(
      'TransactionDescription',
      sql.VarChar(255),
      transactionDesc
    )

    .query(`
      INSERT INTO dbo.MpesaPaymentRequests
      (
        PhoneNumber,
        Amount,
        Initiator,
        AccountReference,
        TransactionDescription,
        PaymentStatus,
        InitiatedAt
      )

      OUTPUT INSERTED.Id

      VALUES
      (
        @PhoneNumber,
        @Amount,
        @Initiator,
        @AccountReference,
        @TransactionDescription,
        'PENDING',
        GETDATE()
      );
    `);

  return result.recordset[0].Id;
}

async function updatePaymentRequest({
  id,
  merchantRequestID,
  checkoutRequestID,
  resultCode,
  resultDescription
}) {

  const pool = await getPool();

  await pool
    .request()

    .input(
      'Id',
      sql.BigInt,
      id
    )

    .input(
      'MerchantRequestID',
      sql.VarChar(100),
      merchantRequestID
    )

    .input(
      'CheckoutRequestID',
      sql.VarChar(100),
      checkoutRequestID
    )

    .input(
      'ResultCode',
      sql.Int,
      resultCode
    )

    .input(
      'ResultDescription',
      sql.VarChar(500),
      resultDescription
    )

    .query(`
      UPDATE dbo.MpesaPaymentRequests

      SET
        MerchantRequestID = @MerchantRequestID,
        CheckoutRequestID = @CheckoutRequestID,
        ResultCode = @ResultCode,
        ResultDescription = @ResultDescription

      WHERE Id = @Id;
    `);
}


export default async function handler(req, res) {
  if (
    methodNotAllowed(req, res) ||
    !requireApiKey(req, res)
  ) {
    return;
  }


  try {

    const {
      amount,
      phoneNumber,
      accountReference,
      transactionDesc,
      initiator
    } = req.body || {};

    const numericAmount = Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {

      return json(res, 400, {
        success: false,
        message: 'Amount must be greater than zero'
      });

    }


    if (!Number.isInteger(numericAmount)) {

      return json(res, 400, {
        success: false,
        message: 'Amount must be a whole number'
      });

    }

    const normalizedPhone =
      normalizePhone(phoneNumber);


    if (!normalizedPhone) {

      return json(res, 400, {
        success: false,
        message:
          'Invalid phone number. Use 07XXXXXXXX, 01XXXXXXXX or 254XXXXXXXXX.'
      });

    }


    const paymentInitiator =
      String(initiator || 'WEB_USER')
        .slice(0, 150);


    const reference =
      String(accountReference || 'PAYMENT')
        .slice(0, 100);


    const description =
      String(transactionDesc || 'Payment')
        .slice(0, 255);

    const paymentId =
      await createPaymentRequest({

        phoneNumber:
          normalizedPhone,

        amount:
          numericAmount,

        initiator:
          paymentInitiator,

        accountReference:
          reference,

        transactionDesc:
          description

      });


    console.log(
      `M-Pesa payment request created: ${paymentId}`
    );

    const data =
      await initiateSTKPush({

        amount:
          numericAmount,

        phoneNumber:
          normalizedPhone,

        accountReference:
          reference,

        transactionDesc:
          description

      });


    console.log(
      'STK PUSH RESPONSE:',
      data
    );


    await updatePaymentRequest({

      id:
        paymentId,

      merchantRequestID:
        data?.MerchantRequestID || null,

      checkoutRequestID:
        data?.CheckoutRequestID || null,

      resultCode:
        data?.ResponseCode != null
          ? Number(data.ResponseCode)
          : null,

      resultDescription:
        data?.ResponseDescription || null

    });

    return json(res, 200, {

      success: true,

      paymentId,

      phoneNumber:
        normalizedPhone,

      amount:
        numericAmount,

      data

    });


  } catch (e) {

    /*
     * Log the error using your
     * existing logger.
     */

    logError('STK_PUSH', e);


    console.error(
      'STK PUSH ERROR:',
      e.response?.data || e.message
    );


    return json(res, 500, {

      success: false,

      error:
        e.response?.data ||
        e.message

    });

  }
}
