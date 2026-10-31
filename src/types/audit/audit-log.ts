import type { UserResponse } from "../user/user";

export interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;

  user?: UserResponse;
}

export interface AuditLogMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AuditLogListResponse {
  data: AuditLog[];
  meta: AuditLogMeta;
}

export interface AuditLogQuery {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  startDate?: string;
  endDate?: string;
}

export type AuditLogDetailResponse = AuditLog;
