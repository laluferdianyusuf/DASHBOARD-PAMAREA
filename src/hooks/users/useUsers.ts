import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  ChangeUserPasswordRequest,
  activateUser,
  changeUserPassword,
  createUser,
  deactivateUser,
  deleteUser,
  getActiveUsers,
  getSecurityUsers,
  getUserById,
  getUsers,
  updateUser,
} from "../../services/users/user.service";

import type {
  CreateUserRequest,
  UpdateUserRequest,
} from "../../types/user/user";

// Query keys
export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  security: () => [...userKeys.all, "security"] as const,
  active: () => [...userKeys.all, "active"] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

// GET /users
export const useUsers = () => {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: getUsers,
  });
};

// GET /users/security
export const useSecurityUsers = () => {
  return useQuery({
    queryKey: userKeys.security(),
    queryFn: getSecurityUsers,
  });
};

// GET /users/active
export const useActiveUsers = () => {
  return useQuery({
    queryKey: userKeys.active(),
    queryFn: getActiveUsers,
  });
};

// GET /users/:id
export const useUserById = (id: string) => {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => getUserById(id),
    enabled: Boolean(id),
  });
};

// POST /users
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateUserRequest) => createUser(payload),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: userKeys.all,
      });
    },
  });
};

// PATCH /users/:id
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserRequest }) =>
      updateUser(id, payload),

    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: userKeys.lists(),
        }),
        queryClient.invalidateQueries({
          queryKey: userKeys.security(),
        }),
        queryClient.invalidateQueries({
          queryKey: userKeys.active(),
        }),
        queryClient.invalidateQueries({
          queryKey: userKeys.detail(variables.id),
        }),
      ]);
    },
  });
};

// PATCH /users/:id/activate
export const useActivateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => activateUser(id),

    onSuccess: async (_data, id) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: userKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: userKeys.detail(id),
        }),
      ]);
    },
  });
};

// PATCH /users/:id/deactivate
export const useDeactivateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deactivateUser(id),

    onSuccess: async (_data, id) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: userKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: userKeys.detail(id),
        }),
      ]);
    },
  });
};

// DELETE /users/:id
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteUser(id),

    onSuccess: async (_data, id) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: userKeys.all,
        }),
        queryClient.removeQueries({
          queryKey: userKeys.detail(id),
          exact: true,
        }),
      ]);
    },
  });
};

export const useChangePassword = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: string;
      payload: ChangeUserPasswordRequest;
    }) => changeUserPassword(userId, payload),

    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: userKeys.lists(),
        }),
        queryClient.invalidateQueries({
          queryKey: userKeys.security(),
        }),
        queryClient.invalidateQueries({
          queryKey: userKeys.active(),
        }),
        queryClient.invalidateQueries({
          queryKey: userKeys.detail(variables.userId),
        }),
      ]);
    },
  });
};
