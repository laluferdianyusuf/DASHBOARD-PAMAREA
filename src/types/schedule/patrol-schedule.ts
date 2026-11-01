import type {
  ScheduleAssignmentStatus,
  ScheduleStatus,
} from "../enums/prisma-enums";
import type { PatrolScheduleAssignment } from "./schedule-assignment";
import type { PatrolScheduleDate } from "./schedule-date";
import type { PatrolSchedulePoint } from "./schedule-point";

export type PatrolScheduleMutationResponse = Omit<
  PatrolSchedule,
  "site" | "points" | "dates" | "assignments" | "_count"
>;

export interface PatrolScheduleSite {
  id: string;
  code: string;
  name: string;
}

export interface PatrolScheduleCount {
  points: number;
  dates: number;
  assignments: number;
}

export interface PatrolSchedule {
  id: string;
  siteId: string;
  name: string;
  startTime: string;
  endTime: string;
  intervalMinutes: number;
  gracePeriodMinutes: number;
  enforceSequence: boolean;
  status: ScheduleStatus;
  createdById: string;
  userId: string | null;
  createdAt: string;
  updatedAt: string;

  site?: PatrolScheduleSite;
  points?: PatrolSchedulePoint[];
  dates?: PatrolScheduleDate[];
  assignments?: PatrolScheduleAssignment[];
  _count?: PatrolScheduleCount;
}

// export interface CreatePatrolSchedulePayload {
//   siteId: string;
//   name: string;
//   startTime: string;
//   endTime: string;
//   intervalMinutes: number;
//   gracePeriodMinutes?: number;
//   enforceSequence?: boolean;

//   points: {
//     patrolPointId: string;
//     required?: boolean;
//   }[];

//   dates?: string[];

//   assignments?: {
//     userId: string;
//     startDate: string;
//     endDate?: string | null;
//   }[];
// }

export interface PatrolScheduleListItem extends Omit<
  PatrolSchedule,
  "site" | "points" | "dates" | "assignments"
> {
  site: PatrolScheduleSite;
  _count: PatrolScheduleCount;
}

export interface UpdatePatrolSchedulePayload {
  name?: string;
  startTime?: string;
  endTime?: string;
  intervalMinutes?: number;
  gracePeriodMinutes?: number;
  enforceSequence?: boolean;
}

export interface ScheduleFilterQuery {
  siteId?: string;
  status?: ScheduleStatus;
  page?: number;
  limit?: number;
}

export interface PatrolScheduleListResponse {
  data: PatrolScheduleListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface MonthlyRosterQuery {
  siteId: string;
  month: number;
  year: number;
}

export interface MonthlyRosterItem {
  userId: string;
  employeeNumber: string | null;
  fullName: string;
  shifts: Record<string, string>;
}

export interface ExtendScheduleDatesPayload {
  newDates: string[];
}

export interface AddScheduleAssignmentPayload {
  userId: string;
  startDate: string;
  endDate?: string | null;
}

export interface UpdateScheduleAssignmentPayload {
  endDate?: string | null;
  status?: ScheduleAssignmentStatus;
}

export interface AddSchedulePointPayload {
  patrolPointId: string;
  insertAtSequence: number;
  required?: boolean;
}

export interface DeleteScheduleResponse {
  message: string;
}

export interface ExtendScheduleDatesResponse {
  message: string;
}

export interface CreatePatrolScheduleRequest {
  siteId: string;
  name: string;
  startTime: string;
  endTime: string;
  intervalMinutes: number;
  gracePeriodMinutes?: number;
  enforceSequence?: boolean;
  status?: ScheduleStatus;
  userId?: string | null;
}

export interface UpdatePatrolScheduleRequest {
  siteId?: string;
  name?: string;
  startTime?: string;
  endTime?: string;
  intervalMinutes?: number;
  gracePeriodMinutes?: number;
  enforceSequence?: boolean;
  status?: ScheduleStatus;
  userId?: string | null;
}

export interface CreateSchedulePointInput {
  patrolPointId: string;
  required?: boolean;
}

export interface CreateScheduleAssignmentInput {
  userId: string;
  startDate: string;
  endDate?: string;
}

export interface CreatePatrolSchedulePayload {
  siteId: string;
  name: string;
  startTime: string;
  endTime: string;
  intervalMinutes: number;
  gracePeriodMinutes?: number;
  enforceSequence?: boolean;
  points: CreateSchedulePointInput[];
  dates?: string[];
  assignments?: CreateScheduleAssignmentInput[];
}

// roster

export interface SecurityUser {
  id: string;
  fullName: string;
  employeeNumber?: string | null;
  username?: string;
}

export interface Schedule {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  siteId?: string;
}

export interface RosterOfficer {
  assignmentId: string;
  officerId: string;
  officerName: string;
  employeeNumber?: string;
  scheduleId: string;
  scheduleName: string;
  startTime: string;
  endTime: string;
  type: "ASSIGNMENT" | "REPLACEMENT";
  post?: string;
  callSign?: string;
  role?: string;
}

export interface RosterEntry {
  assignmentId?: string;
  scheduleId?: string;
  scheduleName?: string;
  startTime?: string;
  endTime?: string;
  type?: "ASSIGNMENT" | "ABSENCE" | "REPLACEMENT";
  status?: string;
  absenceType?: string;
  reason?: string;
  replacedUser?: {
    id: string;
    fullName: string;
    employeeNumber?: string;
  };
}

export interface RosterUser {
  userId: string;
  fullName: string;
  employeeNumber?: string;
  dates?: Record<string, RosterEntry[]>;
}

export interface ShiftItem {
  scheduleId: string;
  type: string;
  time: string;
  startTime: string;
  endTime: string;
  officers: RosterOfficer[];
  count: number;
  required: number;
  squad: string;
  danru: string;
  sector: string;
}

export interface DayItem {
  day: number;
  date: string;
  isToday: boolean;
  shifts: ShiftItem[];
}

export interface CreateAssignmentPayload {
  userId: string;
  startDate: string;
  endDate: string;
}
