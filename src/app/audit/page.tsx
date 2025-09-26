'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Loading from '@/components/Loading';
import { auth } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { AuthUser, AuditLogEntry } from '@/types';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  ClockIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  CalendarIcon,
  TagIcon,
  ArrowsRightLeftIcon
} from '@heroicons/react/24/outline';

export default function AuditPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>([]);
  const [filters, setFilters] = useState({
    actor: '',
    action: '',
    dateFrom: '',
    dateTo: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  
  const router = useRouter();

  useEffect(() => {
    const initializeAuth = async () => {
      if (!auth.isAuthenticated()) {
        router.push('/login');
        return;
      }

      const currentUser = auth.getUser();
      setUser(currentUser);

      if (currentUser && auth.hasPermission('read')) {
        try {
          const response = await apiClient.getAuditLog();
          setAuditLogs(response.items);
          setFilteredLogs(response.items);
        } catch (error) {
          console.error('Failed to load audit logs:', error);
        }
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, [router]);

  useEffect(() => {
    let filtered = auditLogs;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log => 
        log.actor.toLowerCase().includes(query) ||
        log.action.toLowerCase().includes(query) ||
        log.requestId.toLowerCase().includes(query) ||
        JSON.stringify(log.after).toLowerCase().includes(query)
      );
    }

    // Actor filter
    if (filters.actor) {
      filtered = filtered.filter(log => 
        log.actor.toLowerCase().includes(filters.actor.toLowerCase())
      );
    }

    // Action filter
    if (filters.action) {
      filtered = filtered.filter(log => log.action === filters.action);
    }

    // Date filters
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(log => new Date(log.timestamp) >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // Include the entire day
      filtered = filtered.filter(log => new Date(log.timestamp) <= toDate);
    }

    setFilteredLogs(filtered);
  }, [auditLogs, searchQuery, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      actor: '',
      action: '',
      dateFrom: '',
      dateTo: '',
    });
    setSearchQuery('');
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE_TENANT':
      case 'RESUME_TENANT':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'DELETE_TENANT':
      case 'SUSPEND_TENANT':
        return <XCircleIcon className="w-4 h-4" />;
      case 'PATCH_ENTITLEMENTS':
      case 'UPDATE_SEATS':
        return <ArrowsRightLeftIcon className="w-4 h-4" />;
      case 'INVITE_USER':
        return <UserCircleIcon className="w-4 h-4" />;
      case 'CREATE_DOMAIN':
        return <DocumentTextIcon className="w-4 h-4" />;
      default:
        return <ShieldCheckIcon className="w-4 h-4" />;
    }
  };

  const getActionStyles = (action: string) => {
    switch (action) {
      case 'CREATE_TENANT':
      case 'RESUME_TENANT':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'DELETE_TENANT':
      case 'SUSPEND_TENANT':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'PATCH_ENTITLEMENTS':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'UPDATE_SEATS':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'INVITE_USER':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'CREATE_DOMAIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      CREATE_TENANT: '테넌트 생성',
      PATCH_ENTITLEMENTS: '권한 수정',
      SUSPEND_TENANT: '테넌트 중단',
      RESUME_TENANT: '테넌트 재개',
      DELETE_TENANT: '테넌트 삭제',
      INVITE_USER: '사용자 초대',
      CREATE_DOMAIN: '도메인 생성',
      UPDATE_SEATS: '좌석 업데이트',
      GET_TENANT_DETAILS: '테넌트 조회',
    };
    return labels[action] || action.replace(/_/g, ' ');
  };

  const getActionSeverity = (action: string) => {
    const severity: Record<string, 'high' | 'medium' | 'low'> = {
      DELETE_TENANT: 'high',
      SUSPEND_TENANT: 'high',
      CREATE_TENANT: 'medium',
      PATCH_ENTITLEMENTS: 'medium',
      UPDATE_SEATS: 'medium',
      RESUME_TENANT: 'medium',
      INVITE_USER: 'low',
      CREATE_DOMAIN: 'low',
      GET_TENANT_DETAILS: 'low',
    };
    return severity[action] || 'low';
  };

  const formatJsonValue = (value: any) => {
    if (value === null) return 'null';
    if (typeof value === 'string') return value;
    return JSON.stringify(value, null, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading text="감사로그를 로드하는 중..." />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const uniqueActions = Array.from(new Set(auditLogs.map(log => log.action))).sort();

  const stats = {
    total: filteredLogs.length,
    high: filteredLogs.filter(log => getActionSeverity(log.action) === 'high').length,
    medium: filteredLogs.filter(log => getActionSeverity(log.action) === 'medium').length,
    low: filteredLogs.filter(log => getActionSeverity(log.action) === 'low').length,
  };

  return (
    <Layout title="감사로그" user={user}>
      <div className="space-y-8 max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 rounded-3xl shadow-2xl p-8 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <h1 className="text-3xl font-bold mb-2 flex items-center">
                <ShieldCheckIcon className="w-8 h-8 mr-3" />
                감사로그 모니터링
              </h1>
              <p className="text-slate-300">시스템의 모든 중요 활동을 추적하고 모니터링합니다.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-xs text-slate-300">전체 로그</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-rose-400">{stats.high}</div>
                  <div className="text-xs text-slate-300">높음</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-400">{stats.medium}</div>
                  <div className="text-xs text-slate-300">보통</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-400">{stats.low}</div>
                  <div className="text-xs text-slate-300">낮음</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <FunnelIcon className="w-6 h-6 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900">검색 및 필터</h3>
          </div>
          
          <div className="space-y-6">
            {/* Search bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="액터, 액션, 요청 ID로 검색..."
                className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <UserCircleIcon className="w-4 h-4 inline mr-1" />
                  액터
                </label>
                <input
                  type="text"
                  placeholder="예: admin@ediworks.local"
                  className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={filters.actor}
                  onChange={(e) => handleFilterChange('actor', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <TagIcon className="w-4 h-4 inline mr-1" />
                  액션
                </label>
                <select
                  className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer"
                  value={filters.action}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                >
                  <option value="">모든 액션</option>
                  {uniqueActions.map((action) => (
                    <option key={action} value={action}>
                      {getActionLabel(action)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CalendarIcon className="w-4 h-4 inline mr-1" />
                  시작일
                </label>
                <input
                  type="date"
                  className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CalendarIcon className="w-4 h-4 inline mr-1" />
                  종료일
                </label>
                <input
                  type="date"
                  className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                />
              </div>
            </div>

            {/* Filter Summary */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
              <div className="flex items-center text-sm text-gray-600">
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                {filteredLogs.length}개의 로그 (총 {auditLogs.length}개)
              </div>
              {(searchQuery || filters.actor || filters.action || filters.dateFrom || filters.dateTo) && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center">
                  <ArrowPathIcon className="w-4 h-4 mr-1" />
                  필터 초기화
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Audit Log Timeline */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
          <div className="bg-gradient-to-r from-gray-50/80 to-white/60 px-6 py-4 border-b border-gray-200/50 backdrop-blur-sm rounded-t-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <ClockIcon className="w-6 h-6 mr-2 text-gray-400" />
                활동 타임라인
              </h3>
              <div className="flex items-center space-x-4 text-xs">
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-rose-500 rounded-full mr-1"></div>
                  높음
                </span>
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-amber-500 rounded-full mr-1"></div>
                  보통
                </span>
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mr-1"></div>
                  낮음
                </span>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {filteredLogs.map((log, index) => {
                const severity = getActionSeverity(log.action);
                const severityColors = {
                  high: 'border-rose-500 bg-rose-50',
                  medium: 'border-amber-500 bg-amber-50',
                  low: 'border-emerald-500 bg-emerald-50',
                };
                
                return (
                  <div
                    key={`${log.timestamp}-${log.requestId}`}
                    className={`relative flex items-start space-x-4 p-4 rounded-xl border-l-4 hover:shadow-lg transition-all duration-300 ${severityColors[severity]}`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    {/* Time Column */}
                    <div className="flex-shrink-0">
                      <div className="text-xs text-gray-500 font-mono">
                        <div className="font-semibold">
                          {new Date(log.timestamp).toLocaleDateString('ko-KR', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                        <div>
                          {new Date(log.timestamp).toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                    
                    {/* Icon Column */}
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getActionStyles(log.action)} border`}>
                        {getActionIcon(log.action)}
                      </div>
                    </div>
                    
                    {/* Content Column */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getActionStyles(log.action)}`}>
                          {getActionIcon(log.action)}
                          {getActionLabel(log.action)}
                        </span>
                        <span className="text-sm text-gray-600">
                          by <span className="font-semibold text-gray-900">{log.actor}</span>
                        </span>
                      </div>
                      
                      {/* Changes */}
                      {(log.before || log.after) && (
                        <div className="mt-3 p-3 bg-white/80 rounded-lg border border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {log.before && (
                              <div>
                                <div className="text-xs font-semibold text-gray-500 mb-1 flex items-center">
                                  <XCircleIcon className="w-3 h-3 mr-1 text-rose-500" />
                                  이전 값
                                </div>
                                <div className="text-xs bg-rose-50 text-rose-800 p-2 rounded border border-rose-200 font-mono">
                                  {formatJsonValue(log.before)}
                                </div>
                              </div>
                            )}
                            {log.after && (
                              <div>
                                <div className="text-xs font-semibold text-gray-500 mb-1 flex items-center">
                                  <CheckCircleIcon className="w-3 h-3 mr-1 text-emerald-500" />
                                  변경된 값
                                </div>
                                <div className="text-xs bg-emerald-50 text-emerald-800 p-2 rounded border border-emerald-200 font-mono">
                                  {formatJsonValue(log.after)}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Request ID */}
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                          ID: {log.requestId}
                        </span>
                        <span>
                          {new Date(log.timestamp).toLocaleString('ko-KR')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {filteredLogs.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DocumentTextIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {auditLogs.length === 0 
                    ? '감사로그가 없습니다' 
                    : '검색 결과가 없습니다'
                  }
                </h3>
                <p className="text-gray-600">
                  {auditLogs.length === 0 
                    ? '시스템 활동이 기록되면 여기에 표시됩니다.'
                    : '다른 검색어나 필터 조건을 시도해보세요.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}