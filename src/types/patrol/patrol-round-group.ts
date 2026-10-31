import type {
  PatrolCheckpointStatus,
  PatrolRoundStatus,
} from "../enums/prisma-enums";

export interface PatrolRoundGroupedUser {
  id: string;
  employeeNumber: string | null;
  fullName: string;
  username: string;
}

export interface PatrolRoundGroupedSite {
  id: string;
  code: string;
  name: string;
  address: string | null;
}

export interface PatrolRoundGroupedSchedule {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  intervalMinutes: number;
  enforceSequence: boolean;
  site: PatrolRoundGroupedSite;
}

export interface PatrolRoundGroupedScheduleDate {
  id: string;
  date: string;
}

export interface PatrolRoundGroupedCheckpoint {
  id: string;
  roundId: string;
  patrolPointId: string;
  sequence: number;
  required: boolean;
  status: PatrolCheckpointStatus;
  pointCodeSnapshot: string;
  pointNameSnapshot: string;
  radiusMetersSnapshot: number;
  visitedAt: string | null;
  patrolPoint: {
    id: string;
    code: string;
    name: string;
    latitude: number | string;
    longitude: number | string;
    radiusMeters: number;
  };
}

export interface PatrolRoundGroupedItem {
  id: string;
  scheduleDateId: string;
  assignmentId: string;
  roundNumber: number;
  scheduledStartAt: string;
  scheduledEndAt: string;
  status: PatrolRoundStatus;
  startedAt: string | null;
  completedAt: string | null;
  scheduleDate: PatrolRoundGroupedScheduleDate;
  assignment: {
    user: PatrolRoundGroupedUser;
    schedule: PatrolRoundGroupedSchedule;
  };
  checkpoints: PatrolRoundGroupedCheckpoint[];
}

export interface PatrolRoundGroupedByUserItem {
  user: PatrolRoundGroupedUser;
  rounds: PatrolRoundGroupedItem[];
}

export interface PatrolRoundsGroupedByUserResponse {
  totalUsers: number;
  totalRounds: number;
  data: PatrolRoundGroupedByUserItem[];
}
