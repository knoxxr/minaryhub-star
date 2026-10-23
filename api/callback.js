// GitHub 인증 완료: code를 사용자 토큰으로 바꾼 뒤 사이트(opener)에 postMessage로만 전달
// 결과는 허용된 사이트 주소로만 전달됩니다(목록에 없는 창은 받지 못함).
const { SITES } = require('./_db');
const post = (m) => `if(window.opener){${SITES.map((o) => `try{window.opener.postMessage(${JSON.stringify(m)},${JSON.stringify(o)})}catch(e){}`).join('')}}`;

const page = (script) => `<!doctype html><meta charset="utf-8"><title>MinaryHub</title>
<body style="font:15px system-ui;padding:24px">로그인 처리 중…<script>${script}</script></body>`;

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Set-Cookie', 'mh_state=; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
  const cookie = /(?:^|;\s*)mh_state=([^;]+)/.exec(req.headers.cookie || '')?.[1];
  const { code, state, error } = req.query;
  const fail = (msg) => res.status(400).send(page(
    `document.body.textContent=${JSON.stringify('로그인하지 못했습니다: ' + msg)};` +
    post({ type: 'mh-star-auth', error: msg }) + 'setTimeout(()=>window.close(),2500);'));

  if (error) return fail(String(error));
  if (!code || !state || state !== cookie) return fail('state mismatch');

  const r = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `https://${req.headers.host}/api/callback`,
    }),
  }).then((x) => x.json()).catch(() => ({}));
  if (!r.access_token) return fail(r.error || 'token exchange failed');

  const msg = { type: 'mh-star-auth', token: r.access_token,
    expiresAt: r.expires_in ? Date.now() + r.expires_in * 1000 : null };
  res.send(page(post(msg) + 'window.close();'));
};
