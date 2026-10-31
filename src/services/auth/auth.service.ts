import { apiClient } from "../../lib/apiClient";

import type { ApiResponse } from "../../types/common/api";

import type { UserResponse } from "../../types/user/user";

import type {
  AuthTokens,
  LoginRequest,
  LoginResponse,
  LogoutAllResponse,
  RefreshTokenRequest,
  RegisterRequest,
} from "../../types/auth/auth";

// POST /auth/register
export const register = async (
  payload: RegisterRequest,
): Promise<ApiResponse<UserResponse>> => {
  const response = await apiClient.post<ApiResponse<UserResponse>>(
    "/auth/register",
    payload,
  );

  return response.data;
};

// POST /auth/login
export const login = async (
  payload: LoginRequest,
): Promise<ApiResponse<LoginResponse>> => {
  const response = await apiClient.post<ApiResponse<LoginResponse>>(
    "/auth/login",
    payload,
  );

  return response.data;
};

// POST /auth/refresh
export const refreshToken = async (
  payload: RefreshTokenRequest,
): Promise<ApiResponse<AuthTokens>> => {
  const response = await apiClient.post<ApiResponse<AuthTokens>>(
    "/auth/refresh",
    payload,
  );

  return response.data;
};

// GET /auth/me
export const getMe = async (): Promise<ApiResponse<UserResponse>> => {
  const response = await apiClient.get<ApiResponse<UserResponse>>("/auth/me");

  return response.data;
};

// POST /auth/logout
export const logout = async (): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>("/auth/logout");

  return response.data;
};

// POST /auth/logout-all
export const logoutAll = async (): Promise<LogoutAllResponse> => {
  const response = await apiClient.post<LogoutAllResponse>("/auth/logout-all");

  return response.data;
};
