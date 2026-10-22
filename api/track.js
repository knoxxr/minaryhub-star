// 방문·다운로드 기록: 국가는 Vercel이 IP로 판별한 값(x-vercel-ip-country)만 쓰고 IP는 저장하지 않습니다.
const { rpc, cors } = require('./_db');

module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).end();
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
  b = b || {};
  const ua = req.headers['user-agent'] || '';
  if (/bot|crawl|spider|headless|preview|lighthouse/i.test(ua)) return res.status(204).end();
  const type = b.type === 'download' ? 'download' : 'visit';
  try {
    await rpc('mh_track', {
      p_type: type,
      p_app: type === 'download' ? String(b.app || '').slice(0, 100) : null,
      p_file: type === 'download' ? String(b.file || '').slice(0, 200) : null,
      p_country: String(req.headers['x-vercel-ip-country'] || '').slice(0, 2) || null,
      p_visitor: /^[\w-]{8,64}$/.test(b.vid || '') ? b.vid : null,
    });
    res.status(204).end();
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
};
