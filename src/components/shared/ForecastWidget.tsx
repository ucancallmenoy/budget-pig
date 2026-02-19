'use client';

import { formatCurrency } from '@/utils/currency';

interface ForecastWidgetProps {
  periodEndRemaining: number;
  monthEndRemaining: number;
  dailyBurnRate: number;
  runwayDays: number;
}

export default function ForecastWidget({
  periodEndRemaining,
  monthEndRemaining,
  dailyBurnRate,
  runwayDays,
}: ForecastWidgetProps) {
  const isHealthy = periodEndRemaining > 0;
  const statusColor = isHealthy ? 'text-emerald-600' : 'text-rose-600';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
        Forecast
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-400">Period-End Balance</p>
          <p className={`text-lg font-bold ${statusColor}`}>
            {formatCurrency(periodEndRemaining)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Month-End Balance</p>
          <p className={`text-lg font-bold ${monthEndRemaining >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatCurrency(monthEndRemaining)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Daily Burn Rate</p>
          <p className="text-lg font-bold text-gray-800">
            {formatCurrency(dailyBurnRate)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Runway</p>
          <p className={`text-lg font-bold ${runwayDays > 14 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {runwayDays >= 999 ? '∞' : `${runwayDays} days`}
          </p>
        </div>
      </div>
    </div>
  );
}
