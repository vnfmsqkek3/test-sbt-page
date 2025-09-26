'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { auth } from '@/lib/auth';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = (role: 'PLATFORM_ADMIN' | 'REVIEWER' = 'PLATFORM_ADMIN') => {
    setLoading(true);
    setError(null);

    try {
      // 로컬 개발용 로그인
      auth.login(role);
      router.push('/');
    } catch (error) {
      setError('로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Ediworks SBT Admin
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            컨트롤 플레인 관리자 로그인
          </p>
        </div>

        <Card>
          <div className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      로그인 오류
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <Button
                onClick={() => handleLogin('PLATFORM_ADMIN')}
                loading={loading}
                className="w-full"
                size="lg"
              >
                관리자로 로그인
              </Button>

              <Button
                onClick={() => handleLogin('REVIEWER')}
                loading={loading}
                variant="secondary"
                className="w-full"
                size="lg"
              >
                검토자로 로그인
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                로컬 개발 환경 - 외부 인증 서비스 없이 동작
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}