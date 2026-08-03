import { getPool, sql } from './sqlserver.js';

export async function transactionExists(transId) {
  const pool = await getPool();

  const result = await pool.request()
    .input('TransID', sql.NVarChar(100), transId)
    .query(`
      SELECT TOP 1 id
      FROM dbo.mtransdetails
      WHERE TransID = @TransID;
    `);

  return result.recordset.length > 0;
}


export async function saveC2BTransaction(t) {
  if (!t.TransID) {
    throw new Error('TransID is required');
  }

  if (await transactionExists(t.TransID)) {
    return { duplicate: true };
  }

  const pool = await getPool();

  const result = await pool.request()
    .input('TransactionType', sql.NVarChar(100), t.TransactionType ?? 'C2B')
    .input('TransID', sql.NVarChar(100), t.TransID)
    .input('TransTime', sql.NVarChar(50), t.TransTime)
    .input('TransAmount', sql.NVarChar(50), t.TransAmount)
    .input('BusinessShortCode', sql.NVarChar(100), t.BusinessShortCode)
    .input('BillRefNumber', sql.NVarChar(50), t.BillRefNumber)
    .input('OrgAccountBalance', sql.NVarChar(100), t.OrgAccountBalance)
    .input('MSISDN', sql.NVarChar(100), t.MSISDN)
    .input('FirstName', sql.NVarChar(100), t.FirstName)
    .input('MiddleName', sql.NVarChar(100), t.MiddleName)
    .input('LastName', sql.NVarChar(100), t.LastName)
    .input('posted', sql.Bit, false)
    .input('tranpushed', sql.Bit, false)
    .input('paidtoaccount', sql.NVarChar(100), t.BillRefNumber)
    .input('syncid', sql.NVarChar(250), t.TransID)
    .query(`
      INSERT INTO dbo.mtransdetails
      (
        TransactionType,
        TransID,
        TransTime,
        TransAmount,
        BusinessShortCode,
        BillRefNumber,
        OrgAccountBalance,
        MSISDN,
        FirstName,
        MiddleName,
        LastName,
        posted,
        tranpushed,
        paidtoaccount,
        syncid,
        voided
      )
      OUTPUT INSERTED.id
      VALUES
      (
        @TransactionType,
        @TransID,
        @TransTime,
        @TransAmount,
        @BusinessShortCode,
        @BillRefNumber,
        @OrgAccountBalance,
        @MSISDN,
        @FirstName,
        @MiddleName,
        @LastName,
        @posted,
        @tranpushed,
        @paidtoaccount,
        @syncid,
        0
      );
    `);

  return {
    duplicate: false,
    id: result.recordset[0].id
  };
}


export async function saveSTKTransaction(transaction) {
  if (!transaction.mpesaReceiptNumber) {
    throw new Error('MpesaReceiptNumber is required');
  }

  // Prevent duplicate STK transactions
  if (await transactionExists(transaction.mpesaReceiptNumber)) {
    return { duplicate: true };
  }

  const pool = await getPool();

  const request = pool.request();

  request.input(
    'TransactionType',
    sql.NVarChar(100),
    'STK'
  );

  request.input(
    'TransID',
    sql.NVarChar(100),
    transaction.mpesaReceiptNumber
  );

  request.input(
    'TransTime',
    sql.NVarChar(50),
    transaction.transactionDate
      ? String(transaction.transactionDate)
      : null
  );

  request.input(
    'TransAmount',
    sql.NVarChar(50),
    transaction.amount !== undefined &&
    transaction.amount !== null
      ? String(transaction.amount)
      : null
  );

  request.input(
    'BusinessShortCode',
    sql.NVarChar(100),
    process.env.MPESA_SHORTCODE
  );

  request.input(
    'BillRefNumber',
    sql.NVarChar(50),
    null
  );

  request.input(
    'MSISDN',
    sql.NVarChar(100),
    transaction.phoneNumber
      ? String(transaction.phoneNumber)
      : null
  );

  request.input(
    'FirstName',
    sql.NVarChar(100),
    null
  );

  request.input(
    'MiddleName',
    sql.NVarChar(100),
    null
  );

  request.input(
    'LastName',
    sql.NVarChar(100),
    null
  );

  request.input(
    'posted',
    sql.Bit,
    false
  );

  request.input(
    'tranpushed',
    sql.Bit,
    true
  );

  request.input(
    'paidtoaccount',
    sql.NVarChar(100),
    null
  );

  request.input(
    'syncid',
    sql.NVarChar(250),
    transaction.checkoutRequestId
  );

  const result = await request.query(`
    INSERT INTO dbo.mtransdetails
    (
      TransactionType,
      TransID,
      TransTime,
      TransAmount,
      BusinessShortCode,
      BillRefNumber,
      MSISDN,
      FirstName,
      MiddleName,
      LastName,
      posted,
      tranpushed,
      paidtoaccount,
      syncid,
      voided
    )
    VALUES
    (
      @TransactionType,
      @TransID,
      @TransTime,
      @TransAmount,
      @BusinessShortCode,
      @BillRefNumber,
      @MSISDN,
      @FirstName,
      @MiddleName,
      @LastName,
      @posted,
      @tranpushed,
      @paidtoaccount,
      @syncid,
      0
    );

    SELECT SCOPE_IDENTITY() AS id;
  `);

  return {
    duplicate: false,
    id: result.recordset[0].id,
    transId: transaction.mpesaReceiptNumber
  };
}


/**
 * Update SMS response for an STK transaction
 */
export async function updateSTKSMSResponse({
  id,
  mobile,
  response
}) {
  const pool = await getPool();

  const smsResult = response?.responses?.[0];

  await pool.request()
    .input('id', sql.Int, id)

    .input(
      'sms_sent',
      sql.Bit,
      smsResult?.['respose-code'] === 200
    )

    .input(
      'sms_response_code',
      sql.NVarChar(50),
      smsResult?.['respose-code'] != null
        ? String(smsResult['respose-code'])
        : null
    )

    .input(
      'sms_response_description',
      sql.NVarChar(250),
      smsResult?.['response-description'] ?? null
    )

    .input(
      'sms_mobile',
      sql.NVarChar(50),
      smsResult?.mobile
        ? String(smsResult.mobile)
        : String(mobile)
    )

    .input(
      'sms_messageid',
      sql.NVarChar(100),
      smsResult?.messageid != null
        ? String(smsResult.messageid)
        : null
    )

    .input(
      'sms_networkid',
      sql.NVarChar(50),
      smsResult?.networkid != null
        ? String(smsResult.networkid)
        : null
    )

    .input(
      'sms_response',
      sql.NVarChar(sql.MAX),
      JSON.stringify(response)
    )

    .query(`
      UPDATE dbo.mtransdetails
      SET
        sms_sent = @sms_sent,
        sms_response_code = @sms_response_code,
        sms_response_description = @sms_response_description,
        sms_mobile = @sms_mobile,
        sms_messageid = @sms_messageid,
        sms_networkid = @sms_networkid,
        sms_response = @sms_response,
        sms_sent_at = GETDATE()
      WHERE id = @id;
    `);

  return {
    success: true,
    id
  };
}

