import type { AssignmentStatus } from "../enums/prisma-enums";
import type { PatrolRoundWithCheckpoints } from "./patrol-round";

export interface PatrolAssignment {
  id: string;
  userId: string;
  patrolPointId: string;
  startDate: string;
  endDate?: string | null;
  status: AssignmentStatus;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatrolAssignmentSite {
  id: string;
  code: string;
  name: string;
  address: string | null;
}

export interface PatrolAssignmentSchedule {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  intervalMinutes: number;
  gracePeriodMinutes: number;
  enforceSequence: boolean;
}

export interface PatrolAssignmentToday {
  assignmentId: string;
  schedule: PatrolAssignmentSchedule;
  site: PatrolAssignmentSite;
  rounds: PatrolRoundWithCheckpoints[];
}

export interface CreatePatrolAssignmentRequest {
  userId: string;
  patrolPointId: string;
  startDate: string;
  endDate?: string | null;
  status?: AssignmentStatus;
}

export interface UpdatePatrolAssignmentRequest {
  userId?: string;
  patrolPointId?: string;
  startDate?: string;
  endDate?: string | null;
  status?: AssignmentStatus;
}

export interface PatrolAssignmentQuery {
  userId?: string;
  patrolPointId?: string;
  status?: AssignmentStatus;
  startDate?: string;
  endDate?: string;
}
