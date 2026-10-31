import { apiClient } from "../../lib/apiClient";

import type {
  GenerateSchedulePayload,
  GenerateScheduleResponse,
} from "../../types/schedule/schedule-generation";

export const generateSchedule = async (
  scheduleId: string,
  payload: GenerateSchedulePayload,
): Promise<GenerateScheduleResponse> => {
  const response = await apiClient.post<GenerateScheduleResponse>(
    `/patrol-schedules/${scheduleId}/generate`,
    payload,
  );

  return response.data;
};
