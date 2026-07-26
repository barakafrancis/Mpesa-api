export default function handler(req, res) {
  res.status(200).json({ success: true, service: 'mpesa-api', status: 'healthy', timestamp: new Date().toISOString() });
}
