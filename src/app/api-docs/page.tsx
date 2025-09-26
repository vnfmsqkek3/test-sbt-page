'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { auth } from '@/lib/auth';
import { AuthUser } from '@/types';
import { 
  ChevronDownIcon,
  ChevronRightIcon,
  DocumentDuplicateIcon,
  PlayIcon,
  ClipboardDocumentIcon,
  CodeBracketIcon,
  ServerIcon,
  CubeIcon,
  UserGroupIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  summary: string;
  description: string;
  tags: string[];
  parameters?: ApiParameter[];
  requestBody?: ApiRequestBody;
  responses: ApiResponse[];
  example: {
    request?: string;
    response: string;
  };
}

interface ApiParameter {
  name: string;
  in: 'path' | 'query' | 'header';
  required: boolean;
  type: string;
  description: string;
  example?: string;
}

interface ApiRequestBody {
  contentType: string;
  schema: string;
  example: string;
}

interface ApiResponse {
  status: number;
  description: string;
  schema?: string;
}

const apiEndpoints: ApiEndpoint[] = [
  {
    method: 'GET',
    path: '/api/dashboard',
    summary: '대시보드 데이터 조회',
    description: '시스템 전반의 통계 데이터와 최근 활동 정보를 조회합니다.',
    tags: ['Dashboard'],
    responses: [
      {
        status: 200,
        description: '성공적으로 대시보드 데이터를 조회했습니다.',
        schema: 'DashboardResponse'
      }
    ],
    example: {
      response: `{
  "stats": {
    "totalTenants": 15,
    "activeTenants": 12,
    "totalUsers": 147,
    "revenue": 25000
  },
  "recentTenants": [
    {
      "tenantId": "tenant-123",
      "tenantName": "acme-corp",
      "status": "READY",
      "plan": "pro",
      "createdAt": "2024-03-15T10:30:00Z"
    }
  ]
}`
    }
  },
  {
    method: 'GET',
    path: '/api/tenants',
    summary: '테넌트 목록 조회',
    description: '등록된 모든 테넌트의 목록을 페이징과 함께 조회합니다.',
    tags: ['Tenants'],
    parameters: [
      {
        name: 'page',
        in: 'query',
        required: false,
        type: 'number',
        description: '페이지 번호 (기본값: 1)',
        example: '1'
      },
      {
        name: 'limit',
        in: 'query',
        required: false,
        type: 'number',
        description: '페이지당 항목 수 (기본값: 20)',
        example: '20'
      },
      {
        name: 'status',
        in: 'query',
        required: false,
        type: 'string',
        description: '테넌트 상태 필터 (READY, PROVISIONING, SUSPENDED)',
        example: 'READY'
      }
    ],
    responses: [
      {
        status: 200,
        description: '테넌트 목록 조회 성공',
        schema: 'TenantsResponse'
      }
    ],
    example: {
      response: `{
  "items": [
    {
      "tenantId": "tenant-123",
      "tenantName": "acme-corp",
      "tenantType": "ORG",
      "status": "READY",
      "plan": "pro",
      "isolationModel": "Pooled",
      "region": "ap-northeast-2",
      "createdAt": "2024-03-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "totalPages": 1
  }
}`
    }
  },
  {
    method: 'POST',
    path: '/api/tenants',
    summary: '새 테넌트 생성',
    description: '새로운 테넌트를 생성합니다.',
    tags: ['Tenants'],
    requestBody: {
      contentType: 'application/json',
      schema: 'CreateTenantRequest',
      example: `{
  "tenantName": "new-corp",
  "tenantType": "ORG",
  "plan": "pro",
  "isolationModel": "Pooled",
  "region": "ap-northeast-2",
  "contact": {
    "email": "admin@newcorp.com"
  },
  "orgProfile": {
    "legalEntity": "New Corp Inc.",
    "seats": 50
  }
}`
    },
    responses: [
      {
        status: 201,
        description: '테넌트 생성 성공',
        schema: 'CreateTenantResponse'
      },
      {
        status: 400,
        description: '잘못된 요청 데이터'
      }
    ],
    example: {
      request: `{
  "tenantName": "new-corp",
  "tenantType": "ORG",
  "plan": "pro",
  "isolationModel": "Pooled",
  "region": "ap-northeast-2",
  "contact": {
    "email": "admin@newcorp.com"
  },
  "orgProfile": {
    "legalEntity": "New Corp Inc.",
    "seats": 50
  }
}`,
      response: `{
  "tenantId": "tenant-456",
  "message": "테넌트가 성공적으로 생성되었습니다.",
  "status": "PROVISIONING"
}`
    }
  },
  {
    method: 'GET',
    path: '/api/tenants/{id}',
    summary: '특정 테넌트 조회',
    description: '테넌트 ID로 특정 테넌트의 상세 정보를 조회합니다. 모든 테넌트의 기본 정보에 접근할 수 있습니다.',
    tags: ['Tenants'],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        type: 'string',
        description: '테넌트 ID',
        example: 'tenant-123'
      }
    ],
    responses: [
      {
        status: 200,
        description: '테넌트 조회 성공',
        schema: 'TenantResponse'
      },
      {
        status: 404,
        description: '테넌트를 찾을 수 없음'
      }
    ],
    example: {
      response: `{
  "tenantId": "tenant-123",
  "tenantName": "acme-corp",
  "tenantType": "ORG",
  "status": "READY",
  "plan": "pro",
  "isolationModel": "Pooled",
  "region": "ap-northeast-2",
  "contact": {
    "email": "admin@acme.com"
  },
  "orgProfile": {
    "legalEntity": "Acme Corp Inc.",
    "seats": 100
  },
  "createdAt": "2024-03-15T10:30:00Z",
  "updatedAt": "2024-03-20T14:15:00Z"
}`
    }
  },
  {
    method: 'GET',
    path: '/api/users',
    summary: '사용자 목록 조회',
    description: '시스템에 등록된 모든 사용자의 목록을 조회합니다.',
    tags: ['Users'],
    parameters: [
      {
        name: 'page',
        in: 'query',
        required: false,
        type: 'number',
        description: '페이지 번호',
        example: '1'
      },
      {
        name: 'status',
        in: 'query',
        required: false,
        type: 'string',
        description: '사용자 상태 필터',
        example: 'ACTIVE'
      }
    ],
    responses: [
      {
        status: 200,
        description: '사용자 목록 조회 성공',
        schema: 'UsersResponse'
      }
    ],
    example: {
      response: `{
  "items": [
    {
      "userId": "user-123",
      "email": "john@acme.com",
      "status": "ACTIVE",
      "role": "TENANT_ADMIN",
      "tenantId": "tenant-123",
      "createdAt": "2024-03-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 147
  }
}`
    }
  },
  {
    method: 'GET',
    path: '/api/usage/analytics',
    summary: '사용량 분석 데이터',
    description: '시스템 전체의 사용량 통계와 분석 데이터를 조회합니다.',
    tags: ['Usage'],
    responses: [
      {
        status: 200,
        description: '사용량 데이터 조회 성공',
        schema: 'UsageAnalyticsResponse'
      }
    ],
    example: {
      response: `{
  "totalSessions": 2847,
  "totalCompute": 1250.5,
  "totalStorage": 2048,
  "totalEgress": 512,
  "totalTenants": 15
}`
    }
  },
  {
    method: 'GET',
    path: '/api/usage/analytics/{tenantId}',
    summary: '특정 테넌트 사용량 분석',
    description: 'acme 테넌트의 2025.09.20 ~ 2025.09.26 기간 동안의 상세한 컴퓨팅, 스토리지, Egress 사용량 분석 데이터를 조회합니다. 주간 기준으로 일별 데이터와 요약 통계를 제공하며, 피크 사용량과 평균값을 포함합니다.',
    tags: ['Usage'],
    parameters: [
      {
        name: 'tenantId',
        in: 'path',
        required: true,
        type: 'string',
        description: '테넌트 ID',
        example: 'acme'
      }
    ],
    responses: [
      {
        status: 200,
        description: '테넌트 사용량 분석 데이터 조회 성공',
        schema: 'TenantUsageAnalyticsResponse'
      },
      {
        status: 403,
        description: '접근 권한 없음 - 해당 테넌트의 분석 데이터에 접근할 수 없음',
        schema: 'ErrorResponse'
      }
    ],
    example: {
      response: `{
  "tenantId": "acme",
  "period": "week",
  "dateRange": {
    "from": "2025-09-20",
    "to": "2025-09-26"
  },
  "metrics": {
    "compute": [
      {
        "date": "9월 20일",
        "value": 78,
        "timestamp": "2025-09-20T00:00:00.000Z"
      },
      {
        "date": "9월 21일", 
        "value": 65,
        "timestamp": "2025-09-21T00:00:00.000Z"
      },
      {
        "date": "9월 22일",
        "value": 156,
        "timestamp": "2025-09-22T00:00:00.000Z"
      },
      {
        "date": "9월 23일",
        "value": 178,
        "timestamp": "2025-09-23T00:00:00.000Z"
      },
      {
        "date": "9월 24일",
        "value": 162,
        "timestamp": "2025-09-24T00:00:00.000Z"
      },
      {
        "date": "9월 25일",
        "value": 142,
        "timestamp": "2025-09-25T00:00:00.000Z"
      },
      {
        "date": "9월 26일",
        "value": 138,
        "timestamp": "2025-09-26T00:00:00.000Z"
      }
    ],
    "storage": [
      {
        "date": "9월 20일",
        "value": 445,
        "timestamp": "2025-09-20T00:00:00.000Z"
      },
      {
        "date": "9월 21일",
        "value": 432,
        "timestamp": "2025-09-21T00:00:00.000Z"
      }
    ],
    "egress": [
      {
        "date": "9월 20일",
        "value": 28,
        "timestamp": "2025-09-20T00:00:00.000Z"
      },
      {
        "date": "9월 21일",
        "value": 34,
        "timestamp": "2025-09-21T00:00:00.000Z"
      }
    ]
  },
  "summary": {
    "totalCompute": 919,
    "totalStorage": 3175,
    "totalEgress": 245,
    "avgCompute": 131,
    "avgStorage": 454,
    "avgEgress": 35,
    "peakCompute": 178,
    "peakComputeDate": "2025. 9. 23."
  }
}`
    }
  },
  {
    method: 'GET',
    path: '/api/usage/analytics/{tenantId}/users',
    summary: '테넌트 사용자별 사용량 통계',
    description: '특정 테넌트의 사용자별 상세 사용량 통계를 조회합니다. (acme 테넌트만 지원)',
    tags: ['Usage'],
    parameters: [
      {
        name: 'tenantId',
        in: 'path',
        required: true,
        type: 'string',
        description: '테넌트 ID',
        example: 'acme'
      }
    ],
    responses: [
      {
        status: 200,
        description: '테넌트 사용자 통계 조회 성공',
        schema: 'TenantUserStatsResponse'
      },
      {
        status: 403,
        description: '접근 권한 없음',
        schema: 'ErrorResponse'
      }
    ],
    example: {
      response: `{
  "totalUsers": 8,
  "activeUsers": 6,
  "totalComputeHours": 487,
  "totalStorageGB": 245,
  "totalEgressGB": 89,
  "userBreakdown": [
    {
      "userId": "user-001",
      "email": "admin@acme.com",
      "role": "TENANT_ADMIN",
      "status": "ACTIVE",
      "computeHours": 85,
      "storageGB": 42,
      "egressGB": 15,
      "lastActivity": "2024-03-15T14:30:00Z"
    }
  ]
}`
    }
  }
];

const apiCategories = [
  { name: 'Dashboard', icon: ServerIcon, color: 'bg-blue-500' },
  { name: 'Tenants', icon: CubeIcon, color: 'bg-purple-500' },
  { name: 'Users', icon: UserGroupIcon, color: 'bg-green-500' },
  { name: 'Usage', icon: ChartBarIcon, color: 'bg-orange-500' },
  { name: 'System', icon: Cog6ToothIcon, color: 'bg-gray-500' }
];

export default function ApiDocsPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>(['Dashboard']);
  const [activeTab, setActiveTab] = useState<'request' | 'response'>('response');
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);
  const router = useRouter();

  useState(() => {
    const currentUser = auth.getUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    setSelectedEndpoint(apiEndpoints[0]);
  }, [router]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const copyToClipboard = (text: string, endpoint: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(endpoint);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800 border-green-200';
      case 'POST': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PUT': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'DELETE': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!user) return null;

  return (
    <Layout title="API 문서" user={user}>
      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-80 bg-white/80 backdrop-blur-xl border-r border-gray-200/50 overflow-y-auto">
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">EdiWorks SBT API</h2>
              <p className="text-sm text-gray-600">Multi-Tenant 관리 시스템 REST API 문서</p>
              <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-blue-700 font-medium">Base URL: /api</span>
                </div>
              </div>
            </div>

            {/* API Categories */}
            <div className="space-y-2">
              {apiCategories.map((category) => {
                const categoryEndpoints = apiEndpoints.filter(endpoint => 
                  endpoint.tags.includes(category.name)
                );
                const isExpanded = expandedSections.includes(category.name);
                
                return (
                  <div key={category.name} className="border border-gray-200/50 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleSection(category.name)}
                      className="w-full flex items-center justify-between p-3 bg-gray-50/50 hover:bg-gray-100/50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 ${category.color} rounded-md flex items-center justify-center`}>
                          <category.icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-medium text-gray-900">{category.name}</span>
                        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                          {categoryEndpoints.length}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                    
                    {isExpanded && (
                      <div className="border-t border-gray-200/50">
                        {categoryEndpoints.map((endpoint) => (
                          <button
                            key={`${endpoint.method}-${endpoint.path}`}
                            onClick={() => setSelectedEndpoint(endpoint)}
                            className={`w-full p-3 text-left hover:bg-blue-50/50 transition-colors border-l-2 ${
                              selectedEndpoint === endpoint 
                                ? 'border-l-blue-500 bg-blue-50/50' 
                                : 'border-l-transparent'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs font-mono px-2 py-1 rounded border ${getMethodColor(endpoint.method)}`}>
                                {endpoint.method}
                              </span>
                            </div>
                            <div className="font-medium text-sm text-gray-900 mb-1">
                              {endpoint.summary}
                            </div>
                            <div className="text-xs font-mono text-gray-500">
                              {endpoint.path}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {selectedEndpoint && (
            <div className="p-8">
              {/* Endpoint Header */}
              <div className="mb-8">
                <div className="flex items-center space-x-4 mb-4">
                  <span className={`text-sm font-mono px-3 py-1.5 rounded-lg border ${getMethodColor(selectedEndpoint.method)}`}>
                    {selectedEndpoint.method}
                  </span>
                  <div className="flex-1 bg-gray-50/80 rounded-lg px-4 py-2 font-mono text-sm border border-gray-200/50">
                    {selectedEndpoint.path}
                  </div>
                  <button
                    onClick={() => copyToClipboard(selectedEndpoint.path, selectedEndpoint.path)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {copiedEndpoint === selectedEndpoint.path ? (
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    ) : (
                      <ClipboardDocumentIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
                
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedEndpoint.summary}
                </h1>
                <p className="text-gray-600">
                  {selectedEndpoint.description}
                </p>
              </div>

              {/* Parameters */}
              {selectedEndpoint.parameters && (
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Parameters</h2>
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-50/50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">In</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Required</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {selectedEndpoint.parameters.map((param, index) => (
                            <tr key={index} className="hover:bg-gray-50/50">
                              <td className="px-4 py-3 font-mono text-sm font-medium text-gray-900">
                                {param.name}
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                                  {param.in}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-mono text-sm text-gray-600">
                                {param.type}
                              </td>
                              <td className="px-4 py-3">
                                {param.required ? (
                                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                                    Required
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                                    Optional
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {param.description}
                                {param.example && (
                                  <div className="mt-1 font-mono text-xs text-gray-500">
                                    예시: {param.example}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Request Body */}
              {selectedEndpoint.requestBody && (
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Request Body</h2>
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-700">Content-Type:</span>
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {selectedEndpoint.requestBody.contentType}
                        </span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(selectedEndpoint.requestBody!.example, 'request-body')}
                        className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        {copiedEndpoint === 'request-body' ? (
                          <CheckCircleIcon className="w-4 h-4 text-green-500" />
                        ) : (
                          <DocumentDuplicateIcon className="w-4 h-4" />
                        )}
                        <span>Copy</span>
                      </button>
                    </div>
                    <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                      <code>{selectedEndpoint.requestBody.example}</code>
                    </pre>
                  </div>
                </div>
              )}

              {/* Responses */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Responses</h2>
                <div className="space-y-4">
                  {selectedEndpoint.responses.map((response, index) => (
                    <div key={index} className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-lg ${
                          response.status >= 200 && response.status < 300 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {response.status}
                        </span>
                        <span className="text-gray-700">{response.description}</span>
                      </div>
                      {response.schema && (
                        <div className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Schema:</span> {response.schema}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Example */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Example</h2>
                  <div className="flex space-x-2">
                    {selectedEndpoint.example.request && (
                      <button
                        onClick={() => setActiveTab('request')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                          activeTab === 'request'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Request
                      </button>
                    )}
                    <button
                      onClick={() => setActiveTab('response')}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        activeTab === 'response'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Response
                    </button>
                  </div>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-gray-200/50 bg-gray-50/50">
                    <div className="flex items-center space-x-2">
                      <CodeBracketIcon className="w-5 h-5 text-gray-500" />
                      <span className="font-medium text-gray-700">
                        {activeTab === 'request' ? 'Request' : 'Response'} Example
                      </span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(
                        activeTab === 'request' && selectedEndpoint.example.request 
                          ? selectedEndpoint.example.request 
                          : selectedEndpoint.example.response, 
                        `${activeTab}-example`
                      )}
                      className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      {copiedEndpoint === `${activeTab}-example` ? (
                        <CheckCircleIcon className="w-4 h-4 text-green-500" />
                      ) : (
                        <DocumentDuplicateIcon className="w-4 h-4" />
                      )}
                      <span>Copy</span>
                    </button>
                  </div>
                  <pre className="bg-gray-900 text-green-400 p-6 overflow-x-auto text-sm font-mono">
                    <code>
                      {activeTab === 'request' && selectedEndpoint.example.request 
                        ? selectedEndpoint.example.request 
                        : selectedEndpoint.example.response}
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}