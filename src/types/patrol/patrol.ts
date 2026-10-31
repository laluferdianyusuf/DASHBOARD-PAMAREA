import type {
  PatrolStatus,
  GpsValidationStatus,
  NfcValidationStatus,
  NfcBypassReason,
} from "../enums/prisma-enums";
import type { PatrolAnswer } from "./patrol-answer";
import type { PatrolCheckpoint } from "./patrol-checkpoint";
import type { PatrolPhoto } from "./patrol-photo";

export interface Patrol {
  id: string;
  reportNumber: string;
  userId: string;
  siteId: string;
  patrolPointId: string;
  scheduleAssignmentId?: string | null;
  checkpointId?: string | null;
  deviceId?: string | null;
  startedAt: string;
  completedAt?: string | null;

  // GPS
  latitude?: number | null;
  longitude?: number | null;
  gpsAccuracy?: number | null;
  distanceFromPoint?: number | null;
  gpsValidationStatus: GpsValidationStatus;

  // NFC
  nfcTagId?: string | null;
  nfcUidSnapshot?: string | null;
  nfcValidationStatus: NfcValidationStatus;
  nfcBypass: boolean;
  nfcBypassReason?: NfcBypassReason | null;
  nfcBypassNote?: string | null;

  status: PatrolStatus;
  createdAt: string;
  updatedAt: string;

  answers?: PatrolAnswer[];
  photos?: PatrolPhoto[];
}

export interface PatrolSite {
  id: string;
  code: string;
  name: string;
  address: string | null;
}

export interface PatrolPointDetail {
  id: string;
  siteId: string;
  createdById: string;
  code: string;
  name: string;
  description: string | null;
  latitude: number | string;
  longitude: number | string;
  radiusMeters: number;
  status: "ACTIVE" | "INACTIVE";
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StartPatrolRequest {
  deviceId?: string;
}

export interface StartNextPatrolRequest {
  deviceId?: string;
}

/**
 * Informasi temuan saat patroli.
 */
export interface PatrolFindingPhoto {
  id: string;
  findingId: string;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
}

export interface PatrolFinding {
  id: string;
  patrolId: string;
  patrolPointId: string;
  reportedById: string;
  assignedToId: string | null;
  resolvedById: string | null;
  title: string;
  description: string | null;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  resolvedAt: string | null;
  resolutionNote: string | null;
  createdAt: string;
  updatedAt: string;
  photos: PatrolFindingPhoto[];
}

/**
 * Response detail patroli.
 * Digunakan oleh GET /patrols/:patrolId.
 */
export interface PatrolResponse {
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

  latitude: number | string | null;
  longitude: number | string | null;
  gpsAccuracy: number | string | null;
  distanceFromPoint: number | string | null;
  gpsValidationStatus: GpsValidationStatus;

  nfcTagId: string | null;
  nfcUidSnapshot: string | null;
  nfcValidationStatus: NfcValidationStatus;
  nfcBypass: boolean;
  nfcBypassReason: NfcBypassReason | null;
  nfcBypassNote: string | null;

  status: PatrolStatus;

  createdAt: string;
  updatedAt: string;

  site: PatrolSite;
  siteName: string;

  patrolPoint: PatrolPointDetail;

  checkpoint: PatrolCheckpoint | null;

  answers: PatrolAnswer[];
  photos: PatrolPhoto[];
  findings: PatrolFinding[];
}

/**
 * Request untuk memulai patroli dari checkpoint.
 * Sesuaikan properti dengan StartPatrolDto jika DTO memiliki field tambahan.
 */
export interface StartPatrolRequest {
  deviceId?: string;
}

/**
 * Response validasi lokasi GPS.
 */
export interface ValidatePatrolLocationRequest {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface ValidatePatrolLocationResponse {
  valid: boolean;
  distanceMeters: number;
  radiusMeters: number;
  accuracyMeters: number | null;
}

/**
 * Request untuk validasi NFC.
 */
export interface ValidatePatrolNfcRequest {
  uid: string;
}

export interface ValidatePatrolNfcResponse {
  patrolId: string;
  valid: boolean;
  nfcTagId: string;
  uid: string;
  validationStatus: NfcValidationStatus;
}

/**
 * Response ketika NFC berhasil dilewati menggunakan alasan tertentu.
 */
export interface BypassPatrolNfcRequest {
  reason: NfcBypassReason;
  note?: string;
}

export interface BypassPatrolNfcResponse {
  patrolId: string;
  nfcBypass: boolean;
  nfcValidationStatus: NfcValidationStatus;
  bypassReason: NfcBypassReason | null;
  bypassNote: string | null;
  gpsValidationStatus: GpsValidationStatus;
}

/**
 * Response untuk memulai patroli berikutnya.
 * Backend mengembalikan detail patroli.
 */
export type StartNextPatrolResponse = PatrolResponse;

/**
 * Response ketika jawaban patroli berhasil disimpan.
 */
export type SubmitPatrolResponse = PatrolResponse;

export interface CreatePatrolRequest {
  userId: string;
  siteId: string;
  patrolPointId: string;

  scheduleAssignmentId?: string | null;
  checkpointId?: string | null;
  deviceId?: string | null;
  patrolAssignmentId?: string | null;

  latitude?: number | null;
  longitude?: number | null;
  gpsAccuracy?: number | null;
  distanceFromPoint?: number | null;
  gpsValidationStatus?: GpsValidationStatus;

  nfcTagId?: string | null;
  nfcUidSnapshot?: string | null;
  nfcValidationStatus?: NfcValidationStatus;
  nfcBypass?: boolean;
  nfcBypassReason?: NfcBypassReason | null;
  nfcBypassNote?: string | null;

  status?: PatrolStatus;
}

export interface UpdatePatrolRequest {
  completedAt?: string | null;

  latitude?: number | null;
  longitude?: number | null;
  gpsAccuracy?: number | null;
  distanceFromPoint?: number | null;
  gpsValidationStatus?: GpsValidationStatus;

  nfcTagId?: string | null;
  nfcUidSnapshot?: string | null;
  nfcValidationStatus?: NfcValidationStatus;
  nfcBypass?: boolean;
  nfcBypassReason?: NfcBypassReason | null;
  nfcBypassNote?: string | null;

  status?: PatrolStatus;
}

export interface PatrolQuery {
  userId?: string;
  siteId?: string;
  patrolPointId?: string;
  scheduleAssignmentId?: string;
  checkpointId?: string;
  patrolAssignmentId?: string;
  deviceId?: string;
  status?: PatrolStatus;
  gpsValidationStatus?: GpsValidationStatus;
  nfcValidationStatus?: NfcValidationStatus;
  startDate?: string;
  endDate?: string;
}
