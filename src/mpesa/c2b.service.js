import { mpesaRequest } from './client.js';

export function registerC2BUrls() {
  return mpesaRequest('POST', '/mpesa/c2b/v2/registerurl', {
    ShortCode: process.env.MPESA_SHORTCODE,
    ResponseType: 'Completed',
    ConfirmationURL: process.env.MPESA_C2B_CONFIRMATION_URL,
    ValidationURL: process.env.MPESA_C2B_VALIDATION_URL
  });
}

export function simulateC2B({ amount, msisdn, billRefNumber }) {
  return mpesaRequest('POST', '/mpesa/c2b/v1/simulate', {
    ShortCode: process.env.MPESA_SHORTCODE,
    CommandID: 'CustomerPayBillOnline',
    Amount: amount,
    Msisdn: msisdn,
    BillRefNumber: billRefNumber
  });
}
