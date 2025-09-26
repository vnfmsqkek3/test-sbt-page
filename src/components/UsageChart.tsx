'use client';

import { useState, useEffect, useRef } from 'react';
import { ChartBarIcon, CalendarIcon, ServerIcon, CircleStackIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { apiClient } from '@/lib/api';

interface ChartDataPoint {
  date: string;
  compute: number;
  storage: number;
  egress: number;
}

interface UsageChartProps {
  tenantName?: string;
  period?: 'week' | 'month';
}

const generateMockData = (period: 'week' | 'month'): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  const days = period === 'week' ? 7 : 30;
  
  // Realistic computing patterns for acme tenant
  const baseCompute = 120; // Base hours per day
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    // Create realistic computing usage patterns
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isBusinessHours = !isWeekend;
    
    // Business days have higher usage with patterns
    let computeMultiplier = 1.0;
    
    if (isBusinessHours) {
      // Monday to Friday patterns
      switch (dayOfWeek) {
        case 1: // Monday - High usage (catching up)
          computeMultiplier = 1.3 + Math.sin(i * 0.2) * 0.2;
          break;
        case 2: // Tuesday - Peak usage
          computeMultiplier = 1.4 + Math.sin(i * 0.15) * 0.3;
          break;
        case 3: // Wednesday - Peak usage
          computeMultiplier = 1.5 + Math.sin(i * 0.1) * 0.25;
          break;
        case 4: // Thursday - High usage
          computeMultiplier = 1.3 + Math.sin(i * 0.12) * 0.2;
          break;
        case 5: // Friday - Lower usage (winding down)
          computeMultiplier = 1.0 + Math.sin(i * 0.18) * 0.15;
          break;
      }
    } else {
      // Weekend - Much lower usage
      computeMultiplier = 0.2 + Math.random() * 0.3;
    }
    
    // Add occasional spikes for heavy workloads
    if (Math.random() > 0.82) {
      computeMultiplier *= 1.8; // Spike days
    }
    
    // Add some deployment/maintenance dips
    if (Math.random() > 0.92) {
      computeMultiplier *= 0.3; // Maintenance days
    }
    
    const compute = Math.round(baseCompute * computeMultiplier + (Math.random() * 30 - 15));
    
    data.push({
      date: date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
      compute: Math.max(5, compute), // Ensure minimum value
      storage: Math.floor(Math.random() * 80) + 420, // More stable storage
      egress: Math.floor(Math.random() * 40) + 15, // More stable egress
    });
  }
  
  return data;
};

export default function UsageChart({ tenantName = 'acme', period: initialPeriod = 'week' }: UsageChartProps) {
  const [period, setPeriod] = useState<'week' | 'month'>(initialPeriod);
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [originalData, setOriginalData] = useState<ChartDataPoint[]>([]); // Store original full data
  const [animationKey, setAnimationKey] = useState(0);
  const [selectedMetric, setSelectedMetric] = useState<'all' | 'compute' | 'storage' | 'egress'>('compute');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDateData, setSelectedDateData] = useState<{
    date: string;
    compute: number;
    storage: number;
    egress: number;
    details: {
      computeBreakdown: { time: string; usage: number; type: string }[];
      storageBreakdown: { time: string; usage: number; type: string }[];
      egressBreakdown: { time: string; usage: number; type: string }[];
    }
  } | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Generate detailed usage data for a specific date
  const generateDetailedUsageData = (date: string, compute: number, storage: number, egress: number) => {
    return {
      date,
      compute,
      storage,
      egress,
      details: {
        computeBreakdown: [
          { time: '00:00-06:00', usage: Math.round(compute * 0.15), type: 'Batch Processing' },
          { time: '06:00-12:00', usage: Math.round(compute * 0.35), type: 'Peak Usage' },
          { time: '12:00-18:00', usage: Math.round(compute * 0.30), type: 'Business Hours' },
          { time: '18:00-24:00', usage: Math.round(compute * 0.20), type: 'Evening Tasks' },
        ],
        storageBreakdown: [
          { time: '데이터베이스', usage: Math.round(storage * 0.45), type: 'Database' },
          { time: '로그 파일', usage: Math.round(storage * 0.25), type: 'Logs' },
          { time: '백업', usage: Math.round(storage * 0.20), type: 'Backup' },
          { time: '임시 파일', usage: Math.round(storage * 0.10), type: 'Temporary' },
        ],
        egressBreakdown: [
          { time: 'API 응답', usage: Math.round(egress * 0.50), type: 'API Response' },
          { time: '정적 콘텐츠', usage: Math.round(egress * 0.30), type: 'Static Content' },
          { time: '백업 전송', usage: Math.round(egress * 0.15), type: 'Backup Transfer' },
          { time: '기타', usage: Math.round(egress * 0.05), type: 'Other' },
        ],
      }
    };
  };

  // Handle date selection from calendar
  const handleDateSelect = (dateStr: string) => {
    const selectedPoint = originalData.find(point => {
      const pointDate = new Date(dateStr);
      return point.date === `${pointDate.getMonth() + 1}월 ${pointDate.getDate()}일`;
    });

    if (selectedPoint) {
      const detailData = generateDetailedUsageData(
        dateStr, 
        selectedPoint.compute, 
        selectedPoint.storage, 
        selectedPoint.egress
      );
      setSelectedDateData(detailData);
      
      // Set data to show only the selected date
      setData([selectedPoint]);
      setAnimationKey(prev => prev + 1);
      
      // Trigger animation
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 800);
    }
    setSelectedDate(dateStr);
    setShowCalendar(false);
  };

  // Reset to show all data
  const resetToAllData = () => {
    setData(originalData);
    setSelectedDate(null);
    setSelectedDateData(null);
    setAnimationKey(prev => prev + 1);
    
    // Trigger animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 1000);
  };

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };

    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar]);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use the new analytics API endpoint
        const analyticsData = await apiClient.getTenantUsageAnalytics(tenantName);
        
        // Convert API data to chart format
        const chartData: ChartDataPoint[] = analyticsData.metrics.compute.map((item, index) => ({
          date: item.date,
          compute: item.value,
          storage: analyticsData.metrics.storage[index]?.value || 0,
          egress: analyticsData.metrics.egress[index]?.value || 0,
        }));
        
        // Filter data based on period
        const filteredData = period === 'week' ? chartData.slice(-7) : chartData;
        
        setOriginalData(filteredData); // Store original data
        setData(filteredData);
        setAnimationKey(prev => prev + 1);
        
        // Trigger animation
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 1000);
      } catch (error: any) {
        console.error('Failed to fetch analytics data:', error);
        setError(error.message || 'Failed to load analytics data');
        // Fallback to realistic mock data optimized for computing visualization
        const mockData = generateMockData(period);
        console.log('Using enhanced mock computing data:', mockData);
        setOriginalData(mockData); // Store original data
        setData(mockData);
        setAnimationKey(prev => prev + 1);
        
        // Trigger animation
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 1200);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [period, tenantName]);

  const maxCompute = Math.max(...data.map(d => d.compute));
  const maxStorage = Math.max(...data.map(d => d.storage));
  const maxEgress = Math.max(...data.map(d => d.egress));

  const totalCompute = data.reduce((sum, d) => sum + d.compute, 0);
  const totalStorage = data.reduce((sum, d) => sum + d.storage, 0);
  const totalEgress = data.reduce((sum, d) => sum + d.egress, 0);

  const avgCompute = Math.round(totalCompute / data.length);
  const avgStorage = Math.round(totalStorage / data.length);
  const avgEgress = Math.round(totalEgress / data.length);

  const metrics = [
    {
      name: 'compute',
      label: 'Compute',
      value: totalCompute,
      avg: avgCompute,
      unit: 'hours',
      color: 'blue',
      icon: ServerIcon,
      gradient: 'from-blue-400 to-blue-600',
    },
    {
      name: 'storage',
      label: 'Storage',
      value: totalStorage,
      avg: avgStorage,
      unit: 'GB',
      color: 'purple',
      icon: CircleStackIcon,
      gradient: 'from-purple-400 to-purple-600',
    },
    {
      name: 'egress',
      label: 'Egress',
      value: totalEgress,
      avg: avgEgress,
      unit: 'GB',
      color: 'green',
      icon: ArrowTrendingUpIcon,
      gradient: 'from-green-400 to-green-600',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent mr-3"></div>
            <span className="text-gray-600">차트 데이터를 로드하는 중...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50/80 backdrop-blur-xl rounded-2xl shadow-xl border border-red-200/50 p-8">
          <div className="text-center">
            <ChartBarIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">차트 로드 오류</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div className="flex items-center space-x-3">
          <ChartBarIcon className="h-6 w-6 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            사용량 분석 ({tenantName})
            {selectedDate && (
              <span className="ml-2 text-sm font-normal text-indigo-600">
                - {new Date(selectedDate).toLocaleDateString('ko-KR', { 
                  month: 'long', 
                  day: 'numeric',
                  weekday: 'short'
                })}
              </span>
            )}
          </h3>
          {selectedDate && (
            <button
              onClick={resetToAllData}
              className="ml-3 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200 flex items-center space-x-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>전체 보기</span>
            </button>
          )}
        </div>
        
        {/* Period Selector */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => {
                setPeriod('week');
                resetToAllData(); // Reset to all data when changing period
              }}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md transition-all ${
                period === 'week'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span className="text-sm font-medium">일주일</span>
            </button>
            <button
              onClick={() => {
                setPeriod('month');
                resetToAllData(); // Reset to all data when changing period
              }}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md transition-all ${
                period === 'month'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span className="text-sm font-medium">한달</span>
            </button>
          </div>
          
          {/* Calendar Picker */}
          <div className="relative" ref={calendarRef}>
            <button
              onClick={() => setShowCalendar(!showCalendar)}
              className="flex items-center space-x-2 px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <CalendarDaysIcon className="w-4 h-4" />
              <span className="text-sm font-medium">날짜 선택</span>
            </button>
            
            {/* Calendar Dropdown */}
            {showCalendar && (
              <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-4 min-w-[280px]">
                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">사용량 조회 날짜 선택</h4>
                  <p className="text-xs text-gray-600">2025년 9월 20일 ~ 26일 기간에서 선택하세요</p>
                </div>
                
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {/* September 2025 dates for the specific period */}
                  {[
                    { date: '2025-09-20', day: 20, available: true },
                    { date: '2025-09-21', day: 21, available: true },
                    { date: '2025-09-22', day: 22, available: true },
                    { date: '2025-09-23', day: 23, available: true },
                    { date: '2025-09-24', day: 24, available: true },
                    { date: '2025-09-25', day: 25, available: true },
                    { date: '2025-09-26', day: 26, available: true },
                  ].map((dateItem, index) => (
                    <button
                      key={dateItem.date}
                      onClick={() => handleDateSelect(dateItem.date)}
                      className={`text-sm p-2 rounded-md transition-all duration-200 ${
                        selectedDate === dateItem.date
                          ? 'bg-indigo-500 text-white font-semibold'
                          : dateItem.available
                          ? 'hover:bg-indigo-50 text-gray-700 hover:text-indigo-600'
                          : 'text-gray-300 cursor-not-allowed'
                      }`}
                      disabled={!dateItem.available}
                      style={{ gridColumn: index === 0 ? 7 : 'auto' }} // Saturday starts at column 7
                    >
                      {dateItem.day}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.name}
            onClick={() => setSelectedMetric(selectedMetric === metric.name as any ? 'all' : metric.name as any)}
            className={`relative overflow-hidden bg-gradient-to-br ${metric.gradient} rounded-xl p-6 text-white shadow-lg hover:shadow-xl transform transition-all duration-300 cursor-pointer ${
              selectedMetric === metric.name || selectedMetric === 'all'
                ? 'scale-100 opacity-100'
                : 'scale-95 opacity-50'
            }`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <metric.icon className="h-8 w-8 text-white/80" />
                <div className="text-right">
                  {metric.value > metric.avg && (
                    <ArrowTrendingUpIcon className="h-4 w-4 text-white/60" />
                  )}
                  {metric.value < metric.avg && (
                    <ArrowTrendingDownIcon className="h-4 w-4 text-white/60" />
                  )}
                </div>
              </div>
              <h4 className="text-white/90 text-sm font-medium mb-1">{metric.label}</h4>
              <p className="text-2xl font-bold">
                {metric.value.toLocaleString()} <span className="text-sm font-normal text-white/80">{metric.unit}</span>
              </p>
              <p className="text-xs text-white/60 mt-2">
                평균: {metric.avg.toLocaleString()} {metric.unit}/{period === 'week' ? '일' : '일'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 p-6">
        <div className="space-y-6">
          {/* Chart Bars */}
          <div className="relative h-64">
            <div className="absolute inset-0 flex items-end justify-between space-x-1">
              {data.map((point, index) => (
                <div
                  key={`${animationKey}-${index}`}
                  className="flex-1 flex flex-col items-center justify-end space-y-1"
                  style={{
                    animation: `slideUp ${0.3 + index * 0.03}s ease-out`,
                    animationDelay: `${index * 0.05}s`,
                    animationFillMode: 'both'
                  }}
                >
                  {/* Compute Bar - Primary focus */}
                  {(selectedMetric === 'all' || selectedMetric === 'compute') && (
                    <div
                      className="w-full bg-gradient-to-t from-blue-600 via-blue-500 to-blue-400 rounded-t-lg shadow-lg cursor-pointer relative overflow-hidden group"
                      style={{
                        height: `${Math.max(8, (point.compute / maxCompute) * 200)}px`,
                        transformOrigin: 'bottom',
                        animation: `growUp ${0.8 + index * 0.04}s cubic-bezier(0.4, 0.0, 0.2, 1)`,
                        animationDelay: `${0.2 + index * 0.05}s`,
                        animationFillMode: 'both'
                      }}
                    >
                      {/* Shimmer effect for computing bars */}
                      <div 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12"
                        style={{
                          animation: `shimmer 2s ease-in-out ${0.5 + index * 0.1}s infinite`
                        }}
                      ></div>
                      {/* Tooltip on hover */}
                      <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-3 py-2 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-lg z-10 pointer-events-none">
                        <div className="text-center">
                          <div className="font-semibold text-blue-300">{point.date}</div>
                          <div className="mt-1">
                            <div className="text-blue-200">컴퓨팅: {point.compute.toLocaleString()}시간</div>
                            {selectedMetric === 'all' && (
                              <>
                                <div className="text-purple-200">스토리지: {point.storage.toLocaleString()}GB</div>
                                <div className="text-green-200">Egress: {point.egress.toLocaleString()}GB</div>
                              </>
                            )}
                          </div>
                        </div>
                        {/* Tooltip arrow */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                  )}
                  {/* Storage Bar */}
                  {(selectedMetric === 'all' || selectedMetric === 'storage') && (
                    <div
                      className="w-full bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-md opacity-60 cursor-pointer relative group"
                      style={{
                        height: `${Math.max(6, (point.storage / maxStorage) * 150)}px`,
                        transformOrigin: 'bottom',
                        animation: `growUp ${0.6 + index * 0.04}s ease-out`,
                        animationDelay: `${0.4 + index * 0.05}s`,
                        animationFillMode: 'both'
                      }}
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-3 py-2 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-lg z-10 pointer-events-none">
                        <div className="text-center">
                          <div className="font-semibold text-purple-300">{point.date}</div>
                          <div className="text-purple-200 mt-1">스토리지: {point.storage.toLocaleString()}GB</div>
                        </div>
                        {/* Tooltip arrow */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                  )}
                  {/* Egress Bar */}
                  {(selectedMetric === 'all' || selectedMetric === 'egress') && (
                    <div
                      className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t-md opacity-60 cursor-pointer relative group"
                      style={{
                        height: `${Math.max(4, (point.egress / maxEgress) * 120)}px`,
                        transformOrigin: 'bottom',
                        animation: `growUp ${0.7 + index * 0.04}s ease-out`,
                        animationDelay: `${0.6 + index * 0.05}s`,
                        animationFillMode: 'both'
                      }}
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-3 py-2 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-lg z-10 pointer-events-none">
                        <div className="text-center">
                          <div className="font-semibold text-green-300">{point.date}</div>
                          <div className="text-green-200 mt-1">Egress: {point.egress.toLocaleString()}GB</div>
                        </div>
                        {/* Tooltip arrow */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Loading overlay during animation */}
            {isAnimating && (
              <div className="absolute inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <div className="text-indigo-600 font-medium">차트 업데이트 중...</div>
              </div>
            )}
          </div>

          {/* X-axis labels */}
          <div className="flex justify-between text-xs text-gray-500">
            {data.map((point, index) => (
              <div key={index} className="flex-1 text-center">
                {index % (period === 'week' ? 1 : 5) === 0 && point.date}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center space-x-6 pt-4 border-t border-gray-100">
            <button
              onClick={() => setSelectedMetric('all')}
              className={`flex items-center space-x-2 transition-all duration-300 px-3 py-2 rounded-lg hover:bg-gray-50 ${
                selectedMetric === 'all' ? 'opacity-100 bg-gray-100 font-semibold' : 'opacity-60 hover:opacity-100'
              }`}
            >
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <span className="text-sm text-gray-600">전체</span>
            </button>
            {metrics.map((metric) => {
              const isActive = selectedMetric === 'all' || selectedMetric === metric.name;
              const isCompute = metric.name === 'compute';
              return (
                <button
                  key={metric.name}
                  onClick={() => setSelectedMetric(metric.name as any)}
                  className={`flex items-center space-x-2 transition-all duration-300 px-3 py-2 rounded-lg hover:bg-gray-50 ${
                    isActive
                      ? 'opacity-100 bg-gray-100 font-semibold transform scale-105'
                      : 'opacity-60 hover:opacity-100 hover:scale-102'
                  } ${isCompute ? 'ring-2 ring-blue-200' : ''}`}
                >
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${metric.gradient} ${isActive ? 'animate-pulse' : ''}`}></div>
                  <span className={`text-sm ${isActive ? 'text-gray-800 font-medium' : 'text-gray-600'}`}>{metric.label}</span>
                  {isCompute && (
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-bold">HOT</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDateData && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <CalendarDaysIcon className="w-5 h-5 text-indigo-600 mr-2" />
                {new Date(selectedDateData.date).toLocaleDateString('ko-KR', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  weekday: 'long'
                })} 세부 사용량
              </h3>
              <button
                onClick={() => setSelectedDateData(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Compute Details */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
              <div className="flex items-center mb-4">
                <ServerIcon className="w-6 h-6 text-blue-600 mr-3" />
                <div>
                  <h4 className="font-semibold text-blue-900">컴퓨팅 사용량</h4>
                  <p className="text-sm text-blue-700">{selectedDateData.compute.toLocaleString()}시간</p>
                </div>
              </div>
              <div className="space-y-3">
                {selectedDateData.details.computeBreakdown.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-800">{item.time}</div>
                      <div className="text-xs text-gray-600">{item.type}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-blue-700">{item.usage.toLocaleString()}시간</div>
                      <div className="text-xs text-gray-500">
                        {Math.round((item.usage / selectedDateData.compute) * 100)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Storage Details */}
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-5 border border-purple-100">
              <div className="flex items-center mb-4">
                <CircleStackIcon className="w-6 h-6 text-purple-600 mr-3" />
                <div>
                  <h4 className="font-semibold text-purple-900">스토리지 사용량</h4>
                  <p className="text-sm text-purple-700">{selectedDateData.storage.toLocaleString()}GB</p>
                </div>
              </div>
              <div className="space-y-3">
                {selectedDateData.details.storageBreakdown.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-800">{item.time}</div>
                      <div className="text-xs text-gray-600">{item.type}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-purple-700">{item.usage.toLocaleString()}GB</div>
                      <div className="text-xs text-gray-500">
                        {Math.round((item.usage / selectedDateData.storage) * 100)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Egress Details */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
              <div className="flex items-center mb-4">
                <ArrowTrendingUpIcon className="w-6 h-6 text-green-600 mr-3" />
                <div>
                  <h4 className="font-semibold text-green-900">Egress 사용량</h4>
                  <p className="text-sm text-green-700">{selectedDateData.egress.toLocaleString()}GB</p>
                </div>
              </div>
              <div className="space-y-3">
                {selectedDateData.details.egressBreakdown.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-800">{item.time}</div>
                      <div className="text-xs text-gray-600">{item.type}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-green-700">{item.usage.toLocaleString()}GB</div>
                      <div className="text-xs text-gray-500">
                        {Math.round((item.usage / selectedDateData.egress) * 100)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          0% {
            transform: translateY(30px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes growUp {
          0% {
            transform: scaleY(0);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: scaleY(1);
            opacity: 1;
          }
        }
        
        @keyframes shimmer {
          0% {
            transform: translateX(-100%) skewX(-12deg);
          }
          100% {
            transform: translateX(200%) skewX(-12deg);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
}