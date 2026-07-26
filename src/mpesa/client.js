import axios from 'axios';
import { mpesaBaseUrl, required } from '../config/env.js';

let tokenCache = { token: null, expiresAt: 0 };

export async function getAccessToken() {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt) return tokenCache.token;
  const key = required('MPESA_CONSUMER_KEY');
  const secret = required('MPESA_CONSUMER_SECRET');
  const auth = Buffer.from(`${key}:${secret}`).toString('base64');
  const response = await axios.get(`${mpesaBaseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` }, timeout: 15000
  });
  tokenCache = { token: response.data.access_token, expiresAt: Date.now() + 50 * 60 * 1000 };
  return tokenCache.token;
}

export async function mpesaRequest(method, path, data) {
  const token = await getAccessToken();
  const response = await axios({ method, url: `${mpesaBaseUrl}${path}`, data,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, timeout: 30000 });
  return response.data;
}
