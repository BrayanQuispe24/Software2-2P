import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUsersUseCase,
  createUserUseCase,
  updateUserUseCase,
  deactivateUserUseCase,
} from '../../../../app/composition/users.composition';
import type { CreateUserParams } from '../../domain/ManagedUser';
import type { UpdateUserParams } from '../../domain/UsersRepository';

export const USERS_QUERY_KEY = ['users', 'list'] as const;

export function useUsersQuery() {
  return useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: () => getUsersUseCase.execute(),
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateUserParams) => createUserUseCase.execute(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, params }: { id: string; params: UpdateUserParams }) =>
      updateUserUseCase.execute(id, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}

export function useDeactivateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deactivateUserUseCase.execute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}
