// Mock API client for local development (no backend required)
import { 
  Tenant, 
  User, 
  UsageSummary, 
  Plan, 
  AuditLogEntry, 
  ProvisioningTask, 
  LifecycleEvent,
  CreateTenantRequest,
  UpdateEntitlementsRequest,
  InviteUserRequest,
  ApiResponse,
  PaginatedResponse
} from '@/types';
import { 
  mockTenants, 
  mockUsers, 
  mockUsageSummary, 
  mockPlans, 
  mockAuditLog, 
  mockProvisioningTasks, 
  mockLifecycleEvents,
  delay 
} from './mockData';
import { apiLogger } from './logger';

class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  // Local storage for mock data persistence
  private getStoredTenants(): Tenant[] {
    if (typeof window === 'undefined') return mockTenants;
    const stored = localStorage.getItem('mock_tenants');
    // 저장된 데이터가 없거나 비어있으면 mockTenants 사용
    if (!stored || stored === '[]') {
      console.log('No stored tenants found, using mock data');
      this.setStoredTenants(mockTenants);
      return mockTenants;
    }
    return JSON.parse(stored);
  }

  private setStoredTenants(tenants: Tenant[]) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mock_tenants', JSON.stringify(tenants));
    }
  }

  // Simulate API delay for realistic experience with logging
  private async mockRequest<T>(
    method: string,
    endpoint: string,
    requestBody: any,
    data: T, 
    delayMs = 300
  ): Promise<T> {
    const startTime = performance.now();
    
    // Log the request
    const requestId = apiLogger.logMockApiCall(
      method,
      endpoint,
      requestBody,
      data,
      delayMs
    );
    
    await delay(delayMs);
    
    const endTime = performance.now();
    const actualResponseTime = Math.round(endTime - startTime);
    
    // Log the response
    if (requestId) {
      apiLogger.logResponse(requestId, data, actualResponseTime);
    }
    
    return data;
  }

  // Tenants
  async getTenants(params?: {
    type?: string;
    plan?: string;
    status?: string;
    isolationModel?: string;
    region?: string;
    q?: string;
    tag?: string;
    limit?: number;
    cursor?: string;
  }): Promise<PaginatedResponse<Tenant>> {
    let tenants = this.getStoredTenants();
    
    // Apply filters
    if (params) {
      if (params.type) {
        tenants = tenants.filter(t => t.tenantType === params.type);
      }
      if (params.plan) {
        tenants = tenants.filter(t => t.plan === params.plan);
      }
      if (params.status) {
        tenants = tenants.filter(t => t.status === params.status);
      }
      if (params.isolationModel) {
        tenants = tenants.filter(t => t.isolationModel === params.isolationModel);
      }
      if (params.region) {
        tenants = tenants.filter(t => t.region === params.region);
      }
      if (params.q) {
        const query = params.q.toLowerCase();
        tenants = tenants.filter(t => 
          t.tenantName.toLowerCase().includes(query) ||
          t.tenantId.toLowerCase().includes(query) ||
          t.contacts.some(c => c.email.toLowerCase().includes(query))
        );
      }
      
      // Apply limit
      if (params.limit && params.limit < tenants.length) {
        tenants = tenants.slice(0, params.limit);
      }
    }

    return this.mockRequest(
      'GET',
      '/tenants',
      { params },
      {
        items: tenants,
        nextCursor: undefined,
      }
    );
  }

  async getTenant(tenantId: string): Promise<Tenant> {
    const tenants = this.getStoredTenants();
    console.log('Looking for tenant with ID:', tenantId);
    console.log('Available tenants:', tenants.map(t => t.tenantId));
    const tenant = tenants.find(t => t.tenantId === tenantId);
    
    if (!tenant) {
      console.error('Tenant not found:', tenantId);
      throw new ApiError(404, 'NOT_FOUND', 'Tenant not found');
    }
    
    return this.mockRequest(
      'GET',
      `/tenants/${tenantId}`,
      null,
      tenant
    );
  }

  async createTenant(data: CreateTenantRequest): Promise<{ tenantId: string; status: string; plan: string }> {
    const newTenant: Tenant = {
      tenantId: `t-${data.tenantName}-${Math.random().toString(36).substr(2, 4)}`,
      tenantType: data.tenantType,
      tenantName: data.tenantName,
      plan: data.plan,
      isolationModel: data.isolationModel,
      region: data.region,
      domain: data.domain || (data.tenantType === 'ORG' ? `${data.tenantName}.ediworks.com` : undefined),
      entitlements: mockPlans.find(p => p.planId === data.plan)?.defaults.entitlements || mockPlans[0].defaults.entitlements,
      labels: data.labels || {},
      tags: data.tags || {},
      contacts: [{ ...data.contact, type: 'ADMIN' }],
      status: 'PROVISIONING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      orgProfile: data.orgProfile,
    };

    const tenants = this.getStoredTenants();
    tenants.unshift(newTenant);
    this.setStoredTenants(tenants);

    return this.mockRequest(
      'POST',
      '/tenants',
      data,
      {
        tenantId: newTenant.tenantId,
        status: newTenant.status,
        plan: newTenant.plan,
      },
      1000
    );
  }

  async updateTenant(tenantId: string, data: Partial<Tenant>): Promise<Tenant> {
    const tenants = this.getStoredTenants();
    const index = tenants.findIndex(t => t.tenantId === tenantId);
    
    if (index === -1) {
      throw new ApiError(404, 'NOT_FOUND', 'Tenant not found');
    }
    
    tenants[index] = { ...tenants[index], ...data, updatedAt: new Date().toISOString() };
    this.setStoredTenants(tenants);
    
    return this.mockRequest(
      'PATCH',
      `/tenants/${tenantId}`,
      data,
      tenants[index]
    );
  }

  async updateEntitlements(tenantId: string, data: UpdateEntitlementsRequest): Promise<{ tenantId: string; status: string }> {
    const tenants = this.getStoredTenants();
    const index = tenants.findIndex(t => t.tenantId === tenantId);
    
    if (index === -1) {
      throw new ApiError(404, 'NOT_FOUND', 'Tenant not found');
    }
    
    if (data.plan) tenants[index].plan = data.plan;
    if (data.entitlements) {
      Object.entries(data.entitlements).forEach(([key, value]) => {
        if (value !== undefined) {
          tenants[index].entitlements[key] = value;
        }
      });
    }
    if (data.targetIsolation) tenants[index].isolationModel = data.targetIsolation;
    
    tenants[index].updatedAt = new Date().toISOString();
    this.setStoredTenants(tenants);
    
    return this.mockRequest(
      'PATCH',
      `/tenants/${tenantId}/entitlements`,
      data,
      { tenantId, status: 'UPDATING' },
      500
    );
  }

  async suspendTenant(tenantId: string, reason: string): Promise<void> {
    const tenants = this.getStoredTenants();
    const index = tenants.findIndex(t => t.tenantId === tenantId);
    
    if (index === -1) {
      throw new ApiError(404, 'NOT_FOUND', 'Tenant not found');
    }
    
    tenants[index].status = 'SUSPENDED';
    tenants[index].updatedAt = new Date().toISOString();
    this.setStoredTenants(tenants);
    
    return this.mockRequest(
      'POST',
      `/tenants/${tenantId}/actions/suspend`,
      { reason },
      undefined
    );
  }

  async resumeTenant(tenantId: string): Promise<void> {
    const tenants = this.getStoredTenants();
    const index = tenants.findIndex(t => t.tenantId === tenantId);
    
    if (index === -1) {
      throw new ApiError(404, 'NOT_FOUND', 'Tenant not found');
    }
    
    tenants[index].status = 'READY';
    tenants[index].updatedAt = new Date().toISOString();
    this.setStoredTenants(tenants);
    
    return this.mockRequest(
      'POST',
      `/tenants/${tenantId}/actions/resume`,
      null,
      undefined
    );
  }

  async deleteTenant(tenantId: string, preserveDataDays: number = 30): Promise<void> {
    const tenants = this.getStoredTenants();
    const index = tenants.findIndex(t => t.tenantId === tenantId);
    
    if (index === -1) {
      throw new ApiError(404, 'NOT_FOUND', 'Tenant not found');
    }
    
    tenants.splice(index, 1);
    this.setStoredTenants(tenants);
    
    return this.mockRequest(
      'DELETE',
      `/tenants/${tenantId}`,
      { preserveDataDays },
      undefined,
      800
    );
  }

  // Domain Management (Mock)
  async createDomain(tenantId: string, subdomain: string): Promise<{ domain: string; status: string }> {
    const domain = `${subdomain}.ediworks.com`;
    return this.mockRequest(
      'POST',
      `/tenants/${tenantId}/domain`,
      { subdomain, listener: 'HTTPS-443' },
      { domain, status: 'ISSUED' }
    );
  }

  async getDomain(tenantId: string): Promise<{
    domain: string;
    albRuleId: string;
    targetGroupArn: string;
    certificateArn: string;
    status: string;
  }> {
    const tenant = await this.getTenant(tenantId);
    return this.mockRequest(
      'GET',
      `/tenants/${tenantId}/domain`,
      null,
      {
        domain: tenant.domain || `${tenant.tenantName}.ediworks.com`,
        albRuleId: 'rule-xyz',
        targetGroupArn: 'arn:aws:elasticloadbalancing:...',
        certificateArn: 'arn:aws:acm:...',
        status: 'ISSUED',
      }
    );
  }

  async deleteDomain(tenantId: string): Promise<void> {
    return this.mockRequest(
      'DELETE',
      `/tenants/${tenantId}/domain`,
      null,
      undefined
    );
  }

  // Users & Seats (Mock)
  async getAllUsers(params?: {
    status?: string;
    role?: string;
    tenantId?: string;
    q?: string;
    limit?: number;
    cursor?: string;
  }): Promise<PaginatedResponse<User & { tenantName: string }>> {
    const { mockUsersByTenant } = await import('./mockData');
    const tenants = this.getStoredTenants();
    
    // Collect all users from all tenants
    let allUsers: (User & { tenantName: string })[] = [];
    Object.entries(mockUsersByTenant).forEach(([tenantId, users]) => {
      const tenant = tenants.find(t => t.tenantId === tenantId);
      const tenantName = tenant?.tenantName || tenantId;
      
      users.forEach(user => {
        allUsers.push({
          ...user,
          tenantName,
          tenantId: tenantId
        } as any);
      });
    });

    // Apply filters
    if (params) {
      if (params.status) {
        allUsers = allUsers.filter(u => u.status === params.status);
      }
      if (params.role) {
        allUsers = allUsers.filter(u => u.role === params.role);
      }
      if (params.tenantId) {
        allUsers = allUsers.filter(u => (u as any).tenantId === params.tenantId);
      }
      if (params.q) {
        const query = params.q.toLowerCase();
        allUsers = allUsers.filter(u => 
          u.email?.toLowerCase().includes(query) ||
          (u as any).tenantName.toLowerCase().includes(query)
        );
      }
      if (params.limit && params.limit < allUsers.length) {
        allUsers = allUsers.slice(0, params.limit);
      }
    }

    return this.mockRequest(
      'GET',
      '/users',
      { params },
      {
        items: allUsers,
        nextCursor: undefined,
      }
    );
  }

  async getTenantUsers(tenantId: string): Promise<{
    items: User[];
    counts: { active: number; invited: number };
  }> {
    const { mockUsersByTenant } = await import('./mockData');
    const users = mockUsersByTenant[tenantId] || mockUsers;
    const active = users.filter(u => u.status === 'ACTIVE').length;
    const invited = users.filter(u => u.status === 'INVITED').length;
    
    return this.mockRequest(
      'GET',
      `/tenants/${tenantId}/users`,
      null,
      {
        items: users,
        counts: { active, invited },
      }
    );
  }

  async inviteUser(tenantId: string, data: InviteUserRequest): Promise<void> {
    return this.mockRequest(
      'POST',
      `/tenants/${tenantId}/users/invite`,
      data,
      undefined
    );
  }

  async updateUser(tenantId: string, userId: string, data: { role?: string; status?: string }): Promise<void> {
    return this.mockRequest(
      'PATCH',
      `/tenants/${tenantId}/users/${userId}`,
      data,
      undefined
    );
  }

  async deleteUser(tenantId: string, userId: string): Promise<void> {
    return this.mockRequest(
      'DELETE',
      `/tenants/${tenantId}/users/${userId}`,
      null,
      undefined
    );
  }

  async getSeats(tenantId: string): Promise<{ quota: number; used: number; pendingInvites: number }> {
    return this.mockRequest(
      'GET',
      `/tenants/${tenantId}/seats`,
      null,
      { quota: 25, used: 12, pendingInvites: 3 }
    );
  }

  async updateSeats(tenantId: string, quota: number): Promise<void> {
    return this.mockRequest(
      'PATCH',
      `/tenants/${tenantId}/seats`,
      { quota },
      undefined
    );
  }

  async getUserStats(): Promise<{
    total: number;
    active: number;
    invited: number;
    suspended: number;
    byTenant: { [tenantId: string]: { tenantName: string; count: number } };
    byRole: { [role: string]: number };
  }> {
    const { mockUsersByTenant } = await import('./mockData');
    const tenants = this.getStoredTenants();
    
    let total = 0;
    let active = 0;
    let invited = 0;
    let suspended = 0;
    const byTenant: { [tenantId: string]: { tenantName: string; count: number } } = {};
    const byRole: { [role: string]: number } = {};

    Object.entries(mockUsersByTenant).forEach(([tenantId, users]) => {
      const tenant = tenants.find(t => t.tenantId === tenantId);
      const tenantName = tenant?.tenantName || tenantId;
      
      byTenant[tenantId] = { tenantName, count: users.length };
      total += users.length;
      
      users.forEach(user => {
        switch (user.status) {
          case 'ACTIVE':
            active++;
            break;
          case 'INVITED':
            invited++;
            break;
          case 'DISABLED':
            suspended++;
            break;
        }
        
        const role = user.role || 'MEMBER';
        byRole[role] = (byRole[role] || 0) + 1;
      });
    });

    return this.mockRequest(
      'GET',
      '/users/stats',
      null,
      {
        total,
        active,
        invited,
        suspended,
        byTenant,
        byRole,
      }
    );
  }

  // Plans (Mock)
  async getPlans(): Promise<Plan[]> {
    return this.mockRequest(
      'GET',
      '/plans',
      null,
      mockPlans
    );
  }

  async getPlan(planId: string): Promise<Plan> {
    const plan = mockPlans.find(p => p.planId === planId);
    if (!plan) {
      throw new ApiError(404, 'NOT_FOUND', 'Plan not found');
    }
    return this.mockRequest(
      'GET',
      `/plans/${planId}`,
      null,
      plan
    );
  }

  // Usage & Audit (Mock)
  async getUsage(params?: {
    tenantId?: string;
    range?: '1d' | '7d' | '30d';
  }): Promise<UsageSummary> {
    const responseData = {
      ...mockUsageSummary,
      tenantId: params?.tenantId || mockUsageSummary.tenantId,
      range: params?.range || mockUsageSummary.range,
    };
    return this.mockRequest(
      'GET',
      '/usage',
      { params },
      responseData
    );
  }

  async getUsageSeries(params: {
    tenantId?: string;
    metric: 'sessions' | 'compute' | 'storage' | 'egress';
    from: string;
    to: string;
    step?: string;
  }): Promise<Array<{ ts: string; value: number }>> {
    // Generate mock time series data
    const series = [];
    const start = new Date(params.from);
    const end = new Date(params.to);
    const diff = end.getTime() - start.getTime();
    const steps = 24; // 24 data points
    
    for (let i = 0; i < steps; i++) {
      const ts = new Date(start.getTime() + (diff / steps) * i);
      series.push({
        ts: ts.toISOString(),
        value: Math.floor(Math.random() * 100),
      });
    }
    
    return this.mockRequest(
      'GET',
      '/usage/series',
      params,
      series
    );
  }

  // New Analytics API endpoints
  async getUsageAnalytics(): Promise<{
    totalSessions: number;
    totalCompute: number;
    totalStorage: number;
    totalEgress: number;
    totalTenants: number;
  }> {
    // Calculate totals from all tenants
    const tenants = this.getStoredTenants();
    const totals = {
      totalSessions: tenants.length * (Math.floor(Math.random() * 50) + 20),
      totalCompute: tenants.length * (Math.floor(Math.random() * 100) + 50),
      totalStorage: tenants.length * (Math.floor(Math.random() * 200) + 100),
      totalEgress: tenants.length * (Math.floor(Math.random() * 80) + 30),
      totalTenants: tenants.length,
    };

    return this.mockRequest(
      'GET',
      '/usage/analytics',
      null,
      totals
    );
  }

  async getTenantUsageAnalytics(tenantId: string): Promise<{
    tenantId: string;
    period: 'week' | 'month';
    dateRange: {
      from: string;
      to: string;
    };
    metrics: {
      compute: Array<{ date: string; value: number; timestamp: string }>;
      storage: Array<{ date: string; value: number; timestamp: string }>;
      egress: Array<{ date: string; value: number; timestamp: string }>;
    };
    summary: {
      totalCompute: number;
      totalStorage: number;
      totalEgress: number;
      avgCompute: number;
      avgStorage: number;
      avgEgress: number;
      peakCompute: number;
      peakComputeDate: string;
    };
  }> {
    // Only allow acme tenant for detailed analytics
    if (tenantId !== 'acme') {
      throw new ApiError(403, 'FORBIDDEN', 'Access denied for tenant analytics');
    }

    // Generate specific data for 2025.09.20 ~ 2025.09.26 period (7 days)
    const computeData = [];
    const storageData = [];
    const egressData = [];

    // Base computing hours per day for acme tenant
    const baseCompute = 145; // Higher baseline for business tenant
    
    // Specific dates for the period
    const specificDates = [
      { date: new Date('2025-09-20'), day: '토', dayOfWeek: 6, isWeekend: true },  // Saturday
      { date: new Date('2025-09-21'), day: '일', dayOfWeek: 0, isWeekend: true },  // Sunday
      { date: new Date('2025-09-22'), day: '월', dayOfWeek: 1, isWeekend: false }, // Monday
      { date: new Date('2025-09-23'), day: '화', dayOfWeek: 2, isWeekend: false }, // Tuesday
      { date: new Date('2025-09-24'), day: '수', dayOfWeek: 3, isWeekend: false }, // Wednesday
      { date: new Date('2025-09-25'), day: '목', dayOfWeek: 4, isWeekend: false }, // Thursday
      { date: new Date('2025-09-26'), day: '금', dayOfWeek: 5, isWeekend: false }, // Friday
    ];

    let peakCompute = 0;
    let peakComputeDate = '';

    specificDates.forEach((dateInfo, index) => {
      const { date, isWeekend, dayOfWeek } = dateInfo;
      
      // Create realistic computing patterns based on day type
      let computeMultiplier;
      
      if (isWeekend) {
        // Weekend: Lower usage, maintenance windows
        computeMultiplier = 0.35 + Math.random() * 0.25; // 35-60% of normal
      } else {
        // Business days: Higher usage with different patterns
        switch (dayOfWeek) {
          case 1: // Monday - Catching up after weekend
            computeMultiplier = 1.25 + Math.sin(index * 0.3) * 0.15;
            break;
          case 2: // Tuesday - Peak usage day
            computeMultiplier = 1.45 + Math.sin(index * 0.2) * 0.25;
            break;
          case 3: // Wednesday - High sustained usage
            computeMultiplier = 1.35 + Math.sin(index * 0.25) * 0.2;
            break;
          case 4: // Thursday - Steady usage
            computeMultiplier = 1.15 + Math.sin(index * 0.2) * 0.15;
            break;
          case 5: // Friday - Slight decline, end of week
            computeMultiplier = 1.05 + Math.sin(index * 0.15) * 0.1;
            break;
          default:
            computeMultiplier = 1.0;
        }
        
        // Add occasional spikes for heavy workloads (batch processing, reports, etc.)
        if (dayOfWeek === 2 || dayOfWeek === 3) { // Tuesday/Wednesday peaks
          computeMultiplier *= 1.15;
        }
      }
      
      // Calculate actual values with some randomness
      const compute = Math.round(baseCompute * computeMultiplier + (Math.random() * 30 - 15));
      const finalCompute = Math.max(20, compute); // Ensure minimum value
      
      // Track peak usage
      if (finalCompute > peakCompute) {
        peakCompute = finalCompute;
        peakComputeDate = date.toLocaleDateString('ko-KR');
      }
      
      // Storage and egress are less variable but still realistic
      const storage = Math.floor(Math.random() * 80) + 420; // 420-500 GB range
      const egress = Math.floor(Math.random() * 35) + 25;   // 25-60 GB range

      const formattedDate = `${date.getMonth() + 1}월 ${date.getDate()}일`;
      const timestamp = date.toISOString();

      computeData.push({
        date: formattedDate,
        value: finalCompute,
        timestamp
      });
      storageData.push({
        date: formattedDate,
        value: storage,
        timestamp
      });
      egressData.push({
        date: formattedDate,
        value: egress,
        timestamp
      });
    });

    const totalCompute = computeData.reduce((sum, d) => sum + d.value, 0);
    const totalStorage = storageData.reduce((sum, d) => sum + d.value, 0);
    const totalEgress = egressData.reduce((sum, d) => sum + d.value, 0);

    const responseData = {
      tenantId,
      period: 'week' as const,
      dateRange: {
        from: '2025-09-20',
        to: '2025-09-26'
      },
      metrics: {
        compute: computeData,
        storage: storageData,
        egress: egressData,
      },
      summary: {
        totalCompute,
        totalStorage,
        totalEgress,
        avgCompute: Math.round(totalCompute / 7),
        avgStorage: Math.round(totalStorage / 7),
        avgEgress: Math.round(totalEgress / 7),
        peakCompute,
        peakComputeDate,
      },
    };

    return this.mockRequest(
      'GET',
      `/usage/analytics/${tenantId}`,
      null,
      responseData
    );
  }

  async getTenantUserStats(tenantId: string): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalComputeHours: number;
    totalStorageGB: number;
    totalEgressGB: number;
    userBreakdown: Array<{
      userId: string;
      email: string;
      role: string;
      status: string;
      computeHours: number;
      storageGB: number;
      egressGB: number;
      lastActivity: string;
    }>;
  }> {
    const { mockUsersByTenant } = await import('./mockData');
    const users = mockUsersByTenant[tenantId] || [];
    
    const userBreakdown = users.map(user => ({
      userId: user.userId,
      email: user.email,
      role: user.role,
      status: user.status,
      computeHours: Math.floor(Math.random() * 100) + 10,
      storageGB: Math.floor(Math.random() * 50) + 5,
      egressGB: Math.floor(Math.random() * 20) + 2,
      lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    }));

    const stats = {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === 'ACTIVE').length,
      totalComputeHours: userBreakdown.reduce((sum, u) => sum + u.computeHours, 0),
      totalStorageGB: userBreakdown.reduce((sum, u) => sum + u.storageGB, 0),
      totalEgressGB: userBreakdown.reduce((sum, u) => sum + u.egressGB, 0),
      userBreakdown,
    };

    return this.mockRequest(
      'GET',
      `/usage/analytics/${tenantId}/users`,
      {},
      stats
    );
  }

  async getUserUsageHistory(userId: string, range: '7d' | '30d' | '90d' = '30d'): Promise<{
    userId: string;
    range: string;
    totalSessions: number;
    totalComputeHours: number;
    totalStorageGB: number;
    totalEgressGB: number;
    dailyStats: Array<{
      date: string;
      sessions: number;
      computeHours: number;
      storageGB: number;
      egressGB: number;
    }>;
  }> {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const dailyStats = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dailyStats.push({
        date: date.toISOString().split('T')[0],
        sessions: Math.floor(Math.random() * 8) + 1,
        computeHours: Math.floor(Math.random() * 12) + 2,
        storageGB: Math.floor(Math.random() * 5) + 1,
        egressGB: Math.floor(Math.random() * 3) + 0.5,
      });
    }

    const totals = dailyStats.reduce((sum, day) => ({
      sessions: sum.sessions + day.sessions,
      computeHours: sum.computeHours + day.computeHours,
      storageGB: sum.storageGB + day.storageGB,
      egressGB: sum.egressGB + day.egressGB,
    }), { sessions: 0, computeHours: 0, storageGB: 0, egressGB: 0 });

    const usage = {
      userId,
      range,
      totalSessions: totals.sessions,
      totalComputeHours: totals.computeHours,
      totalStorageGB: totals.storageGB,
      totalEgressGB: totals.egressGB,
      dailyStats,
    };

    return this.mockRequest(
      'GET',
      `/users/${userId}/usage`,
      { range },
      usage
    );
  }

  async getAuditLog(params?: {
    tenantId?: string;
    actor?: string;
    action?: string;
    from?: string;
    to?: string;
  }): Promise<PaginatedResponse<AuditLogEntry>> {
    let logs = [...mockAuditLog];
    
    if (params?.tenantId) {
      // Filter by tenantId if needed
    }
    if (params?.actor) {
      logs = logs.filter(log => log.actor.includes(params.actor!));
    }
    if (params?.action) {
      logs = logs.filter(log => log.action === params.action);
    }
    
    return this.mockRequest(
      'GET',
      '/audit',
      { params },
      {
        items: logs,
        nextCursor: undefined,
      }
    );
  }

  // Events & Tasks (Mock)
  async getTenantEvents(tenantId: string): Promise<PaginatedResponse<LifecycleEvent>> {
    return this.mockRequest(
      'GET',
      `/tenants/${tenantId}/events`,
      null,
      {
        items: mockLifecycleEvents,
        nextCursor: undefined,
      }
    );
  }

  async getProvisioningTasks(tenantId: string): Promise<PaginatedResponse<ProvisioningTask>> {
    return this.mockRequest(
      'GET',
      `/tenants/${tenantId}/tasks`,
      null,
      {
        items: mockProvisioningTasks,
        nextCursor: undefined,
      }
    );
  }
}

export const apiClient = new ApiClient();
export { ApiError };