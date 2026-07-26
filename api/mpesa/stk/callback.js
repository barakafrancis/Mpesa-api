export async function saveSTKTransaction(transaction) {
  const pool = await getPool();

  await pool.request()
    .input('TransactionType', sql.VarChar, 'STK Push')
    .input('TransID', sql.VarChar, transaction.mpesaReceiptNumber)
    .input('TransTime', sql.VarChar, transaction.transactionDate)
    .input('TransAmount', sql.Decimal(18, 2), transaction.amount)
    .input(
      'BusinessShortCode',
      sql.VarChar,
      process.env.MPESA_SHORTCODE
    )
    .input('BillRefNumber', sql.VarChar, null)
    .input('OrgAccountBalance', sql.Decimal(18, 2), null)
    .input('MSISDN', sql.VarChar, transaction.phoneNumber)
    .input('FirstName', sql.VarChar, null)
    .input('MiddleName', sql.VarChar, null)
    .input('LastName', sql.VarChar, null)
    .input('posted', sql.Bit, 0)
    .input('tranpushed', sql.Bit, 0)
    .input('paidtoaccount', sql.Bit, 0)
    .input('syncid', sql.VarChar, transaction.checkoutRequestId)
    .input('voided', sql.Bit, 0)
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
        @voided
      )
    `);
}
