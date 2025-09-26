'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';
import Loading from '@/components/Loading';
import { auth } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { AuthUser, Tenant, TenantType, PlanId, TenantStatus } from '@/types';
import { getPlanStyles, getPlanLabel, getPlanGradientClasses } from '@/lib/planStyles';
import { generateTenantDomain, copyDomainToClipboard } from '@/lib/domainUtils';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  BuildingOffice2Icon,
  PlayIcon,
  PauseIcon,
  ClockIcon,
  StopIcon,
  EyeIcon,
  FunnelIcon,
  ArrowUpRightIcon,
  ChartBarIcon,
  UsersIcon,
  GlobeAltIcon,
  ClipboardDocumentIcon,
  Squares2X2Icon,
  TableCellsIcon
} from '@heroicons/react/24/outline';

export default function TenantsPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [filteredTenants, setFilteredTenants] = useState<Tenant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [filters, setFilters] = useState({
    type: '',
    plan: '',
    status: '',
  });
  
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
          const response = await apiClient.getTenants({ limit: 100 });
          setTenants(response.items);
          setFilteredTenants(response.items);
        } catch (error) {
          console.error('Failed to load tenants:', error);
        }
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, [router]);

  useEffect(() => {
    let filtered = tenants;

    // 검색 필터
    if (searchQuery) {
      filtered = filtered.filter(tenant =>
        tenant.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.tenantId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.contacts.some(contact => 
          contact.email.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // 타입 필터
    if (filters.type) {
      filtered = filtered.filter(tenant => tenant.tenantType === filters.type);
    }

    // 플랜 필터
    if (filters.plan) {
      filtered = filtered.filter(tenant => tenant.plan === filters.plan);
    }

    // 상태 필터
    if (filters.status) {
      filtered = filtered.filter(tenant => tenant.status === filters.status);
    }

    setFilteredTenants(filtered);
  }, [tenants, searchQuery, filters]);

  const getStatusIcon = (status: TenantStatus) => {
    switch (status) {
      case 'READY':
        return <PlayIcon className="w-3 h-3" />;
      case 'PROVISIONING':
        return <ClockIcon className="w-3 h-3" />;
      case 'SUSPENDED':
        return <PauseIcon className="w-3 h-3" />;
      default:
        return <StopIcon className="w-3 h-3" />;
    }
  };

  const getStatusStyles = (status: TenantStatus) => {
    switch (status) {
      case 'READY':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'PROVISIONING':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'SUSPENDED':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: TenantStatus) => {
    switch (status) {
      case 'READY': return '활성';
      case 'PROVISIONING': return '프로비저닝';
      case 'SUSPENDED': return '일시중지';
      case 'DELETING': return '삭제중';
      case 'ERROR': return '오류';
      default: return status;
    }
  };

  const getTypeIcon = (type: TenantType) => {
    return type === 'ORG' 
      ? <BuildingOffice2Icon className="w-3 h-3" />
      : <UsersIcon className="w-3 h-3" />;
  };

  const stats = {
    total: tenants.length,
    active: tenants.filter(t => t.status === 'READY').length,
    provisioning: tenants.filter(t => t.status === 'PROVISIONING').length,
    suspended: tenants.filter(t => t.status === 'SUSPENDED').length,
  };

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return null;
  }

  return (
    <Layout title="테넌트 관리" user={user}>
      <div className="space-y-8 max-w-7xl mx-auto p-6">
        {/* Header with View Toggle */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">테넌트 관리</h1>
            <p className="text-gray-600">등록된 테넌트를 관리하고 모니터링합니다.</p>
          </div>
          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('card')}
                className={`flex items-center px-3 py-1.5 rounded-md transition-all duration-200 ${
                  viewMode === 'card'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="카드 뷰"
              >
                <Squares2X2Icon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center px-3 py-1.5 rounded-md transition-all duration-200 ${
                  viewMode === 'table'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="테이블 뷰"
              >
                <TableCellsIcon className="w-4 h-4" />
              </button>
            </div>
            
            {auth.hasPermission('write') && (
              <Link
                href="/tenants/new"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                새 테넌트 생성
              </Link>
            )}
          </div>
        </div>

        {/* Statistics Overview - Clickable Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div 
            onClick={() => setFilters({ type: '', plan: '', status: '' })}
            className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">총 테넌트</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <BuildingOffice2Icon className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div 
            onClick={() => setFilters({ type: '', plan: '', status: 'READY' })}
            className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">활성 테넌트</p>
                <p className="text-3xl font-bold">{stats.active}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <PlayIcon className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div 
            onClick={() => setFilters({ type: '', plan: '', status: 'PROVISIONING' })}
            className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">프로비저닝</p>
                <p className="text-3xl font-bold">{stats.provisioning}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <ClockIcon className="w-6 h-6 animate-spin" />
              </div>
            </div>
          </div>

          <div 
            onClick={() => setFilters({ type: '', plan: '', status: 'SUSPENDED' })}
            className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-rose-100 text-sm font-medium">일시중지</p>
                <p className="text-3xl font-bold">{stats.suspended}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <PauseIcon className="w-6 h-6" />
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
            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="테넌트명, ID, 담당자 이메일로 검색..."
                className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <select
                  className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer"
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="">🏢 모든 타입</option>
                  <option value="ORG">🏢 기업</option>
                  <option value="INDIVIDUAL">👤 개인</option>
                </select>
              </div>

              <div className="relative">
                <select
                  className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer"
                  value={filters.plan}
                  onChange={(e) => setFilters(prev => ({ ...prev, plan: e.target.value }))}
                >
                  <option value="">📦 모든 플랜</option>
                  <option value="trial">Trial</option>
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <div className="relative">
                <select
                  className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer"
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="">✨ 모든 상태</option>
                  <option value="READY">✅ 활성</option>
                  <option value="PROVISIONING">⏳ 프로비저닝</option>
                  <option value="SUSPENDED">⚠️ 일시중지</option>
                </select>
              </div>

              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilters({ type: '', plan: '', status: '' });
                }}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
              >
                초기화
              </button>
            </div>
          </div>
        </div>

        {/* Conditional View Rendering */}
        {viewMode === 'card' ? (
          /* Tenant Cards Grid - Changed from 4 columns to 3 columns */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTenants.map((tenant, index) => (
              <div
                key={tenant.tenantId}
                className={`group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border-2 overflow-hidden hover:shadow-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer ${getPlanStyles(tenant.plan).border}`}
                onClick={() => router.push(`/tenants/${tenant.tenantId}`)}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Card Header */}
                <div className={`p-4 border-b ${getPlanStyles(tenant.plan).bg} ${getPlanStyles(tenant.plan).border}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 bg-gradient-to-br ${getPlanStyles(tenant.plan).gradient} rounded-xl flex items-center justify-center text-white font-bold shadow-lg`}>
                        {tenant.tenantName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {tenant.tenantName}
                        </h3>
                        <p className="text-xs text-gray-500 font-mono">{tenant.tenantId}</p>
                      </div>
                    </div>
                    <ArrowUpRightIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-4">
                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">상태</span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyles(tenant.status)}`}>
                      {getStatusIcon(tenant.status)}
                      {getStatusLabel(tenant.status)}
                    </span>
                  </div>

                  {/* Type */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">타입</span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                      {getTypeIcon(tenant.tenantType)}
                      {tenant.tenantType === 'ORG' ? '기업' : '개인'}
                    </span>
                  </div>

                  {/* Plan */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">플랜</span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold border shadow-sm ${getPlanStyles(tenant.plan).badge}`}>
                      {getPlanLabel(tenant.plan).toUpperCase()}
                    </span>
                  </div>

                  {/* Domain */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">도메인</span>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-mono">
                        <GlobeAltIcon className="w-3 h-3" />
                        {generateTenantDomain(tenant.tenantName, tenant.plan)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyDomainToClipboard(generateTenantDomain(tenant.tenantName, tenant.plan));
                        }}
                        className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                        title="도메인 복사"
                      >
                        <ClipboardDocumentIcon className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Created Date */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-sm text-gray-600">생성일</span>
                    <span className="text-xs text-gray-500">
                      {new Date(tenant.createdAt).toLocaleDateString('ko-KR', {
                        year: '2-digit',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                {/* Card Footer */}
                <div className={`px-4 py-3 border-t ${getPlanStyles(tenant.plan).border} bg-gradient-to-r ${getPlanStyles(tenant.plan).bg} opacity-50`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <UsersIcon className="w-3 h-3" />
                        <span>{tenant.contacts?.length || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <ChartBarIcon className="w-3 h-3" />
                        <span>활성</span>
                      </div>
                    </div>
                    <button className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1 group-hover:scale-105 transition-transform">
                      <EyeIcon className="w-3 h-3" />
                      <span>상세보기</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-gray-50/80 to-white/60 border-b border-gray-200/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      테넌트
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      타입
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      플랜
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      도메인
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      생성일
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTenants.map((tenant) => (
                    <tr
                      key={tenant.tenantId}
                      className="hover:bg-blue-50/30 transition-colors cursor-pointer"
                      onClick={() => router.push(`/tenants/${tenant.tenantId}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 bg-gradient-to-br ${getPlanStyles(tenant.plan).gradient} rounded-lg flex items-center justify-center text-white font-bold text-sm shadow`}>
                            {tenant.tenantName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {tenant.tenantName}
                            </div>
                            <div className="text-xs text-gray-500 font-mono">
                              {tenant.tenantId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                          {getTypeIcon(tenant.tenantType)}
                          {tenant.tenantType === 'ORG' ? '기업' : '개인'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyles(tenant.status)}`}>
                          {getStatusIcon(tenant.status)}
                          {getStatusLabel(tenant.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold border ${getPlanStyles(tenant.plan).badge}`}>
                          {getPlanLabel(tenant.plan).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <GlobeAltIcon className="w-4 h-4 text-blue-500" />
                          <span className="text-xs font-mono text-blue-600">
                            {generateTenantDomain(tenant.tenantName, tenant.plan)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyDomainToClipboard(generateTenantDomain(tenant.tenantName, tenant.plan));
                            }}
                            className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                            title="도메인 복사"
                          >
                            <ClipboardDocumentIcon className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(tenant.createdAt).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/tenants/${tenant.tenantId}`);
                          }}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <EyeIcon className="w-4 h-4 mr-1" />
                          상세보기
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredTenants.length === 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-12">
            <div className="text-center">
              <BuildingOffice2Icon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">테넌트가 없습니다</h3>
              <p className="mt-1 text-sm text-gray-500">새로운 테넌트를 생성하여 시작하세요.</p>
              {auth.hasPermission('write') && (
                <div className="mt-6">
                  <Link
                    href="/tenants/new"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors"
                  >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    새 테넌트 생성
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}