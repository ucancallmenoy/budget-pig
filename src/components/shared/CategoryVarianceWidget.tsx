'use client';

import { formatCurrency } from '@/utils/currency';
import { CategoryVariance } from '@/types/budget';
import { ProgressBar } from '@/components/shared/ProgressBar';

interface CategoryVarianceWidgetProps {
  data: CategoryVariance[];
}

export default function CategoryVarianceWidget({ data }: CategoryVarianceWidgetProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Budget vs Actual
        </h3>
        <p className="text-sm text-gray-400">
          No category spending limits set for this month yet.
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Add category budgets (for example: rent, utilities, subscriptions), then this widget will compare planned amount vs actual spending.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
        Budget vs Actual
      </h3>
      <div className="space-y-4">
        {data.map((item) => {
          const isOver = item.variance < 0;
          return (
            <div key={item.category}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {item.category}
                </span>
                <span className={`text-xs font-medium ${isOver ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {isOver ? 'Over' : 'Under'} by {formatCurrency(Math.abs(item.variance))}
                </span>
              </div>
              <ProgressBar
                current={item.actual}
                target={item.budgeted}
                color={isOver ? 'rose' : 'emerald'}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                <span>{formatCurrency(item.actual)} spent</span>
                <span>{formatCurrency(item.budgeted)} budget</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
