import { apiClient } from "../../lib/apiClient";

import type { ApiResponse } from "../../types/common/api";

import type {
  CreateSiteRequest,
  Site,
  UpdateSiteRequest,
} from "../../types/site/site";

// GET /sites
export const getSites = async (): Promise<ApiResponse<Site[]>> => {
  const response = await apiClient.get<ApiResponse<Site[]>>("/sites");

  return response.data;
};

// GET /sites/active
export const getActiveSites = async (): Promise<ApiResponse<Site[]>> => {
  const response = await apiClient.get<ApiResponse<Site[]>>("/sites/active");

  return response.data;
};

// GET /sites/:id
export const getSiteById = async (id: string): Promise<ApiResponse<Site>> => {
  const response = await apiClient.get<ApiResponse<Site>>(`/sites/${id}`);

  return response.data;
};

// POST /sites
export const createSite = async (
  payload: CreateSiteRequest,
): Promise<ApiResponse<Site>> => {
  const response = await apiClient.post<ApiResponse<Site>>("/sites", payload);

  return response.data;
};

// PATCH /sites/:id
export const updateSite = async (
  id: string,
  payload: UpdateSiteRequest,
): Promise<ApiResponse<Site>> => {
  const response = await apiClient.patch<ApiResponse<Site>>(
    `/sites/${id}`,
    payload,
  );

  return response.data;
};

// PATCH /sites/:id/deactivate
export const deactivateSite = async (
  id: string,
): Promise<ApiResponse<Site>> => {
  const response = await apiClient.patch<ApiResponse<Site>>(
    `/sites/${id}/deactivate`,
  );

  return response.data;
};

// PATCH /sites/:id/activate
export const activateSite = async (id: string): Promise<ApiResponse<Site>> => {
  const response = await apiClient.patch<ApiResponse<Site>>(
    `/sites/${id}/activate`,
  );

  return response.data;
};

// DELETE /sites/:id
export const deleteSite = async (id: string): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ message: string }>(`/sites/${id}`);

  return response.data;
};
