import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { teamService } from "../../services/team/team.service";
import type {
  CreateTeamPayload,
  QueryTeamParams,
  UpdateTeamVariables,
} from "../../types/team/team";

export const teamKeys = {
  all: ["teams"] as const,
  lists: () => [...teamKeys.all, "list"] as const,
  list: (params?: QueryTeamParams) =>
    [...teamKeys.lists(), params ?? {}] as const,
  active: (siteId?: string) =>
    [...teamKeys.all, "active", siteId ?? "all"] as const,
  details: () => [...teamKeys.all, "detail"] as const,
  detail: (id: string) => [...teamKeys.details(), id] as const,
};

export const useTeams = (params?: QueryTeamParams) => {
  return useQuery({
    queryKey: teamKeys.list(params),
    queryFn: () => teamService.getAll(params),
    retry: false,
  });
};

export const useActiveTeams = (siteId?: string) => {
  return useQuery({
    queryKey: teamKeys.active(siteId),
    queryFn: () => teamService.getActive(siteId),
    retry: false,
  });
};

export const useTeamById = (id?: string) => {
  return useQuery({
    queryKey: teamKeys.detail(id ?? ""),
    queryFn: () => teamService.getById(id!),
    enabled: Boolean(id),
    retry: false,
  });
};

export const useCreateTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTeamPayload) => teamService.create(payload),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: teamKeys.all,
      });
    },
  });
};

export const useUpdateTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateTeamVariables) =>
      teamService.update(id, payload),

    onSuccess: async (updatedTeam) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: teamKeys.all,
        }),

        queryClient.invalidateQueries({
          queryKey: teamKeys.detail(updatedTeam.id),
        }),
      ]);

      queryClient.setQueryData(teamKeys.detail(updatedTeam.id), updatedTeam);
    },
  });
};

export const useDeleteTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => teamService.delete(id),

    onSuccess: async (_response, deletedId) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: teamKeys.all,
        }),

        queryClient.removeQueries({
          queryKey: teamKeys.detail(deletedId),
        }),
      ]);
    },
  });
};
