import { apiClient } from "../../lib/apiClient";

import type {
  PatrolScheduleDate,
  CreateScheduleDatesPayload,
  CancelScheduleDateResponse,
} from "../../types/schedule/schedule-date";

// Menambahkan tanggal ke schedule
export const createScheduleDates = async (
  scheduleId: string,
  payload: CreateScheduleDatesPayload,
): Promise<PatrolScheduleDate[]> => {
  const response = await apiClient.post<PatrolScheduleDate[]>(
    `/patrol-schedules/${scheduleId}/dates`,
    payload,
  );

  return response.data;
};

// Mengambil semua tanggal dalam schedule
export const getScheduleDates = async (
  scheduleId: string,
): Promise<PatrolScheduleDate[]> => {
  const response = await apiClient.get<PatrolScheduleDate[]>(
    `/patrol-schedules/${scheduleId}/dates`,
  );

  return response.data;
};

// Membatalkan tanggal schedule
export const cancelScheduleDate = async (
  scheduleId: string,
  dateId: string,
): Promise<CancelScheduleDateResponse> => {
  const response = await apiClient.delete<CancelScheduleDateResponse>(
    `/patrol-schedules/${scheduleId}/dates/${dateId}`,
  );

  return response.data;
};
