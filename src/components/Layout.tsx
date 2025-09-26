'use client';

import { ReactNode, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { AuthUser } from '@/types';
import {
  HomeIcon,
  BuildingOffice2Icon,
  UsersIcon,
  ChartBarIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  GlobeAltIcon,
  HeartIcon,
  ShieldCheckIcon,
  BeakerIcon,
  BellIcon,
  UserCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

interface LayoutProps {
  children: ReactNode;
  title: string;
  user?: AuthUser | null;
}

const navigation = [
  { name: '대시보드', href: '/', icon: HomeIcon },
  { name: '테넌트', href: '/tenants', icon: BuildingOffice2Icon },
  { name: '사용자', href: '/users', icon: UsersIcon },
  { name: '사용량', href: '/usage', icon: ChartBarIcon },
  { name: '감사로그', href: '/audit', icon: DocumentTextIcon },
  { name: '설정', href: '/settings', icon: Cog6ToothIcon },
];

export default function Layout({ children, title, user }: LayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSignOut = async () => {
    try {
      auth.logout();
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen">
        <main className="py-10">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Mobile menu overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white/90 backdrop-blur-xl border-r border-gray-200/50 transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Mobile Close Button */}
        <div className="lg:hidden flex justify-end p-4">
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        {/* Logo Section - Always Full Width */}
        <div className="bg-gradient-to-r from-white/70 via-white/80 to-white/70 backdrop-blur-xl px-6 py-4 border-b border-gray-200/50 shadow-sm">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <BuildingOffice2Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">EdiWorks</div>
              <div className="text-xs text-gray-500">SBT Admin</div>
            </div>
          </Link>
        </div>
        
        {/* Collapsible Navigation Section */}
        <div className={`flex-1 transition-all duration-300 overflow-hidden ${sidebarCollapsed ? 'w-16' : 'w-full'}`}>
          {/* Collapse/Expand Button - Inside Navigation Area */}
          <div className="flex justify-end px-4 py-2">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
              title={sidebarCollapsed ? '메뉴 펼치기' : '메뉴 접기'}
            >
              {sidebarCollapsed ? (
                <ChevronRightIcon className="h-5 w-5" />
              ) : (
                <ChevronLeftIcon className="h-5 w-5" />
              )}
            </button>
          </div>
          
          <nav className={`${sidebarCollapsed ? 'px-2' : 'px-4'} pb-6 space-y-1 overflow-y-auto`}>
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/' && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center ${sidebarCollapsed ? 'px-3 py-3 justify-center' : 'px-3 py-2.5'} text-sm font-medium rounded-lg transition-all duration-200 relative ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <item.icon className={`h-5 w-5 transition-colors ${sidebarCollapsed ? '' : 'mr-3'} ${
                    isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'
                  }`} />
                  {!sidebarCollapsed && (
                    <>
                      {item.name}
                      {isActive && (
                        <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                      )}
                    </>
                  )}
                  {sidebarCollapsed && isActive && (
                    <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-full"></div>
                  )}
                  
                  {/* Tooltip for collapsed state */}
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                      {item.name}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navigation */}
        <header className="bg-white/60 backdrop-blur-xl border-b border-gray-200/50 lg:hidden">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <div className="text-lg font-semibold text-gray-900">{title}</div>
            
            {/* Mobile Logout Button */}
            <button
              onClick={handleSignOut}
              className="p-2 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
              title="로그아웃"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Enhanced Header - Desktop only */}
        <header className="hidden lg:block bg-gradient-to-r from-white/70 via-white/80 to-white/70 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                    {title}
                  </h1>
                  <div className="flex items-center mt-1 text-sm text-gray-500">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse mr-2"></div>
                    <span className="font-medium">시스템 정상 운영 중</span>
                    <div className="mx-2 w-px h-4 bg-gray-300"></div>
                    <GlobeAltIcon className="w-4 h-4 mr-1 text-blue-500" />
                    <span className="text-xs">Seoul Region</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Quick Actions */}
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200 relative group">
                    <BellIcon className="w-5 h-5" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <div className="absolute bottom-full right-0 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      알림 2개
                    </div>
                  </button>
                  <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200 group">
                    <UserCircleIcon className="w-5 h-5" />
                    <div className="absolute bottom-full right-0 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      프로필
                    </div>
                  </button>
                </div>
                
                <div className="h-8 w-px bg-gray-200"></div>
                
                {/* User Info & Logout */}
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {user.email?.split('@')[0]}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center">
                      <ShieldCheckIcon className="w-3 h-3 mr-1" />
                      {user.platformRole === 'PLATFORM_ADMIN' ? '관리자' : '검토자'}
                    </div>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    {user.email?.slice(0, 2).toUpperCase()}
                  </div>
                  
                  {/* Logout Button */}
                  <button
                    onClick={handleSignOut}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group"
                    title="로그아웃"
                  >
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                    <div className="absolute bottom-full right-0 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      로그아웃
                    </div>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Secondary Header Bar */}
            <div className="mt-3 pt-3 border-t border-gray-100/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6 text-xs text-gray-500">
                  <div className="flex items-center space-x-2">
                    <BeakerIcon className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">Development Environment</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>Last Updated:</span>
                    <span className="font-medium text-gray-700">
                      {new Date().toLocaleString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>API Connected</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span>WebSocket Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-gradient-to-br from-gray-50/50 via-white/30 to-gray-50/50">
          <div className="h-full">
            {children}
          </div>
        </main>
        
        {/* Enhanced Footer */}
        <footer className="bg-gradient-to-r from-gray-50/80 via-white/90 to-gray-50/80 backdrop-blur-xl border-t border-gray-200/50">
          <div className="px-8 py-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
              {/* Left Section - Company Info */}
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <BuildingOffice2Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">EdiWorks SBT</div>
                    <div className="text-xs text-gray-500">Multi-Tenant Management Platform</div>
                  </div>
                </div>
                
                <div className="hidden lg:flex items-center space-x-6 text-xs text-gray-500">
                  <Link href="/" className="hover:text-indigo-600 transition-colors flex items-center space-x-1">
                    <HomeIcon className="w-4 h-4" />
                    <span>홈</span>
                  </Link>
                  <Link href="/help" className="hover:text-indigo-600 transition-colors">
                    도움말
                  </Link>
                  <Link href="/api-docs" className="hover:text-indigo-600 transition-colors">
                    API 문서
                  </Link>
                  <Link href="/support" className="hover:text-indigo-600 transition-colors">
                    지원
                  </Link>
                </div>
              </div>
              
              {/* Center Section - Status Indicators */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-gray-600 font-medium">All Systems Operational</span>
                </div>
                <div className="h-4 w-px bg-gray-300"></div>
                <div className="text-xs text-gray-500">
                  Version 2.1.0
                </div>
              </div>
              
              {/* Right Section - Legal & Social */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>© 2024 EdiWorks</span>
                  <Link href="/privacy" className="hover:text-indigo-600 transition-colors">
                    개인정보처리방침
                  </Link>
                  <Link href="/terms" className="hover:text-indigo-600 transition-colors">
                    이용약관
                  </Link>
                </div>
                
                <div className="flex items-center space-x-1">
                  <HeartIcon className="w-4 h-4 text-red-400" />
                  <span className="text-xs text-gray-500">Made in Seoul</span>
                </div>
              </div>
            </div>
            
            {/* Mobile Footer Links */}
            <div className="lg:hidden mt-4 pt-4 border-t border-gray-200/50">
              <div className="flex flex-wrap items-center justify-center space-x-4 text-xs text-gray-500">
                <Link href="/" className="hover:text-indigo-600 transition-colors flex items-center space-x-1">
                  <HomeIcon className="w-3 h-3" />
                  <span>홈</span>
                </Link>
                <Link href="/help" className="hover:text-indigo-600 transition-colors">도움말</Link>
                <Link href="/api-docs" className="hover:text-indigo-600 transition-colors">API</Link>
                <Link href="/support" className="hover:text-indigo-600 transition-colors">지원</Link>
                <Link href="/privacy" className="hover:text-indigo-600 transition-colors">개인정보</Link>
                <Link href="/terms" className="hover:text-indigo-600 transition-colors">약관</Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}