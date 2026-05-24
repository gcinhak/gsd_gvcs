# gsd-gvcs-territory

점령전(Territory) 전용 Cloudflare Worker.

popcat 워커(`../cloudflare/`)와 D1 데이터베이스(`gsd_popcat`)를 공유하지만 `territory_state` 테이블만 사용합니다.

## 배포

```bash
cd cloudflare-territory
CLOUDFLARE_ACCOUNT_ID=26d103b4b1d8be53b4a1ec8a3d340e25 npx wrangler deploy
```

배포 URL: `https://gsd-gvcs-territory.gcinhak.workers.dev`

## API

- `GET  /api/territory` → `{ campuses, total, empty }`
- `POST /api/territory/claim` body `{ team }` → 빈 땅 차지 또는 강탈 자동

## 스키마

`territory_state` 테이블은 popcat 워커 쪽 `cloudflare/schema.sql` 에 정의되어 있습니다.
