// ==============================
// USER
// ==============================

import type {
  FindingSeverity,
  FindingStatus,
  GpsValidationStatus,
  NfcValidationStatus,
  PatrolCheckpointStatus,
  PatrolStatus,
} from "../enums/prisma-enums";

export interface PatrolHistoryUser {
  id: string;
  employeeNumber: string | null;
  fullName: string;
  username: string;
}

// ==============================
// SITE
// ==============================

export interface PatrolHistorySite {
  id: string;
  name: string;
}

// ==============================
// PATROL POINT
// ==============================

export interface PatrolHistoryPoint {
  id: string;
  code: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
}

// ==============================
// CHECKPOINT
// ==============================

export interface PatrolHistoryCheckpoint {
  id: string;
  sequence: number;
  status: PatrolCheckpointStatus;
  pointCodeSnapshot: string | null;
  pointNameSnapshot: string | null;
  visitedAt: string | null;
}

// ==============================
// PHOTO
// ==============================

export interface PatrolHistoryPhoto {
  id: string;
  fileUrl: string;
  fileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  latitude: number | null;
  longitude: number | null;
  capturedAt: string | null;
}

export interface PatrolHistoryFindingPhoto {
  id: string;
  fileUrl: string;
  fileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  createdAt: string;
}

// ==============================
// ANSWER
// ==============================

export interface PatrolHistoryAnswer {
  id: string;
  questionId: string;
  questionTextSnapshot: string;
  answerValue: string;
  answerLabelSnapshot: string | null;
  photos: PatrolHistoryPhoto[];
}

// ==============================
// FINDING USER
// ==============================

export interface PatrolHistoryFindingUser {
  id: string;
  fullName: string;
  employeeNumber: string | null;
}

// ==============================
// FINDING PATROL POINT
// ==============================

export interface PatrolHistoryFindingPoint {
  id: string;
  code: string;
  name: string;
}

// ==============================
// FINDING
// ==============================

export interface PatrolHistoryFinding {
  id: string;
  title: string;
  description: string;
  severity: FindingSeverity;
  status: FindingStatus;
  resolvedAt: string | null;
  resolutionNote: string | null;
  createdAt: string;

  patrolPoint: PatrolHistoryFindingPoint;

  reportedBy: PatrolHistoryFindingUser;
  assignedTo: PatrolHistoryFindingUser | null;
  resolvedBy: PatrolHistoryFindingUser | null;

  photos: PatrolHistoryFindingPhoto[];
}

// ==============================
// PATROL ITEM
// ==============================

export interface PatrolHistoryItem {
  id: string;
  reportNumber: string;

  startedAt: string;
  completedAt: string | null;

  status: PatrolStatus;

  latitude: number | null;
  longitude: number | null;
  gpsAccuracy: number | null;
  distanceFromPoint: number | null;
  gpsValidationStatus: GpsValidationStatus;

  nfcUidSnapshot: string | null;
  nfcValidationStatus: NfcValidationStatus;
  nfcBypass: boolean;
  nfcBypassReason: string | null;
  nfcBypassNote: string | null;

  site: PatrolHistorySite;
  patrolPoint: PatrolHistoryPoint;

  checkpoint: PatrolHistoryCheckpoint;

  answers: PatrolHistoryAnswer[];

  // Foto langsung pada patroli, tanpa answerId.
  photos: PatrolHistoryPhoto[];

  findings: PatrolHistoryFinding[];
}

// ==============================
// PATROLS GROUPED BY USER
// ==============================

export interface PatrolHistoryGroupedByUser {
  user: PatrolHistoryUser;
  patrols: PatrolHistoryItem[];
}

// ==============================
// PAGINATION
// ==============================

export interface PatrolHistoryPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ==============================
// API RESPONSE
// ==============================

export interface PatrolHistoryGroupedByUserResponse {
  pagination: PatrolHistoryPagination;
  totalUsers: number;
  totalPatrols: number;
  data: PatrolHistoryGroupedByUser[];
}

// ==============================
// QUERY PARAMETERS
// ==============================

export interface PatrolHistoryGroupedByUserParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: PatrolStatus;
  startDate?: string;
  endDate?: string;
}

export interface PatrolHistoryQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: PatrolStatus;
  startDate?: string;
  endDate?: string;
}
