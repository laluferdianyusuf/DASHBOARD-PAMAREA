import type { ScheduleAssignmentStatus } from "../enums/prisma-enums";
import type { UserResponse } from "../user/user";
import type { PatrolSchedule } from "./patrol-schedule";
// import type { PatrolSchedule } from "./patrol-schedule";

export interface ScheduleAssignmentUser {
  id: string;
  employeeNumber: string | null;
  fullName: string;
  username: string;
}

export interface PatrolScheduleAssignment {
  id: string;
  scheduleId: string;
  userId: string;
  startDate: string;
  endDate?: string | null;
  status: ScheduleAssignmentStatus;
  createdById: string;
  createdAt: string;
  updatedAt: string;

  schedule?: PatrolSchedule;
  user?: ScheduleAssignmentUser;
}

export interface ScheduleAssignmentDetailResponse extends PatrolScheduleAssignment {
  user?: UserResponse;

  createdBy?: UserResponse;
}

export interface CreateScheduleAssignmentPayload {
  userId: string;
  startDate: string;
  endDate?: string | null;
}

export interface BulkScheduleAssignmentItem {
  scheduleId: string;
  startDate: string;
  endDate?: string;
}

export interface BulkAssignUserPayload {
  userId: string;
  assignments: BulkScheduleAssignmentItem[];
}

export interface DeleteScheduleAssignmentResponse {
  message: string;
}

export interface BulkAssignUserResponse {
  message: string;
  data: PatrolScheduleAssignment[];
}

export interface UpdateScheduleAssignmentRequest {
  startDate?: string;
  endDate?: string | null;
  status?: ScheduleAssignmentStatus;
}

export interface ScheduleAssignmentQuery {
  scheduleId?: string;
  userId?: string;
  status?: ScheduleAssignmentStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
