import { apiClient } from "../../lib/apiClient";

import type {
  BulkAssignUserPayload,
  BulkAssignUserResponse,
  CreateScheduleAssignmentPayload,
  DeleteScheduleAssignmentResponse,
  PatrolScheduleAssignment,
} from "../../types/schedule/schedule-assignment";

// Menambahkan satu petugas ke schedule
export const createScheduleAssignment = async (
  scheduleId: string,
  payload: CreateScheduleAssignmentPayload,
): Promise<PatrolScheduleAssignment> => {
  const response = await apiClient.post<PatrolScheduleAssignment>(
    `/patrol-schedule-assignments/schedules/${scheduleId}/assign`,
    payload,
  );

  return response.data;
};

// satu petugas ke schedule
export const removeScheduleAssignment = async (
  scheduleId: string,
  assignmentId: string,
): Promise<PatrolScheduleAssignment> => {
  const response = await apiClient.delete<PatrolScheduleAssignment>(
    `/patrol-schedule-assignments/schedules/${scheduleId}/${assignmentId}`,
  );
  return response.data;
};

// Menambahkan beberapa assignment sekaligus untuk satu petugas
export const bulkAssignUser = async (
  payload: BulkAssignUserPayload,
): Promise<BulkAssignUserResponse> => {
  const response = await apiClient.post<BulkAssignUserResponse>(
    `/patrol-schedule-assignments/bulk`,
    payload,
  );

  return response.data;
};

// Mengambil seluruh assignment dalam schedule
export const getScheduleAssignment = async (
  scheduleId: string,
): Promise<PatrolScheduleAssignment[]> => {
  const response = await apiClient.get<PatrolScheduleAssignment[]>(
    `/patrol-schedule-assignments/${scheduleId}`,
  );

  return response.data;
};

export const getScheduleAssignments = async (): Promise<
  PatrolScheduleAssignment[]
> => {
  const response = await apiClient.get<PatrolScheduleAssignment[]>(
    `/patrol-schedule-assignments`,
  );

  return response.data;
};

// Menghapus assignment dari schedule
export const deleteScheduleAssignment = async (
  scheduleId: string,
  assignmentId: string,
): Promise<DeleteScheduleAssignmentResponse> => {
  const response = await apiClient.delete<DeleteScheduleAssignmentResponse>(
    `/patrol-schedule-assignments/schedules/${scheduleId}/${assignmentId}`,
  );

  return response.data;
};
