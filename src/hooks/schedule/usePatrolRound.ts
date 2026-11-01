import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getAllRoundsGroupedByUser,
  getPatrolRoundById,
  getPatrolRoundsByUser,
  reorderPatrolRoundCheckpoints,
} from "../../services/patrol/patrol-round.service";
import type {
  GetAllRoundsGroupedByUserParams,
  GetPatrolRoundsByUserParams,
} from "../../types";

export const usePatrolRoundById = (roundId?: string) => {
  return useQuery({
    queryKey: ["patrol-round-detail", roundId],
    queryFn: () => {
      if (!roundId) {
        throw new Error("Patrol round ID tidak ditemukan");
      }

      return getPatrolRoundById(roundId);
    },
    enabled: Boolean(roundId),
    retry: false,
  });
};

export const usePatrolRoundsByUser = ({
  userId,
  date,
}: GetPatrolRoundsByUserParams) => {
  return useQuery({
    queryKey: ["patrol-rounds-by-user", userId, date ?? "today"],

    queryFn: () =>
      getPatrolRoundsByUser({
        userId,
        date,
      }),

    enabled: Boolean(userId),

    retry: false,

    staleTime: 30_000,
  });
};

export const usePatrolRoundsGroupedByUser = (
  params?: GetAllRoundsGroupedByUserParams,
) => {
  return useQuery({
    queryKey: ["patrol-rounds", "grouped-by-user", params ?? {}],

    queryFn: () => getAllRoundsGroupedByUser(params),

    retry: false,
    staleTime: 30_000,
  });
};

export const useReorderPatrolRoundCheckpoints = (roundId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (checkpointIds: string[]) =>
      reorderPatrolRoundCheckpoints(roundId, checkpointIds),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["patrol-round-detail", roundId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["patrol-rounds"],
        }),
      ]);
    },
  });
};
