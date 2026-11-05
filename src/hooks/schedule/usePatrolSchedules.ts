import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  activatePatrolSchedule,
  addScheduleAssignment,
  archivePatrolSchedule,
  createPatrolSchedule,
  deletePatrolSchedule,
  getMonthlyRoster,
  getPatrolScheduleById,
  getPatrolSchedules,
  unarchivePatrolSchedule,
  updatePatrolSchedule,
} from "../../services/schedule/patrol-schedule.service";
import type {
  AddScheduleAssignmentPayload,
  CreatePatrolSchedulePayload,
  MonthlyRosterQuery,
  RosterUser,
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
  return useQuery<RosterUser[], Error>({
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

        queryClient.invalidateQueries({
          queryKey: ["patrol-schedule-assignments"],
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
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["patrol-schedules"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["patrol-schedule-assignments"],
        }),
      ]);
    },
  });
};

export const useArchivePatrolSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => archivePatrolSchedule(id),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["patrol-schedules"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["patrol-schedule-assignments"],
        }),
      ]);
    },
  });
};

export const useUnarchivePatrolSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => unarchivePatrolSchedule(id),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["patrol-schedules"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["patrol-schedule-assignments"],
        }),
      ]);
    },
  });
};
