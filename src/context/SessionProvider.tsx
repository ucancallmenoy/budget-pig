'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { ToastProvider } from '@/components/ui/Toast';

interface Props {
  children: React.ReactNode;
}

export function SessionProvider({ children }: Props) {
  return (
    <NextAuthSessionProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </QueryClientProvider>
    </NextAuthSessionProvider>
  );
}