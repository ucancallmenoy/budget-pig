'use client';

import React from 'react';
import { Saving } from '@/types/saving';

interface SavingsChartProps {
  savings: Saving[];
}

export function SavingsChart({ savings }: SavingsChartProps) {
  const completedGoals = savings.filter(s => s.isCompleted).length;
  const inProgressGoals = savings.filter(s => !s.isCompleted).length;
  const totalTarget = savings.reduce((sum, s) => sum + s.targetAmount, 0);
  const totalSaved = savings.reduce((sum, s) => sum + s.savedAmount, 0);
  const percentage = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  // Group by category
  const categoryData = savings.reduce((acc, saving) => {
    const category = saving.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = { saved: 0, target: 0 };
    }
    acc[category].saved += saving.savedAmount;
    acc[category].target += saving.targetAmount;
    return acc;
  }, {} as Record<string, { saved: number; target: number }>);

  const maxValue = Math.max(...Object.values(categoryData).map(c => c.target));

  return (
    <div className="space-y-6">
      {/* Donut Chart */}
      <div className="flex items-center justify-center">
        <div className="relative w-48 h-48">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="80"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="16"
            />
            <circle
              cx="96"
              cy="96"
              r="80"
              fill="none"
              stroke="#10b981"
              strokeWidth="16"
              strokeDasharray={`${percentage * 5.026} 502.6`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-gray-900">{percentage.toFixed(0)}%</span>
            <span className="text-sm text-gray-600">Saved</span>
          </div>
        </div>
      </div>

      {/* Goals Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-2xl font-bold text-green-700">{completedGoals}</p>
          <p className="text-sm text-green-600">Completed</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-2xl font-bold text-blue-700">{inProgressGoals}</p>
          <p className="text-sm text-blue-600">In Progress</p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">By Category</h4>
        <div className="space-y-3">
          {Object.entries(categoryData).map(([category, data]) => {
            const categoryPercentage = (data.saved / data.target) * 100;
            const barWidth = (data.target / maxValue) * 100;
            
            return (
              <div key={category}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">{category}</span>
                  <span className="text-sm text-gray-600">${data.saved.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3" style={{ width: `${barWidth}%` }}>
                  <div
                    className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${categoryPercentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}