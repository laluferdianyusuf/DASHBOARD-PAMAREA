import type { UserSummary } from "./user";

export interface Session {
  id: string;
  userId: string;

  expiresAt: string;
  revokedAt: string | null;

  createdAt: string;

  user?: UserSummary;
}

export interface RevokeSessionRequest {
  sessionId: string;
}

export interface SessionQuery {
  userId?: string;
  page?: number;
  limit?: number;
}
