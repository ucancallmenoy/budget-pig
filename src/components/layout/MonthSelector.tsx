'use client';

import React from 'react';
import { getMonthName } from '@/utils/date';

interface MonthSelectorProps {
  currentYear: number;
  currentMonth: number;
  onPrev: () => void;
  onNext: () => void;
  isOpen?: boolean;
}

export function MonthSelector({ currentYear, currentMonth, onPrev, onNext, isOpen = true }: MonthSelectorProps) {
  return (
    <div className={`transition-all duration-300 ${isOpen ? 'px-4 py-4' : 'px-4 py-4 lg:px-2'}`}>
      <div className={`bg-white rounded-2xl shadow-md border border-gray-200 transition-all duration-300 ${
        isOpen ? 'p-4' : 'p-4 lg:p-2'
      }`}>
        <div className={`flex items-center ${isOpen ? 'justify-between' : 'justify-between lg:flex-col lg:gap-2'}`}>
          <button
            onClick={onPrev}
            className="p-2 rounded-xl hover:bg-emerald-50 text-emerald-600 transition-colors flex-shrink-0 cursor-pointer"
            aria-label="Previous month"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className={`transition-all duration-300 ${
            isOpen 
              ? 'text-center flex-1' 
              : 'text-center flex-1 lg:flex-initial'
          }`}>
            <div className={isOpen ? '' : 'lg:hidden'}>
              <h3 className="text-lg font-bold text-emerald-900">
                {getMonthName(currentMonth)}
              </h3>
              <p className="text-sm text-emerald-600">{currentYear}</p>
            </div>
            <div className={`${isOpen ? 'hidden' : 'hidden lg:flex lg:items-center lg:justify-center'}`}>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center relative group">
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  {getMonthName(currentMonth)} {currentYear}
                </div>
              </div>
            </div>
          </div>
          
          <button
            onClick={onNext}
            className="p-2 rounded-xl hover:bg-emerald-50 text-emerald-600 transition-colors flex-shrink-0 cursor-pointer"
            aria-label="Next month"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}