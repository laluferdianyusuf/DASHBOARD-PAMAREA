export interface AssignmentRoutePoint {
  patrolPointId: string;
  name?: string;
  code?: string | null;
  sequence?: number;
  latitude?: number | null;
  longitude?: number | null;
}

export interface AssignmentRouteResponse {
  assignmentId: string;
  source: "ASSIGNMENT" | "SCHEDULE_DEFAULT";
  points: AssignmentRoutePoint[];
}

export interface SetAssignmentRoutePayload {
  points: {
    patrolPointId: string;
  }[];
}

export interface OptimizeAssignmentRoutePayload {
  patrolPointIds: string[];
  startPatrolPointId: string;
}

export interface RedirectCheckpointPayload {
  patrolPointId: string;
}

export interface AssignmentRouteOption {
  id: string;
  userId: string;
  scheduleId: string;
  user?: {
    fullName?: string;
    employeeNumber?: string | null;
  };
  schedule?: {
    name?: string;
    startTime?: string;
    endTime?: string;
  };
  status?: string;
}

export interface PatrolPointOption {
  id: string;
  name: string;
  code?: string | null;
  status?: string;
  latitude?: number | null;
  longitude?: number | null;
}
