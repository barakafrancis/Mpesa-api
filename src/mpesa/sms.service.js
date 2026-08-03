import axios from 'axios';

const SMS_API_URL =
  process.env.SMS_API_URL ||
  'https://quicksms.advantasms.com/api/services/sendsms/';

export async function sendAcknowledgementSMS({
  mobile,
  message
}) {
  const payload = {
    apikey: process.env.SMS_API_KEY,
    partnerID: process.env.SMS_PARTNER_ID,
    message,
    shortcode: process.env.SMS_SHORTCODE,
    mobile: String(mobile)
  };

  console.log('[SMS_REQUEST]', {
    mobile,
    message
  });

  const response = await axios.post(
    SMS_API_URL,
    payload,
    {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 15000
    }
  );

  console.log('[SMS_RESPONSE]', response.data);

  return response.data;
}
