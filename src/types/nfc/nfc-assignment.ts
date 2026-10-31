// // src/types/nfc/nfc-assignment.types.ts
// import type { NfcAssignmentStatus } from "../enums/prisma-enums";
// import type { PatrolPoint } from "../patrol-point/checkpoints";
// import type { NfcTag } from "./nfc-tag";

// export interface PatrolPointNfc {
//   id: string;
//   patrolPointId: string;
//   nfcTagId: string;
//   assignedAt: string;
//   unassignedAt?: string | null;
//   status: NfcAssignmentStatus;
//   reason?: string | null;
//   createdById: string;
//   createdAt: string;

//   patrolPoint?: PatrolPoint;
//   nfcTag?: NfcTag;
// }

// src/types/nfc/nfc-assignment.ts

import type { NfcAssignmentStatus } from "../enums/prisma-enums";

// Ringkasan titik patroli untuk relasi NFC
export interface NfcPatrolPointSummary {
  id: string;
  code: string;
  name: string;
  siteId: string;
}

// Ringkasan NFC tag untuk relasi assignment
export interface NfcAssignmentTagSummary {
  id: string;
  uid: string;
  label: string | null;
}

// Data assignment NFC yang diterima dari API
export interface NfcAssignment {
  id: string;

  patrolPointId: string;
  nfcTagId: string;

  assignedAt: string;
  unassignedAt: string | null;

  status: NfcAssignmentStatus;
  reason: string | null;

  createdById: string;
  createdAt: string;

  patrolPoint?: NfcPatrolPointSummary;
  nfcTag?: NfcAssignmentTagSummary;
}

// Payload untuk memasang NFC tag ke titik patroli
export interface CreateNfcAssignmentRequest {
  patrolPointId: string;
  nfcTagId: string;
  reason?: string | null;
}

// Payload untuk memperbarui assignment NFC
export interface UpdateNfcAssignmentRequest {
  status?: NfcAssignmentStatus;
  reason?: string | null;
}

// Query untuk pencarian assignment NFC
export interface NfcAssignmentQuery {
  patrolPointId?: string;
  nfcTagId?: string;
  status?: NfcAssignmentStatus;

  page?: number;
  limit?: number;

  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Payload untuk melepas NFC tag
export interface RemoveNfcAssignmentRequest {
  reason?: string | null;
}
