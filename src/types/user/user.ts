import type { RoleName, TeamStatus, UserStatus } from "../enums/prisma-enums";

import type { Role } from "./role";
import type { Site } from "../site/site";

export interface UserResponse {
  id: string;
  roleId: string;
  teamId: string;
  siteId: string | null;

  employeeNumber: string | null;
  fullName: string;
  username: string;
  email: string | null;
  phone: string | null;
  photoUrl?: string | null;

  status: UserStatus;

  lastLoginAt: string | null;
  deletedAt: string | null;

  createdAt: string;
  updatedAt: string;

  role?: Role;
  site?: Site | null;
  team?: Team | null;
}

export interface CreateUserRequest {
  employeeNumber?: string | null;
  fullName: string;
  username?: string;
  email?: string | null;
  phone?: string | null;
  password: string;
  // team?: CreateTeamUser;

  roleId: string;
  siteId?: string | null;
  teamId?: string;

  // status?: UserStatus;
}

export interface EditUserForm {
  employeeNumber: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  role: RoleName;
  teamId: string;
}

export interface UpdateUserRequest {
  employeeNumber?: string | null;
  fullName?: string;
  username?: string;
  email?: string | null;
  phone?: string | null;
  password?: string;
  team?: UpdateTeamUser;

  roleId?: string;
  siteId?: string | null;
  teamId?: string | null;
}

export interface UserQuery {
  search?: string;
  roleId?: string;
  siteId?: string;
  status?: UserStatus;

  page?: number;
  limit?: number;

  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface UserSummary {
  id: string;
  fullName: string;
  username: string;
  employeeNumber: string | null;
  status: UserStatus;
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

  site?: Site;
  users?: UserResponse[];
}

export interface UpdateTeamUser {
  name: string;
  code: string;
  description?: string | null;
}
export interface CreateTeamUser {
  name: string;
  code: string;
  description?: string | null;
}
