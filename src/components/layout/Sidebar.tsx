'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { getMonthName, getCurrentMonth } from '@/utils/date';
import { useMonths } from '@/hooks/months/queries/useMonths';

interface SidebarProps {
  currentYear?: number;
  currentMonth?: number;
}

const navigation = [
  {
    name: 'Overview',
    href: '/dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
      </svg>
    ),
  },
  {
    name: 'Annual Report',
    href: '/dashboard/annual',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

const quickLinks = [
  {
    name: 'Bills',
    path: 'bills',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    name: 'Debts',
    path: 'debts',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h10m4 0a1 1 0 100-2 1 1 0 000 2zM7 6h.01M11 6h.01M15 6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    name: 'Savings',
    path: 'savings',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
      </svg>
    ),
  },
];

export function Sidebar({ currentYear: initialYear, currentMonth: initialMonth }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  
  // Extract year/month from URL dynamically
  const [currentYear, setCurrentYear] = useState(initialYear);
  const [currentMonth, setCurrentMonth] = useState(initialMonth);

  useEffect(() => {
    // Try to extract year/month from URL
    const dashboardMatch = pathname.match(/\/dashboard\/(\d{4})\/(\d{1,2})/);
    
    if (dashboardMatch) {
      setCurrentYear(parseInt(dashboardMatch[1]));
      setCurrentMonth(parseInt(dashboardMatch[2]));
    } else {
      // Default to current month
      const current = getCurrentMonth();
      setCurrentYear(current.year);
      setCurrentMonth(current.month);
    }
  }, [pathname]);
  
  // Fetch months to get the monthId for the current year/month
  const { data: months, isLoading } = useMonths(currentYear ? { year: currentYear } : undefined);
  
  // Find the current month's ID
  const currentMonthData = months?.find(
    (m) => m.year === currentYear && m.month === currentMonth
  );
  const monthId = currentMonthData?._id;

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href || pathname.match(/^\/dashboard\/\d{4}\/\d{1,2}$/);
    }
    return pathname.startsWith(href);
  };

  const handlePrevMonth = () => {
    if (!currentYear || !currentMonth) return;
    let newMonth = currentMonth - 1;
    let newYear = currentYear;
    
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    
    router.push(`/dashboard/${newYear}/${newMonth}`);
  };

  const handleNextMonth = () => {
    if (!currentYear || !currentMonth) return;
    let newMonth = currentMonth + 1;
    let newYear = currentYear;
    
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    
    router.push(`/dashboard/${newYear}/${newMonth}`);
  };

  return (
    <>
      {/* Sidebar */}
      <aside className={`flex flex-col h-screen bg-white border-r border-gray-200 shadow-lg transition-all duration-300 ease-in-out relative ${
        isOpen ? 'w-72' : 'w-20'
      }`}>
        {/* Logo / Toggle Button */}
        <div className="p-6 border-b border-gray-200 flex items-center">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-12 h-12 flex items-center justify-center transform transition-transform group-hover:scale-110 flex-shrink-0">
              <img src="/logo.png" alt="Budget Buddy" className="w-12 h-12" />
            </div>
            {isOpen && (
              <div>
                <h1 className="text-xl font-bold text-emerald-900">Budget Pig</h1>
                <p className="text-xs text-emerald-600">Smart Finance Tracker</p>
              </div>
            )}
          </Link>
        </div>

        {/* Month Selector */}
        {currentYear && currentMonth && (
          <div className={`transition-all duration-300 ${isOpen ? 'px-4 py-4' : 'px-2 py-4'}`}>
            <div className={`bg-white rounded-2xl shadow-md border border-gray-200 transition-all duration-300 ${
              isOpen ? 'p-4' : 'p-2'
            }`}>
              <div className="flex items-center justify-between">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 rounded-xl hover:bg-emerald-50 text-emerald-600 transition-colors"
                  aria-label="Previous month"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                {isOpen ? (
                  <div className="text-center flex-1">
                    <h3 className="text-lg font-bold text-emerald-900">
                      {getMonthName(currentMonth)}
                    </h3>
                    <p className="text-sm text-emerald-600">{currentYear}</p>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                )}
                
                <button
                  onClick={handleNextMonth}
                  className="p-2 rounded-xl hover:bg-emerald-50 text-emerald-600 transition-colors"
                  aria-label="Next month"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto">
          <div className="mb-4">
            {isOpen && (
              <h3 className="px-3 mb-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                Main Menu
              </h3>
            )}
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl text-sm font-medium transition-all ${
                  isOpen ? 'px-4 py-3' : 'px-2 py-3 justify-center'
                } ${
                  isActive(item.href)
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-200'
                    : 'text-emerald-700 hover:bg-emerald-50'
                }`}
                title={!isOpen ? item.name : undefined}
              >
                {item.icon}
                {isOpen && <span>{item.name}</span>}
              </Link>
            ))}
          </div>

          {/* Quick Links */}
          <div className="mb-4">
            {isOpen && (
              <h3 className="px-3 mb-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                Quick Access
              </h3>
            )}
            <div className="space-y-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
                </div>
              ) : monthId ? (
                quickLinks.map((link) => {
                  const href = `/${link.path}/${monthId}`;
                  const isLinkActive = pathname.includes(`/${link.path}/`);
                  
                  return (
                    <Link
                      key={link.name}
                      href={href}
                      className={`flex items-center gap-3 rounded-xl text-sm font-medium transition-all ${
                        isOpen ? 'px-4 py-3' : 'px-2 py-3 justify-center'
                      } ${
                        isLinkActive
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-200'
                          : 'text-emerald-700 hover:bg-emerald-50'
                      }`}
                      title={!isOpen ? link.name : undefined}
                    >
                      {link.icon}
                      {isOpen && <span>{link.name}</span>}
                    </Link>
                  );
                })
              ) : (
                isOpen && (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    No month data available
                  </div>
                )
              )}
            </div>
          </div>
        </nav>

        {/* User Profile & Logout */}
        <div className={`p-4 border-t border-gray-200 transition-all duration-300`}>
          <button 
            onClick={() => signOut({ callbackUrl: '/login' })}
            className={`w-full flex items-center gap-3 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-all ${
              isOpen ? 'px-4 py-3' : 'px-2 py-3 justify-center'
            }`}
            title={!isOpen ? 'Sign Out' : undefined}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {isOpen && <span>Sign Out</span>}
          </button>
        </div>

        {/* Toggle Button - Positioned Absolutely in the Middle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center text-white hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl z-50"
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
        >
          <svg className={`w-4 h-4 transition-transform duration-300 ${isOpen ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </aside>
    </>
  );
}