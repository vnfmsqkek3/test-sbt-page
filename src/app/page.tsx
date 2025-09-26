'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Loading from '@/components/Loading';
import { auth } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { AuthUser, Tenant } from '@/types';
import { getPlanStyles, getPlanLabel } from '@/lib/planStyles';
import { generateTenantDomain } from '@/lib/domainUtils';
import { 
  BuildingOffice2Icon,
  UserGroupIcon,
  ServerIcon,
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowUpRightIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  CurrencyDollarIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [stats, setStats] = useState({
    totalTenants: 0,
    activeTenants: 0,
    provisioningTenants: 0,
    suspendedTenants: 0,
    totalUsers: 0,
    revenue: 0,
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
          // 최근 테넌트 목록 가져오기
          const tenantsResponse = await apiClient.getTenants({ limit: 5 });
          setTenants(tenantsResponse.items);

          // 전체 통계 가져오기
          const allTenantsResponse = await apiClient.getTenants({ limit: 100 });
          const allTenants = allTenantsResponse.items;
          
          // Mock calculations
          const totalUsers = allTenants.reduce((sum, tenant) => {
            const userCount = Math.floor(Math.random() * 50) + 5;
            return sum + userCount;
          }, 0);

          const revenue = Math.floor(Math.random() * 50000) + 10000;
          
          const stats = {
            totalTenants: allTenants.length,
            activeTenants: allTenants.filter(t => t.status === 'READY').length,
            provisioningTenants: allTenants.filter(t => t.status === 'PROVISIONING').length,
            suspendedTenants: allTenants.filter(t => t.status === 'SUSPENDED').length,
            totalUsers,
            revenue,
          };
          setStats(stats);
        } catch (error) {
          console.error('Failed to load dashboard data:', error);
        }
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Loading text="대시보드를 로드하는 중..." />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'READY':
        return <PlayIcon className="w-4 h-4" />;
      case 'PROVISIONING':
        return <ClockIcon className="w-4 h-4" />;
      case 'SUSPENDED':
        return <PauseIcon className="w-4 h-4" />;
      default:
        return <StopIcon className="w-4 h-4" />;
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'READY':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 animate-pulse';
      case 'PROVISIONING':
        return 'bg-amber-100 text-amber-800 border-amber-200 animate-bounce';
      case 'SUSPENDED':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'READY': return '활성';
      case 'PROVISIONING': return '프로비저닝';
      case 'SUSPENDED': return '일시중지';
      case 'DELETING': return '삭제중';
      case 'ERROR': return '오류';
      default: return status;
    }
  };

  return (
    <Layout title="대시보드" user={user}>
      <div className="space-y-8 max-w-7xl mx-auto p-6">
        {/* Welcome Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 rounded-2xl shadow-2xl border border-white/10">
          <div className="absolute inset-0 bg-white/5 backdrop-blur-3xl"></div>
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-xl"></div>
          
          <div className="relative px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                안녕하세요, {user.email?.split('@')[0]}님! 👋
              </h1>
              <p className="text-slate-300 text-lg sm:text-xl mb-6">
                EdiWorks SBT 관리 시스템
              </p>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 max-w-3xl mx-auto">
                <p className="text-white/90 text-base sm:text-lg leading-relaxed">
                  현재 <span className="font-semibold text-purple-300">{stats.totalTenants}개의 테넌트</span>와 
                  <span className="font-semibold text-blue-300"> {stats.totalUsers}명의 사용자</span>가 
                  활발히 서비스를 이용하고 있습니다.
                </p>
                <div className="flex items-center justify-center mt-4 pt-4 border-t border-white/10">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                  <span className="text-green-300 text-sm sm:text-base font-medium">시스템 정상 운영중</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Revenue Card */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-500">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <CurrencyDollarIcon className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div>
                <p className="text-white/90 text-sm font-medium mb-1">월간 매출</p>
                <p className="text-3xl font-bold text-white mb-1">${stats.revenue.toLocaleString()}</p>
                <p className="text-white/70 text-xs flex items-center">
                  <ArrowUpRightIcon className="w-3 h-3 mr-1" />
                  +12.5% 전월 대비
                </p>
              </div>
            </div>
          </div>

          {/* Total Tenants Card */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-500">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <BuildingOffice2Icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div>
                <p className="text-white/90 text-sm font-medium mb-1">총 테넌트</p>
                <p className="text-3xl font-bold text-white mb-1">{stats.totalTenants}</p>
                <p className="text-white/70 text-xs flex items-center">
                  <ArrowUpRightIcon className="w-3 h-3 mr-1" />
                  활성: {stats.activeTenants}개
                </p>
              </div>
            </div>
          </div>

          {/* Active Tenants Card */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-500">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <ServerIcon className="w-6 h-6 text-white" />
                </div>
                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <p className="text-white/90 text-sm font-medium mb-1">활성 테넌트</p>
                <p className="text-3xl font-bold text-white mb-1">{stats.activeTenants}</p>
                <div className="flex items-center">
                  <div className="flex-1 bg-white/20 rounded-full h-1.5">
                    <div 
                      className="bg-emerald-300 h-1.5 rounded-full transition-all duration-1000" 
                      style={{ width: `${(stats.activeTenants / stats.totalTenants) * 100}%` }}
                    ></div>
                  </div>
                  <span className="ml-2 text-xs text-white/70">
                    {Math.round((stats.activeTenants / stats.totalTenants) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Total Users Card */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-orange-400 via-pink-500 to-rose-500 rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-500">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <UserGroupIcon className="w-6 h-6 text-white" />
                </div>
                <ArrowUpRightIcon className="w-5 h-5 text-white/70" />
              </div>
              <div>
                <p className="text-white/90 text-sm font-medium mb-1">총 사용자</p>
                <p className="text-3xl font-bold text-white mb-1">{stats.totalUsers}</p>
                <p className="text-white/70 text-xs flex items-center">
                  <ArrowUpRightIcon className="w-3 h-3 mr-1" />
                  +8.2% 전월 대비
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Tenants - Takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50/80 to-white/60 px-6 py-4 border-b border-gray-200/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">최근 테넌트</h3>
                  <button 
                    onClick={() => router.push('/tenants')}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 transition-colors hover:scale-105 transform"
                  >
                    전체 보기 <ArrowUpRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-100/50">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        테넌트
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
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map((tenant, index) => (
                      <tr 
                        key={tenant.tenantId} 
                        className="hover:bg-blue-50/50 transition-all duration-300 cursor-pointer border-b border-gray-50/50 last:border-0 group"
                        onClick={() => router.push(`/tenants/${tenant.tenantId}`)}
                        style={{ 
                          animationDelay: `${index * 0.1}s`,
                          animation: `fadeInUp 0.6s ease-out forwards`
                        }}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 via-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:scale-110 transition-transform duration-300">
                              {tenant.tenantName.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {tenant.tenantName}
                              </div>
                              <div className="text-xs text-gray-500 font-mono">
                                {tenant.tenantId}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap ${getStatusStyles(tenant.status)} group-hover:scale-105 transition-transform duration-300`}>
                            {getStatusIcon(tenant.status)}
                            <span className="whitespace-nowrap">{getStatusLabel(tenant.status)}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold border transition-all duration-300 ${getPlanStyles(tenant.plan).badge} group-hover:scale-105`}>
                            {getPlanLabel(tenant.plan).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <GlobeAltIcon className="w-4 h-4 text-blue-500" />
                            <span className="text-xs font-mono text-blue-600">
                              {generateTenantDomain(tenant.tenantName, tenant.plan)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(tenant.createdAt).toLocaleDateString('ko-KR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {tenants.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BuildingOffice2Icon className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">테넌트가 없습니다.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Quick Actions & Status */}
          <div className="space-y-6">
            {/* System Status */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse mr-3"></div>
                시스템 상태
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">가동률</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-1000" 
                        style={{ width: `${(stats.activeTenants / stats.totalTenants) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {Math.round((stats.activeTenants / stats.totalTenants) * 100)}%
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center">
                    <ClockIcon className="w-4 h-4 mr-2 text-amber-500" />
                    프로비저닝
                  </span>
                  <span className="text-sm font-semibold text-amber-600">{stats.provisioningTenants}개</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center">
                    <PauseIcon className="w-4 h-4 mr-2 text-rose-500" />
                    일시중지
                  </span>
                  <span className="text-sm font-semibold text-rose-600">{stats.suspendedTenants}개</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">빠른 작업</h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/tenants/new')}
                  className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <BuildingOffice2Icon className="w-5 h-5 mr-2" />
                  새 테넌트 생성
                </button>
                
                <button
                  onClick={() => router.push('/usage')}
                  className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-700 font-medium rounded-xl transition-all duration-300 border border-gray-200 hover:border-gray-300 transform hover:scale-105"
                >
                  <ChartBarIcon className="w-5 h-5 mr-2" />
                  사용량 분석
                </button>
                
                <button
                  onClick={() => router.push('/audit')}
                  className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-700 font-medium rounded-xl transition-all duration-300 border border-gray-200 hover:border-gray-300 transform hover:scale-105"
                >
                  <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                  감사로그
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Layout>
  );
}