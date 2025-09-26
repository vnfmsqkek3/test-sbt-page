'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Loading from '@/components/Loading';
import { auth } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { AuthUser, Plan } from '@/types';
import { CurrencyDollarIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function PlansPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  
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
          const plansData = await apiClient.getPlans();
          setPlans(plansData);
        } catch (error) {
          console.error('Failed to load plans:', error);
        }
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading text="플랜 정보를 로드하는 중..." />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getPlanColor = (planId: string) => {
    const colors = {
      trial: 'gray',
      starter: 'blue',
      pro: 'purple',
      enterprise: 'indigo',
    };
    return colors[planId as keyof typeof colors] || 'gray';
  };

  const formatPrice = (billing: Plan['billing']) => {
    if (billing.model === 'free') return '무료';
    if (billing.model === 'custom') return '별도 문의';
    return `$${billing.base}/${billing.currency === 'USD' ? '월' : billing.currency}`;
  };

  return (
    <Layout title="플랜 관리" user={user}>
      <div className="space-y-6">
        {/* Plans Overview */}
        <Card title="사용 가능한 플랜">
          <p className="text-sm text-gray-600 mb-6">
            각 플랜별 기본 설정과 엔타이틀먼트를 확인하고 관리할 수 있습니다.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => {
              const color = getPlanColor(plan.planId);
              const colorClasses = {
                gray: 'border-gray-200 text-gray-900',
                blue: 'border-blue-200 text-blue-900 bg-blue-50',
                purple: 'border-purple-200 text-purple-900 bg-purple-50',
                indigo: 'border-indigo-200 text-indigo-900 bg-indigo-50',
              };

              return (
                <div 
                  key={plan.planId}
                  className={`rounded-lg border-2 p-6 ${colorClasses[color as keyof typeof colorClasses]}`}
                >
                  {/* Plan Header */}
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold">{plan.displayName}</h3>
                    <div className="mt-2 flex items-center justify-center">
                      <CurrencyDollarIcon className="h-5 w-5 mr-1" />
                      <span className="text-2xl font-bold">
                        {formatPrice(plan.billing)}
                      </span>
                    </div>
                    <p className="text-sm opacity-75 mt-1">
                      {plan.billing.model} 모델
                    </p>
                  </div>

                  {/* Plan Details */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium mb-2">기본 설정</h4>
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span>격리 모델:</span>
                          <span className="font-medium">{plan.defaults.isolationModel}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">엔타이틀먼트</h4>
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span>최대 세션:</span>
                          <span className="font-medium">{plan.defaults.entitlements['dcv.maxSessions']}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>GPU:</span>
                          <span className="font-medium">{plan.defaults.entitlements['dcv.gpuClass']}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>세션 시간:</span>
                          <span className="font-medium">{plan.defaults.entitlements['session.maxDurationMin']}분</span>
                        </div>
                        <div className="flex justify-between">
                          <span>스토리지:</span>
                          <span className="font-medium">{plan.defaults.entitlements['storage.gb']}GB</span>
                        </div>
                        <div className="flex justify-between">
                          <span>월 Egress:</span>
                          <span className="font-medium">{plan.defaults.entitlements['egress.gbPerMonth']}GB</span>
                        </div>
                      </div>
                    </div>

                    {plan.featureFlags.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">기능</h4>
                        <div className="space-y-1">
                          {plan.featureFlags.map((feature) => (
                            <div key={feature} className="flex items-center text-xs">
                              <CheckIcon className="h-3 w-3 mr-1" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Plans Comparison Table */}
        <Card title="플랜 비교">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    기능
                  </th>
                  {plans.map((plan) => (
                    <th key={plan.planId} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {plan.displayName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    월 요금
                  </td>
                  {plans.map((plan) => (
                    <td key={plan.planId} className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                      {formatPrice(plan.billing)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    최대 세션 수
                  </td>
                  {plans.map((plan) => (
                    <td key={plan.planId} className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                      {plan.defaults.entitlements['dcv.maxSessions']}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    GPU 클래스
                  </td>
                  {plans.map((plan) => (
                    <td key={plan.planId} className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                      {plan.defaults.entitlements['dcv.gpuClass']}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    세션 최대 시간
                  </td>
                  {plans.map((plan) => (
                    <td key={plan.planId} className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                      {plan.defaults.entitlements['session.maxDurationMin']}분
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    스토리지
                  </td>
                  {plans.map((plan) => (
                    <td key={plan.planId} className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                      {plan.defaults.entitlements['storage.gb']}GB
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    월 Egress
                  </td>
                  {plans.map((plan) => (
                    <td key={plan.planId} className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                      {plan.defaults.entitlements['egress.gbPerMonth']}GB
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    격리 모델
                  </td>
                  {plans.map((plan) => (
                    <td key={plan.planId} className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                      {plan.defaults.isolationModel}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    BYOK
                  </td>
                  {plans.map((plan) => (
                    <td key={plan.planId} className="px-6 py-4 whitespace-nowrap text-center">
                      {plan.featureFlags.includes('BYOK') ? (
                        <CheckIcon className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <XMarkIcon className="h-5 w-5 text-gray-300 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    전용 서브넷
                  </td>
                  {plans.map((plan) => (
                    <td key={plan.planId} className="px-6 py-4 whitespace-nowrap text-center">
                      {plan.featureFlags.includes('DedicatedSubnet') ? (
                        <CheckIcon className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <XMarkIcon className="h-5 w-5 text-gray-300 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    화이트 글러브
                  </td>
                  {plans.map((plan) => (
                    <td key={plan.planId} className="px-6 py-4 whitespace-nowrap text-center">
                      {plan.featureFlags.includes('WhiteGlove') ? (
                        <CheckIcon className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <XMarkIcon className="h-5 w-5 text-gray-300 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </Layout>
  );
}