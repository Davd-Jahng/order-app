# COZY — 프론트엔드 (React + Vite)

React + 바닐라 JavaScript, Vite 기반 개발 환경입니다.

## 요구사항

- Node.js 18+
- npm

## 설치 및 실행

```bash
# 의존성 설치 (최초 1회)
npm install

# 개발 서버 실행 (HMR 지원)
npm run dev
```

개발 서버는 기본적으로 http://localhost:5173 에서 실행됩니다.

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 결과물 미리보기 |
| `npm run lint` | ESLint 실행 |

## 디렉터리 구조

```
UI/
├── public/          # 정적 파일
├── src/
│   ├── App.jsx      # 루트 컴포넌트
│   ├── main.jsx     # 엔트리
│   ├── index.css    # 전역 스타일
│   └── assets/      # 이미지 등 리소스
├── index.html
├── vite.config.js
└── package.json
```
