import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addSchedulePoint,
  getSchedulePoints,
} from "../../services/schedule/schedule-point.service";
import type { AddSchedulePointPayload } from "../../types";

export const patrolSchedulePointKeys = {
  all: ["patrol-schedules-points"] as const,

  lists: () => [...patrolSchedulePointKeys.all, "list"] as const,

  list: (scheduleId: string) =>
    [...patrolSchedulePointKeys.lists(), scheduleId] as const,
};

export const useAddNewPoint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      scheduleId,
      payload,
    }: {
      scheduleId: string;
      payload: AddSchedulePointPayload;
    }) => addSchedulePoint(scheduleId, payload),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["patrol-schedules"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["patrol-schedules-point"],
        }),
      ]);
    },
  });
};

export const useSchedulePoints = (scheduleId: string, enabled = true) => {
  return useQuery({
    queryKey: ["patrol-schedules-point", scheduleId],
    queryFn: () => getSchedulePoints(scheduleId),
    enabled: enabled && !!scheduleId,
    staleTime: 1000 * 60,
  });
};
