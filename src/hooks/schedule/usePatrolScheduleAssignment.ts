import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  bulkAssignUser,
  createScheduleAssignment,
  getScheduleAssignment,
  getScheduleAssignments,
} from "../../services/schedule/schedule-assigments.service";
import type {
  BulkAssignUserPayload,
  CreateScheduleAssignmentPayload,
} from "../../types";

export const useScheduleAssignments = (scheduleId: string) => {
  return useQuery({
    queryKey: ["patrol-schedule-assignment", scheduleId],
    queryFn: () => getScheduleAssignment(scheduleId),
    // enabled: !!scheduleId,
  });
};
export const useGetScheduleAssignments = () => {
  return useQuery({
    queryKey: ["patrol-schedule-assignment"],
    queryFn: () => getScheduleAssignments(),
  });
};
export const useCreateScheduleAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      scheduleId,
      payload,
    }: {
      scheduleId: string;
      payload: CreateScheduleAssignmentPayload;
    }) => createScheduleAssignment(scheduleId, payload),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["patrol-schedule-roster"],
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

export const useUnassignScheduleAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      scheduleId,
      assignmentId,
    }: {
      scheduleId: string;
      assignmentId: string;
    }) => unassignScheduleAssignment(scheduleId, assignmentId),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["patrol-schedule-roster"],
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

export const useBulkAssignUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BulkAssignUserPayload) => bulkAssignUser(payload),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["patrol-schedules"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["patrol-schedule-assignment"],
        }),
      ]);
    },
  });
};
