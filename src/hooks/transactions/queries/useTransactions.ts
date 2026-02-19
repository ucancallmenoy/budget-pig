import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { Transaction } from '@/types/transaction';
import { QUERY_KEYS } from '@/utils/constants';
import type { Period } from '@/utils/period';

interface UseTransactionsOptions {
  year?: number;
  month?: number;
  period?: Period;
  type?: Transaction['type'];
}

export function useTransactions(options: UseTransactionsOptions) {
  return useQuery({
    queryKey: [
      ...QUERY_KEYS.transactions(options.year || 0, options.month || 0),
      options.period || 'all',
      options.type || 'all',
    ],
    queryFn: async () => {
      const params: Record<string, string> = {
        year: String(options.year),
        month: String(options.month),
      };
      if (options.period) params.period = options.period;
      if (options.type) params.type = options.type;
      const response = await api.get<{ transactions: Transaction[] }>('/api/transactions', {
        params,
      });
      return response.transactions;
    },
    enabled: !!options.year && !!options.month,
  });
}
