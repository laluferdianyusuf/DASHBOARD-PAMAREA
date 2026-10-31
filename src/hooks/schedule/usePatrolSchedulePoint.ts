import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addSchedulePoint } from "../../services/schedule/schedule-point.service";
import type { AddSchedulePointPayload } from "../../types";

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
