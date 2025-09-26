'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Loading from '@/components/Loading';
import { auth } from '@/lib/auth';
import { AuthUser } from '@/types';
import { 
  UserIcon, 
  InformationCircleIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  ServerIcon
} from '@heroicons/react/24/outline';

export default function SettingsPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    const initializeAuth = async () => {
      if (!auth.isAuthenticated()) {
        router.push('/login');
        return;
      }

      const currentUser = auth.getUser();
      setUser(currentUser);
      setLoading(false);
    };

    initializeAuth();
  }, [router]);

  const clearLocalData = async () => {
    if (confirm('로컬 저장된 모든 Mock 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      setClearing(true);
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        localStorage.removeItem('mock_tenants');
        localStorage.removeItem('auth_user');
        
        alert('로컬 데이터가 삭제되었습니다. 페이지를 새로고침합니다.');
        window.location.reload();
      } catch (error) {
        console.error('Failed to clear local data:', error);
        alert('데이터 삭제 중 오류가 발생했습니다.');
      } finally {
        setClearing(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading text="설정을 로드하는 중..." />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Layout title="시스템 설정" user={user}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Cog6ToothIcon className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-600" />
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">시스템 설정</h1>
                <p className="text-sm text-gray-500">플랫폼 환경 및 개발 도구 설정</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* User Information Card */}
            <div className="lg:col-span-2">
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-blue-700 px-4 sm:px-6 py-3 sm:py-4">
                  <h3 className="text-base sm:text-lg font-semibold text-white flex items-center">
                    <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    현재 사용자 정보
                  </h3>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center">
                      <UserIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900">{user.email}</h4>
                      <div className="mt-1 sm:mt-2 space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs sm:text-sm text-gray-500">역할:</span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            user.platformRole === 'PLATFORM_ADMIN'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            <ShieldCheckIcon className="h-3 w-3 mr-1" />
                            {user.platformRole === 'PLATFORM_ADMIN' ? '플랫폼 관리자' : '검토자'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs sm:text-sm text-gray-500">권한:</span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            auth.hasPermission('write')
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {auth.hasPermission('write') ? '읽기/쓰기' : '읽기 전용'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-gray-200/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">환경</p>
                    <p className="text-lg sm:text-xl font-bold text-gray-900 mt-1">개발 모드</p>
                  </div>
                  <ServerIcon className="h-8 w-8 sm:h-10 sm:w-10 text-green-500" />
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mt-2">로컬 Mock 데이터 사용 중</p>
              </div>

              <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-gray-200/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">세션</p>
                    <p className="text-lg sm:text-xl font-bold text-gray-900 mt-1">활성</p>
                  </div>
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mt-2">
                  {new Date().toLocaleString('ko-KR')}부터
                </p>
              </div>
            </div>
          </div>

          {/* Development Environment Settings */}
          <div className="mt-6 sm:mt-8">
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
              <div className="bg-gradient-to-r from-yellow-500 to-orange-600 px-4 sm:px-6 py-3 sm:py-4">
                <h3 className="text-base sm:text-lg font-semibold text-white flex items-center">
                  <ExclamationTriangleIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  개발 환경 설정
                </h3>
              </div>
              
              <div className="p-4 sm:p-6">
                {/* Development Info Banner */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200/50 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <InformationCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm sm:text-base font-semibold text-yellow-800 mb-2">
                        로컬 개발 모드
                      </h4>
                      <div className="text-xs sm:text-sm text-yellow-700 space-y-1">
                        <p>• 현재 Mock 데이터와 로컬 인증을 사용하고 있습니다</p>
                        <p>• 실제 운영 환경에서는 AWS Cognito와 백엔드 API가 연동됩니다</p>
                        <p>• 모든 데이터는 브라우저 로컬 스토리지에 임시 저장됩니다</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Local Data Management */}
                <div className="bg-gray-50/50 rounded-2xl p-4 sm:p-6 border border-gray-200/30">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">
                        로컬 데이터 관리
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600">
                        브라우저에 저장된 Mock 데이터(테넌트, 사용자, 인증 정보)를 완전히 초기화합니다. 
                        이 작업은 되돌릴 수 없으며, 페이지가 자동으로 새로고침됩니다.
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <button
                        onClick={clearLocalData}
                        disabled={clearing}
                        className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-medium rounded-xl hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        {clearing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                            초기화 중...
                          </>
                        ) : (
                          <>
                            <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                            데이터 초기화
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Permissions Notice */}
          {!auth.hasPermission('write') && (
            <div className="mt-6 sm:mt-8">
              <div className="bg-blue-50/80 backdrop-blur-sm border border-blue-200/50 rounded-2xl p-4 sm:p-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <InformationCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm sm:text-base font-semibold text-blue-800 mb-2">
                      권한 안내
                    </h4>
                    <p className="text-xs sm:text-sm text-blue-700">
                      현재 검토자 권한으로 로그인되어 있습니다. 
                      시스템 설정 변경을 위해서는 플랫폼 관리자 권한이 필요합니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}