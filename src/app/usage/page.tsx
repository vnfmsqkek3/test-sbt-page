'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Loading from '@/components/Loading';
import { auth } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { AuthUser, Tenant, UsageSummary, PlanId, TenantStatus } from '@/types';
import { getPlanStyles, getPlanLabel, getPlanGradientClasses } from '@/lib/planStyles';
import { 
  ChartBarIcon, 
  ServerIcon, 
  CloudIcon, 
  ArrowUpTrayIcon,
  ClockIcon,
  CpuChipIcon,
  CircleStackIcon,
  SignalIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowPathIcon,
  EyeIcon,
  CalendarIcon,
  BeakerIcon,
  RocketLaunchIcon,
  StarIcon,
  FireIcon,
  BuildingOffice2Icon
} from '@heroicons/react/24/outline';

interface TenantUsage extends UsageSummary {
  tenantName: string;
  plan: PlanId;
  status: TenantStatus;
}

interface PlanStatistics {
  plan: PlanId;
  tenantCount: number;
  totalSessions: number;
  totalCompute: number;
  totalStorage: number;
  totalEgress: number;
  averageSessions: number;
  averageCompute: number;
  averageStorage: number;
  averageEgress: number;
  tenants: TenantUsage[];
}

export default function UsagePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [tenantUsages, setTenantUsages] = useState<TenantUsage[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PlanId | 'all'>('all');
  const [planStats, setPlanStats] = useState<PlanStatistics[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalSessions: 0,
    totalCompute: 0,
    totalStorage: 0,
    totalEgress: 0,
    totalTenants: 0,
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
          // Get all tenants first
          const tenantsResponse = await apiClient.getTenants({ limit: 100 });
          const tenants = tenantsResponse.items;

          // Get usage data for each tenant
          const usagePromises = tenants.map(async (tenant) => {
            try {
              const usage = await apiClient.getUsage({ 
                tenantId: tenant.tenantId, 
                range: '30d' // Use 30-day range for comprehensive data
              });
              return {
                ...usage,
                tenantName: tenant.tenantName,
                plan: tenant.plan,
                status: tenant.status,
              };
            } catch (error) {
              console.error(`Failed to load usage for ${tenant.tenantId}:`, error);
              return null;
            }
          });

          const usageResults = await Promise.all(usagePromises);
          const validUsages = usageResults.filter((usage): usage is TenantUsage => usage !== null) as TenantUsage[];
          
          setTenantUsages(validUsages);

          // Calculate plan-based statistics
          const planStatsMap = new Map<PlanId, PlanStatistics>();
          
          validUsages.forEach(usage => {
            const plan = usage.plan;
            if (!planStatsMap.has(plan)) {
              planStatsMap.set(plan, {
                plan,
                tenantCount: 0,
                totalSessions: 0,
                totalCompute: 0,
                totalStorage: 0,
                totalEgress: 0,
                averageSessions: 0,
                averageCompute: 0,
                averageStorage: 0,
                averageEgress: 0,
                tenants: []
              });
            }

            const stats = planStatsMap.get(plan)!;
            stats.tenantCount += 1;
            stats.totalSessions += usage.metrics['dcv.sessions.total'];
            stats.totalCompute += usage.metrics['compute.hours'];
            stats.totalStorage += usage.metrics['storage.gb'];
            stats.totalEgress += usage.metrics['egress.gb'];
            stats.tenants.push(usage);
          });

          // Calculate averages for each plan
          const planStatsArray = Array.from(planStatsMap.values()).map(stats => ({
            ...stats,
            averageSessions: stats.tenantCount > 0 ? stats.totalSessions / stats.tenantCount : 0,
            averageCompute: stats.tenantCount > 0 ? stats.totalCompute / stats.tenantCount : 0,
            averageStorage: stats.tenantCount > 0 ? stats.totalStorage / stats.tenantCount : 0,
            averageEgress: stats.tenantCount > 0 ? stats.totalEgress / stats.tenantCount : 0,
          }));

          setPlanStats(planStatsArray);

          // Calculate total statistics
          const totals = validUsages.reduce((acc, usage) => ({
            totalSessions: acc.totalSessions + usage.metrics['dcv.sessions.total'],
            totalCompute: acc.totalCompute + usage.metrics['compute.hours'],
            totalStorage: acc.totalStorage + usage.metrics['storage.gb'],
            totalEgress: acc.totalEgress + usage.metrics['egress.gb'],
            totalTenants: validUsages.length,
          }), { totalSessions: 0, totalCompute: 0, totalStorage: 0, totalEgress: 0, totalTenants: 0 });

          setTotalStats(totals);
        } catch (error) {
          console.error('Failed to load usage data:', error);
        }
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, [router]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(Math.round(num * 100) / 100);
  };

  const getPlanIcon = (plan: PlanId) => {
    switch (plan.toLowerCase()) {
      case 'trial':
        return BeakerIcon;
      case 'starter':
        return RocketLaunchIcon;
      case 'pro':
        return StarIcon;
      case 'enterprise':
        return FireIcon;
      default:
        return BuildingOffice2Icon;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading text="사용량 데이터를 로드하는 중..." />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const planLabels = {
    all: '전체 플랜',
    trial: 'Trial',
    starter: 'Starter',
    pro: 'Professional',
    enterprise: 'Enterprise'
  };

  const availablePlans = ['all', ...Array.from(new Set(tenantUsages.map(t => t.plan)))] as Array<PlanId | 'all'>;

  const filteredUsages = selectedPlan === 'all' 
    ? tenantUsages 
    : tenantUsages.filter(usage => usage.plan === selectedPlan);

  const selectedPlanStats = selectedPlan === 'all' 
    ? null 
    : planStats.find(stat => stat.plan === selectedPlan);

  const getRandomTrend = () => {
    const trends = ['+12.5%', '+8.2%', '-3.1%', '+15.7%', '+5.4%', '-1.8%'];
    const isPositive = Math.random() > 0.3;
    return {
      value: trends[Math.floor(Math.random() * trends.length)],
      positive: isPositive
    };
  };

  return (
    <Layout title="사용량 분석" user={user}>
      <div className="space-y-8 max-w-7xl mx-auto p-6">
        {/* Header with Plan Selector */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl p-8 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <h1 className="text-3xl font-bold mb-2">플랫폼 사용량 분석</h1>
              <p className="text-indigo-100">전체 테넌트의 사용량 통계를 확인하세요.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <div className="flex items-center space-x-2 mb-3">
                <StarIcon className="w-5 h-5 text-white/80" />
                <span className="text-sm font-medium text-white/80">플랜 선택</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {availablePlans.map((plan) => (
                  <button
                    key={plan}
                    onClick={() => setSelectedPlan(plan)}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                      selectedPlan === plan
                        ? 'bg-white text-indigo-600 shadow-lg'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    {plan === 'all' ? '전체' : getPlanLabel(plan)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>


        {/* Current Selection Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <ChartBarIcon className="w-6 h-6" />
              </div>
              <div className="text-right">
                <div className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-200">
                  {selectedPlan === 'all' ? '전체' : getPlanLabel(selectedPlan)}
                </div>
              </div>
            </div>
            <div>
              <p className="text-blue-100 text-sm font-medium">총 세션 수</p>
              <p className="text-3xl font-bold">
                {selectedPlan === 'all' 
                  ? formatNumber(totalStats.totalSessions)
                  : formatNumber(selectedPlanStats?.totalSessions || 0)
                }
              </p>
              <p className="text-blue-200 text-xs mt-1">
                {selectedPlan === 'all' ? '전체 테넌트' : `${selectedPlanStats?.tenantCount || 0}개 테넌트`}
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <CpuChipIcon className="w-6 h-6" />
              </div>
              <div className="text-right">
                <div className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-200">
                  평균
                </div>
              </div>
            </div>
            <div>
              <p className="text-emerald-100 text-sm font-medium">평균 컴퓨팅 시간</p>
              <p className="text-3xl font-bold">
                {selectedPlan === 'all' 
                  ? formatNumber(totalStats.totalTenants > 0 ? totalStats.totalCompute / totalStats.totalTenants : 0)
                  : formatNumber(selectedPlanStats?.averageCompute || 0)
                }<span className="text-lg">h</span>
              </p>
              <p className="text-emerald-200 text-xs mt-1">테넌트당 평균</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <CircleStackIcon className="w-6 h-6" />
              </div>
              <div className="text-right">
                <div className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-200">
                  평균
                </div>
              </div>
            </div>
            <div>
              <p className="text-purple-100 text-sm font-medium">평균 스토리지 사용량</p>
              <p className="text-3xl font-bold">
                {selectedPlan === 'all' 
                  ? formatNumber(totalStats.totalTenants > 0 ? totalStats.totalStorage / totalStats.totalTenants : 0)
                  : formatNumber(selectedPlanStats?.averageStorage || 0)
                }<span className="text-lg">GB</span>
              </p>
              <p className="text-purple-200 text-xs mt-1">테넌트당 평균</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-rose-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <SignalIcon className="w-6 h-6" />
              </div>
              <div className="text-right">
                <div className="text-xs px-2 py-1 rounded-full bg-rose-500/20 text-rose-200">
                  총계
                </div>
              </div>
            </div>
            <div>
              <p className="text-orange-100 text-sm font-medium">총 데이터 전송</p>
              <p className="text-3xl font-bold">
                {selectedPlan === 'all' 
                  ? formatNumber(totalStats.totalEgress)
                  : formatNumber(selectedPlanStats?.totalEgress || 0)
                }<span className="text-lg">GB</span>
              </p>
              <p className="text-orange-200 text-xs mt-1">Egress 트래픽</p>
            </div>
          </div>
        </div>

        {/* Usage Summary Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">테넌트 수</h3>
              <BuildingOffice2Icon className="w-5 h-5 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {selectedPlan === 'all' ? totalStats.totalTenants : selectedPlanStats?.tenantCount || 0}
            </div>
            <p className="text-gray-600 text-sm">
              {selectedPlan === 'all' ? '전체 활성 테넌트' : `${getPlanLabel(selectedPlan)} 플랜`}
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">평균 세션</h3>
              <ChartBarIcon className="w-5 h-5 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {selectedPlan === 'all' 
                ? (totalStats.totalTenants > 0 ? Math.round(totalStats.totalSessions / totalStats.totalTenants) : 0)
                : Math.round(selectedPlanStats?.averageSessions || 0)
              }
            </div>
            <p className="text-gray-600 text-sm">테넌트당 평균</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">마지막 업데이트</h3>
              <ClockIcon className="w-5 h-5 text-gray-400" />
            </div>
            <div className="text-lg font-bold text-gray-900 mb-2">
              {new Date().toLocaleDateString('ko-KR', { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            <p className="text-gray-600 text-sm">실시간 데이터</p>
          </div>
        </div>

        {/* Tenant Usage Cards */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
          <div className="bg-gradient-to-r from-gray-50/80 to-white/60 px-6 py-4 border-b border-gray-200/50 backdrop-blur-sm rounded-t-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                {selectedPlan === 'all' ? '전체 테넌트 사용량' : `${getPlanLabel(selectedPlan)} 플랜 사용량`}
              </h3>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <EyeIcon className="w-4 h-4" />
                <span>{filteredUsages.length}개 테넌트</span>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsages.map((usage, index) => {
                const trend = getRandomTrend();
                return (
                  <div
                    key={usage.tenantId}
                    onClick={() => {
                      // All tenants can be viewed for basic info, but usage analytics only for acme
                      router.push(`/tenants/${usage.tenantId}`);
                    }}
                    className={`rounded-xl border-2 p-5 hover:shadow-lg transform hover:scale-105 transition-all duration-300 cursor-pointer ${getPlanGradientClasses(usage.plan)}`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 bg-gradient-to-br ${getPlanStyles(usage.plan).gradient} rounded-lg flex items-center justify-center text-white font-bold text-sm`}>
                          {usage.tenantName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{usage.tenantName}</h4>
                          <p className="text-xs text-gray-500 font-mono">{usage.tenantId}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center text-xs px-2 py-1 rounded-full font-semibold border ${getPlanStyles(usage.plan).badge}`}>
                        {getPlanLabel(usage.plan).toUpperCase()}
                      </span>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center mx-auto mb-2">
                          <ChartBarIcon className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {formatNumber(usage.metrics['dcv.sessions.total'])}
                        </div>
                        <div className="text-xs text-gray-600">세션</div>
                      </div>

                      <div className="text-center p-3 bg-emerald-50 rounded-lg">
                        <div className="w-6 h-6 bg-emerald-500 rounded-md flex items-center justify-center mx-auto mb-2">
                          <CpuChipIcon className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {formatNumber(usage.metrics['compute.hours'])}h
                        </div>
                        <div className="text-xs text-gray-600">컴퓨팅</div>
                      </div>

                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="w-6 h-6 bg-purple-500 rounded-md flex items-center justify-center mx-auto mb-2">
                          <CircleStackIcon className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {formatNumber(usage.metrics['storage.gb'])}GB
                        </div>
                        <div className="text-xs text-gray-600">스토리지</div>
                      </div>

                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="w-6 h-6 bg-orange-500 rounded-md flex items-center justify-center mx-auto mb-2">
                          <SignalIcon className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {formatNumber(usage.metrics['egress.gb'])}GB
                        </div>
                        <div className="text-xs text-gray-600">Egress</div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                      <div className="flex items-center space-x-2">
                        <div className={`text-xs px-2 py-1 rounded-full flex items-center space-x-1 ${
                          trend.positive 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {trend.positive ? (
                            <ArrowTrendingUpIcon className="w-3 h-3" />
                          ) : (
                            <ArrowTrendingDownIcon className="w-3 h-3" />
                          )}
                          <span>{trend.value}</span>
                        </div>
                        <div className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full flex items-center space-x-1">
                          <EyeIcon className="w-3 h-3" />
                          <span>{usage.tenantName === 'acme' ? '상세 분석 보기' : '기본 정보 보기'}</span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(usage.updatedAt).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {filteredUsages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ChartBarIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">사용량 데이터가 없습니다</h3>
                <p className="text-gray-600">
                  {selectedPlan === 'all' 
                    ? '사용량 정보가 없습니다.' 
                    : `${getPlanLabel(selectedPlan)} 플랜에 대한 사용량 정보가 없습니다.`
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