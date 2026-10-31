import { apiClient } from "../../lib/apiClient";

import type {
  ActivePatrolPointResponse,
  CreatePatrolPointRequest,
  CreatePatrolPointResponse,
  PatrolPointBase,
  PatrolPointDetailResponse,
  PatrolPointQuery,
  PatrolPointResponse,
  UpdatePatrolPointRequest,
} from "../../types/patrol-point/patrolPoint";

// POST /patrol-points
export const createPatrolPoint = async (
  payload: CreatePatrolPointRequest,
): Promise<CreatePatrolPointResponse> => {
  const response = await apiClient.post<CreatePatrolPointResponse>(
    "/patrol-points",
    payload,
  );

  return response.data;
};

// GET /patrol-points
export const getPatrolPoints = async (
  query?: PatrolPointQuery,
): Promise<PatrolPointResponse[]> => {
  const response = await apiClient.get<PatrolPointResponse[]>(
    "/patrol-points",
    {
      params: query,
    },
  );

  return response.data;
};

// GET /patrol-points/active
export const getActivePatrolPoints = async (
  query?: PatrolPointQuery,
): Promise<ActivePatrolPointResponse[]> => {
  const response = await apiClient.get<ActivePatrolPointResponse[]>(
    "/patrol-points/active",
    {
      params: query,
    },
  );

  return response.data;
};

// GET /patrol-points/:id
export const getPatrolPointById = async (
  id: string,
): Promise<PatrolPointDetailResponse> => {
  const response = await apiClient.get<PatrolPointDetailResponse>(
    `/patrol-points/${id}`,
  );

  return response.data;
};

// PATCH /patrol-points/:id
export const updatePatrolPoint = async (
  id: string,
  payload: UpdatePatrolPointRequest,
): Promise<PatrolPointResponse> => {
  console.log(payload);

  const response = await apiClient.patch<PatrolPointResponse>(
    `/patrol-points/${id}`,
    payload,
  );
  console.log(response);

  return response.data;
};

// PATCH /patrol-points/:id/deactivate
export const deactivatePatrolPoint = async (
  id: string,
): Promise<PatrolPointBase> => {
  const response = await apiClient.patch<PatrolPointBase>(
    `/patrol-points/${id}/deactivate`,
  );

  return response.data;
};

// PATCH /patrol-points/:id/activate
export const activatePatrolPoint = async (
  id: string,
): Promise<PatrolPointBase> => {
  const response = await apiClient.patch<PatrolPointBase>(
    `/patrol-points/${id}/activate`,
  );

  return response.data;
};

// DELETE /patrol-points/:id
// Soft delete: mengisi deletedAt dan mengubah status menjadi INACTIVE
export const deletePatrolPoint = async (
  id: string,
): Promise<PatrolPointBase> => {
  const response = await apiClient.delete<PatrolPointBase>(
    `/patrol-points/${id}`,
  );

  return response.data;
};

// Tipe response untuk operasi status dan soft delete
export interface PatrolPointBaseResponse {
  id: string;
  siteId: string;
  createdById: string;
  code: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  status: "ACTIVE" | "INACTIVE";
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
