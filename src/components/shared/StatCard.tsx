import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';

interface StatCardProps {
  title: string;
  value: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: 'emerald' | 'rose' | 'sky' | 'amber' | 'purple' | 'teal';
}

export function StatCard({ title, value, icon, trend, color = 'emerald' }: StatCardProps) {
  const colorStyles = {
    emerald: 'bg-emerald-100 text-emerald-700',
    rose: 'bg-rose-100 text-rose-700',
    sky: 'bg-sky-100 text-sky-700',
    amber: 'bg-amber-100 text-amber-700',
    purple: 'bg-purple-100 text-purple-700',
    teal: 'bg-teal-100 text-teal-700'
  };

  return (
    <Card>
      <CardContent>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
            <p className="text-2xl font-bold text-gray-800">
              {value}
            </p>
          </div>
          {icon && (
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorStyles[color]}`}>
              {icon}
            </div>
          )}
        </div>
        
        {trend && (
          <div className="mt-3 flex items-center gap-1.5 text-sm">
            <span className={`font-medium ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
              {trend.isPositive ? '↗' : '↘'} {trend.value}
            </span>
            <span className="text-gray-500">vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}