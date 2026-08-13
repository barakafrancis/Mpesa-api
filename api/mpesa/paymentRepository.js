import { getPool, sql } from "./sqlserver.js";

export async function createPaymentRequest({
    phoneNumber,
    amount,
    initiator,
    accountReference,
    transactionDesc
}) {
    const pool = await getPool();

    const result = await pool
        .request()
        .input("PhoneNumber", sql.VarChar(20), phoneNumber)
        .input("Amount", sql.Decimal(18, 2), amount)
        .input("Initiator", sql.VarChar(150), initiator)
        .input("AccountReference", sql.VarChar(100), accountReference)
        .input("TransactionDescription", sql.VarChar(255), transactionDesc)
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


export async function updatePaymentRequest({
    checkoutRequestID,
    merchantRequestID,
    resultCode,
    resultDescription,
    mpesaReceiptNumber
}) {
    const pool = await getPool();

    const status = Number(resultCode) === 0
        ? "SUCCESS"
        : "FAILED";

    await pool
        .request()
        .input(
            "CheckoutRequestID",
            sql.VarChar(100),
            checkoutRequestID
        )
        .input(
            "MerchantRequestID",
            sql.VarChar(100),
            merchantRequestID
        )
        .input(
            "ResultCode",
            sql.Int,
            resultCode
        )
        .input(
            "ResultDescription",
            sql.VarChar(500),
            resultDescription
        )
        .input(
            "MpesaReceiptNumber",
            sql.VarChar(100),
            mpesaReceiptNumber
        )
        .input(
            "PaymentStatus",
            sql.VarChar(30),
            status
        )
        .query(`
            UPDATE dbo.MpesaPaymentRequests
            SET
                MerchantRequestID = COALESCE(
                    @MerchantRequestID,
                    MerchantRequestID
                ),
                ResultCode = @ResultCode,
                ResultDescription = @ResultDescription,
                MpesaReceiptNumber = @MpesaReceiptNumber,
                PaymentStatus = @PaymentStatus,
                CompletedAt = GETDATE()
            WHERE CheckoutRequestID = @CheckoutRequestID;
        `);
}


export async function updateCheckoutRequest({
    id,
    merchantRequestID,
    checkoutRequestID
}) {
    const pool = await getPool();

    await pool
        .request()
        .input("Id", sql.BigInt, id)
        .input(
            "MerchantRequestID",
            sql.VarChar(100),
            merchantRequestID
        )
        .input(
            "CheckoutRequestID",
            sql.VarChar(100),
            checkoutRequestID
        )
        .query(`
            UPDATE dbo.MpesaPaymentRequests
            SET
                MerchantRequestID = @MerchantRequestID,
                CheckoutRequestID = @CheckoutRequestID
            WHERE Id = @Id;
        `);
}
