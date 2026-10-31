import type { DeviceStatus } from "../enums/prisma-enums";

import type { UserSummary } from "./user";

export interface UserDeviceResponse {
  id: string;
  userId: string;

  deviceIdentifier: string;

  platform: string | null;
  model: string | null;
  osVersion: string | null;
  appVersion: string | null;

  status: DeviceStatus;
  lastSeenAt: string | null;

  createdAt: string;
  updatedAt: string;

  user?: UserSummary;
}

export interface RegisterUserDeviceRequest {
  deviceIdentifier: string;

  platform?: string | null;
  model?: string | null;
  osVersion?: string | null;
  appVersion?: string | null;
}

export interface UpdateUserDeviceRequest {
  platform?: string | null;
  model?: string | null;
  osVersion?: string | null;
  appVersion?: string | null;
  status?: DeviceStatus;
}

export interface UserDeviceQuery {
  userId?: string;
  status?: DeviceStatus;
  search?: string;

  page?: number;
  limit?: number;
}
