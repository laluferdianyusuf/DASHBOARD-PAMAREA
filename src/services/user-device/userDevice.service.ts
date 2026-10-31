import { apiClient } from "../../lib/apiClient";

import type {
  RegisterDeviceRequest,
  RegisterDeviceResponse,
} from "../../types/user-device/device";

// POST /device/register
export const registerDevice = async (
  payload: RegisterDeviceRequest,
): Promise<RegisterDeviceResponse> => {
  const response = await apiClient.post<RegisterDeviceResponse>(
    "/device/register",
    payload,
  );

  return response.data;
};
