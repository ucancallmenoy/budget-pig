'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { getMonthName, getCurrentMonth } from '@/utils/date';
import { useMonths } from '@/hooks/months/queries/useMonths';
import { MonthSelector } from './MonthSelector';

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
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
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
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  const [currentYear, setCurrentYear] = useState(() => {
    if (typeof window === 'undefined') return initialYear;
    const savedYear = localStorage.getItem('selectedYear');
    return savedYear ? parseInt(savedYear) : initialYear;
  });
  
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (typeof window === 'undefined') return initialMonth;
    const savedMonth = localStorage.getItem('selectedMonth');
    return savedMonth ? parseInt(savedMonth) : initialMonth;
  });

  useEffect(() => {
    setIsClient(true);
    
    const savedSidebarState = localStorage.getItem('sidebarOpen');
    if (savedSidebarState !== null && window.innerWidth >= 1024) {
      setIsOpen(savedSidebarState === 'true');
    }

    if (!currentYear || !currentMonth) {
      const current = getCurrentMonth();
      setCurrentYear(current.year);
      setCurrentMonth(current.month);
      localStorage.setItem('selectedYear', current.year.toString());
      localStorage.setItem('selectedMonth', current.month.toString());
      document.cookie = `selectedYear=${current.year}; path=/; max-age=31536000`;
      document.cookie = `selectedMonth=${current.month}; path=/; max-age=31536000`;
    }
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const dashboardMatch = pathname.match(/\/dashboard\/(\d{4})\/(\d{1,2})/);
    
    if (dashboardMatch) {
      const year = parseInt(dashboardMatch[1]);
      const month = parseInt(dashboardMatch[2]);
      setCurrentYear(year);
      setCurrentMonth(month);
      localStorage.setItem('selectedYear', year.toString());
      localStorage.setItem('selectedMonth', month.toString());
      document.cookie = `selectedYear=${year}; path=/; max-age=31536000`;
      document.cookie = `selectedMonth=${month}; path=/; max-age=31536000`;
    }
  }, [pathname, isClient]);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const { data: months, isLoading } = useMonths(currentYear ? { year: currentYear } : undefined);
  
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
    
    setCurrentYear(newYear);
    setCurrentMonth(newMonth);
    localStorage.setItem('selectedYear', newYear.toString());
    localStorage.setItem('selectedMonth', newMonth.toString());
    document.cookie = `selectedYear=${newYear}; path=/; max-age=31536000`;
    document.cookie = `selectedMonth=${newMonth}; path=/; max-age=31536000`;
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
    
    setCurrentYear(newYear);
    setCurrentMonth(newMonth);
    localStorage.setItem('selectedYear', newYear.toString());
    localStorage.setItem('selectedMonth', newMonth.toString());
    document.cookie = `selectedYear=${newYear}; path=/; max-age=31536000`;
    document.cookie = `selectedMonth=${newMonth}; path=/; max-age=31536000`;
    router.push(`/dashboard/${newYear}/${newMonth}`);
  };

  const toggleSidebar = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    localStorage.setItem('sidebarOpen', newState.toString());
  };

  const overviewHref = currentYear && currentMonth ? `/dashboard/${currentYear}/${currentMonth}` : '/dashboard';

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-emerald-600 text-white rounded-lg shadow-lg hover:bg-emerald-700 transition-colors"
        aria-label="Toggle menu"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {isMobileOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside className={`
        flex flex-col h-screen bg-white border-r border-gray-200 shadow-lg transition-all duration-300 ease-in-out
        fixed lg:relative z-40
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isOpen ? 'w-72' : 'w-72 lg:w-20'}
      `}>
        <div className="p-6 border-b border-gray-200 flex items-center">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-12 h-12 flex items-center justify-center transform transition-transform group-hover:scale-110 flex-shrink-0">
              <img src="/logo.png" alt="Budget Buddy" className="w-12 h-12" />
            </div>
            <div className={`transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-100 lg:opacity-0 lg:w-0 lg:overflow-hidden'}`}>
              <h1 className="text-xl font-bold text-emerald-900">Budget Pig</h1>
              <p className="text-xs text-emerald-600">Smart Finance Tracker</p>
            </div>
          </Link>
        </div>

        {currentYear && currentMonth && (
          <MonthSelector
            currentYear={currentYear}
            currentMonth={currentMonth}
            onPrev={handlePrevMonth}
            onNext={handleNextMonth}
            isOpen={isOpen}
          />
        )}

        <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto">
          <div className="mb-4">
            <h3 className={`px-3 mb-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider transition-all duration-300 ${
              isOpen ? 'opacity-100' : 'opacity-100 lg:opacity-0 lg:h-0 lg:mb-0'
            }`}>
              Main Menu
            </h3>
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.name === 'Overview' ? overviewHref : item.href}
                className={`flex items-center gap-3 rounded-xl text-sm font-medium transition-all ${
                  isOpen ? 'px-4 py-3' : 'px-4 py-3 lg:px-2 lg:justify-center'
                } ${
                  isActive(item.href)
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-200'
                    : 'text-emerald-700 hover:bg-emerald-50'
                }`}
                title={!isOpen ? item.name : undefined}
              >
                {item.icon}
                <span className={`transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-100 lg:opacity-0 lg:w-0 lg:overflow-hidden'}`}>
                  {item.name}
                </span>
              </Link>
            ))}
          </div>

          <div className="mb-4">
            <h3 className={`px-3 mb-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider transition-all duration-300 ${
              isOpen ? 'opacity-100' : 'opacity-100 lg:opacity-0 lg:h-0 lg:mb-0'
            }`}>
              Quick Access
            </h3>
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
                        isOpen ? 'px-4 py-3' : 'px-4 py-3 lg:px-2 lg:justify-center'
                      } ${
                        isLinkActive
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-200'
                          : 'text-emerald-700 hover:bg-emerald-50'
                      }`}
                      title={!isOpen ? link.name : undefined}
                    >
                      {link.icon}
                      <span className={`transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-100 lg:opacity-0 lg:w-0 lg:overflow-hidden'}`}>
                        {link.name}
                      </span>
                    </Link>
                  );
                })
              ) : (
                currentYear && currentMonth && quickLinks.map((link) => {
                  const href = `/${link.path}/${currentYear}/${currentMonth}`;
                  const isLinkActive = pathname.includes(`/${link.path}/`);
                  
                  return (
                    <Link
                      key={link.name}
                      href={href}
                      className={`flex items-center gap-3 rounded-xl text-sm font-medium transition-all ${
                        isOpen ? 'px-4 py-3' : 'px-4 py-3 lg:px-2 lg:justify-center'
                      } ${
                        isLinkActive
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-200'
                          : 'text-emerald-700 hover:bg-emerald-50'
                      }`}
                      title={!isOpen ? link.name : undefined}
                    >
                      {link.icon}
                      <span className={`transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-100 lg:opacity-0 lg:w-0 lg:overflow-hidden'}`}>
                        {link.name}
                      </span>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200 transition-all duration-300">
          <button 
            onClick={() => signOut({ callbackUrl: '/login' })}
            className={`w-full flex cursor-pointer items-center gap-3 rounded-xl text-sm font-medium text-rose-600 hover:text-rose-800 transition-all ${
              isOpen ? 'px-4 py-3' : 'px-4 py-3 lg:px-2 lg:justify-center'
            }`}
            title={!isOpen ? 'Sign Out' : undefined}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className={`transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-100 lg:opacity-0 lg:w-0 lg:overflow-hidden'}`}>
              Sign Out
            </span>
          </button>
        </div>

        <button
          onClick={toggleSidebar}
          className="hidden lg:flex cursor-pointer absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-6 h-6 bg-emerald-600 rounded-full items-center justify-center text-white hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl z-50"
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