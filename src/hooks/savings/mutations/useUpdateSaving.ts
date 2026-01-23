import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { Saving, UpdateSavingInput } from '@/types/saving';
import { QUERY_KEYS } from '@/utils/constants';

interface UpdateSavingParams {
  savingId: string;
  monthId: string;
  data: UpdateSavingInput;
}

export function useUpdateSaving() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ savingId, data }: UpdateSavingParams) => {
      const response = await api.put<{ saving: Saving }>(`/api/savings/${savingId}`, data);
      return response.saving;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.savings(variables.monthId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.monthlyDashboard(variables.monthId) });
    },
  });
}