# Vercel M-Pesa API — C2B, B2C and B2B

A modular Node.js serverless API designed for deployment on Vercel and storage of C2B transactions in SQL Server.

## Important database note

`BARAKA\\SQLEXPRESS` is a local SQL Server named instance. A Vercel function cannot normally connect directly to a SQL Server running only on your local computer. Use a publicly reachable SQL Server over a secure network/VPN/tunnel, or change the database layer to a managed MySQL/PostgreSQL provider.

## Install

```bash
npm install
cp .env.example .env
npm run dev
```

## Deploy

```bash
npm install -g vercel
vercel login
vercel
```

Set all variables from `.env.example` in Vercel Project Settings → Environment Variables, then deploy to production.

## Database

Run `database/001_mtransdetails.sql` against the `BARAKA` database. If the table already exists, keep your existing table and create the unique `TransID` index only after confirming there are no duplicate transaction IDs.

## Endpoints

### Public M-Pesa callbacks

- `POST /api/mpesa/c2b/callback`
- `POST /api/mpesa/c2b/validation`
- `POST /api/mpesa/b2c/result`
- `POST /api/mpesa/b2c/timeout`
- `POST /api/mpesa/b2b/result`
- `POST /api/mpesa/b2b/timeout`

### Protected application endpoints

Send:

```http
x-api-key: YOUR_API_KEY
```

- `POST /api/mpesa/c2b/register`
- `POST /api/mpesa/c2b/simulate`
- `POST /api/mpesa/b2c/payment`
- `POST /api/mpesa/b2b/payment`

## Example B2C body

```json
{
  "amount": 100,
  "phoneNumber": "2547XXXXXXXX",
  "remarks": "Loan disbursement",
  "occasion": "LOAN-0001"
}
```

## Example B2B body

```json
{
  "amount": 1000,
  "partyB": "600000",
  "accountReference": "INV-0001",
  "remarks": "Business payment"
}
```

## Example C2B simulation body

```json
{
  "amount": 100,
  "msisdn": "2547XXXXXXXX",
  "billRefNumber": "CUSTOMER-001"
}
```

## C2B posting flow

1. Safaricom calls `/api/mpesa/c2b/callback`.
2. The transaction is saved into `dbo.mtransdetails`.
3. `posted = 0` means your internal system has not posted it yet.
4. `tranpushed = 0` means it has not been pushed to the downstream system.
5. `voided = 0` means it is active.
6. The unique `TransID` protection prevents duplicate callbacks from creating duplicate transactions.

## Production recommendations

- Use HTTPS for all callback URLs.
- Never commit `.env`.
- Use a strong random `API_KEY`.
- Keep Safaricom callbacks public, but protect application-initiated payment endpoints with `x-api-key` or a stronger authentication mechanism.
- Use a managed/publicly reachable database rather than a local SQL Server instance.
- Add a separate transaction event/audit table as the system grows.
- For high-volume processing, add a queue/worker architecture rather than doing heavy posting inside the M-Pesa callback.
