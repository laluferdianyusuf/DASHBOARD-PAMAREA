import { PatrolRoundStatus } from "@/src/types";

export interface ApiCheckpoint {
  id: string;
  sequence: number;
  required: boolean;
  status: string;
  pointCodeSnapshot: string | null;
  pointNameSnapshot: string;
  visitedAt: string | null;
}

export interface ApiSchedule {
  id: string;
  name: string;
  site: {
    id: string;
    name: string;
  } | null;
}

export interface ApiRound {
  id: string;
  roundNumber: number;
  status: PatrolRoundStatus;
  scheduledStartAt: string;
  scheduledEndAt: string;
  startedAt: string | null;
  completedAt: string | null;
  schedule: ApiSchedule;
  scheduleDate: {
    id: string;
    date: string;
    status: string;
  };
  checkpoints: ApiCheckpoint[];
}

export interface ApiUser {
  id: string;
  employeeNumber: string | null;
  fullName: string;
  username: string;
  teamName: string;
}

export interface ApiGroupedResponse {
  totalUsers: number;
  totalRounds: number;
  data: {
    user: ApiUser;
    rounds: ApiRound[];
  }[];
}

export interface PatrolCheckpoint {
  id: string;
  sequence: number;
  name: string;
  code: string;
  required: boolean;
}

export interface PatrolRound {
  id: string;
  roundNumber: number;
  status: PatrolRoundStatus;
  scheduledStartAt: string;
  scheduledEndAt: string;
  checkpoints: PatrolCheckpoint[];
}

export interface PatrolAssignment {
  id: string;
  userId: string;
  date: string;

  scheduleId: string;
  scheduleName: string;

  fullName: string;
  npp: string;
  squadName: string;

  siteId: string;
  siteName: string;

  rounds: PatrolRound[];
}

export interface ScheduleGroup {
  scheduleId: string;
  scheduleName: string;
  assignments: PatrolAssignment[];
}

export interface PatrolScheduleOption {
  id: string;
  name: string;
}
