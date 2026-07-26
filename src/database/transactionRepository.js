import { getPool, sql } from './sqlserver.js';

export async function transactionExists(transId) {
  const pool = await getPool();
  const result = await pool.request().input('TransID', sql.NVarChar(100), transId)
    .query('SELECT TOP 1 id FROM dbo.mtransdetails WHERE TransID = @TransID;');
  return result.recordset.length > 0;
}

export async function saveC2BTransaction(t) {
  if (!t.TransID) throw new Error('TransID is required');
  if (await transactionExists(t.TransID)) return { duplicate: true };
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
    .query(`INSERT INTO dbo.mtransdetails
      (TransactionType, TransID, TransTime, TransAmount, BusinessShortCode, BillRefNumber,
       OrgAccountBalance, MSISDN, FirstName, MiddleName, LastName, posted, tranpushed,
       paidtoaccount, syncid, voided)
      OUTPUT INSERTED.id
      VALUES (@TransactionType, @TransID, @TransTime, @TransAmount, @BusinessShortCode,
       @BillRefNumber, @OrgAccountBalance, @MSISDN, @FirstName, @MiddleName, @LastName,
       @posted, @tranpushed, @paidtoaccount, @syncid, 0);`);
  return { duplicate: false, id: result.recordset[0].id };
}

export async function saveSTKTransaction(transaction) {
  const pool = await getPool();

  const request = pool.request();

  request.input(
    "TransactionType",
    sql.NVarChar(100),
    transaction.TransactionType
  );

  request.input(
    "TransID",
    sql.NVarChar(100),
    transaction.TransID
  );

  request.input(
    "TransTime",
    sql.NVarChar(50),
    transaction.TransTime
  );

  request.input(
    "TransAmount",
    sql.NVarChar(50),
    transaction.TransAmount
  );

  request.input(
    "BusinessShortCode",
    sql.NVarChar(100),
    transaction.BusinessShortCode
  );

  request.input(
    "BillRefNumber",
    sql.NVarChar(50),
    transaction.BillRefNumber
  );

  request.input(
    "MSISDN",
    sql.NVarChar(100),
    transaction.MSISDN
  );

  request.input(
    "FirstName",
    sql.NVarChar(100),
    transaction.FirstName
  );

  request.input(
    "MiddleName",
    sql.NVarChar(100),
    transaction.MiddleName
  );

  request.input(
    "LastName",
    sql.NVarChar(100),
    transaction.LastName
  );

  request.input(
    "posted",
    sql.Bit,
    false
  );

  request.input(
    "tranpushed",
    sql.Bit,
    true
  );

  request.input(
    "paidtoaccount",
    sql.NVarChar(100),
    transaction.paidtoaccount
  );

  request.input(
    "syncid",
    sql.NVarChar(250),
    transaction.syncid
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

  return result.recordset[0];
}
