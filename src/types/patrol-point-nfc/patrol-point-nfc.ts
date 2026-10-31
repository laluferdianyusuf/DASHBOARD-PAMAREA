import type {
  NfcAssignmentStatus,
  NfcStatus,
  PatrolPointStatus,
} from "../enums/prisma-enums";

// Informasi Patrol Point yang disertakan dalam assignment
export interface AssignmentPatrolPoint {
  id: string;
  siteId: string;
  code: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  radiusMeters: number;
  status: PatrolPointStatus;
}

// Informasi NFC Tag yang disertakan dalam assignment
export interface AssignmentNfcTag {
  id: string;
  uid: string;
  label: string | null;
  status: NfcStatus;
}

// Informasi pengguna yang membuat assignment
export interface AssignmentCreatedBy {
  id: string;
  username: string;
  fullName: string;
}

// Response assignment NFC
export interface PatrolPointNfcResponse {
  id: string;
  patrolPointId: string;
  nfcTagId: string;
  assignedAt: string;
  unassignedAt: string | null;
  status: NfcAssignmentStatus;
  reason: string | null;
  createdById: string;
  createdAt: string;

  patrolPoint: AssignmentPatrolPoint;
  nfcTag: AssignmentNfcTag;
  createdBy: AssignmentCreatedBy;
}

// Request untuk menghubungkan NFC ke Patrol Point
export interface AssignNfcRequest {
  patrolPointId: string;
  nfcTagId: string;
}

// Request untuk melepas assignment
export interface RemoveNfcAssignmentRequest {
  reason?: string;
}

// Request untuk mengganti NFC pada assignment
export interface ReplaceNfcAssignmentRequest {
  newNfcTagId: string;
  reason?: string;
}

// Filter untuk daftar assignment
export interface PatrolPointNfcQuery {
  patrolPointId?: string;
  nfcTagId?: string;
}

// Response assignment aktif berdasarkan Patrol Point
export interface ActiveNfcByPatrolPointResponse {
  id: string;
  patrolPointId: string;
  nfcTagId: string;
  assignedAt: string;
  unassignedAt: string | null;
  status: NfcAssignmentStatus;
  reason: string | null;
  createdById: string;
  createdAt: string;

  nfcTag: AssignmentNfcTag;

  patrolPoint: Pick<
    AssignmentPatrolPoint,
    | "id"
    | "code"
    | "name"
    | "latitude"
    | "longitude"
    | "radiusMeters"
    | "status"
  >;
}

// Response assignment aktif berdasarkan NFC Tag
export interface ActiveNfcByTagResponse {
  id: string;
  patrolPointId: string;
  nfcTagId: string;
  assignedAt: string;
  unassignedAt: string | null;
  status: NfcAssignmentStatus;
  reason: string | null;
  createdById: string;
  createdAt: string;

  nfcTag: AssignmentNfcTag;
  patrolPoint: AssignmentPatrolPoint;
}

// Response validasi NFC dari service backend
export interface ValidateNfcResponse {
  valid: boolean;
  reason?: string;
  assignment?: ActiveNfcByTagResponse;
}
