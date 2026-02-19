'use client';

import { type ViewMode } from '@/utils/period';
import { VIEW_MODE_OPTIONS } from '@/utils/constants';

interface ViewModeToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export default function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
  return (
    <div className="inline-flex rounded-lg bg-gray-100 p-1">
      {VIEW_MODE_OPTIONS.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            value === opt.value
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {opt.value === 'monthly' ? 'Month' : opt.value}
        </button>
      ))}
    </div>
  );
}
