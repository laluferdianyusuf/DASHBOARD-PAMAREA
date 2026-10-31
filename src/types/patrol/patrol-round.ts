import type {
  PatrolCheckpointStatus,
  PatrolRoundStatus,
} from "../enums/prisma-enums";
// import type { PatrolCheckpoint } from "./patrol-checkpoint";

export interface PatrolRoundSchedule {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  intervalMinutes: number;
  gracePeriodMinutes?: number;
  enforceSequence: boolean;
}

export interface PatrolRoundSite {
  id: string;
  code: string;
  name: string;
  address: string | null;
}

export interface PatrolRoundProgress {
  totalCheckpoints: number;
  requiredCheckpoints: number;
  completedCheckpoints: number;
  missedCheckpoints: number;
  percentage: number;
}

export interface PatrolRoundPoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export interface PatrolRoundCheckpoint {
  id: string;
  sequence: number;
  status: PatrolCheckpointStatus;
  required: boolean;
  visitedAt: string | null;
  patrolPoint: PatrolRoundPoint;
}

export interface PatrolRound {
  id: string;
  roundNumber: number;
  status: PatrolRoundStatus;
  scheduledStartAt: string;
  scheduledEndAt: string;
  startedAt?: string | null;
  completedAt?: string | null;

  schedule: PatrolRoundSchedule;
  site: PatrolRoundSite;
  progress: PatrolRoundProgress;
  checkpoints: PatrolRoundCheckpoint[];
  // checkpoints?: PatrolCheckpoint[];
}

export type PatrolRoundWithCheckpoints = PatrolRound;

export interface PatrolRoundListResponse {
  userId: string;
  date: string;
  totalRounds: number;
  data: PatrolRound[];
}

export interface GetPatrolRoundsByUserParams {
  userId: string;
  date?: string;
}

export interface PatrolRoundQuery {
  date?: string;
}

export interface StartPatrolRoundResponse {
  id: string;
  status: PatrolRoundStatus;
  startedAt: string | null;
}

export interface SyncOverdueRoundsResponse {
  checked: number;
  updated: number;
  checkedAt: string;
}

export interface CreatePatrolRoundRequest {
  scheduleDateId: string;
  assignmentId: string;
  roundNumber: number;
  scheduledStartAt: string;
  scheduledEndAt: string;
  status?: PatrolRoundStatus;
}

export interface UpdatePatrolRoundRequest {
  roundNumber?: number;
  scheduledStartAt?: string;
  scheduledEndAt?: string;
  status?: PatrolRoundStatus;
  startedAt?: string | null;
  completedAt?: string | null;
}
