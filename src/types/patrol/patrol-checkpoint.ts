import type {
  PatrolCheckpointStatus,
  PatrolRoundStatus,
  PatrolStatus,
} from "../enums/prisma-enums";
// import type { PatrolPoint } from "../patrol-point/checkpoints";

export interface PatrolCheckpointUser {
  id: string;
  fullName: string;
  employeeNumber: string | null;
  username: string;
}

export interface PatrolCheckpointSchedule {
  id: string;
  siteId: string;
  name: string;
  startTime: string;
  endTime: string;
  intervalMinutes: number;
  gracePeriodMinutes: number;
}

export interface PatrolCheckpointAssignment {
  id: string;
  userId: string;
  scheduleId: string;
  startDate: string;
  endDate: string | null;
  status: string;
  user: PatrolCheckpointUser;
  schedule: PatrolCheckpointSchedule;
}

export interface PatrolCheckpointRound {
  id: string;
  scheduleDateId: string;
  assignmentId: string;
  roundNumber: number;
  scheduledStartAt: string;
  scheduledEndAt: string;
  status: PatrolRoundStatus;
  startedAt: string | null;
  completedAt: string | null;
  assignment: PatrolCheckpointAssignment;
}

export interface PatrolCheckpointPoint {
  id: string;
  siteId: string;
  code: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  status: string;
}

export interface PatrolCheckpointPatrol {
  id: string;
  reportNumber: string;
  userId: string;
  siteId: string;
  patrolPointId: string;
  scheduleAssignmentId: string | null;
  checkpointId: string | null;
  deviceId: string | null;
  startedAt: string;
  completedAt: string | null;
  status: PatrolStatus;
}

export interface PatrolCheckpoint {
  id: string;
  roundId: string;
  patrolPointId: string;
  sequence: number;
  status: PatrolCheckpointStatus;
  pointCodeSnapshot: string;
  pointNameSnapshot: string;
  radiusMetersSnapshot: number;
  required: boolean;
  createdAt: string;
  updatedAt: string;
  visitedAt: string | null;
  round: PatrolCheckpointRound;
  patrolPoint: PatrolCheckpointPoint;
  patrol: PatrolCheckpointPatrol | null;
}

// export interface PatrolCheckpoint {
//   id: string;
//   roundId: string;
//   patrolPointId: string;
//   sequence: number;
//   required: boolean;
//   status: PatrolCheckpointStatus;
//   pointCodeSnapshot: string;
//   pointNameSnapshot: string;
//   radiusMetersSnapshot: number;
//   visitedAt?: string | null;
//   createdAt: string;
//   updatedAt: string;

// patrolPoint?: PatrolPoint;
// }

// export interface PatrolCheckpointPoint {
//   id: string;
//   siteId: string;
//   code: string;
//   name: string;
//   description: string | null;
//   latitude: number | string;
//   longitude: number | string;
//   radiusMeters: number;
//   status: "ACTIVE" | "INACTIVE";
// }

export interface CreatePatrolCheckpointRequest {
  roundId: string;
  patrolPointId: string;
  sequence?: number;
  required?: boolean;
  status?: PatrolCheckpointStatus;
  pointCodeSnapshot: string;
  pointNameSnapshot: string;
  radiusMetersSnapshot: number;
}

export interface UpdatePatrolCheckpointRequest {
  sequence?: number;
  required?: boolean;
  status?: PatrolCheckpointStatus;
  visitedAt?: string | null;
}

export interface PatrolCheckpointQuery {
  roundId?: string;
  patrolPointId?: string;
  status?: PatrolCheckpointStatus;
  required?: boolean;
}

// export interface PatrolCheckpointDetail extends PatrolCheckpoint {
//   patrolPoint: PatrolCheckpointPoint & {
//     site: {
//       id: string;
//       code: string;
//       name: string;
//       address: string | null;
//     };
//   };

//   round: {
//     id: string;
//     scheduleDateId: string;
//     assignmentId: string;
//     roundNumber: number;
//     scheduledStartAt: string;
//     scheduledEndAt: string;
//     status: string;
//     startedAt: string | null;
//     completedAt: string | null;
//     createdAt: string;
//     updatedAt: string;

//     scheduleDate: {
//       id: string;
//       scheduleId: string;
//       date: string;
//       status: string;
//       createdById: string | null;
//       createdAt: string;
//       updatedAt: string;

//       schedule: {
//         id: string;
//         siteId: string;
//         name: string;
//         startTime: string;
//         endTime: string;
//         intervalMinutes: number;
//         gracePeriodMinutes: number;
//         enforceSequence: boolean;
//         status: string;
//         createdById: string;
//         createdAt: string;
//         updatedAt: string;
//       };
//     };
//   };
// }
