import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  changeShift,
  getShiftChanges,
} from "../../services/schedule/shift-change.service";
import type {
  ShiftChange,
  ShiftChangeParams,
} from "../../types/schedule/shift-change";

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

export const useShiftChanges = (params?: ShiftChangeParams) => {
  return useQuery({
    queryKey: ["shift-changes", params],
    queryFn: () => getShiftChanges(params),
  });
};
