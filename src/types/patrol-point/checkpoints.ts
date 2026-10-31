import type { PatrolPointStatus } from "../enums/prisma-enums";
import type { Site } from "../site/site";

export interface PatrolPoint {
  id: string;
  siteId: string;
  createdById: string;
  code: string;
  name: string;
  description?: string | null;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  status: PatrolPointStatus;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;

  site?: Site;
}

export interface CreatePatrolPointRequest {
  siteId: string;

  code: string;
  name: string;
  description?: string | null;

  latitude: number;
  longitude: number;

  radiusMeters?: number;

  status?: PatrolPointStatus;
}

export interface UpdatePatrolPointRequest {
  siteId?: string;

  code?: string;
  name?: string;
  description?: string | null;

  latitude?: number;
  longitude?: number;

  radiusMeters?: number;

  status?: PatrolPointStatus;
}

export interface PatrolPointQuery {
  search?: string;

  siteId?: string;
  status?: PatrolPointStatus;

  page?: number;
  limit?: number;

  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PatrolPointSummary {
  id: string;
  siteId: string;

  code: string;
  name: string;

  latitude: number;
  longitude: number;

  radiusMeters: number;
  status: PatrolPointStatus;
}

/** Mock checkpoint shape used by checkpoint.service */
export interface Checkpoint {
  id: string;
  code: string;
  name: string;
  site?: string;
  description?: string | null;
  latitude: number | null;
  longitude: number | null;
  radiusMeters: number;
  status: string;
  nfcStatus?: string | null;
}

export type CreateCheckpointPayload = Omit<Checkpoint, "id">;
export type UpdateCheckpointPayload = Partial<CreateCheckpointPayload>;
