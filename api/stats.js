// 통계 조회: 집계 결과만 돌려줍니다(개별 기록 없음).
const { rpc, cors } = require('./_db');

module.exports = async (req, res) => {
  if (cors(req, res)) return;
  const days = Math.min(365, Math.max(1, parseInt(req.query.days, 10) || 30));
  try {
    const data = await rpc('mh_stats', { p_days: days });
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
};
