# Popcat Cloudflare Worker

문경/음성/세종 3캠퍼스 실시간 응원 카운터의 백엔드.
Cloudflare Workers + D1(SQLite)로 동작합니다.

## 처음 한 번 — 배포 셋업

```bash
# 1) wrangler CLI 설치 (한 번만)
npm i -g wrangler
wrangler login

# 2) D1 데이터베이스 생성
wrangler d1 create gsd_popcat
# 출력된 database_id 를 복사해서 wrangler.toml 의
# `database_id = "REPLACE_WITH_D1_DATABASE_ID"` 자리에 붙여넣기

# 3) 스키마 적용 (원격)
wrangler d1 execute gsd_popcat --file=schema.sql --remote

# 4) 워커 배포
wrangler deploy
```

배포가 끝나면 `https://gsd-gvcs-popcat.<your-account>.workers.dev` 같은 URL이 출력됩니다.
이 URL을 프론트엔드 `.env.local` 의 `VITE_POPCAT_API_URL` 값으로 넣어주세요.

## 로컬 개발 (선택)

```bash
# 로컬 D1 (스키마 적용)
wrangler d1 execute gsd_popcat --file=schema.sql --local

# 로컬 워커 실행
wrangler dev
# → http://localhost:8787
```

프론트엔드 `.env.local`:
```
VITE_POPCAT_API_URL=http://localhost:8787
```

## API

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/api/popcat` | — | `{ "문경": 123, "음성": 90, "세종": 45 }` |
| POST | `/api/popcat/increment` | `{ "campus": "문경", "delta": 1 }` | `{ "campus": "문경", "count": 124 }` |

CORS는 `*` 로 열려 있어 어떤 도메인에서도 호출 가능합니다.
