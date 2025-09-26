interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  fullscreen?: boolean;
}

export default function Loading({ size = 'md', text = '로딩 중...', fullscreen = false }: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 p-8 sm:p-12">
          <div className="flex flex-col items-center justify-center">
            {/* Modern animated spinner */}
            <div className="relative">
              <div className={`${sizeClasses[size]} rounded-full border-4 border-gray-200`}></div>
              <div className={`${sizeClasses[size]} rounded-full border-4 border-indigo-600 border-t-transparent animate-spin absolute inset-0`}></div>
            </div>
            
            {/* Pulsing dots animation */}
            <div className="flex space-x-2 mt-6">
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
            </div>

            {text && (
              <p className={`mt-4 font-medium text-gray-700 ${textSizeClasses[size]}`}>
                {text}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-6 sm:py-8">
      {/* Modern animated spinner */}
      <div className="relative">
        <div className={`${sizeClasses[size]} rounded-full border-3 border-gray-200`}></div>
        <div className={`${sizeClasses[size]} rounded-full border-3 border-indigo-600 border-t-transparent animate-spin absolute inset-0`}></div>
      </div>
      
      {/* Pulsing dots animation */}
      <div className="flex space-x-1.5 mt-4">
        <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse"></div>
        <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
        <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
      </div>

      {text && (
        <p className={`mt-3 font-medium text-gray-600 ${textSizeClasses[size]}`}>
          {text}
        </p>
      )}
    </div>
  );
}