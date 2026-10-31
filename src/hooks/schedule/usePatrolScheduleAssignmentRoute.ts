import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "../../lib/apiClient";
import type {
  AssignmentRouteResponse,
  OptimizeAssignmentRoutePayload,
  SetAssignmentRoutePayload,
} from "../../types/schedule/assignment-route";

const BASE_URL = "/patrol-schedule-assignments";

export const assignmentRouteKeys = {
  all: ["assignment-routes"] as const,
  detail: (assignmentId: string) =>
    [...assignmentRouteKeys.all, assignmentId] as const,
};

export function useAssignmentRoute(assignmentId?: string) {
  return useQuery<AssignmentRouteResponse>({
    queryKey: assignmentRouteKeys.detail(assignmentId ?? ""),
    queryFn: async () => {
      if (!assignmentId) {
        throw new Error("Assignment ID wajib diisi.");
      }

      const response = await apiClient.get<AssignmentRouteResponse>(
        `${BASE_URL}/${assignmentId}/route`,
      );

      return response.data;
    },
    enabled: Boolean(assignmentId),
  });
}

export function useSetAssignmentRoute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assignmentId,
      payload,
    }: {
      assignmentId: string;
      payload: SetAssignmentRoutePayload;
    }) => {
      const response = await apiClient.put(
        `${BASE_URL}/${assignmentId}/route`,
        payload,
      );

      return response.data;
    },

    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: assignmentRouteKeys.detail(variables.assignmentId),
      });

      void queryClient.invalidateQueries({
        queryKey: ["schedule-assignments"],
      });
    },
  });
}

export function useOptimizeAssignmentRoute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assignmentId,
      payload,
    }: {
      assignmentId: string;
      payload: OptimizeAssignmentRoutePayload;
    }) => {
      const response = await apiClient.post(
        `${BASE_URL}/${assignmentId}/route/optimize`,
        payload,
      );

      return response.data;
    },

    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: assignmentRouteKeys.detail(variables.assignmentId),
      });

      void queryClient.invalidateQueries({
        queryKey: ["schedule-assignments"],
      });
    },
  });
}
