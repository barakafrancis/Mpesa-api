import crypto from 'node:crypto';
import { mpesaRequest } from './client.js';
import { required } from '../config/env.js';

function getNairobiTimestamp() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Nairobi',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  }).formatToParts(new Date());

  const values = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${values.year}${values.month}${values.day}${values.hour}${values.minute}${values.second}`;
}

function normalizePhone(phoneNumber) {
  const value = String(phoneNumber ?? '').replace(/\s+/g, '');
  if (/^07\d{8}$/.test(value)) return `254${value.slice(1)}`;
  if (/^01\d{8}$/.test(value)) return `254${value.slice(1)}`;
  if (/^254\d{9}$/.test(value)) return value;
  throw new Error('phoneNumber must be in 2547XXXXXXXX, 07XXXXXXXX, 2541XXXXXXXX or 01XXXXXXXX format');
}

export async function initiateSTKPush({
  amount,
  phoneNumber,
  accountReference,
  transactionDesc = 'Payment'
}) {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error('amount must be a positive number');
  }

  const timestamp = getNairobiTimestamp();
  const shortcode = required('MPESA_SHORTCODE');
  const passkey = required('MPESA_PASSKEY');
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

  return await mpesaRequest('POST', '/mpesa/stkpush/v1/processrequest', {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: process.env.MPESA_STK_TRANSACTION_TYPE || 'CustomerPayBillOnline',
    Amount: Math.round(numericAmount),
    PartyA: normalizePhone(phoneNumber),
    PartyB: shortcode,
    PhoneNumber: normalizePhone(phoneNumber),
    CallBackURL: required('MPESA_STK_CALLBACK_URL'),
    AccountReference: String(accountReference || 'PAYMENT').slice(0, 12),
    TransactionDesc: String(transactionDesc).slice(0, 13)
  });
}

export function createStkReference() {
  return crypto.randomUUID();
}
