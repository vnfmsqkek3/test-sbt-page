import { ReactNode } from 'react';

interface CardProps {
  title?: string | ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export default function Card({ 
  title, 
  children, 
  footer, 
  className = '' 
}: CardProps) {
  return (
    <div className={`bg-white shadow overflow-hidden sm:rounded-lg ${className}`}>
      {title && (
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          {typeof title === 'string' ? (
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {title}
            </h3>
          ) : (
            title
          )}
        </div>
      )}
      <div className="px-4 py-5 sm:p-6">
        {children}
      </div>
      {footer && (
        <div className="px-4 py-4 sm:px-6 bg-gray-50 border-t border-gray-200">
          {footer}
        </div>
      )}
    </div>
  );
}