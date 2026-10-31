import { apiClient } from "../../lib/apiClient";

import type { ApiResponse } from "../../types";

import type {
  CreateRoleRequest,
  UpdateRoleRequest,
  RoleResponse,
  RoleWithCountResponse,
} from "../../types/role/role";

// GET /roles
export const getRoles = async (): Promise<
  ApiResponse<RoleWithCountResponse[]>
> => {
  const response =
    await apiClient.get<ApiResponse<RoleWithCountResponse[]>>("/roles");

  return response.data;
};

// GET /roles/:id
export const getRoleById = async (
  id: string,
): Promise<ApiResponse<RoleWithCountResponse>> => {
  const response = await apiClient.get<ApiResponse<RoleWithCountResponse>>(
    `/roles/${id}`,
  );

  return response.data;
};

// POST /roles
export const createRole = async (
  payload: CreateRoleRequest,
): Promise<ApiResponse<RoleResponse>> => {
  const response = await apiClient.post<ApiResponse<RoleResponse>>(
    "/roles",
    payload,
  );

  return response.data;
};

// PATCH /roles/:id
export const updateRole = async (
  id: string,
  payload: UpdateRoleRequest,
): Promise<ApiResponse<RoleResponse>> => {
  const response = await apiClient.patch<ApiResponse<RoleResponse>>(
    `/roles/${id}`,
    payload,
  );

  return response.data;
};

// DELETE /roles/:id
export const deleteRole = async (id: string): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ message: string }>(`/roles/${id}`);

  return response.data;
};
