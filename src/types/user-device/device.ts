import type { DeviceStatus } from "../enums/prisma-enums";

export interface DeviceResponse {
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
}

export interface RegisterDeviceRequest {
  deviceIdentifier: string;
  platform?: string;
  model?: string;
  osVersion?: string;
  appVersion?: string;
}

export interface RegisterDeviceResponse {
  status: "SUCCESS";
  message: string;
  data: DeviceResponse;
}
