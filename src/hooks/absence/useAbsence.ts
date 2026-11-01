import {
  cancelSecurityAbsence,
  createSecurityAbsence,
  getSecurityAbsenceById,
  getSecurityAbsences,
} from "@/src/services/absence/security-absence.service";
import {
  CreateSecurityAbsenceRequest,
  QuerySecurityAbsence,
} from "@/src/types/absence/security-absence";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const absenceKeys = {
  all: ["security-absences"] as const,

  lists: () => [...absenceKeys.all, "list"] as const,

  list: (query?: QuerySecurityAbsence) =>
    [...absenceKeys.lists(), query] as const,

  details: () => [...absenceKeys.all, "detail"] as const,

  detail: (id: string) => [...absenceKeys.details(), id] as const,
};

export const useAbsences = (query?: QuerySecurityAbsence) => {
  return useQuery({
    queryKey: absenceKeys.list(query),
    queryFn: () => getSecurityAbsences(query),
  });
};

export const useAbsence = (id: string) => {
  return useQuery({
    queryKey: absenceKeys.detail(id),
    queryFn: () => getSecurityAbsenceById(id),
    enabled: Boolean(id),
  });
};

export const useCreateAbsence = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSecurityAbsenceRequest) =>
      createSecurityAbsence(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: absenceKeys.all,
      });
    },
  });
};

export const useCancelAbsence = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cancelSecurityAbsence(id),

    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: absenceKeys.all,
      });

      queryClient.invalidateQueries({
        queryKey: absenceKeys.detail(id),
      });
    },
  });
};
