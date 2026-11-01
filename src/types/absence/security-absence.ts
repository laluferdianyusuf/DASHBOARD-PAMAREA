export type AbsenceType = "CUTI" | "SAKIT" | "IZIN" | "ALPHA";

export type AbsenceStatus = "ACTIVE" | "CANCELLED";

export type ReplacementStatus = "ACTIVE" | "CANCELLED";

export interface SecurityAbsenceUser {
  id: string;
  fullName: string;
  employeeNumber?: string | null;
}

export interface SecurityAbsenceSite {
  id: string;
  name: string;
  code: string;
}

export interface SecurityAbsenceCreator {
  id: string;
  fullName: string;
}

export interface SecurityAbsenceSchedule {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
}

export interface SecurityAbsenceAssignment {
  id: string;
  scheduleId: string;
  userId: string;
  startDate: string;
  endDate: string | null;
  status: string;

  schedule?: SecurityAbsenceSchedule;

  user?: SecurityAbsenceUser;
}

export interface SecurityAbsenceReplacement {
  id: string;
  absenceId: string;
  originalAssignmentId: string;
  replacementAssignmentId: string;
  replacementUserId: string;
  createdById: string;

  startDate: string;
  endDate: string;

  status: ReplacementStatus;

  replacementUser?: SecurityAbsenceUser;

  originalAssignment?: SecurityAbsenceAssignment;

  replacementAssignment?: SecurityAbsenceAssignment;

  createdAt: string;
  updatedAt: string;
}

export interface SecurityAbsence {
  id: string;

  userId: string;
  siteId: string;
  createdById: string;

  type: AbsenceType;

  startDate: string;
  endDate: string;

  reason: string | null;

  status: AbsenceStatus;

  user?: SecurityAbsenceUser;
  site?: SecurityAbsenceSite;
  createdBy?: SecurityAbsenceCreator;

  replacements?: SecurityAbsenceReplacement[];

  createdAt: string;
  updatedAt: string;
}

export interface CreateSecurityAbsenceRequest {
  userId: string;
  replacementUserId?: string;
  type: AbsenceType;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface QuerySecurityAbsence {
  siteId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}
