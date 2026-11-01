import { apiClient } from "../../lib/apiClient";

import type {
  AddScheduleAssignmentPayload,
  CreatePatrolSchedulePayload,
  DeleteScheduleResponse,
  ExtendScheduleDatesPayload,
  ExtendScheduleDatesResponse,
  MonthlyRosterQuery,
  PatrolSchedule,
  PatrolScheduleListResponse,
  PatrolScheduleMutationResponse,
  RosterUser,
  ScheduleFilterQuery,
  UpdatePatrolSchedulePayload,
  UpdateScheduleAssignmentPayload,
} from "../../types/schedule/patrol-schedule";

import type { PatrolScheduleAssignment } from "../../types/schedule/schedule-assignment";

// Mengambil daftar schedule dengan filter dan pagination
export const getPatrolSchedules = async (
  params?: ScheduleFilterQuery,
): Promise<PatrolScheduleListResponse> => {
  const response = await apiClient.get<PatrolScheduleListResponse>(
    "/patrol-schedules",
    { params },
  );

  return response.data;
};

// Mengambil detail schedule berdasarkan ID
export const getPatrolScheduleById = async (
  id: string,
): Promise<PatrolSchedule> => {
  const response = await apiClient.get<PatrolSchedule>(
    `/patrol-schedules/${id}`,
  );

  return response.data;
};

// Membuat schedule baru
export const createPatrolSchedule = async (
  payload: CreatePatrolSchedulePayload,
): Promise<PatrolSchedule> => {
  const response = await apiClient.post<PatrolSchedule>(
    "/patrol-schedules",
    payload,
  );

  return response.data;
};

// Memperbarui schedule
export const updatePatrolSchedule = async (
  id: string,
  payload: UpdatePatrolSchedulePayload,
): Promise<PatrolScheduleMutationResponse> => {
  const response = await apiClient.patch<PatrolScheduleMutationResponse>(
    `/patrol-schedules/${id}`,
    payload,
  );

  return response.data;
};
// export const updatePatrolSchedule = async (
//   id: string,
//   payload: UpdatePatrolSchedulePayload,
// ): Promise<PatrolSchedule> => {
//   const response = await apiClient.patch<PatrolSchedule>(
//     `/patrol-schedules/${id}`,
//     payload,
//   );

//   return response.data;
// };

// Mengaktifkan schedule
export const activatePatrolSchedule = async (
  id: string,
): Promise<PatrolScheduleMutationResponse> => {
  const response = await apiClient.post<PatrolScheduleMutationResponse>(
    `/patrol-schedules/${id}/activate`,
  );

  return response.data;
};
// export const activatePatrolSchedule = async (
//   id: string,
// ): Promise<PatrolSchedule> => {
//   const response = await apiClient.post<PatrolSchedule>(
//     `/patrol-schedules/${id}/activate`,
//   );

//   return response.data;
// };

// Mengarsipkan schedule
export const archivePatrolSchedule = async (
  id: string,
): Promise<PatrolScheduleMutationResponse> => {
  const response = await apiClient.post<PatrolScheduleMutationResponse>(
    `/patrol-schedules/${id}/archive`,
  );

  return response.data;
};
// export const archivePatrolSchedule = async (
//   id: string,
// ): Promise<PatrolSchedule> => {
//   const response = await apiClient.post<PatrolSchedule>(
//     `/patrol-schedules/${id}/archive`,
//   );

//   return response.data;
// };

// Menghapus schedule
export const deletePatrolSchedule = async (
  id: string,
): Promise<DeleteScheduleResponse> => {
  const response = await apiClient.delete<DeleteScheduleResponse>(
    `/patrol-schedules/${id}`,
  );

  return response.data;
};

// Mengambil roster schedule bulanan
export const getMonthlyRoster = async (
  params: MonthlyRosterQuery,
): Promise<RosterUser[]> => {
  const response = await apiClient.get<RosterUser[]>(
    "/patrol-schedules/roster",
    { params },
  );

  return response.data;
};

// Menambahkan tanggal ke schedule
export const extendPatrolScheduleDates = async (
  id: string,
  payload: ExtendScheduleDatesPayload,
): Promise<ExtendScheduleDatesResponse> => {
  const response = await apiClient.post<ExtendScheduleDatesResponse>(
    `/patrol-schedules/${id}/extend-dates`,
    payload,
  );

  return response.data;
};

// Menambahkan assignment ke schedule
export const addScheduleAssignment = async (
  scheduleId: string,
  payload: AddScheduleAssignmentPayload,
): Promise<PatrolScheduleAssignment> => {
  const response = await apiClient.post<PatrolScheduleAssignment>(
    `/patrol-schedules/${scheduleId}/assignment`,
    payload,
  );

  return response.data;
};

// Memperbarui assignment
export const updateScheduleAssignment = async (
  assignmentId: string,
  payload: UpdateScheduleAssignmentPayload,
): Promise<PatrolScheduleAssignment> => {
  const response = await apiClient.patch<PatrolScheduleAssignment>(
    `/patrol-schedules/assignments/${assignmentId}`,
    payload,
  );

  return response.data;
};
