export interface PatrolCheckpointItem {
  id: string;
  sequence: number;
  required: boolean;
  status: string;
  pointCodeSnapshot: string;
  pointNameSnapshot: string;
  radiusMetersSnapshot: number;
  visitedAt: string | null;
  patrolPoint: {
    id: string;
    name: string;
  };
}

export interface PatrolRoundDetail {
  id: string;
  roundNumber: number;
  status: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  startedAt: string | null;
  completedAt: string | null;

  assignment: {
    id: string;
    user: {
      id: string;
      fullName: string;
      employeeNumber: string | null;
    };
    schedule: {
      id: string;
      name: string;
      startTime: string;
      endTime: string;
      intervalMinutes: number;
      gracePeriodMinutes?: number;
      enforceSequence: boolean;
    };
  };

  scheduleDate: {
    id: string;
    date: string;
  };

  checkpoints: PatrolCheckpointItem[];
}
