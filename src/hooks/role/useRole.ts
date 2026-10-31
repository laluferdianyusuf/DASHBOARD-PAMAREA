import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createRole,
  deleteRole,
  getRoleById,
  getRoles,
  updateRole,
} from "../../services/roles/roles.service";

import type {
  CreateRoleRequest,
  UpdateRoleRequest,
} from "../../types/role/role";

export const roleKeys = {
  all: ["roles"] as const,
  lists: () => [...roleKeys.all, "list"] as const,
  details: () => [...roleKeys.all, "detail"] as const,
  detail: (id: string) => [...roleKeys.details(), id] as const,
};

export const useRoles = () => {
  return useQuery({
    queryKey: roleKeys.lists(),
    queryFn: getRoles,
  });
};

export const useRoleById = (id: string) => {
  return useQuery({
    queryKey: roleKeys.detail(id),
    queryFn: () => getRoleById(id),
    enabled: Boolean(id),
  });
};

export const useCreateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRoleRequest) => createRole(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: roleKeys.all,
      });
    },
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRoleRequest }) =>
      updateRole(id, payload),

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: roleKeys.all,
      });

      queryClient.invalidateQueries({
        queryKey: roleKeys.detail(variables.id),
      });
    },
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteRole(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: roleKeys.all,
      });
    },
  });
};
