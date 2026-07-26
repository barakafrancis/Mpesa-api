export default function handler(req, res) {
  console.log('B2C TIMEOUT', JSON.stringify(req.body));
  res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
}
