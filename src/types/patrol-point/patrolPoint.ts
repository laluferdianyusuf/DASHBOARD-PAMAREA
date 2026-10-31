import type {
  NfcAssignmentStatus,
  NfcStatus,
  PatrolPointStatus,
  PhotoRequirement,
  QuestionStatus,
  QuestionType,
} from "../enums/prisma-enums";
import type { PatrolSchedulePoint } from "../schedule/schedule-point";

import type { Site } from "../site/site";

// Informasi pembuat Patrol Point
export interface PatrolPointCreatedBy {
  id: string;
  username: string;
  fullName: string;
}

// Relasi Site pada daftar Patrol Point
export interface PatrolPointSiteSummary {
  id: string;
  code: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
}

// Relasi Site pada detail/create Patrol Point
// export interface PatrolPointSite extends Site {}

// Informasi NFC Tag pada assignment
export interface PatrolPointNfcTag {
  id: string;
  uid: string;
  label: string | null;
  status: NfcStatus;
}

// Relasi assignment NFC
export interface PatrolPointNfcAssignment {
  id: string;
  patrolPointId: string;
  nfcTagId: string;
  assignedAt: string;
  unassignedAt: string | null;
  status: NfcAssignmentStatus;
  reason: string | null;
  createdById: string;
  createdAt: string;
  nfcTag?: PatrolPointNfcTag;
}

// Ringkasan jumlah relasi
export interface PatrolPointCount {
  assignments: number;
  patrols: number;
  findings: number;
}

// Informasi pertanyaan
export interface PatrolPointQuestionInfo {
  id: string;
  code: string;
  questionText: string;
  questionType: QuestionType;
  isRequired: boolean;
  photoRequirement: PhotoRequirement;
  status: QuestionStatus;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

// Relasi pertanyaan pada Patrol Point
export interface PatrolPointQuestion {
  id: string;
  patrolPointId: string;
  questionId: string;
  sortOrder: number;
  isRequired: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  question: PatrolPointQuestionInfo;
}

// Data dasar Patrol Point
export interface PatrolPointBase {
  id: string;
  siteId: string;
  createdById: string;
  code: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  status: PatrolPointStatus;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Response GET /patrol-points
export interface PatrolPointResponse extends PatrolPointBase {
  site: PatrolPointSiteSummary;
  nfcAssignments: PatrolPointNfcAssignment[];
  schedulePoints: PatrolSchedulePoint[];
  _count: PatrolPointCount;
}

// Response GET /patrol-points/:id
export interface PatrolPointDetailResponse extends PatrolPointBase {
  site: Site;
  createdBy: PatrolPointCreatedBy;
  nfcAssignments: PatrolPointNfcAssignment[];
  pointQuestions: PatrolPointQuestion[];
  _count: PatrolPointCount;
}

// Response POST /patrol-points
export interface CreatePatrolPointResponse extends PatrolPointBase {
  site: Site;
  createdBy: PatrolPointCreatedBy;
}

// Response GET /patrol-points/active
export interface ActivePatrolPointResponse {
  id: string;
  siteId: string;
  code: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  status: PatrolPointStatus;
}

// Request POST /patrol-points
export interface CreatePatrolPointRequest {
  siteId: string;
  code: string;
  name: string;
  description?: string | null;
  latitude: number;
  longitude: number;
  radiusMeters?: number;
}

// Request PATCH /patrol-points/:id
export interface UpdatePatrolPointRequest {
  code?: string;
  name?: string;
  description?: string | null;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  status?: PatrolPointStatus;
}

// Query GET /patrol-points
export interface PatrolPointQuery {
  siteId?: string;
}
