'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import Layout from '@/components/Layout';
import Loading from '@/components/Loading';
import UsageChart from '@/components/UsageChart';
import { auth } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { AuthUser, Tenant, User, ProvisioningTask, LifecycleEvent } from '@/types';
import { generateTenantDomain, copyDomainToClipboard } from '@/lib/domainUtils';
import { 
  ArrowLeftIcon,
  BuildingOffice2Icon,
  UsersIcon,
  ChartBarIcon,
  CogIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  PauseIcon,
  GlobeAltIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';

export default function TenantDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [userStats, setUserStats] = useState<any>(null);
  const [usageLoading, setUsageLoading] = useState(false);

  useEffect(() => {
    const initializeUser = () => {
      try {
        let currentUser = auth.getUser();
        if (!currentUser) {
          console.log('No user found, performing auto-login...');
          currentUser = auth.login('PLATFORM_ADMIN');
        }
        setUser(currentUser);
      } catch (error) {
        console.error('사용자 초기화 오류:', error);
        setError('사용자 인증에 실패했습니다.');
      }
    };

    initializeUser();
  }, []);

  useEffect(() => {
    if (!user || !id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Fetching tenant with ID:', id);
        
        // Fetch tenant data - all tenants are accessible for basic info
        const tenantData = await apiClient.getTenant(id);
        console.log('Tenant data received:', tenantData);
        setTenant(tenantData);

        // Fetch users data - try but don't fail if not available
        try {
          const usersResponse = await apiClient.getTenantUsers(id);
          setUsers(usersResponse.items);
        } catch (userError) {
          console.log('Failed to fetch users, continuing with empty array');
          setUsers([]);
        }
      } catch (error: any) {
        console.error('테넌트 정보 로딩 오류:', error);
        setError(error.message || '테넌트 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, id]);

  const fetchUsageStats = useCallback(async () => {
    if (!id) return;
    
    // Only allow usage stats for acme tenant
    if (id !== 'acme') {
      console.log('Usage stats not available for tenant:', id);
      setUsageLoading(false);
      return;
    }
    
    try {
      setUsageLoading(true);
      const stats = await apiClient.getTenantUserStats(id);
      setUserStats(stats);
    } catch (error) {
      console.error('Failed to fetch usage stats:', error);
    } finally {
      setUsageLoading(false);
    }
  }, [id]);

  // Fetch usage stats when usage tab is activated
  useEffect(() => {
    if (activeTab === 'usage' && !userStats) {
      fetchUsageStats();
    }
  }, [activeTab, userStats, fetchUsageStats]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'READY':
        return CheckCircleIcon;
      case 'PROVISIONING':
        return ClockIcon;
      case 'SUSPENDED':
        return ExclamationCircleIcon;
      default:
        return ExclamationCircleIcon;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'READY':
        return 'text-green-600 bg-green-50';
      case 'PROVISIONING':
        return 'text-yellow-600 bg-yellow-50';
      case 'SUSPENDED':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const tabs = [
    { id: 'overview', name: '개요', icon: DocumentTextIcon },
    { id: 'users', name: '사용자', icon: UsersIcon, count: users.length },
    { id: 'usage', name: '사용량', icon: ChartBarIcon },
    { id: 'settings', name: '설정', icon: CogIcon },
  ];

  if (loading) {
    return <Loading />;
  }

  if (error) {
    if (error === '404_NOT_FOUND') {
      return (
        <Layout title="테넌트를 찾을 수 없습니다" user={user}>
          <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
            <div className="text-center max-w-md mx-auto px-4">
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 p-8">
                <div className="text-6xl font-bold text-gray-300 mb-4">404</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">테넌트를 찾을 수 없습니다</h2>
                <p className="text-gray-600 mb-6">
                  요청하신 테넌트는 존재하지 않거나 액세스 권한이 없습니다.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => router.back()}
                    className="w-full px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    이전 페이지로 돌아가기
                  </button>
                  <button
                    onClick={() => router.push('/tenants')}
                    className="w-full px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    테넌트 목록으로 이동
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Layout>
      );
    }
    
    return (
      <Layout title="테넌트 상세" user={user}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">오류 발생</h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!tenant) {
    return (
      <Layout title="테넌트 상세" user={user}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">테넌트를 찾을 수 없습니다</h2>
            <p className="text-gray-600">요청하신 테넌트 정보가 존재하지 않습니다.</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!tenant) {
    return (
      <Layout title="테넌트 상세" user={user}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">테넌트를 찾을 수 없습니다</h2>
            <p className="text-sm sm:text-base text-gray-600">요청하신 테넌트 정보가 존재하지 않습니다.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const StatusIcon = getStatusIcon(tenant.status);

  return (
    <Layout title="테넌트 상세" user={user}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {/* Header Section - Responsive */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <button
                  onClick={() => router.push('/tenants')}
                  className="flex items-center text-indigo-600 hover:text-indigo-800 text-sm sm:text-base font-medium transition-colors group"
                >
                  <ArrowLeftIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                  테넌트 목록
                </button>
                <div className="h-4 sm:h-6 w-px bg-gray-300"></div>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <BuildingOffice2Icon className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{tenant.tenantName}</h1>
                </div>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getStatusColor(tenant.status)}`}>
                  <StatusIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                  {tenant.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Tab Navigation - Responsive */}
          <div className="mb-6 sm:mb-8">
            <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto pb-2" aria-label="Tabs">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-lg'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    <TabIcon className="h-4 w-4 mr-2" />
                    {tab.name}
                    {tab.count !== undefined && (
                      <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${
                        isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6 sm:space-y-8">
              {/* Main Info Cards Grid - Responsive */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {/* Left Column - Main Info (spans 2 columns on large screens) */}
                <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                  {/* Basic Information Card */}
                  <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-600 to-blue-700 px-4 sm:px-6 py-3 sm:py-4">
                      <h3 className="text-base sm:text-lg font-semibold text-white flex items-center">
                        <DocumentTextIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                        기본 정보
                      </h3>
                    </div>
                    <div className="p-4 sm:p-6">
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-1">
                          <dt className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">테넌트 ID</dt>
                          <dd className="text-sm sm:text-base font-mono text-gray-900 bg-gray-50 px-2 py-1 rounded">{tenant.tenantId}</dd>
                        </div>
                        <div className="space-y-1">
                          <dt className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">플랜</dt>
                          <dd className="text-sm sm:text-base font-semibold text-indigo-600">{tenant.plan}</dd>
                        </div>
                        <div className="space-y-1">
                          <dt className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">지역</dt>
                          <dd className="text-sm sm:text-base text-gray-900">{tenant.region}</dd>
                        </div>
                        <div className="space-y-1">
                          <dt className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">격리 모델</dt>
                          <dd className="text-sm sm:text-base text-gray-900">{tenant.isolationModel}</dd>
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                          <dt className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">도메인</dt>
                          <dd className="flex items-center justify-between bg-blue-50/80 backdrop-blur-sm border border-blue-200/50 rounded-lg p-3">
                            <div className="flex items-center space-x-2">
                              <GlobeAltIcon className="w-4 h-4 text-blue-500" />
                              <span className="text-sm font-mono text-blue-700">
                                {generateTenantDomain(tenant.tenantName, tenant.plan)}
                              </span>
                            </div>
                            <button
                              onClick={() => copyDomainToClipboard(generateTenantDomain(tenant.tenantName, tenant.plan))}
                              className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded-md transition-colors"
                              title="도메인 복사"
                            >
                              <ClipboardDocumentIcon className="w-4 h-4" />
                            </button>
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  {/* Entitlements Card */}
                  {tenant.entitlements && (
                    <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
                      <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-4 sm:px-6 py-3 sm:py-4">
                        <h3 className="text-base sm:text-lg font-semibold text-white flex items-center">
                          <ChartBarIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                          권한 및 제한
                        </h3>
                      </div>
                      <div className="p-4 sm:p-6">
                        <dl className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                          {Object.entries(tenant.entitlements).map(([key, value]) => (
                            <div key={key} className="text-center p-3 sm:p-4 bg-gray-50 rounded-xl">
                              <dt className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">{key}</dt>
                              <dd className="text-lg sm:text-xl font-bold text-gray-900 mt-1">{typeof value === 'number' ? value.toLocaleString() : value?.toString()}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Status & Actions */}
                <div className="space-y-4 sm:space-y-6">
                  {/* Status Card */}
                  <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
                    <div className="p-4 sm:p-6">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4">상태</h3>
                      <div className="text-center">
                        <StatusIcon className={`h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 ${getStatusColor(tenant.status).split(' ')[0]}`} />
                        <p className="text-lg sm:text-xl font-bold text-gray-900">{tenant.status}</p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
                    <div className="p-4 sm:p-6">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4">통계</h3>
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm text-gray-600">활성 사용자</span>
                          <span className="text-sm sm:text-base font-semibold text-gray-900">{users.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm text-gray-600">생성일</span>
                          <span className="text-xs sm:text-sm font-mono text-gray-700">
                            {new Date(tenant.createdAt).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm text-gray-600">최종 수정</span>
                          <span className="text-xs sm:text-sm font-mono text-gray-700">
                            {new Date(tenant.updatedAt).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab Content */}
          {activeTab === 'users' && (
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-700 px-4 sm:px-6 py-3 sm:py-4">
                <h3 className="text-base sm:text-lg font-semibold text-white flex items-center">
                  <UsersIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  사용자 목록 ({users.length}명)
                </h3>
              </div>
              <div className="p-4 sm:p-6">
                {users.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {users.map((user) => (
                      <div key={user.userId} className="p-3 sm:p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-xs sm:text-sm font-semibold text-indigo-600">
                              {user.email?.slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{user.email}</p>
                            <p className="text-xs text-gray-500">{user.role || 'USER'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <UsersIcon className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                    <p className="text-sm sm:text-base text-gray-500">등록된 사용자가 없습니다</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Usage Tab Content */}
          {activeTab === 'usage' && (
            <div className="space-y-6 sm:space-y-8">
              {/* Check if usage analytics is available for this tenant */}
              {tenant.tenantName === 'acme' ? (
                <>
                  {/* Animated Usage Charts - only for acme */}
                  <UsageChart tenantName={tenant.tenantName} period="week" />
                </>
              ) : (
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
                  <div className="p-8 text-center">
                    <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">사용량 분석 제한</h3>
                    <p className="text-gray-600 mb-4">
                      상세한 사용량 분석은 특정 테넌트에만 제공됩니다.
                    </p>
                    <p className="text-sm text-gray-500">
                      기본 테넌트 정보는 개요 탭에서 확인하실 수 있습니다.
                    </p>
                  </div>
                </div>
              )}
              
              {usageLoading ? (
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
                  <div className="p-8">
                    <Loading text="사용량 통계를 로드하는 중..." />
                  </div>
                </div>
              ) : userStats ? (
                <>
                  {/* Overall Tenant Usage Statistics */}
                  <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-cyan-700 px-4 sm:px-6 py-3 sm:py-4">
                      <h3 className="text-base sm:text-lg font-semibold text-white flex items-center">
                        <ChartBarIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                        테넌트 전체 사용량 통계
                      </h3>
                    </div>
                    <div className="p-4 sm:p-6">
                      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
                        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs sm:text-sm font-medium text-indigo-600 uppercase tracking-wide">총 사용자</p>
                              <p className="text-xl sm:text-2xl font-bold text-indigo-900 mt-1">{userStats.totalUsers}명</p>
                            </div>
                            <UsersIcon className="h-8 w-8 text-indigo-500" />
                          </div>
                          <p className="text-xs text-indigo-600 mt-2">활성: {userStats.activeUsers}명</p>
                        </div>
                        
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs sm:text-sm font-medium text-green-600 uppercase tracking-wide">활성 사용자</p>
                              <p className="text-xl sm:text-2xl font-bold text-green-900 mt-1">{userStats.activeUsers}명</p>
                            </div>
                            <UsersIcon className="h-8 w-8 text-green-500" />
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs sm:text-sm font-medium text-purple-600 uppercase tracking-wide">컴퓨팅 시간</p>
                              <p className="text-xl sm:text-2xl font-bold text-purple-900 mt-1">{userStats.totalComputeHours}h</p>
                            </div>
                            <ClockIcon className="h-8 w-8 text-purple-500" />
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs sm:text-sm font-medium text-orange-600 uppercase tracking-wide">스토리지</p>
                              <p className="text-xl sm:text-2xl font-bold text-orange-900 mt-1">{userStats.totalStorageGB}GB</p>
                            </div>
                            <DocumentTextIcon className="h-8 w-8 text-orange-500" />
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs sm:text-sm font-medium text-blue-600 uppercase tracking-wide">트래픽</p>
                              <p className="text-xl sm:text-2xl font-bold text-blue-900 mt-1">{userStats.totalEgressGB}GB</p>
                            </div>
                            <ChartBarIcon className="h-8 w-8 text-blue-500" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Individual User Usage Statistics */}
                  <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-4 sm:px-6 py-3 sm:py-4">
                      <h3 className="text-base sm:text-lg font-semibold text-white flex items-center">
                        <UsersIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                        개별 사용자 사용량 상세
                      </h3>
                    </div>
                    <div className="p-4 sm:p-6">
                      <div className="space-y-4">
                        {userStats.userBreakdown.map((user: any) => (
                          <div key={user.userId} className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-200/50 hover:shadow-lg transition-shadow">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center">
                                  <span className="text-white font-semibold text-sm">
                                    {user.email.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-sm sm:text-base font-semibold text-gray-900">{user.email}</p>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                      user.role === 'TENANT_ADMIN' ? 'bg-purple-100 text-purple-800' :
                                      user.role === 'BILLING_ADMIN' ? 'bg-blue-100 text-blue-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {user.role}
                                    </span>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                      user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {user.status}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                                <div className="bg-purple-50 rounded-lg p-2">
                                  <p className="text-lg font-bold text-purple-900">{user.computeHours}h</p>
                                  <p className="text-xs text-purple-600">컴퓨팅</p>
                                </div>
                                <div className="bg-orange-50 rounded-lg p-2">
                                  <p className="text-lg font-bold text-orange-900">{user.storageGB}GB</p>
                                  <p className="text-xs text-orange-600">스토리지</p>
                                </div>
                                <div className="bg-green-50 rounded-lg p-2">
                                  <p className="text-lg font-bold text-green-900">{user.egressGB}GB</p>
                                  <p className="text-xs text-green-600">트래픽</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs text-gray-500">
                                마지막 활동: {new Date(user.lastActivity).toLocaleDateString('ko-KR', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {userStats.userBreakdown.length === 0 && (
                        <div className="text-center py-8">
                          <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">등록된 사용자가 없습니다</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
                  <div className="p-8 text-center">
                    <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">
                      {tenant.tenantName === 'acme' ? '사용량 데이터를 불러올 수 없습니다' : '이 테넌트에 대한 사용량 분석은 제공되지 않습니다'}
                    </p>
                    {tenant.tenantName === 'acme' && (
                      <button
                        onClick={fetchUsageStats}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        다시 시도
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Settings Tab Content */}
          {activeTab === 'settings' && (
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-600 to-gray-800 px-4 sm:px-6 py-3 sm:py-4">
                <h3 className="text-base sm:text-lg font-semibold text-white flex items-center">
                  <CogIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  테넌트 설정
                </h3>
              </div>
              <div className="p-4 sm:p-6">
                <div className="text-center py-8 sm:py-12">
                  <CogIcon className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <p className="text-sm sm:text-base text-gray-500">설정 옵션을 준비 중입니다</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}