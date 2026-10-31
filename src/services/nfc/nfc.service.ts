import { apiClient } from "../../lib/apiClient";

import type {
  CreateNfcTagRequest,
  NfcTagBasicResponse,
  NfcTagDetailResponse,
  NfcTagQuery,
  NfcTagResponse,
  ReplaceNfcTagRequest,
  ReplaceNfcTagResponse,
  UnassignedNfcTagResponse,
  UpdateNfcTagRequest,
} from "../../types/nfc/nfc";

// POST /nfc-tags
export const createNfcTag = async (
  payload: CreateNfcTagRequest,
): Promise<NfcTagDetailResponse> => {
  const response = await apiClient.post<NfcTagDetailResponse>(
    "/nfc-tags",
    payload,
  );

  return response.data;
};

// GET /nfc-tags
export const getNfcTags = async (
  query?: NfcTagQuery,
): Promise<NfcTagResponse[]> => {
  const response = await apiClient.get<NfcTagResponse[]>("/nfc-tags", {
    params: query,
  });

  return response.data;
};

// GET /nfc-tags/unassigned
export const getUnassignedNfcTags = async (): Promise<
  UnassignedNfcTagResponse[]
> => {
  const response = await apiClient.get<UnassignedNfcTagResponse[]>(
    "/nfc-tags/unassigned",
  );

  return response.data;
};

// GET /nfc-tags/uid/:uid
export const getNfcTagByUid = async (
  uid: string,
): Promise<NfcTagBasicResponse> => {
  const response = await apiClient.get<NfcTagBasicResponse>(
    `/nfc-tags/uid/${encodeURIComponent(uid)}`,
  );

  return response.data;
};

// GET /nfc-tags/:id
export const getNfcTagById = async (
  id: string,
): Promise<NfcTagDetailResponse> => {
  const response = await apiClient.get<NfcTagDetailResponse>(`/nfc-tags/${id}`);

  return response.data;
};

// PATCH /nfc-tags/:id
export const updateNfcTag = async (
  id: string,
  payload: UpdateNfcTagRequest,
): Promise<NfcTagDetailResponse> => {
  const response = await apiClient.patch<NfcTagDetailResponse>(
    `/nfc-tags/${id}`,
    payload,
  );

  return response.data;
};

// PATCH /nfc-tags/:id/activate
export const activateNfcTag = async (
  id: string,
): Promise<NfcTagDetailResponse> => {
  const response = await apiClient.patch<NfcTagDetailResponse>(
    `/nfc-tags/${id}/activate`,
  );

  return response.data;
};

// PATCH /nfc-tags/:id/deactivate
export const deactivateNfcTag = async (
  id: string,
): Promise<NfcTagDetailResponse> => {
  const response = await apiClient.patch<NfcTagDetailResponse>(
    `/nfc-tags/${id}/deactivate`,
  );

  return response.data;
};

// PATCH /nfc-tags/:id/damaged
export const markNfcTagDamaged = async (
  id: string,
): Promise<NfcTagDetailResponse> => {
  const response = await apiClient.patch<NfcTagDetailResponse>(
    `/nfc-tags/${id}/damaged`,
  );

  return response.data;
};

// PATCH /nfc-tags/:id/lost
export const markNfcTagLost = async (
  id: string,
): Promise<NfcTagDetailResponse> => {
  const response = await apiClient.patch<NfcTagDetailResponse>(
    `/nfc-tags/${id}/lost`,
  );

  return response.data;
};

// POST /nfc-tags/:id/replace
export const replaceNfcTag = async (
  id: string,
  payload: ReplaceNfcTagRequest,
): Promise<ReplaceNfcTagResponse> => {
  const response = await apiClient.post<ReplaceNfcTagResponse>(
    `/nfc-tags/${id}/replace`,
    payload,
  );

  return response.data;
};

// DELETE /nfc-tags/:id
export const deleteNfcTag = async (
  id: string,
): Promise<NfcTagDetailResponse> => {
  const response = await apiClient.delete<NfcTagDetailResponse>(
    `/nfc-tags/${id}`,
  );

  return response.data;
};
