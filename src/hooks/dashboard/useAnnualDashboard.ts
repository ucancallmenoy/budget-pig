import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { AnnualDashboard } from '@/types/dashboard';
import { QUERY_KEYS } from '@/utils/constants';

export function useAnnualDashboard(year: number | undefined) {
  const currentYear = new Date().getFullYear();
  const isCurrentYear = year === currentYear;

  return useQuery({
    queryKey: QUERY_KEYS.annualDashboard(year || 0),
    queryFn: async () => {
      const response = await api.get<{ dashboard: AnnualDashboard }>(
        '/api/dashboard/annual',
        { params: { year: year!.toString() } }
      );
      return response.dashboard;
    },
    enabled: !!year,
    refetchInterval: isCurrentYear ? 1000 * 60 : false,
    staleTime: isCurrentYear ? 0 : 60 * 1000,
  });
}