'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { getMonthName } from '@/utils/date';

interface MonthSelectorProps {
  currentYear: number;
  currentMonth: number;
}

export function MonthSelector({ currentYear, currentMonth }: MonthSelectorProps) {
  const router = useRouter();

  const handlePrevMonth = () => {
    let newMonth = currentMonth - 1;
    let newYear = currentYear;
    
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    
    router.push(`/dashboard/${newYear}/${newMonth}`);
  };

  const handleNextMonth = () => {
    let newMonth = currentMonth + 1;
    let newYear = currentYear;
    
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    
    router.push(`/dashboard/${newYear}/${newMonth}`);
  };

  return (
    <div className="flex items-center space-x-4 bg-white rounded-xl px-5 py-3 border border-gray-200">
      <button
        onClick={handlePrevMonth}
        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-800">
          {getMonthName(currentMonth)} {currentYear}
        </h2>
      </div>
      
      <button
        onClick={handleNextMonth}
        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}