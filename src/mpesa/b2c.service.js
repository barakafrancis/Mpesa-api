import crypto from 'node:crypto';
import { mpesaRequest } from './client.js';

export function initiateB2C({ amount, phoneNumber, commandId = 'BusinessPayment', remarks = 'Payment', occasion = '' }) {
  return mpesaRequest('POST', '/mpesa/b2c/v3/paymentrequest', {
    OriginatorConversationID: crypto.randomUUID(),
    InitiatorName: process.env.MPESA_INITIATOR_NAME,
    SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
    CommandID: commandId,
    Amount: amount,
    PartyA: process.env.MPESA_SHORTCODE,
    PartyB: phoneNumber,
    Remarks: remarks,
    QueueTimeOutURL: process.env.MPESA_B2C_TIMEOUT_URL,
    ResultURL: process.env.MPESA_B2C_RESULT_URL,
    Occasion: occasion
  });
}
