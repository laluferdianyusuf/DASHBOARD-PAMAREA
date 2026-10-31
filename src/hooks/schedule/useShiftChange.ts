import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ShiftChange } from "../../types/schedule/shift-change";
import { changeShift } from "../../services/schedule/shift-change.service";

export const useChangeShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ShiftChange) => changeShift(payload),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["shift-changes"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["patrol-schedules"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["patrol-schedule-assignments"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["patrol-rounds"],
        }),
      ]);
    },
  });
};
