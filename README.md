# Ediworks SBT Admin Frontend

Ediworks SBT 컨트롤 플레인 관리자 페이지입니다. **로컬 개발 환경에서 외부 서비스 없이 실행 가능**합니다.

## 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Icons**: Heroicons
- **Authentication**: Local Mock Authentication (개발용)
- **Data**: Mock Data with LocalStorage Persistence

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3002 에서 애플리케이션에 접근할 수 있습니다.

### 3. 로그인

로컬 환경에서는 외부 인증 서비스 없이 즉시 로그인할 수 있습니다:

- **관리자로 로그인**: 모든 기능 사용 가능
- **검토자로 로그인**: 읽기 전용 권한

## 주요 기능

### 🔐 인증
- 로컬 개발용 Mock 인증 시스템
- PLATFORM_ADMIN/REVIEWER 권한 구분
- LocalStorage 기반 세션 관리

### 📊 대시보드
- 테넌트 통계 (총/활성/프로비저닝/일시중지)
- 최근 테넌트 목록
- 실시간 상태 표시

### 🏢 테넌트 관리
- ✅ 테넌트 목록 (검색/필터링)
- ✅ 새 테넌트 생성 (Mock 데이터로 동작)
- ✅ Mock 데이터 영속성 (LocalStorage)
- 📝 테넌트 상세 정보 (구조만 완성)

### 📋 Mock 데이터
- 샘플 테넌트, 사용자, 플랜 데이터
- LocalStorage를 통한 상태 유지
- 실제 API와 동일한 인터페이스

## 로컬 개발 특징

### ✅ 외부 의존성 없음
- AWS Cognito 불필요
- 백엔드 API 서버 불필요
- 모든 데이터는 Mock으로 처리

### 📁 데이터 영속성
- 생성/수정/삭제된 테넌트는 LocalStorage에 저장
- 브라우저 재시작 후에도 데이터 유지
- 개발 중 데이터 손실 없음

### 🎯 실제와 동일한 UX
- API 지연 시뮬레이션
- 로딩 상태 표시
- 에러 처리

## 빌드

```bash
npm run build
```

## 타입 체크

```bash
npm run type-check
```

## 린트

```bash
npm run lint
```

## 디렉토리 구조

```
src/
├── app/                    # Next.js App Router 페이지
│   ├── page.tsx           # 대시보드
│   ├── login/             # 로그인 페이지  
│   ├── tenants/           # 테넌트 관리 페이지
│   └── layout.tsx         # 루트 레이아웃
├── components/            # 재사용 가능한 UI 컴포넌트
├── lib/                   # 유틸리티 및 서비스
│   ├── auth.ts           # 로컬 인증 관리
│   ├── api.ts            # Mock API 클라이언트
│   └── mockData.ts       # 샘플 데이터
└── types/                 # TypeScript 타입 정의
```

## 실제 배포를 위한 다음 단계

1. **AWS Cognito 연동**: `src/lib/auth.ts`에서 실제 JWT 처리
2. **API 클라이언트 연동**: `src/lib/api.ts`에서 실제 백엔드 호출
3. **환경변수 설정**: Cognito 및 API 엔드포인트 설정
4. **에러 처리 강화**: 실제 API 에러 대응

현재는 **완전한 로컬 개발 환경**으로 외부 서비스 없이 모든 기능을 테스트할 수 있습니다!