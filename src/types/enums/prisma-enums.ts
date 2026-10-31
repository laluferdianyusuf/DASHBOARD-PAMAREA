// src/types/enums/prisma-enums.types.ts

export type RoleName =
  | "ADMIN"
  | "SECURITY"
  | "DANRU_SECURITY"
  | "CHIEF_SECURITY";

export type UserStatus = "ACTIVE" | "INACTIVE";
export type TeamStatus = "ACTIVE" | "INACTIVE";

export type SiteStatus = "ACTIVE" | "INACTIVE";

export type DeviceStatus = "ACTIVE" | "INACTIVE" | "BLOCKED";

export type PatrolPointStatus = "ACTIVE" | "INACTIVE";

export type NfcStatus =
  | "UNASSIGNED"
  | "ACTIVE"
  | "DAMAGED"
  | "LOST"
  | "REPLACED"
  | "INACTIVE";

export type NfcAssignmentStatus = "ACTIVE" | "REPLACED" | "REMOVED";

export type AssignmentStatus = "ACTIVE" | "INACTIVE";

export type QuestionType = "YES_NO" | "SINGLE_CHOICE" | "TEXT";

export type PhotoRequirement = "NONE" | "REQUIRED" | "CONDITIONAL";

export type QuestionStatus = "ACTIVE" | "INACTIVE";

export type ScheduleStatus = "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";

export type ScheduleDateStatus = "SCHEDULED" | "CANCELLED" | "COMPLETED";

export type ScheduleAssignmentStatus = "ACTIVE" | "INACTIVE" | "EXPIRED";

export type PatrolRoundStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "PARTIAL"
  | "MISSED"
  | "CANCELLED";

export type PatrolCheckpointStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "LATE"
  | "MISSED"
  | "FAILED"
  | "CANCELLED";

export type PatrolStatus =
  | "STARTED"
  | "VALIDATED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "FAILED"
  | "CANCELLED";

export type GpsValidationStatus = "VALID" | "INVALID" | "UNAVAILABLE";

export type NfcValidationStatus = "VALID" | "BYPASSED" | "FAILED";

export type NfcBypassReason =
  | "DAMAGED"
  | "NOT_READABLE"
  | "LOST"
  | "DEVICE_ISSUE"
  | "OTHER";

export type FindingSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type FindingStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";
