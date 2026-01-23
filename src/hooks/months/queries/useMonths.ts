import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { Month } from '@/types/month';
import { QUERY_KEYS } from '@/utils/constants';

interface UseMonthsOptions {
  year?: number;
}

export function useMonths(options?: UseMonthsOptions) {
  return useQuery({
    queryKey: options?.year 
      ? [...QUERY_KEYS.months, options.year] 
      : QUERY_KEYS.months,
    queryFn: async () => {
      const params = options?.year ? { year: options.year.toString() } : undefined;
      const response = await api.get<{ months: Month[] }>('/api/months', { params });
      return response.months;
    },
  });
}