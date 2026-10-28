# minaryhub-star
MinaryHub 사이트(kimserv.com)용 Vercel 함수

| 경로 | 하는 일 |
|---|---|
| `/api/login`, `/api/callback` | GitHub 별 주기용 로그인 |
| `/api/track`, `/api/stats` | 방문·다운로드 통계 (Supabase) |
| `/api/contact` | 사이트 하단 '문의하기' 메일 보내기 (Brevo) |

## 문의하기 설정 (Vercel → Settings → Environment Variables)

| 변수 | 값 |
|---|---|
| `BREVO_API_KEY` | Brevo → SMTP & API → API keys 에서 만든 키 |
| `CONTACT_TO` | 문의를 받을 메일 주소 (공개되지 않음) |
| `CONTACT_FROM` | Brevo에서 인증한 보내는 주소 (Senders, Domains & Dedicated IPs) |
| `CONTACT_FROM_NAME` | 보내는 이름 (선택, 기본 `Kimserv`) |

- 방문자 메일은 Reply-To로 들어가므로 받은 메일에서 바로 답장하면 됩니다.
- 사이트 주소(`SITE_ORIGINS`)에서 온 요청만 받습니다. 숨은 칸·최소 작성 시간·IP당 10분 3회 제한으로 간단한 스팸을 막습니다.
- 설정이 빠져 있으면 503 `not_configured`를 돌려주고 메일을 보내지 않습니다.
