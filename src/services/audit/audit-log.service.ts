import { apiClient } from "../../lib/apiClient";
import type {
  AuditLogListResponse,
  AuditLogQuery,
} from "../../types/audit/audit-log";

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  oldData: unknown;
  newData: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user?: {
    id: string;
    fullName: string | null;
    employeeNumber?: string | null;
    role?: {
      id: string;
      name: string;
    } | null;
  } | null;
}

interface AuditLogsResponse {
  data: AuditLog[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DeleteAuditLogResponse {
  message: string;
  deletedCount: number;
}

export const getAuditLogs = async (
  params: AuditLogQuery = {},
): Promise<AuditLogListResponse> => {
  const response = await apiClient.get<AuditLogListResponse>("/audit-logs", {
    params,
  });

  return response.data;
};

export const getAuditLogById = async (id: string): Promise<AuditLog> => {
  const response = await apiClient.get<AuditLog>(`/audit-logs/${id}`);

  return response.data;
};

export const getAllAuditLogs = async (): Promise<AuditLog[]> => {
  const limit = 100;

  const firstResponse = await apiClient.get<AuditLogsResponse>("/audit-logs", {
    params: { page: 1, limit },
  });

  const firstPage = firstResponse.data;
  const allLogs = [...firstPage.data];

  if (firstPage.meta.totalPages <= 1) {
    return allLogs;
  }

  for (let page = 2; page <= firstPage.meta.totalPages; page++) {
    const response = await apiClient.get<AuditLogsResponse>("/audit-logs", {
      params: { page, limit },
    });

    allLogs.push(...response.data.data);
  }

  return allLogs;
};

export const deleteAuditLog = async (
  id: string,
): Promise<DeleteAuditLogResponse> => {
  const response = await apiClient.delete<DeleteAuditLogResponse>(
    `/audit-logs/${id}`,
  );

  return response.data;
};

export const deleteSelectedAuditLogs = async (
  ids: string[],
): Promise<DeleteAuditLogResponse> => {
  const response = await apiClient.delete<DeleteAuditLogResponse>(
    "/audit-logs/selected",
    {
      data: { ids },
    },
  );

  return response.data;
};

export const deleteAllAuditLogs = async (): Promise<DeleteAuditLogResponse> => {
  const response =
    await apiClient.delete<DeleteAuditLogResponse>("/audit-logs/all");

  return response.data;
};
