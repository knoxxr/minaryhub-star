// 사이트 하단 '문의하기' 메일 보내기 (Brevo 트랜잭션 메일 API).
// 받는 주소·API 키는 Vercel 환경 변수에만 두고 응답에도 싣지 않습니다.
//   BREVO_API_KEY   Brevo → SMTP & API → API keys
//   CONTACT_TO      문의를 받을 메일 주소 (공개되지 않음)
//   CONTACT_FROM    Brevo에서 인증한 보내는 주소 (Senders, Domains)
//   CONTACT_FROM_NAME  보내는 이름 (선택, 기본 "Kimserv")
// 방문자 주소는 Reply-To로 넣어, 받은 메일에서 바로 답장하면 방문자에게 갑니다.
const { cors, SITES } = require('./_db');

const MAX = { name: 100, email: 200, app: 100, message: 5000 };
const EMAIL = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]{2,}$/;
// 스팸 막기: 같은 IP는 10분에 3번까지 (인스턴스 메모리 기준이라 느슨한 제한), 폼을 연 지 3초 안에 보내면 무시
const hits = new Map();
const limited = (ip) => {
  const now = Date.now(), list = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  if (list.length >= 3) return true;
  list.push(now); hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return false;
};
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const oneLine = (s) => String(s).replace(/[\r\n]+/g, ' ').trim();

module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).end();
  const origin = req.headers.origin || '';
  if (!SITES.includes(origin) && !/^http:\/\/localhost(:\d+)?$/.test(origin)) return res.status(403).json({ error: 'origin' });

  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
  b = b || {};
  // 사람에게는 보이지 않는 칸(website)을 채웠거나 너무 빨리 보내면 봇으로 보고, 보낸 척만 한다
  if (b.website || (Number(b.openedMs) >= 0 && Number(b.openedMs) < 3000)) return res.status(200).json({ ok: true });

  const name = oneLine(b.name || '').slice(0, MAX.name);
  const email = oneLine(b.email || '').slice(0, MAX.email);
  const app = oneLine(b.app || '').slice(0, MAX.app);
  const message = String(b.message || '').trim().slice(0, MAX.message);
  const page = /^https?:\/\//.test(b.page || '') ? String(b.page).slice(0, 300) : '';
  if (!EMAIL.test(email) || !message) return res.status(400).json({ error: 'invalid' });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (limited(ip)) return res.status(429).json({ error: 'rate' });

  const { BREVO_API_KEY, CONTACT_TO, CONTACT_FROM, CONTACT_FROM_NAME } = process.env;
  if (!BREVO_API_KEY || !CONTACT_TO || !CONTACT_FROM) return res.status(503).json({ error: 'not_configured' });

  const country = String(req.headers['x-vercel-ip-country'] || '').slice(0, 2);
  const subject = `[Kimserv 문의] ${app || '일반'} — ${name || email}`;
  const meta = [`보낸 사람: ${name || '(이름 없음)'} <${email}>`, `앱: ${app || '일반'}`, page && `페이지: ${page}`, country && `국가: ${country}`, b.lang && `언어: ${oneLine(b.lang).slice(0, 5)}`].filter(Boolean);
  try {
    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        sender: { email: CONTACT_FROM, name: CONTACT_FROM_NAME || 'Kimserv' },
        to: [{ email: CONTACT_TO }],
        replyTo: { email, ...(name ? { name } : {}) },
        subject,
        textContent: `${meta.join('\n')}\n\n${message}`,
        htmlContent: `<p style="color:#666">${meta.map(esc).join('<br>')}</p><hr><p style="white-space:pre-wrap">${esc(message)}</p>`,
        tags: ['kimserv-contact'],
      }),
    });
    if (!r.ok) throw new Error(`brevo ${r.status}`);
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error('contact send failed:', e.message);   // 문의 내용·주소는 로그에 남기지 않음
    res.status(502).json({ error: 'send' });
  }
};
