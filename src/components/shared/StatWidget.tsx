import React from 'react';

interface StatWidgetProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color: 'emerald' | 'blue' | 'purple' | 'rose' | 'amber';
  subtitle?: string;
}

export function StatWidget({ title, value, icon, trend, color, subtitle }: StatWidgetProps) {
  const colorStyles = {
    emerald: {
      gradient: 'from-emerald-400 to-emerald-600',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
    },
    blue: {
      gradient: 'from-blue-400 to-blue-600',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
    },
    purple: {
      gradient: 'from-purple-400 to-purple-600',
      bg: 'bg-purple-50',
      text: 'text-purple-600',
    },
    rose: {
      gradient: 'from-rose-400 to-rose-600',
      bg: 'bg-rose-50',
      text: 'text-rose-600',
    },
    amber: {
      gradient: 'from-amber-400 to-amber-600',
      bg: 'bg-amber-50',
      text: 'text-amber-600',
    },
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6 hover:shadow-xl transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colorStyles[color].gradient} flex items-center justify-center text-white shadow-lg`}>
          {icon}
        </div>
      </div>

      {trend && (
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${trend.isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={trend.isPositive ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} />
            </svg>
            <span className="text-xs font-semibold">{trend.value}</span>
          </div>
          <span className="text-xs text-gray-500">vs last month</span>
        </div>
      )}
    </div>
  );
}