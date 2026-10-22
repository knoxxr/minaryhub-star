// GitHub 로그인 시작: state를 쿠키에 저장하고 GitHub 인증 화면으로 이동
const crypto = require('crypto');

module.exports = (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) return res.status(500).send('GITHUB_CLIENT_ID not set');
  const state = crypto.randomBytes(16).toString('hex');
  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', `https://${req.headers.host}/api/callback`);
  url.searchParams.set('state', state);
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Set-Cookie', `mh_state=${state}; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  res.statusCode = 302;
  res.setHeader('Location', url.toString());
  res.end();
};
