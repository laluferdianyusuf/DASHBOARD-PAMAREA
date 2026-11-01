export interface ShiftChange {
  firstAssignmentId: string;
  secondAssignmentId: string;
  effectiveDate: string;
  reason?: string;
}

export interface ShiftChangeAssignmentResponse {
  id: string;
  scheduleId: string;
  userId: string;
  startDate: string;
  endDate: string | null;
  status: string;
  user: {
    id: string;
    fullName: string;
    [key: string]: unknown;
  };
  schedule: {
    id: string;
    name: string;
    [key: string]: unknown;
  };
}

export interface ShiftChangeResponse {
  id: string;
  firstAssignmentId: string;
  secondAssignmentId: string;
  effectiveDate: string;
  reason: string | null;
  requestedById: string;
  approvedById: string | null;
  approvedAt: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  firstAssignment: ShiftChangeAssignmentResponse;
  secondAssignment: ShiftChangeAssignmentResponse;
}

export interface ShiftChangeParams {
  status?: string;
  effectiveDate?: string;
}
