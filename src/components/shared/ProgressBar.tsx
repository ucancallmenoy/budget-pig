import React from 'react';

interface ProgressBarProps {
  current: number;
  target: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'emerald' | 'sky' | 'amber' | 'rose';
}

export function ProgressBar({ 
  current, 
  target, 
  label, 
  showPercentage = true,
  color = 'emerald' 
}: ProgressBarProps) {
  const percentage = Math.min((current / target) * 100, 100);

  const colorStyles = {
    emerald: 'bg-emerald-500',
    sky: 'bg-sky-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
  };

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex justify-between mb-2">
          {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
          {showPercentage && <span className="text-sm font-medium text-gray-600">{percentage.toFixed(0)}%</span>}
        </div>
      )}
      <div className="w-full bg-gray-100 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full ${colorStyles[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}