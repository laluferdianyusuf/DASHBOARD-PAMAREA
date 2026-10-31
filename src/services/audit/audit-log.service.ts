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

  // Ambil halaman pertama untuk mengetahui total halaman.
  const firstResponse = await apiClient.get<AuditLogsResponse>("/audit-logs", {
    params: {
      page: 1,
      limit,
    },
  });

  const firstPage = firstResponse.data;
  const allLogs = [...firstPage.data];

  // Jika hanya ada satu halaman, langsung kembalikan hasilnya.
  if (firstPage.meta.totalPages <= 1) {
    return allLogs;
  }

  // Ambil halaman berikutnya sampai seluruh data terkumpul.
  for (let page = 2; page <= firstPage.meta.totalPages; page++) {
    const response = await apiClient.get<AuditLogsResponse>("/audit-logs", {
      params: {
        page,
        limit,
      },
    });

    allLogs.push(...response.data.data);
  }

  return allLogs;
};
