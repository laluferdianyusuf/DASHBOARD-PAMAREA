import { apiClient } from "../../lib/apiClient";

import type {
  ActiveNfcByPatrolPointResponse,
  ActiveNfcByTagResponse,
  AssignNfcRequest,
  PatrolPointNfcQuery,
  PatrolPointNfcResponse,
  RemoveNfcAssignmentRequest,
  ReplaceNfcAssignmentRequest,
  UnassignNfcRequest,
} from "../../types/patrol-point-nfc/patrol-point-nfc";

// POST /patrol-point-nfc
// Menghubungkan NFC Tag ke Patrol Point
export const assignNfc = async (
  payload: AssignNfcRequest,
): Promise<PatrolPointNfcResponse> => {
  const response = await apiClient.post<PatrolPointNfcResponse>(
    "/patrol-point-nfc",
    payload,
  );

  return response.data;
};

export const unassignNfc = async (
  payload: UnassignNfcRequest,
): Promise<PatrolPointNfcResponse> => {
  const response = await apiClient.delete<PatrolPointNfcResponse>(
    `/patrol-point-nfc/${payload.patrolPointId}/unassign`,
    {
      data: {
        reason: payload.reason,
      },
    },
  );

  return response.data;
};

// GET /patrol-point-nfc
// Mendapatkan daftar assignment aktif
export const getPatrolPointNfcAssignments = async (
  query?: PatrolPointNfcQuery,
): Promise<PatrolPointNfcResponse[]> => {
  const response = await apiClient.get<PatrolPointNfcResponse[]>(
    "/patrol-point-nfc",
    {
      params: query,
    },
  );

  return response.data;
};

// GET /patrol-point-nfc/history
// Mendapatkan riwayat assignment NFC
export const getPatrolPointNfcHistory = async (
  query?: PatrolPointNfcQuery,
): Promise<PatrolPointNfcResponse[]> => {
  const response = await apiClient.get<PatrolPointNfcResponse[]>(
    "/patrol-point-nfc/history",
    {
      params: query,
    },
  );

  return response.data;
};

// GET /patrol-point-nfc/patrol-point/:patrolPointId
// Mendapatkan assignment aktif berdasarkan Patrol Point
export const getActiveNfcByPatrolPoint = async (
  patrolPointId: string,
): Promise<ActiveNfcByPatrolPointResponse | null> => {
  const response = await apiClient.get<ActiveNfcByPatrolPointResponse | null>(
    `/patrol-point-nfc/patrol-point/${patrolPointId}`,
  );

  return response.data;
};

// GET /patrol-point-nfc/nfc/:nfcTagId
// Mendapatkan assignment aktif berdasarkan NFC Tag
export const getActiveNfcByTag = async (
  nfcTagId: string,
): Promise<ActiveNfcByTagResponse | null> => {
  const response = await apiClient.get<ActiveNfcByTagResponse | null>(
    `/patrol-point-nfc/nfc/${nfcTagId}`,
  );

  return response.data;
};

// GET /patrol-point-nfc/:id
// Mendapatkan detail assignment
export const getPatrolPointNfcAssignmentById = async (
  id: string,
): Promise<PatrolPointNfcResponse> => {
  const response = await apiClient.get<PatrolPointNfcResponse>(
    `/patrol-point-nfc/${id}`,
  );

  return response.data;
};

// POST /patrol-point-nfc/:id/replace
// Mengganti NFC Tag pada assignment
export const replaceNfcAssignment = async (
  id: string,
  payload: ReplaceNfcAssignmentRequest,
): Promise<PatrolPointNfcResponse> => {
  const response = await apiClient.post<PatrolPointNfcResponse>(
    `/patrol-point-nfc/${id}/replace`,
    payload,
  );

  return response.data;
};

// DELETE /patrol-point-nfc/:id
// Melepas assignment NFC
export const removeNfcAssignment = async (
  id: string,
  payload: RemoveNfcAssignmentRequest = {},
): Promise<PatrolPointNfcResponse> => {
  const response = await apiClient.delete<PatrolPointNfcResponse>(
    `/patrol-point-nfc/${id}`,
    {
      data: payload,
    },
  );

  return response.data;
};
