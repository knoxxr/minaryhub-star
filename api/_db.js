// MinaryHub 통계 저장소(Supabase). 공개용 publishable 키라 코드에 두어도 됩니다.
// 테이블은 직접 접근이 막혀 있고, mh_track / mh_stats 두 함수만 호출할 수 있습니다.
const URL_ = 'https://wdlqoibkniqjtmaxclua.supabase.co';
const KEY = process.env.SUPABASE_KEY || 'sb_publishable_gTyvcs77L4u4dPxa0XJ9hg_ukX5pqfF';
// 사이트 주소(GitHub Pages 기본 주소 + 사용자 도메인). SITE_ORIGINS 환경 변수(쉼표 구분)로 바꿀 수 있습니다.
const SITES = (process.env.SITE_ORIGINS || 'https://minaryhub.github.io,https://kimserv.com,https://www.kimserv.com').split(',').map((s) => s.trim());
exports.SITES = SITES;

exports.rpc = async (fn, args) => {
  const r = await fetch(`${URL_}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  if (!r.ok) throw new Error(`db ${r.status}`);
  const t = await r.text();
  return t ? JSON.parse(t) : null;
};

exports.cors = (req, res) => {
  const o = req.headers.origin;
  if (SITES.includes(o) || /^http:\/\/localhost(:\d+)?$/.test(o || '')) res.setHeader('Access-Control-Allow-Origin', o);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).end(); return true; }
  return false;
};
