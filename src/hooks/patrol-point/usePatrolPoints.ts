import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  activatePatrolPoint,
  createPatrolPoint,
  deactivatePatrolPoint,
  getPatrolPointById,
  getPatrolPoints,
  updatePatrolPoint,
} from "../../services/patrol-point/patrolPoint.service";
import type {
  CreatePatrolPointRequest,
  PatrolPointQuery,
  UpdatePatrolPointRequest,
} from "../../types/patrol-point/patrolPoint";

export const usePatrolPoints = (query?: PatrolPointQuery) => {
  return useQuery({
    queryKey: ["patrol-points", query],
    queryFn: () => getPatrolPoints(query),
  });
};
export const usePatrolPointsById = (id: string) => {
  return useQuery({
    queryKey: ["patrol-point", id],
    queryFn: () => getPatrolPointById(id),
    enabled: Boolean(id),
  });
};

export const useCreatePatrolPoint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePatrolPointRequest) =>
      createPatrolPoint(payload),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["patrol-points"],
      });
    },
  });
};

export const useUpdatePatrolPoint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdatePatrolPointRequest;
    }) => updatePatrolPoint(id, payload),

    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["patrol-point"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["patrol-point", variables.id],
        }),
      ]);
    },
  });
};

export const useActivatePatrolPoint = (id: string) => {
  return useQuery({
    queryKey: ["patrol-point", id],
    queryFn: () => activatePatrolPoint(id),
  });
};
export const useDeactivatePatrolPoint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deactivatePatrolPoint(id),

    onSuccess: async (_data, id) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["patrol-point"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["patrol-point", id],
        }),
      ]);
    },
  });
};
