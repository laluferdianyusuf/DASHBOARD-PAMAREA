import { apiClient } from "../../lib/apiClient";
import type { ApiResponse } from "../../types";
import type {
  CreateUserRequest,
  UpdateUserRequest,
  UserResponse,
} from "../../types/user/user";

export const getUsers = async (): Promise<ApiResponse<UserResponse[]>> => {
  const response = await apiClient.get<ApiResponse<UserResponse[]>>("/users");

  return response.data;
};

export const getSecurityUsers = async (): Promise<
  ApiResponse<UserResponse[]>
> => {
  const response =
    await apiClient.get<ApiResponse<UserResponse[]>>("/users/security");
  return response.data;
};

export const getActiveUsers = async (): Promise<
  ApiResponse<UserResponse[]>
> => {
  const response =
    await apiClient.get<ApiResponse<UserResponse[]>>("/users/active");
  return response.data;
};

export const getUserById = async (
  id: string,
): Promise<ApiResponse<UserResponse>> => {
  const response = await apiClient.get<ApiResponse<UserResponse>>(
    `/users/${id}`,
  );
  return response.data;
};

export const createUser = async (
  payload: CreateUserRequest,
): Promise<ApiResponse<UserResponse>> => {
  const response = await apiClient.post<ApiResponse<UserResponse>>(
    "/users",
    payload,
  );
  return response.data;
};

export const updateUser = async (
  id: string,
  payload: UpdateUserRequest,
): Promise<ApiResponse<UserResponse>> => {
  const response = await apiClient.patch<ApiResponse<UserResponse>>(
    `/users/${id}`,
    payload,
  );
  return response.data;
};

export const deactivateUser = async (
  id: string,
): Promise<ApiResponse<UserResponse>> => {
  const response = await apiClient.patch<ApiResponse<UserResponse>>(
    `/users/${id}/deactivate`,
  );
  return response.data;
};

export const activateUser = async (
  id: string,
): Promise<ApiResponse<UserResponse>> => {
  const response = await apiClient.patch<ApiResponse<UserResponse>>(
    `/users/${id}/activate`,
  );
  return response.data;
};

export const deleteUser = async (id: string): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ message: string }>(`/users/${id}`);
  return response.data;
};
