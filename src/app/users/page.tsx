'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Loading from '@/components/Loading';
import { auth } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { AuthUser, User, Tenant } from '@/types';
import { 
  UsersIcon,
  UserPlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  BuildingOffice2Icon,
  EnvelopeIcon,
  PhoneIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  ShieldCheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

type UserWithTenant = User & { tenantName: string; tenantId: string };

interface UserStats {
  total: number;
  active: number;
  invited: number;
  suspended: number;
  byTenant: { [tenantId: string]: { tenantName: string; count: number } };
  byRole: { [role: string]: number };
}

export default function UsersPage() {
  const router = useRouter();
  
  const [user, setUser] = useState<AuthUser | null>(null);
  const [users, setUsers] = useState<UserWithTenant[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithTenant[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [tenantFilter, setTenantFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

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
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Fetching users and stats...');
        
        // Fetch all data in parallel
        const [usersResponse, statsResponse, tenantsResponse] = await Promise.all([
          apiClient.getAllUsers(),
          apiClient.getUserStats(),
          apiClient.getTenants()
        ]);
        
        setUsers(usersResponse.items as UserWithTenant[]);
        setFilteredUsers(usersResponse.items as UserWithTenant[]);
        setStats(statsResponse);
        setTenants(tenantsResponse.items);
        
        console.log('Data loaded successfully:', {
          users: usersResponse.items.length,
          stats: statsResponse,
          tenants: tenantsResponse.items.length
        });
      } catch (error: any) {
        console.error('사용자 정보 로딩 오류:', error);
        setError(error.message || '사용자 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Apply filters whenever filter criteria change
  useEffect(() => {
    let filtered = users;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.email?.toLowerCase().includes(query) ||
        user.tenantName.toLowerCase().includes(query)
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    if (roleFilter) {
      filtered = filtered.filter(user => (user.role || 'MEMBER') === roleFilter);
    }

    if (tenantFilter) {
      filtered = filtered.filter(user => user.tenantId === tenantFilter);
    }

    setFilteredUsers(filtered);
  }, [users, searchQuery, statusFilter, roleFilter, tenantFilter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return CheckCircleIcon;
      case 'INVITED':
        return ClockIcon;
      case 'DISABLED':
        return ExclamationCircleIcon;
      default:
        return ExclamationCircleIcon;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'INVITED':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'DISABLED':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'TENANT_ADMIN':
      case 'BILLING_ADMIN':
        return ShieldCheckIcon;
      case 'MEMBER':
      default:
        return UserIcon;
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setRoleFilter('');
    setTenantFilter('');
    setShowFilters(false);
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <Layout title="사용자 관리" user={user}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">오류 발생</h2>
            <p className="text-sm sm:text-base text-gray-600">{error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="사용자 관리" user={user}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <UsersIcon className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-600" />
                <div>
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">사용자 관리</h1>
                  <p className="text-sm text-gray-500">전체 플랫폼 사용자 관리</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <span className="text-sm sm:text-base text-gray-600">
                  총 <span className="font-semibold text-indigo-600">{stats?.total || 0}</span>명
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Stats Overview */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-gray-200/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">전체</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
                  </div>
                  <UsersIcon className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-gray-200/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-green-600 uppercase tracking-wide">활성</p>
                    <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-1">{stats.active}</p>
                  </div>
                  <CheckCircleIcon className="h-8 w-8 sm:h-12 sm:w-12 text-green-400" />
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-gray-200/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-yellow-600 uppercase tracking-wide">초대됨</p>
                    <p className="text-2xl sm:text-3xl font-bold text-yellow-600 mt-1">{stats.invited}</p>
                  </div>
                  <ClockIcon className="h-8 w-8 sm:h-12 sm:w-12 text-yellow-400" />
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-gray-200/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-red-600 uppercase tracking-wide">비활성</p>
                    <p className="text-2xl sm:text-3xl font-bold text-red-600 mt-1">{stats.suspended}</p>
                  </div>
                  <ExclamationCircleIcon className="h-8 w-8 sm:h-12 sm:w-12 text-red-400" />
                </div>
              </div>
            </div>
          )}

          {/* Search and Filter Controls */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-gray-200/50 p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="사용자 검색 (이름, 이메일, 테넌트)"
                  className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-lg border transition-all duration-200 ${
                  showFilters || statusFilter || roleFilter || tenantFilter
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                필터
                {(statusFilter || roleFilter || tenantFilter) && (
                  <span className="ml-2 px-1.5 py-0.5 text-xs bg-indigo-100 text-indigo-600 rounded-full">
                    {[statusFilter, roleFilter, tenantFilter].filter(Boolean).length}
                  </span>
                )}
              </button>

              {(searchQuery || statusFilter || roleFilter || tenantFilter) && (
                <button
                  onClick={clearFilters}
                  className="flex items-center px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <XMarkIcon className="h-4 w-4 mr-2" />
                  초기화
                </button>
              )}
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
                {/* Status Filter */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">상태</label>
                  <select
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">전체 상태</option>
                    <option value="ACTIVE">활성</option>
                    <option value="INVITED">초대됨</option>
                    <option value="DISABLED">비활성</option>
                  </select>
                </div>

                {/* Role Filter */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">역할</label>
                  <select
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="">전체 역할</option>
                    <option value="TENANT_ADMIN">테넌트 관리자</option>
                    <option value="BILLING_ADMIN">빌링 관리자</option>
                    <option value="MEMBER">멤버</option>
                  </select>
                </div>

                {/* Tenant Filter */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">테넌트</label>
                  <select
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={tenantFilter}
                    onChange={(e) => setTenantFilter(e.target.value)}
                  >
                    <option value="">전체 테넌트</option>
                    {tenants.map((tenant) => (
                      <option key={tenant.tenantId} value={tenant.tenantId}>
                        {tenant.tenantName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Users List */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-gray-200/50 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-700 px-4 sm:px-6 py-3 sm:py-4">
              <h3 className="text-base sm:text-lg font-semibold text-white flex items-center">
                <UsersIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                사용자 목록 ({filteredUsers.length}명)
              </h3>
            </div>

            {filteredUsers.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredUsers.map((user) => {
                  const StatusIcon = getStatusIcon(user.status);
                  const RoleIcon = getRoleIcon(user.role || 'USER');
                  
                  return (
                    <div key={`${user.tenantId}-${user.userId}`} className="p-4 sm:p-6 hover:bg-gray-50/50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center space-x-3 sm:space-x-4">
                          {/* Avatar */}
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base">
                            {(user.email?.slice(0, 1) || 'U').toUpperCase()}
                          </div>
                          
                          {/* User Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="text-sm sm:text-base font-medium text-gray-900 truncate">
                                {user.email}
                              </h4>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(user.status)}`}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {user.status}
                              </span>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-gray-500">
                              <div className="flex items-center">
                                <EnvelopeIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                {user.email}
                              </div>
                              <div className="flex items-center">
                                <RoleIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                {user.role || 'MEMBER'}
                              </div>
                              <div className="flex items-center">
                                <BuildingOffice2Icon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                {user.tenantName}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => router.push(`/tenants/${user.tenantId}`)}
                            className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                          >
                            테넌트 보기
                          </button>
                          
                          <div className="relative">
                            <button className="p-1 sm:p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                              <EllipsisVerticalIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 sm:py-16">
                <UsersIcon className="h-16 w-16 sm:h-20 sm:w-20 text-gray-400 mx-auto mb-4 sm:mb-6" />
                <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">사용자가 없습니다</h3>
                <p className="text-sm sm:text-base text-gray-500">
                  {searchQuery || statusFilter || roleFilter || tenantFilter
                    ? '검색 조건에 맞는 사용자를 찾을 수 없습니다.'
                    : '등록된 사용자가 없습니다.'
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