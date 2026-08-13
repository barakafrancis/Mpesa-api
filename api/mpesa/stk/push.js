import { initiateSTKPush } from '../../../src/mpesa/stk.service.js';
import { json, methodNotAllowed, requireApiKey } from '../../../src/utils/http.js';
import { logError } from '../../../src/utils/logger.js';
import { getPool, sql } from '../../../src/db/sqlserver.js';

function normalizePhone(phoneNumber) {
  if (!phoneNumber) return null;

  let phone = String(phoneNumber).trim();

  // Remove +, spaces, -, brackets, etc.
  phone = phone.replace(/\D/g, '');

  // 0712345678 -> 254712345678
  if (phone.startsWith('0')) {
    phone = '254' + phone.substring(1);
  }

  // 712345678 -> 254712345678
  if (phone.startsWith('7') && phone.length === 9) {
    phone = '254' + phone;
  }

  return phone;
}

function isValidPhone(phone) {
  return /^2547\d{8}$/.test(phone);
}

async function createPaymentRequest({
  amount,
  phoneNumber,
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

  // Keep your existing protection
  if (methodNotAllowed(req, res) || !requireApiKey(req, res)) {
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

    // Validate amount//

    const paymentAmount = Number(amount);

    if (
      !Number.isFinite(paymentAmount) ||
      paymentAmount <= 0
    ) {
      return json(res, 400, {
        success: false,
        error: 'Amount must be greater than zero'
      });
    }

    if (!Number.isInteger(paymentAmount)) {
      return json(res, 400, {
        success: false,
        error: 'Amount must be a whole number'
      });
    }

    // Normalize phone//

    const normalizedPhone =
      normalizePhone(phoneNumber);

    if (!normalizedPhone) {
      return json(res, 400, {
        success: false,
        error: 'Phone number is required'
      });
    }

    // Validate//

    if (!isValidPhone(normalizedPhone)) {
      return json(res, 400, {
        success: false,
        error:
          'Invalid Kenyan phone number. Use a valid 07XXXXXXXX or 2547XXXXXXXX number.'
      });
    }

   // Defaults//

    const paymentInitiator =
      initiator || 'WEB_USER';

    const reference =
      accountReference || 'PAYMENT';

    const description =
      transactionDesc || 'Customer Payment';

    // Save request as PENDING// 
  
const paymentId =
      await createPaymentRequest({
        amount: paymentAmount,
        phoneNumber: normalizedPhone,
        initiator: paymentInitiator,
        accountReference: reference,
        transactionDesc: description
      });

    // stk //
 const data = await initiateSTKPush({
      amount: paymentAmount,
      phoneNumber: normalizedPhone,
      accountReference: reference,
      transactionDesc: description
    });

    // Save M-Pesa request//

    await updatePaymentRequest({
      id: paymentId,

      merchantRequestID:
        data?.MerchantRequestID || null,

      checkoutRequestID:
        data?.CheckoutRequestID || null,

      resultCode:
        data?.ResponseCode != null
          ? Number(data.ResponseCode)
          : null,

      resultDescription:
        data?.ResponseDescription ||
        null
    });

    //response to frontend//
    
    return json(res, 200, {

      success: true,

      paymentId,

      phoneNumber: normalizedPhone,

      amount: paymentAmount,

      data

    });

  } catch (e) {

    logError('STK_PUSH', e);

    return json(res, 500, {
      success: false,

      error:
        e.response?.data ||
        e.message
    });
  }
}
