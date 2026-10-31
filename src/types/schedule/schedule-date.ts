import type { ScheduleDateStatus } from "../enums/prisma-enums";

export interface PatrolScheduleDate {
  id: string;
  scheduleId: string;
  date: string;
  status: ScheduleDateStatus;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
}

// export interface ScheduleDateDetailResponse
//   extends PatrolScheduleDate {
//   // Tambahkan relasi rounds di sini jika endpoint
//   // mengembalikan detail ronde patroli.
// }

export interface CreateScheduleDatesPayload {
  dates: string[];
}

export interface ScheduleDateListQuery {
  scheduleId: string;
}

export type CancelScheduleDateResponse = PatrolScheduleDate;

// export interface CancelScheduleDateResponse {
//   id: string;
//   scheduleId: string;
//   date: string;
//   status: ScheduleDateStatus;
//   createdById: string;
//   createdAt: string;
//   updatedAt: string;
// }

export interface CreateScheduleDateRequest {
  scheduleId: string;
  date: string;
  status?: ScheduleDateStatus;
}

export interface UpdateScheduleDateRequest {
  date?: string;
  status?: ScheduleDateStatus;
}

export interface ScheduleDateQuery {
  scheduleId?: string;
  status?: ScheduleDateStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
