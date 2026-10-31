import type { TeamStatus } from "../enums/prisma-enums";

export interface TeamSite {
  id: string;
  code: string;
  name: string;
}

export interface TeamCount {
  users: number;
}

export interface Team {
  id: string;
  siteId: string;
  name: string;
  code: string;
  description: string | null;
  status: TeamStatus;
  createdAt: string;
  updatedAt: string;
  site: TeamSite;
  _count: TeamCount;
}

export interface CreateTeamPayload {
  siteId: string | null;
  name: string;
  code: string;
  description?: string;
}

export interface UpdateTeamPayload {
  siteId?: string;
  name?: string;
  code?: string;
  description?: string | null;
  status?: TeamStatus;
}

export interface QueryTeamParams {
  siteId?: string;
  status?: TeamStatus;
}

export interface DeleteTeamResponse {
  message: string;
  data: {
    id: string;
  };
}

export interface UpdateTeamVariables {
  id: string;
  payload: UpdateTeamPayload;
}
