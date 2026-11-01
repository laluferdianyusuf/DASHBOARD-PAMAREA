import { apiClient } from "../../lib/apiClient";
import type { AddSchedulePointPayload } from "../../types";

import type {
  PatrolSchedulePoint,
  CreateSchedulePointPayload,
  CreateManySchedulePointsPayload,
  CreateManySchedulePointsResponse,
  UpdateSchedulePointPayload,
  UpdateSchedulePointResponse,
  DeleteSchedulePointResponse,
} from "../../types/schedule/schedule-point";

const BASE_URL = "/patrol-schedules-points";

// Menambahkan satu point ke schedule
export const createSchedulePoint = async (
  scheduleId: string,
  payload: CreateSchedulePointPayload,
): Promise<PatrolSchedulePoint> => {
  const response = await apiClient.post<PatrolSchedulePoint>(
    `${BASE_URL}/${scheduleId}/points`,
    payload,
  );

  return response.data;
};

// Menambahkan banyak point ke schedule sekaligus
export const createManySchedulePoints = async (
  scheduleId: string,
  payload: CreateManySchedulePointsPayload,
): Promise<CreateManySchedulePointsResponse> => {
  const response = await apiClient.post<CreateManySchedulePointsResponse>(
    `${BASE_URL}/${scheduleId}/points/many`,
    payload,
  );

  return response.data;
};

// Mengambil seluruh point dalam schedule
export const getSchedulePoints = async (
  scheduleId: string,
): Promise<PatrolSchedulePoint[]> => {
  const response = await apiClient.get<PatrolSchedulePoint[]>(
    `${BASE_URL}/${scheduleId}`,
  );

  return response.data;
};

// Memperbarui point dalam schedule
export const updateSchedulePoint = async (
  scheduleId: string,
  pointId: string,
  payload: UpdateSchedulePointPayload,
): Promise<UpdateSchedulePointResponse> => {
  const response = await apiClient.patch<UpdateSchedulePointResponse>(
    `${BASE_URL}/${scheduleId}/points/${pointId}`,
    payload,
  );

  return response.data;
};

// Menghapus point dari schedule
export const deleteSchedulePoint = async (
  scheduleId: string,
  pointId: string,
): Promise<DeleteSchedulePointResponse> => {
  const response = await apiClient.delete<DeleteSchedulePointResponse>(
    `${BASE_URL}/${scheduleId}/points/${pointId}`,
  );

  return response.data;
};

// Menambahkan point ke schedule
export const addSchedulePoint = async (
  scheduleId: string,
  payload: AddSchedulePointPayload,
): Promise<PatrolSchedulePoint> => {
  const response = await apiClient.post<PatrolSchedulePoint>(
    `/patrol-schedules-points/${scheduleId}/new-point`,
    payload,
  );

  return response.data;
};
