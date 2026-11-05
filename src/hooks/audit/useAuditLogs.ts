import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  deleteAllAuditLogs,
  deleteAuditLog,
  deleteSelectedAuditLogs,
  getAuditLogById,
  getAuditLogs,
} from "../../services/audit/audit-log.service";

import type { AuditLogQuery } from "../../types/audit/audit-log";

export const auditLogKeys = {
  all: ["audit-logs"] as const,

  lists: () => [...auditLogKeys.all, "list"] as const,

  list: (params: AuditLogQuery) => [...auditLogKeys.lists(), params] as const,

  details: () => [...auditLogKeys.all, "detail"] as const,

  detail: (id: string) => [...auditLogKeys.details(), id] as const,
};

export const useAuditLogs = (params: AuditLogQuery = {}) => {
  return useQuery({
    queryKey: auditLogKeys.list(params),
    queryFn: () => getAuditLogs(params),
    staleTime: 30 * 1000,
    retry: false,
    placeholderData: keepPreviousData,
  });
};

export const useAuditLogDetail = (id: string | null) => {
  return useQuery({
    queryKey: auditLogKeys.detail(id ?? ""),
    queryFn: () => getAuditLogById(id!),
    enabled: Boolean(id),
    staleTime: 30 * 1000,
    retry: false,
  });
};

export const useDeleteAuditLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAuditLog,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: auditLogKeys.all,
      });
    },
  });
};

export const useDeleteSelectedAuditLogs = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSelectedAuditLogs,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: auditLogKeys.all,
      });
    },
  });
};

export const useDeleteAllAuditLogs = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAllAuditLogs,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: auditLogKeys.all,
      });
    },
  });
};
