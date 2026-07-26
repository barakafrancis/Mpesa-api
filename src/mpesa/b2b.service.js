import crypto from 'node:crypto';
import { mpesaRequest } from './client.js';

export function initiateB2B({ amount, partyB, accountReference, remarks = 'Business payment', commandId = 'BusinessPayBill', senderIdentifierType = '4', receiverIdentifierType = '4' }) {
  return mpesaRequest('POST', '/mpesa/b2b/v1/paymentrequest', {
    Initiator: process.env.MPESA_INITIATOR_NAME,
    SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
    CommandID: commandId,
    SenderIdentifierType: senderIdentifierType,
    RecieverIdentifierType: receiverIdentifierType,
    Amount: amount,
    PartyA: process.env.MPESA_SHORTCODE,
    PartyB: partyB,
    AccountReference: accountReference,
    Remarks: remarks,
    QueueTimeOutURL: process.env.MPESA_B2B_TIMEOUT_URL,
    ResultURL: process.env.MPESA_B2B_RESULT_URL,
    OriginatorConversationID: crypto.randomUUID()
  });
}
