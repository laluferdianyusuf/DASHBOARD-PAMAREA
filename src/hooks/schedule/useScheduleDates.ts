import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateScheduleDatesPayload } from "../../types";
import {
  createScheduleDates,
  getScheduleDates,
} from "../../services/schedule/schedule-date.service";

export const useGetScheduleDates = (scheduleId: string) => {
  useQuery({
    queryKey: ["patrol-schedules", scheduleId],
    queryFn: () => getScheduleDates(scheduleId),
  });
};
export const useCreatePatrolScheduleDates = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      scheduleId,
      payload,
    }: {
      scheduleId: string;
      payload: CreateScheduleDatesPayload;
    }) => createScheduleDates(scheduleId, payload),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["patrol-schedules"],
      });
    },
  });
};
