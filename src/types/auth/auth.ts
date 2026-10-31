import type { UserResponse } from "../user/user";

// POST /auth/login
export interface LoginRequest {
  username: string;
  password: string;
}

// POST /auth/register
export interface RegisterRequest {
  roleId: string;
  siteId?: string;
  fullName: string;
  username: string;
  employeeNumber: string;
  email?: string;
  phone?: string;
  password: string;
}

// POST /auth/refresh
export interface RefreshTokenRequest {
  refreshToken: string;
}

// Respons token dari backend
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Respons login
export interface LoginResponse extends AuthTokens {
  user: UserResponse;
}

// Respons logout seluruh sesi
export interface LogoutAllResponse {
  message: string;
  revokedSessions: number;
}
