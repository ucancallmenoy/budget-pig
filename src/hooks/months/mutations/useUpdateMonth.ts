import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { Month, UpdateMonthInput } from '@/types/month';
import { QUERY_KEYS } from '@/utils/constants';

interface UpdateMonthParams {
  monthId: string;
  data: UpdateMonthInput;
}

export function useUpdateMonth() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ monthId, data }: UpdateMonthParams) => {
      const response = await api.put<{ month: Month }>(`/api/months/${monthId}`, data);
      return response.month;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.months });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.month(variables.monthId) });
    },
  });
}