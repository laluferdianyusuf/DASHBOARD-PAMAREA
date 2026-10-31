import type { PatrolPoint } from "../patrol-point/checkpoints";

export interface PatrolSchedulePoint {
  id: string;
  scheduleId: string;
  patrolPointId: string;
  sequence: number;
  required: boolean;
  createdAt: string;
  patrolPoint?: PatrolPoint;
}

// export interface SchedulePointDetailResponse extends PatrolSchedulePoint {
//   patrolPoint?: PatrolPoint;
// }

export interface CreateSchedulePointPayload {
  // scheduleId: string;
  patrolPointId: string;
  sequence?: number;
  required?: boolean;
}

export interface CreateManySchedulePointsPayload {
  patrolPointIds: string[];
  required?: boolean;
}

export interface UpdateSchedulePointPayload {
  // patrolPointId?: string;
  sequence?: number;
  required?: boolean;
}

export interface UpdateSchedulePointResponse {
  id: string;
  scheduleId: string;
  patrolPointId: string;
  sequence: number;
  required: boolean;
  createdAt: string;
}

export interface CreateManySchedulePointsResponse {
  message: string;
  addedCount: number;
  skippedCount: number;
  data: PatrolSchedulePoint[];
}

export interface DeleteSchedulePointResponse {
  message: string;
}

export interface SchedulePointQuery {
  scheduleId?: string;
  patrolPointId?: string;
  required?: boolean;
}
