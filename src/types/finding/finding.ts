import type { FindingSeverity, FindingStatus } from "../enums/prisma-enums";
import type { FindingPhoto } from "./finding-photo";
import type { UserResponse } from "../user/user";

export interface FindingPatrolPoint {
  id: string;
  code: string;
  name: string;
  site: {
    id: string;
    name: string;
  };
}

export interface Finding {
  id: string;
  patrolId: string;
  patrolPointId: string;
  reportedById: string;

  assignedToId?: string | null;
  resolvedById?: string | null;

  title: string;
  description?: string | null;

  severity: FindingSeverity;
  status: FindingStatus;

  resolvedAt?: string | null;
  resolutionNote?: string | null;

  createdAt: string;
  updatedAt: string;

  photos?: FindingPhoto[];

  reportedBy?: UserResponse | null;
  assignedTo?: UserResponse | null;
  resolvedBy?: UserResponse | null;

  patrolPoint?: FindingPatrolPoint;
}

export interface CreateFindingRequest {
  patrolId: string;
  patrolPointId: string;
  reportedById: string;
  assignedToId?: string | null;
  title: string;
  description?: string | null;
  severity?: FindingSeverity;
  status?: FindingStatus;
}

export interface UpdateFindingRequest {
  assignedToId?: string | null;
  resolvedById?: string | null;
  title?: string;
  description?: string | null;
  severity?: FindingSeverity;
  status?: FindingStatus;
  resolvedAt?: string | null;
  resolutionNote?: string | null;
}

export interface FindingQuery {
  patrolId?: string;
  patrolPointId?: string;
  reportedById?: string;
  assignedToId?: string;
  resolvedById?: string;
  severity?: FindingSeverity;
  status?: FindingStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface FindingListResponse {
  data: Finding[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
