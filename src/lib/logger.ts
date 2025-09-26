// API Logger utility for development
export interface ApiLogEntry {
  timestamp: string;
  method: string;
  endpoint: string;
  requestId: string;
  requestBody?: any;
  responseData?: any;
  responseTime: number;
  status: 'success' | 'error';
  error?: string;
}

class ApiLogger {
  private static instance: ApiLogger;
  private logs: ApiLogEntry[] = [];
  private enabled: boolean = true;

  private constructor() {}

  static getInstance(): ApiLogger {
    if (!ApiLogger.instance) {
      ApiLogger.instance = new ApiLogger();
    }
    return ApiLogger.instance;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled && (typeof window !== 'undefined');
  }

  logRequest(
    method: string,
    endpoint: string,
    requestId: string,
    requestBody?: any
  ): string {
    if (!this.isEnabled()) return requestId;

    const logEntry: Partial<ApiLogEntry> = {
      timestamp: new Date().toISOString(),
      method,
      endpoint,
      requestId,
      requestBody: requestBody ? JSON.parse(JSON.stringify(requestBody)) : undefined,
    };

    console.group(`🚀 API Request: ${method} ${endpoint}`);
    console.log('📋 Request Details:', {
      timestamp: logEntry.timestamp,
      requestId: logEntry.requestId,
      endpoint: logEntry.endpoint,
      method: logEntry.method,
    });

    if (requestBody) {
      console.log('📦 Request Body:', JSON.stringify(requestBody, null, 2));
    }

    console.groupEnd();

    return requestId;
  }

  logResponse(
    requestId: string,
    responseData: any,
    responseTime: number,
    error?: string
  ) {
    if (!this.isEnabled()) return;

    const status = error ? 'error' : 'success';
    const logEntry: ApiLogEntry = {
      timestamp: new Date().toISOString(),
      method: '',
      endpoint: '',
      requestId,
      responseData: responseData ? JSON.parse(JSON.stringify(responseData)) : undefined,
      responseTime,
      status,
      error,
    };

    // Update existing log entry
    const existingLogIndex = this.logs.findIndex(log => log.requestId === requestId);
    if (existingLogIndex >= 0) {
      this.logs[existingLogIndex] = { ...this.logs[existingLogIndex], ...logEntry };
    } else {
      this.logs.push(logEntry);
    }

    // Console output
    const icon = status === 'success' ? '✅' : '❌';
    const timeColor = responseTime < 100 ? '🟢' : responseTime < 500 ? '🟡' : '🔴';
    
    console.group(`${icon} API Response (${timeColor} ${responseTime}ms)`);
    console.log('📋 Response Details:', {
      requestId,
      status,
      responseTime: `${responseTime}ms`,
      timestamp: logEntry.timestamp,
    });

    if (error) {
      console.error('⚠️ Error:', error);
    } else if (responseData) {
      console.log('📦 Response Data:', JSON.stringify(responseData, null, 2));
    }

    console.groupEnd();

    // Keep only last 50 logs
    if (this.logs.length > 50) {
      this.logs = this.logs.slice(-50);
    }
  }

  logMockApiCall(
    method: string,
    endpoint: string,
    requestBody: any,
    responseData: any,
    responseTime: number
  ) {
    if (!this.isEnabled()) return;

    const requestId = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    
    // Log request
    this.logRequest(method, endpoint, requestId, requestBody);
    
    // Simulate delay and log response
    setTimeout(() => {
      this.logResponse(requestId, responseData, responseTime);
    }, 0);

    return requestId;
  }

  getLogs(): ApiLogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
    console.clear();
    console.log('🗑️ API logs cleared');
  }

  exportLogs(): string {
    const exportData = {
      exportTime: new Date().toISOString(),
      totalLogs: this.logs.length,
      logs: this.logs,
    };

    return JSON.stringify(exportData, null, 2);
  }

  // Development helper methods
  printLogsSummary() {
    if (!this.isEnabled()) return;

    console.group('📊 API Logs Summary');
    console.log(`Total requests: ${this.logs.length}`);
    console.log(`Successful: ${this.logs.filter(log => log.status === 'success').length}`);
    console.log(`Failed: ${this.logs.filter(log => log.status === 'error').length}`);
    
    if (this.logs.length > 0) {
      const avgResponseTime = this.logs.reduce((sum, log) => sum + log.responseTime, 0) / this.logs.length;
      console.log(`Average response time: ${avgResponseTime.toFixed(2)}ms`);
      
      // Group by endpoint
      const endpointGroups = this.logs.reduce((acc, log) => {
        acc[log.endpoint] = (acc[log.endpoint] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log('📈 Requests by endpoint:', endpointGroups);
    }
    console.groupEnd();
  }
}

export const apiLogger = ApiLogger.getInstance();

// Global helper for development console
if (typeof window !== 'undefined') {
  (window as any).__API_LOGGER__ = {
    logs: () => apiLogger.getLogs(),
    summary: () => apiLogger.printLogsSummary(),
    clear: () => apiLogger.clearLogs(),
    export: () => apiLogger.exportLogs(),
    enable: () => apiLogger.setEnabled(true),
    disable: () => apiLogger.setEnabled(false),
  };
  
  console.log('🔧 API Logger loaded! Use window.__API_LOGGER__ for debug commands');
}