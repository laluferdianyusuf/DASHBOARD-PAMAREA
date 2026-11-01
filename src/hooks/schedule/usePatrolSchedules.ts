import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  activatePatrolSchedule,
  addScheduleAssignment,
  createPatrolSchedule,
  deletePatrolSchedule,
  getMonthlyRoster,
  getPatrolScheduleById,
  getPatrolSchedules,
  updatePatrolSchedule,
} from "../../services/schedule/patrol-schedule.service";
import type {
  AddScheduleAssignmentPayload,
  CreatePatrolSchedulePayload,
  MonthlyRosterItem,
  MonthlyRosterQuery,
  UpdatePatrolSchedulePayload,
} from "../../types";

export const usePatrolSchedules = () => {
  return useQuery({
    queryKey: ["patrol-schedules"],
    queryFn: () => getPatrolSchedules(),
  });
};
export const usePatrolSchedulesId = (id: string) => {
  return useQuery({
    queryKey: ["patrol-schedule", id],
    queryFn: () => getPatrolScheduleById(id),
    enabled: Boolean(id),
  });
};

export const useCreatePatrolSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePatrolSchedulePayload) =>
      createPatrolSchedule(payload),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["patrol-schedules"],
      });
    },
  });
};

export const useAddScheduleAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      scheduleId,
      payload,
    }: {
      scheduleId: string;
      payload: AddScheduleAssignmentPayload;
    }) => addScheduleAssignment(scheduleId, payload),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["patrol-schedules"],
      });
    },
  });
};

export const usePatrolScheduleActivate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => activatePatrolSchedule(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["patrol-schedules"],
      });
    },
  });
};

export const useMonthlyRoster = (params: MonthlyRosterQuery | null) => {
  return useQuery<MonthlyRosterItem[], Error>({
    queryKey: ["monthly-roster", params?.siteId, params?.month, params?.year],
    queryFn: () => {
      if (!params) {
        throw new Error("Parameter roster tidak tersedia");
      }
      return getMonthlyRoster(params);
    },
    enabled: Boolean(params?.siteId && params?.month && params?.year),
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdatePatrolSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdatePatrolSchedulePayload;
    }) => updatePatrolSchedule(id, payload),

    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["patrol-schedules"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["patrol-schedule", variables.id],
        }),
      ]);
    },
  });
};
export const useDeletePatrolSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deletePatrolSchedule(id),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["patrol-schedules"],
      });
    },
  });
};
