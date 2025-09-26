Ediworks SBT Admin – Technical Spec (TypeScript)

목적: register.ediworks.com에서 들어온 신청을 승인 → 자동 프로비저닝 → 운영/가시화까지 처리하는 **SBT 어드민 페이지(컨트롤 플레인)**의 기술 정의서.
스택: TypeScript / Next.js(어드민 FE) / AWS API Gateway + Lambda + Step Functions + EventBridge + DynamoDB + Route53/ALB/ACM.
인증: Cognito Hosted UI (OAuth2 Code) + JWT Bearer. SSO, 웹훅, 도메인 소유 검증 토큰은 범위에서 제외.

0. 범위(Scope)

어드민 전용 SPA: 테넌트 목록/검색, 상세, 플랜·격리 변경, 일시중지/재개/삭제, 도메인 발급, 사용자/좌석 현황, 사용량/감사로그 가시화.

컨트롤 플레인 HTTP API: 멱등/상태머신 구동, 라이프사이클 이벤트 발행.

앱 플레인(Ediworks)과의 연계는 EventBridge 이벤트(TenantCreated, EntitlementChanged, TenantDeleted)를 통해 이루어짐.

1. 아키텍처 개요
flowchart LR
  subgraph AdminFE[Admin FE (Next.js)]
    UI[Admin UI Pages]
    SDK[Typed SDK (OpenAPI client)]
  end

  subgraph CP[Control Plane (API GW + Lambda + SFN)]
    API[HTTP API /api/v1/*]
    REG[TenantRegistry (DynamoDB)]
    STEP[Step Functions (Provisioning)]
    EVT[EventBridge Topics]
  end

  subgraph NET[Networking]
    R53[Route53/ACM]
    ALB[ALB Host Rules]
  end

  subgraph OBS[Observability]
    LOGS[CloudWatch Logs]
    USG[Usage Store (S3/Glue/Athena)]
    AUD[AuditLog (DynamoDB)]
  end

  UI-->SDK-->API
  API-->REG
  API-->STEP
  STEP-->EVT
  STEP-->R53
  STEP-->ALB
  API-->AUD
  API-->USG

2. 인증/권한

Authorization: Bearer <JWT> (Cognito)

필수 클레임:

platformRole ∈ {PLATFORM_ADMIN, REVIEWER} (어드민용)

선택 클레임: sub, email

인가 규칙:

GET 조회: PLATFORM_ADMIN 또는 REVIEWER

쓰기/상태 전이: PLATFORM_ADMIN만 허용

3. 공통 규약

Base URL: /api/v1

헤더:

X-Idempotency-Key (POST/PATCH/DELETE 권장, 24h 캐시)

X-Request-Id (옵션; 응답에 에코)

페이징: ?limit=50&cursor=<opaque> ↔ { items: [...], nextCursor: "..." }

에러 포맷

{ "error": { "code": "VALIDATION_FAILED", "message": "explanation", "details": {}, "requestId": "..." } }


상태 머신 전이

PROVISIONING -> READY -> SUSPENDED (resume 가능)
READY -> DELETING (종료) / ERROR (retry 가능)

4. API 인벤토리

제외: (옵션) 회사 도메인 소유 검증 토큰, Federation(SSO), Webhooks

4.1 Tenants (수명주기/운영)
4.1.1 생성

POST /tenants

요청

{
  "tenantType": "ORG|INDIVIDUAL",
  "tenantName": "acme",
  "plan": "trial|starter|pro|enterprise",
  "isolationModel": "Pooled|SiloInVpc|SiloAccount",
  "region": "ap-northeast-2",
  "contact": { "email": "admin@acme.com" },
  "orgProfile": { "legalEntity": "Acme Inc.", "seats": 25 },
  "individualProfile": null,
  "labels": { "priority": "gold" },
  "tags": { "industry": "media" }
}


응답 201

{ "tenantId": "t-acme-9f3a", "status": "PROVISIONING", "plan": "trial" }


내부: TenantRegistry upsert → SFN 시작 → EventBridge TenantCreated 발행 → 도메인/TG/ASG 등 태스크

4.1.2 목록/검색

GET /tenants?type=&plan=&status=&isolationModel=&region=&q=&tag=key:value&limit=&cursor=

응답 200

{
  "items": [
    {
      "tenantId":"t-acme-9f3a","tenantName":"acme","tenantType":"ORG",
      "plan":"pro","status":"READY","isolationModel":"SiloInVpc",
      "region":"ap-northeast-2","domain":"acme.ediworks.com","createdAt":"..."
    }
  ],
  "nextCursor": null
}

4.1.3 상세

GET /tenants/{tenantId}

응답 200 → Tenant 스키마 참조(§6)

4.1.4 메타데이터/라벨/노트

PATCH /tenants/{tenantId}

{ "tenantName":"acme-design","contacts":[{"email":"ops@acme.com"}], "tags":{"industry":"media"} }


PUT /tenants/{tenantId}/labels

{ "labels": { "priority":"gold", "accountExec":"mz-lee" } }


POST /tenants/{tenantId}/notes

{ "body": "GPU 한도 상향 요청 접수(9/25)" }


POST /tenants/{tenantId}/attachments/presign

{ "fileName":"security-checklist.pdf","contentType":"application/pdf" }


응답: { "uploadUrl":"https://s3...", "fields": {...} }

4.1.5 플랜/엔타이틀먼트/격리

POST /tenants/{tenantId}/entitlements/validate

{ "proposed": { "plan":"pro", "entitlements": { "dcv.maxSessions": 10 } } }


응답: 적용 가능 여부, 요구 인프라(전용 ASG 필요 등), 예상 영향 요약

PATCH /tenants/{tenantId}/entitlements

{
  "plan":"pro",
  "entitlements":{
    "dcv.maxSessions":10,"dcv.gpuClass":"g4dn.xlarge",
    "session.maxDurationMin":240,"storage.gb":500,"egress.gbPerMonth":200
  },
  "targetIsolation":"SiloInVpc"
}


응답 202 → { "tenantId":"...","status":"UPDATING" } (내부적으로 EntitlementChanged 발행)

4.1.6 상태 전이/관리

POST /tenants/{tenantId}/actions/suspend
요청: { "reason":"payment_overdue" }

POST /tenants/{tenantId}/actions/resume

POST /tenants/{tenantId}/actions/convert-type (개인→기업)

{ "tenantName":"acme", "orgProfile": { "legalEntity":"Acme Inc.", "seats": 10 } }


내부: TenantTypeChanged 이벤트

POST /tenants/{tenantId}/actions/retry-provisioning

{ "taskId": "tf-asg-02", "force": false }


DELETE /tenants/{tenantId}

{ "preserveDataDays": 30 }


내부: TenantDeleted 이벤트 → 앱 런북 실행

4.1.7 이벤트/태스크 가시성

GET /tenants/{tenantId}/events

{
  "items":[
    {"eventId":"e-1","type":"TenantCreated","createdAt":"..."},
    {"eventId":"e-2","type":"DomainIssued","createdAt":"..."}
  ]
}


GET /tenants/{tenantId}/provisioning-tasks

{
  "items":[
    {"taskId":"tf-domain-01","name":"IssueDomain","status":"SUCCEEDED","durationSec":38},
    {"taskId":"tf-asg-02","name":"CreateTenantASG","status":"RUNNING"}
  ]
}

4.2 Domain & Routing (기업 전용)

POST /tenants/{tenantId}/domain

{ "subdomain": "acme", "listener":"HTTPS-443","certificateArn": null }


응답:

{ "domain":"acme.ediworks.com","status":"ISSUED" }


GET /tenants/{tenantId}/domain

{
  "domain":"acme.ediworks.com",
  "albRuleId":"rule-xyz",
  "targetGroupArn":"arn:aws:elasticloadbalancing:...",
  "certificateArn":"arn:aws:acm:...",
  "status":"ISSUED"
}


POST /tenants/{tenantId}/domain/reissue (인증서 회전/재적용)

DELETE /tenants/{tenantId}/domain

GET /tenants/{tenantId}/domain/expected-records (외부 DNS 사용 시 안내용 레코드)

4.3 Users & Seats (Cognito 메타 연동)

GET /tenants/{tenantId}/users

{
  "items":[
    {"userId":"u-1","email":"admin@acme.com","role":"TENANT_ADMIN","status":"ACTIVE"},
    {"userId":"u-2","email":"designer@acme.com","role":"MEMBER","status":"INVITED"}
  ],
  "counts":{"active":12,"invited":3}
}


POST /tenants/{tenantId}/users/invite

{ "email":"new@acme.com","role":"MEMBER","sendEmail":true }


POST /tenants/{tenantId}/users/bulk-invite

{ "csvS3Url":"s3://ediworks-admin/invites/acme.csv","defaultRole":"MEMBER" }


PATCH /tenants/{tenantId}/users/{userId}

{ "role":"BILLING_ADMIN", "status":"DISABLED" }


DELETE /tenants/{tenantId}/users/{userId}

GET /tenants/{tenantId}/seats

{ "quota": 25, "used": 12, "pendingInvites": 3 }


PATCH /tenants/{tenantId}/seats

{ "quota": 30 }

4.4 Plans / Catalog

GET /plans

GET /plans/{planId}

{
  "planId":"pro",
  "displayName":"Pro",
  "defaults":{
    "isolationModel":"SiloInVpc",
    "entitlements":{
      "dcv.maxSessions":10,"dcv.gpuClass":"g4dn.xlarge",
      "session.maxDurationMin":240,"storage.gb":500,"egress.gbPerMonth":200
    }
  },
  "billing":{"model":"hybrid","base":300,"currency":"USD"},
  "featureFlags":["BYOK","DedicatedSubnet"]
}


(운영) POST/PUT /plans — 카탈로그 관리(내부)

4.5 Usage / Audit

GET /usage?tenantId=&range=1d|7d|30d

{
  "tenantId":"t-acme-9f3a","range":"7d",
  "metrics":{
    "dcv.sessions.active":3,"dcv.sessions.total":42,
    "compute.hours":57.3,"storage.gb":180,"egress.gb":28.4
  },
  "updatedAt":"2025-09-25T03:10:00Z"
}


GET /usage/series?tenantId=&metric=sessions|compute|storage|egress&from=&to=&step=

[{ "ts":"2025-09-25T03:00:00Z","value": 12 }, ...]


GET /audit?tenantId=&actor=&action=&from=&to=

{
  "items":[
    {
      "timestamp":"2025-09-25T03:11:22Z",
      "actor":"admin@ediworks.com","action":"PATCH_ENTITLEMENTS",
      "before":{"plan":"starter"},"after":{"plan":"pro"},"requestId":"..."
    }
  ]
}

5. 에러 코드
code	설명
VALIDATION_FAILED	필드/규칙 위반 (플랜별 불가 스펙 등)
UNSUPPORTED_ISOLATION	해당 플랜에서 허용되지 않는 격리모델
DUPLICATE_DOMAIN	서브도메인 충돌
NOT_FOUND	자원 없음
ACCESS_DENIED	권한 부족(platformRole)
STATE_CONFLICT	현재 상태에서 허용되지 않는 전이
PROVISIONING_FAILED	인프라 생성 실패(세부는 details)
RATE_LIMITED	호출 과다(429)
6. 핵심 스키마 (JSON) & TypeScript 타입
6.1 Tenant (JSON)
{
  "tenantId":"t-acme-9f3a",
  "tenantType":"ORG|INDIVIDUAL",
  "tenantName":"acme",
  "plan":"trial|starter|pro|enterprise",
  "isolationModel":"Pooled|SiloInVpc|SiloAccount",
  "region":"ap-northeast-2",
  "domain":"acme.ediworks.com",
  "entitlements":{
    "dcv.maxSessions":1,
    "dcv.gpuClass":"none",
    "session.maxDurationMin":60,
    "storage.gb":10,
    "egress.gbPerMonth":1
  },
  "labels":{"priority":"gold"},
  "tags":{"industry":"media"},
  "contacts":[{"email":"admin@acme.com","type":"ADMIN"}],
  "status":"PROVISIONING|READY|SUSPENDED|DELETING|ERROR",
  "createdAt":"...","updatedAt":"..."
}

6.2 TypeScript 타입 (공유 패키지 @ediworks/types)
export type TenantType = 'ORG' | 'INDIVIDUAL';
export type PlanId = 'trial' | 'starter' | 'pro' | 'enterprise';
export type IsolationModel = 'Pooled' | 'SiloInVpc' | 'SiloAccount';
export type TenantStatus = 'PROVISIONING' | 'READY' | 'SUSPENDED' | 'DELETING' | 'ERROR';

export interface Entitlements {
  'dcv.maxSessions': number;
  'dcv.gpuClass': 'none' | 'g4dn.xlarge' | string;
  'session.maxDurationMin': number;
  'storage.gb': number;
  'egress.gbPerMonth': number;
  [k: string]: number | string;
}

export interface Tenant {
  tenantId: string;
  tenantType: TenantType;
  tenantName: string;
  plan: PlanId;
  isolationModel: IsolationModel;
  region: string;
  domain?: string;
  entitlements: Entitlements;
  labels?: Record<string, string>;
  tags?: Record<string, string>;
  contacts: { email: string; type: 'ADMIN' | 'BILLING' }[];
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UsageSummary {
  tenantId: string;
  range: '1d' | '7d' | '30d';
  metrics: {
    'dcv.sessions.active': number;
    'dcv.sessions.total': number;
    'compute.hours': number;
    'storage.gb': number;
    'egress.gb': number;
  };
  updatedAt: string;
}

7. 데이터 모델 (DynamoDB)

TenantRegistry

PK: tenantId

GSI1: status (쿼리: 상태별)

GSI2: plan#isolationModel (복합 필터)

속성: §6 Tenant 전체 + labels, tags

LifecycleEvents

PK: tenantId, SK: ts#<ISO>#<uuid>

속성: type, payload

ProvisioningTasks

PK: tenantId, SK: taskId

속성: name, status, attempt, durationSec, error

AuditLog

PK: tenantId, SK: ts#<ISO>#<uuid>

속성: actor, action, before, after, requestId

SeatCounter

PK: tenantId → { quota, used, pendingInvites }

8. 인프라(CDK) 스택 개요

ControlPlaneApiStack

API Gateway (JWT Authorizer), Lambda(handlers), Cognito User Pool(Client for Admin), WAF(옵션)

ControlPlaneStateStack

DynamoDB(TenantRegistry, LifecycleEvents, ProvisioningTasks, AuditLog, SeatCounter)

ProvisioningFlowStack

Step Functions(상태머신), 역할/권한(IAM), EventBridge 버스/룰

RoutingStack

Route53, ACM(와일드카드), ALB Listener/Rules(테넌트 전용 TargetGroup 훅)

ObservabilityStack

CloudWatch Logs/Alarms, Usage ETL(S3/Firehose/Glue/Athena)

9. 어드민 FE (Next.js) – 주요 페이지 & API 매핑

/login (Hosted UI 리다이렉트)

/tenants (목록) → GET /tenants

/tenants/[id] (상세) → GET /tenants/:id, GET /.../events, GET /.../provisioning-tasks, GET /usage?tenantId=...

/tenants/[id]/edit → PATCH /tenants/:id, /labels, /notes

/tenants/[id]/domain → POST/GET/DELETE /tenants/:id/domain

/tenants/[id]/plan → POST /.../entitlements/validate, PATCH /.../entitlements

/tenants/[id]/users → GET /.../users, POST /.../users/invite, POST /.../users/bulk-invite, PATCH/DELETE

/tenants/[id]/seats → GET/PATCH /.../seats

/audit → GET /audit

10. 프로젝트 구조 (monorepo; pnpm 또는 npm workspaces)
ediworks-sbt-admin/
├─ apps/
│  ├─ admin/                    # Next.js (App Router)
│  │  ├─ app/
│  │  │  ├─ tenants/...
│  │  │  ├─ login/...
│  │  │  └─ layout.tsx
│  │  ├─ src/
│  │  │  ├─ components/         # UI 컴포넌트
│  │  │  ├─ hooks/
│  │  │  ├─ lib/auth.ts         # Cognito helpers
│  │  │  └─ lib/api.ts          # SDK 래퍼
│  │  ├─ env.mjs
│  │  └─ package.json
│  └─ docs/                     # 정적 문서(이 파일 포함)
├─ services/
│  └─ control-plane/
│     ├─ src/
│     │  ├─ handlers/           # APIGW Lambda Handlers
│     │  │  ├─ tenants.ts
│     │  │  ├─ domain.ts
│     │  │  ├─ users.ts
│     │  │  ├─ plans.ts
│     │  │  ├─ usage.ts
│     │  │  └─ audit.ts
│     │  ├─ core/               # 도메인 서비스/리포지토리
│     │  │  ├─ tenant.service.ts
│     │  │  ├─ provisioning.service.ts
│     │  │  ├─ usage.service.ts
│     │  │  └─ audit.service.ts
│     │  ├─ repos/
│     │  │  ├─ tenant.repo.ts   # DynamoDB access
│     │  │  ├─ events.repo.ts
│     │  │  └─ tasks.repo.ts
│     │  ├─ lib/
│     │  │  ├─ auth.ts          # JWT verify (Cognito JWK)
│     │  │  ├─ idempotency.ts
│     │  │  ├─ pagination.ts
│     │  │  └─ errors.ts
│     │  └─ types/              # 내부 타입
│     ├─ package.json
│     └─ tsconfig.json
├─ infra/
│  ├─ cdk/                      # CDK 앱 (ts)
│  │  ├─ stacks/*.ts
│  │  └─ bin/app.ts
│  └─ package.json
├─ packages/
│  ├─ types/                    # @ediworks/types (공유 타입)
│  ├─ sdk/                      # @ediworks/sdk (OpenAPI client)
│  ├─ logger/                   # @ediworks/logger (powertools 래퍼)
│  └─ config/                   # @ediworks/config (env schema zod)
├─ package.json
├─ turbo.json (or nx.json)
└─ pnpm-workspace.yaml


코딩 가이드

ESLint + Prettier + strict TS ("strict": true)

런타임 검증: zod (핸들러 입출력 스키마)

로깅: Powertools for AWS Lambda (TS)

11. 보안/가드레일

JWT 검증: API GW JWT Authorizer + 핸들러 레벨 클레임 재검증

멱등: X-Idempotency-Key + DynamoDB 키-락 테이블(24h TTL)

입력 검증: zod로 스키마 검증 및 의미적 검증(플랜별 허용 범위)

레이트리밋: API GW usage plan / WAF (어드민 콘솔 IP allowlist 옵션)

감사로그: 모든 쓰기 요청 AuditLog에 기록(before/after, actor, requestId)

12. 관찰성

로그: 요청/응답 요약(PII 제외), requestId, actor(email)

메트릭: 테넌트 생성 TAT, 실패율, 재시도율, 업그레이드 성공률

알람: PROVISIONING_FAILED 단일 테넌트 임계치, 5xx 상승, 도메인 발급 실패

13. 예시 호출
# テナント 생성
curl -X POST https://api.ediworks.com/api/v1/tenants \
 -H "Authorization: Bearer $JWT" \
 -H "Content-Type: application/json" \
 -H "X-Idempotency-Key: $(uuidgen)" \
 -d '{
   "tenantType":"ORG",
   "tenantName":"acme",
   "plan":"pro",
   "isolationModel":"SiloInVpc",
   "region":"ap-northeast-2",
   "contact":{"email":"admin@acme.com"},
   "orgProfile":{"legalEntity":"Acme Inc.","seats":25}
 }'

14. 테스트 전략

유닛: 핸들러/서비스 로직 (jest, ts-jest)

계약: zod 스키마 스냅샷 + OpenAPI 검증

통합: LocalStack (APIGW/Lambda/DDB/SFN/EVT)

E2E: Cypress(어드민 FE) + ephemeral 환경(CDK destroy 자동화)

15. 환경 변수 (@ediworks/config)
export interface Env {
  STAGE: 'dev' | 'stg' | 'prd';
  REGION: string; // ap-northeast-2
  COGNITO_USER_POOL_ID: string;
  COGNITO_APP_CLIENT_ID: string;
  COGNITO_ISSUER: string; // https://cognito-idp.<region>.amazonaws.com/<poolId>
  DDB_TENANT_TABLE: string;
  DDB_EVENTS_TABLE: string;
  DDB_TASKS_TABLE: string;
  DDB_AUDIT_TABLE: string;
  S3_UPLOAD_BUCKET: string;
  EVENT_BUS_NAME: string;
  ALB_ARN?: string;
  ACM_CERT_ARN?: string; // 와일드카드
}

16. OpenAPI 스니펫 (발췌)
openapi: 3.0.3
info: { title: Ediworks Control Plane API, version: 1.0.0 }
servers: [{ url: /api/v1 }]
components:
  securitySchemes:
    cognito: { type: http, scheme: bearer, bearerFormat: JWT }
security: [{ cognito: [] }]
paths:
  /tenants:
    post:
      operationId: createTenant
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateTenantRequest'
      responses:
        '201': { description: Created, content: { application/json: { schema: { $ref: '#/components/schemas/CreateTenantResponse' }}}}
    get:
      operationId: listTenants
      parameters:
        - { name: type, in: query, schema: { type: string, enum: [ORG, INDIVIDUAL] } }
        - { name: plan, in: query, schema: { type: string } }
        - { name: status, in: query, schema: { type: string } }
        - { name: limit, in: query, schema: { type: integer, default: 50 } }
        - { name: cursor, in: query, schema: { type: string } }
      responses:
        '200': { description: OK }
  /tenants/{tenantId}:
    get:
      parameters: [{ name: tenantId, in: path, required: true, schema: { type: string }}]
      responses: { '200': { description: OK } }
    patch:
      requestBody: { required: true, content: { application/json: { schema: { $ref: '#/components/schemas/UpdateTenantRequest' }}}}
      responses: { '200': { description: OK } }
  /tenants/{tenantId}/entitlements:
    patch:
      requestBody: { required: true, content: { application/json: { schema: { $ref: '#/components/schemas/UpdateEntitlementsRequest' }}}}
      responses: { '202': { description: Accepted } }
components:
  schemas:
    CreateTenantRequest:
      type: object
      required: [tenantType, tenantName, plan, isolationModel, contact]
      properties:
        tenantType: { type: string, enum: [ORG, INDIVIDUAL] }
        tenantName: { type: string }
        plan: { type: string, enum: [trial, starter, pro, enterprise] }
        isolationModel: { type: string, enum: [Pooled, SiloInVpc, SiloAccount] }
        region: { type: string }
        contact: { type: object, properties: { email: { type: string, format: email }}}
        orgProfile: { type: object, additionalProperties: true }
        individualProfile: { type: object, additionalProperties: true }
    CreateTenantResponse:
      type: object
      properties:
        tenantId: { type: string }
        status: { type: string }
        plan: { type: string }
    UpdateTenantRequest:
      type: object
      properties:
        tenantName: { type: string }
        contacts:
          type: array
          items: { type: object, properties: { email: { type: string, format: email }, type: { type: string }}}
        tags: { type: object, additionalProperties: { type: string } }
    UpdateEntitlementsRequest:
      type: object
      properties:
        plan: { type: string }
        entitlements: { type: object, additionalProperties: true }
        targetIsolation: { type: string, enum: [Pooled, SiloInVpc, SiloAccount] }

17. 롤아웃 순서 (MVP → 확장)

필수: POST /tenants, GET /tenants/:id, PATCH /.../entitlements, POST /.../domain, GET /usage, GET /audit

가시성: /tenants/:id/events, /.../provisioning-tasks, /notes, /attachments/presign

운영 편의: /entitlements/validate, actions/*, Users/Seats