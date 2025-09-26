'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { auth } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { TenantType, PlanId, IsolationModel, CreateTenantRequest } from '@/types';
import { generateTenantDomain } from '@/lib/domainUtils';
import { 
  ArrowLeftIcon,
  BuildingOffice2Icon,
  UserIcon,
  CogIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  LinkIcon
} from '@heroicons/react/24/outline';

export default function NewTenantPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState<CreateTenantRequest>({
    tenantType: 'ORG',
    tenantName: '',
    plan: 'trial',
    isolationModel: 'Pooled',
    region: 'ap-northeast-2',
    contact: { email: '' },
    orgProfile: {
      legalEntity: '',
      seats: 10,
    },
    labels: {},
    tags: {},
  });
  const [customDomain, setCustomDomain] = useState('');

  const router = useRouter();

  useEffect(() => {
    const currentUser = auth.getUser();
    if (!currentUser || !auth.hasPermission('write')) {
      router.push('/tenants');
      return;
    }
    setUser(currentUser);
  }, [router]);

  if (!user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 유효성 검사
      if (!formData.tenantName.trim()) {
        throw new Error('테넌트명을 입력해주세요.');
      }
      if (!formData.contact.email.trim()) {
        throw new Error('연락처 이메일을 입력해주세요.');
      }
      if (formData.tenantType === 'ORG' && !formData.orgProfile?.legalEntity?.trim()) {
        throw new Error('법인명을 입력해주세요.');
      }

      // 도메인 자동 생성 또는 커스텀 도메인 사용
      const finalFormData = {
        ...formData,
        domain: customDomain || generateTenantDomain(formData.tenantName, formData.plan)
      };
      
      const result = await apiClient.createTenant(finalFormData);
      
      // 성공 시 상세 페이지로 이동
      router.push(`/tenants/${result.tenantId}`);
    } catch (error: any) {
      setError(error.message || '테넌트 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNestedInputChange = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof CreateTenantRequest] as any,
        [field]: value,
      },
    }));
  };

  return (
    <Layout title="새 테넌트 생성" user={user}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
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
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">새 테넌트 생성</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            {error && (
              <div className="bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-xl p-4 sm:p-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 text-red-500">❌</div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm sm:text-base font-semibold text-red-800 mb-1">오류 발생</h3>
                    <p className="text-xs sm:text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 기본 정보 */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-blue-700 px-4 sm:px-6 py-3 sm:py-4">
                <h3 className="text-base sm:text-lg font-semibold text-white flex items-center">
                  <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  기본 정보
                </h3>
              </div>
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                      테넌트 타입
                    </label>
                    <select
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      value={formData.tenantType}
                      onChange={(e) => handleInputChange('tenantType', e.target.value as TenantType)}
                    >
                      <option value="ORG">기업</option>
                      <option value="INDIVIDUAL">개인</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                      테넌트명 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      value={formData.tenantName}
                      onChange={(e) => handleInputChange('tenantName', e.target.value)}
                      placeholder="예: acme"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                    연락처 이메일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    value={formData.contact.email}
                    onChange={(e) => handleNestedInputChange('contact', 'email', e.target.value)}
                    placeholder="admin@example.com"
                  />
                </div>
              </div>
            </div>

            {/* 기업 정보 */}
            {formData.tenantType === 'ORG' && (
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-600 to-green-700 px-4 sm:px-6 py-3 sm:py-4">
                  <h3 className="text-base sm:text-lg font-semibold text-white flex items-center">
                    <BuildingOffice2Icon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    기업 정보
                  </h3>
                </div>
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                        법인명 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                        value={formData.orgProfile?.legalEntity || ''}
                        onChange={(e) => handleNestedInputChange('orgProfile', 'legalEntity', e.target.value)}
                        placeholder="예: Acme Inc."
                      />
                    </div>

                    <div>
                      <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                        좌석 수
                      </label>
                      <input
                        type="number"
                        min="1"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                        value={formData.orgProfile?.seats || 10}
                        onChange={(e) => handleNestedInputChange('orgProfile', 'seats', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 플랜 및 설정 */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-700 px-4 sm:px-6 py-3 sm:py-4">
                <h3 className="text-base sm:text-lg font-semibold text-white flex items-center">
                  <CogIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  플랜 및 설정
                </h3>
              </div>
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                      플랜
                    </label>
                    <select
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      value={formData.plan}
                      onChange={(e) => handleInputChange('plan', e.target.value as PlanId)}
                    >
                      <option value="trial">Trial</option>
                      <option value="starter">Starter</option>
                      <option value="pro">Pro</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                      격리 모델
                    </label>
                    <select
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      value={formData.isolationModel}
                      onChange={(e) => handleInputChange('isolationModel', e.target.value as IsolationModel)}
                    >
                      <option value="Pooled">공유</option>
                      <option value="SiloInVpc">VPC 격리</option>
                      <option value="SiloAccount">계정 격리</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                      리전
                    </label>
                    <select
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      value={formData.region}
                      onChange={(e) => handleInputChange('region', e.target.value)}
                    >
                      <option value="ap-northeast-2">ap-northeast-2 (Seoul)</option>
                      <option value="us-east-1">us-east-1 (N. Virginia)</option>
                      <option value="us-west-2">us-west-2 (Oregon)</option>
                    </select>
                  </div>
                </div>
                
                <div className="sm:col-span-2">
                  <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                    도메인 <span className="text-xs text-gray-500">(선택사항)</span>
                  </label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-mono text-sm"
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value)}
                      placeholder={generateTenantDomain(formData.tenantName || 'example', formData.plan)}
                    />
                    {!customDomain && formData.tenantName && (
                      <div className="mt-2 text-xs text-gray-500">
                        기본 도메인: <span className="font-mono text-blue-600">{generateTenantDomain(formData.tenantName, formData.plan)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                type="button"
                onClick={() => router.push('/tenants')}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    생성 중...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    테넌트 생성
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}