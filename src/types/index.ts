// Core Types based on CONTROL_PLANE_SPEC.md

export type TenantType = 'ORG' | 'INDIVIDUAL';
export type PlanId = 'trial' | 'starter' | 'pro' | 'enterprise';
export type IsolationModel = 'Pooled' | 'SiloInVpc' | 'SiloAccount';
export type TenantStatus = 'PROVISIONING' | 'READY' | 'SUSPENDED' | 'DELETING' | 'ERROR';
export type UserRole = 'TENANT_ADMIN' | 'MEMBER' | 'BILLING_ADMIN';
export type UserStatus = 'ACTIVE' | 'INVITED' | 'DISABLED';

export interface Entitlements {
  'dcv.maxSessions': number;
  'dcv.gpuClass': 'none' | 'g4dn.xlarge' | string;
  'session.maxDurationMin': number;
  'storage.gb': number;
  'egress.gbPerMonth': number;
  [k: string]: number | string;
}

export interface Contact {
  email: string;
  type: 'ADMIN' | 'BILLING';
}

export interface OrgProfile {
  legalEntity: string;
  seats: number;
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
  contacts: Contact[];
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
  orgProfile?: OrgProfile;
}

export interface User {
  userId: string;
  email: string;
  role: UserRole;
  status: UserStatus;
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

export interface Plan {
  planId: PlanId;
  displayName: string;
  defaults: {
    isolationModel: IsolationModel;
    entitlements: Entitlements;
  };
  billing: {
    model: string;
    base: number;
    currency: string;
  };
  featureFlags: string[];
}

export interface AuditLogEntry {
  timestamp: string;
  actor: string;
  action: string;
  before: any;
  after: any;
  requestId: string;
}

export interface ProvisioningTask {
  taskId: string;
  name: string;
  status: 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  attempt?: number;
  durationSec?: number;
  error?: string;
}

export interface LifecycleEvent {
  eventId: string;
  type: string;
  createdAt: string;
  payload?: any;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
    requestId?: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
}

// Auth Types
export interface AuthUser {
  sub: string;
  email?: string;
  platformRole: 'PLATFORM_ADMIN' | 'REVIEWER';
}

// Create/Update Types
export interface CreateTenantRequest {
  tenantType: TenantType;
  tenantName: string;
  plan: PlanId;
  isolationModel: IsolationModel;
  region: string;
  domain?: string;
  contact: { email: string };
  orgProfile?: OrgProfile;
  individualProfile?: any;
  labels?: Record<string, string>;
  tags?: Record<string, string>;
}

export interface UpdateEntitlementsRequest {
  plan?: PlanId;
  entitlements?: Partial<Entitlements>;
  targetIsolation?: IsolationModel;
}

export interface InviteUserRequest {
  email: string;
  role: UserRole;
  sendEmail: boolean;
}