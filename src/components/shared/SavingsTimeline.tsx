'use client';

import React from 'react';
import { Saving } from '@/types/saving';
import { formatCurrency } from '@/utils/currency';
import { formatDate, getDaysUntil } from '@/utils/date';

interface SavingsTimelineProps {
  savings: Saving[];
}

export function SavingsTimeline({ savings }: SavingsTimelineProps) {
  const longTermGoals = savings
    .filter(s => s.goalType === 'long_term' && s.targetDate)
    .sort((a, b) => {
      if (!a.targetDate || !b.targetDate) return 0;
      return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
    });

  if (longTermGoals.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No long-term goals yet</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />

      <div className="space-y-6">
        {longTermGoals.map((saving, index) => {
          const progress = (saving.savedAmount / saving.targetAmount) * 100;
          const daysRemaining = saving.targetDate ? getDaysUntil(saving.targetDate) : null;
          const isOverdue = daysRemaining !== null && daysRemaining < 0;
          const isComplete = saving.isCompleted;

          return (
            <div key={saving._id} className="relative flex items-start group">
              <div className={`absolute left-6 w-4 h-4 rounded-full border-4 ${
                isComplete ? 'bg-green-500 border-green-200' :
                isOverdue ? 'bg-red-500 border-red-200' :
                'bg-blue-500 border-blue-200'
              }`} />

              <div className="ml-16 flex-1">
                <div className="bg-white border-2 border-gray-100 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{saving.name}</h4>
                      {saving.category && (
                        <span className="text-xs text-gray-500">{saving.category}</span>
                      )}
                    </div>
                    {isComplete && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ Completed
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-gray-600">Saved</p>
                      <p className="text-sm font-semibold text-green-600">
                        {formatCurrency(saving.savedAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Target</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(saving.targetAmount)}
                      </p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          isComplete ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{progress.toFixed(0)}% complete</p>
                  </div>

                  {saving.targetDate && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">
                        Target: {formatDate(saving.targetDate)}
                      </span>
                      {!isComplete && daysRemaining !== null && (
                        <span className={isOverdue ? 'text-red-600 font-medium' : 'text-blue-600'}>
                          {isOverdue 
                            ? `${Math.abs(daysRemaining)} days overdue`
                            : `${daysRemaining} days left`
                          }
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}