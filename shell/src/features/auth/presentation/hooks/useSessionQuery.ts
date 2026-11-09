import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSessionUseCase,
  startLoginUseCase,
  logoutUseCase,
} from '../../../../app/composition/auth.composition';

export const SESSION_QUERY_KEY = ['auth', 'session'] as const;

export function useSessionQuery() {
  return useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: () => getSessionUseCase.execute(),
    staleTime: 0,
    retry: false,
  });
}

export function useAuthActions() {
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: () => logoutUseCase.execute(),
    onSuccess: () => {
      queryClient.setQueryData(SESSION_QUERY_KEY, null);
      queryClient.removeQueries({ queryKey: SESSION_QUERY_KEY });
    },
  });

  return {
    login: () => startLoginUseCase.execute(),
    logout: () => logoutMutation.mutate(),
    isLoggingOut: logoutMutation.isPending,
  };
}
