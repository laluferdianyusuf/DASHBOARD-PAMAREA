import type { NfcStatus } from "../enums/prisma-enums";

// Data pembuat NFC
export interface NfcCreatedBy {
  id: string;
  username: string;
  fullName: string;
}

// Data patrol point pada assignment NFC
export interface NfcPatrolPoint {
  id: string;
  code: string;
  name: string;
  siteId: string;
}

// Data assignment NFC
export interface NfcAssignmentResponse {
  id: string;
  patrolPointId: string;
  assignedAt: string;
  unassignedAt: string | null;
  status: string;
  patrolPoint: NfcPatrolPoint;
}

// Data ringkas NFC
export interface NfcTagBasicResponse {
  id: string;
  uid: string;
  label: string | null;
  status: NfcStatus;
}

// Data NFC pada daftar
export interface NfcTagResponse extends NfcTagBasicResponse {
  createdAt: string;
  updatedAt: string;
  createdBy: NfcCreatedBy;
  _count: {
    assignments: number;
    patrols: number;
  };
}

// Data detail NFC
export interface NfcTagDetailResponse extends NfcTagResponse {
  assignments: NfcAssignmentResponse[];
}

// Data NFC yang belum ditugaskan
export interface UnassignedNfcTagResponse {
  id: string;
  uid: string;
  label: string | null;
  status: NfcStatus;
  createdAt: string;
}

// Request membuat NFC
export interface CreateNfcTagRequest {
  uid: string;
  label?: string;
}

// Request memperbarui NFC
export interface UpdateNfcTagRequest {
  uid?: string;
  label?: string;
}

// Request mengganti NFC
export interface ReplaceNfcTagRequest {
  newNfcTagId: string;
}

// Respons penggantian NFC
export interface ReplaceNfcTagResponse {
  oldNfcId: string;
  newNfc: NfcTagBasicResponse;
}

// Query daftar NFC
export interface NfcTagQuery {
  status?: NfcStatus;
}
