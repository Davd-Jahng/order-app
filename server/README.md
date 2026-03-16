# COZY — 백엔드 (Express.js)

Node.js + Express + PostgreSQL 기반 API 서버입니다.

## 요구사항

- Node.js 18+
- PostgreSQL 14+ (로컬 또는 원격 설치)

## PostgreSQL 설정

1. **환경 변수**: `server/.env` 에서 PostgreSQL 비밀번호를 설정하세요.
   - `PGPASSWORD=` 에 PostgreSQL 설치 시 설정한 **postgres** 사용자 비밀번호를 넣습니다.
   - 비밀번호가 없다면 빈 값 `PGPASSWORD=` 또는 주석 처리 후, 로컬에서 trust 인증이면 연결될 수 있습니다.
2. **DB 및 테이블 생성** (최초 1회):
   ```bash
   cd server
   npm run db:init
   ```
   - `cozy` 데이터베이스가 없으면 만들고, `menus`, `options`, `orders`, `order_items` 테이블을 생성합니다.

## 설치 및 실행

```bash
# 의존성 설치 (최초 1회)
npm install

# DB·테이블 생성 (최초 1회, .env 에 PGPASSWORD 설정 후)
npm run db:init

# 개발 서버 (파일 변경 시 자동 재시작)
npm run dev

# 프로덕션 실행
npm start
```

기본 포트: **3000** (`PORT` 환경 변수로 변경 가능)

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run db:init` | DB `cozy` 및 테이블 생성 (최초 1회) |
| `npm run dev` | 개발 서버 (--watch) |
| `npm start` | 서버 실행 |

## API

- `GET /api/health` — 서버 상태 + DB 연결 여부 (`database: "connected"` / `"disconnected"`)
- `GET /api/menus` — 메뉴 목록
- `POST /api/orders` — 주문 저장
- `PATCH /api/orders/:id` — 주문 상태 변경(재고 차감)
