import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'soft' | 'outlined';
}

export function Card({ 
  children, 
  className = '', 
  variant = 'default'
}: CardProps) {
  const variantStyles = {
    default: 'bg-white shadow-md border border-gray-100',
    soft: 'bg-emerald-50/50 border border-emerald-100',
    outlined: 'bg-white border-2 border-gray-200'
  };
  
  return (
    <div className={`rounded-2xl ${variantStyles[variant]} ${className}`}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function CardHeader({ children, className = '', icon, action }: CardHeaderProps) {
  return (
    <div className={`p-6 border-b border-gray-100 flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
            {icon}
          </div>
        )}
        {children}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
  return (
    <h3 className={`text-xl font-semibold text-gray-800 ${className}`}>
      {children}
    </h3>
  );
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
}