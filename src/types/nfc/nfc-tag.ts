// src/types/nfc/nfc-tag.types.ts
import type { NfcStatus } from "../enums/prisma-enums";

export interface NfcTag {
  id: string;
  uid: string;
  label?: string | null;
  status: NfcStatus;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

// Payload untuk membuat NFC tag
export interface CreateNfcTagRequest {
  uid: string;
  label?: string | null;
}

export interface ReplaceNfcTagRequest {
  newNfcTagId: string;
}

// Payload untuk memperbarui NFC tag
export interface UpdateNfcTagRequest {
  label?: string | null;
  status?: NfcStatus;
}

// Query untuk pencarian dan filter NFC tag
export interface NfcTagQuery {
  search?: string;
  status?: NfcStatus;

  page?: number;
  limit?: number;

  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Data ringkas NFC tag
export interface NfcTagSummary {
  id: string;
  uid: string;
  label: string | null;
  status: NfcStatus;
}
