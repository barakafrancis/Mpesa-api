export default function handler(req, res) {
  console.log('B2B TIMEOUT', JSON.stringify(req.body));
  res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
}
