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

export const createNfcTag = async (
  payload: CreateNfcTagRequest,
): Promise<NfcTagDetailResponse> => {
  const response = await apiClient.post<NfcTagDetailResponse>(
    "/nfc-tags",
    payload,
  );

  return response.data;
};

export const getNfcTags = async (
  query?: NfcTagQuery,
): Promise<NfcTagResponse[]> => {
  const response = await apiClient.get<NfcTagResponse[]>("/nfc-tags", {
    params: query,
  });

  return response.data;
};

export const getUnassignedNfcTags = async (): Promise<
  UnassignedNfcTagResponse[]
> => {
  const response = await apiClient.get<UnassignedNfcTagResponse[]>(
    "/nfc-tags/unassigned",
  );

  return response.data;
};

export const getNfcTagByUid = async (
  uid: string,
): Promise<NfcTagBasicResponse> => {
  const response = await apiClient.get<NfcTagBasicResponse>(
    `/nfc-tags/uid/${encodeURIComponent(uid)}`,
  );

  return response.data;
};

export const getNfcTagById = async (
  id: string,
): Promise<NfcTagDetailResponse> => {
  const response = await apiClient.get<NfcTagDetailResponse>(
    `/nfc-tags/${encodeURIComponent(id)}`,
  );

  return response.data;
};

export const updateNfcTag = async (
  id: string,
  payload: UpdateNfcTagRequest,
): Promise<NfcTagDetailResponse> => {
  const response = await apiClient.patch<NfcTagDetailResponse>(
    `/nfc-tags/${encodeURIComponent(id)}`,
    payload,
  );

  return response.data;
};

export const activateNfcTag = async (
  id: string,
): Promise<NfcTagDetailResponse> => {
  const response = await apiClient.patch<NfcTagDetailResponse>(
    `/nfc-tags/${encodeURIComponent(id)}/activate`,
  );

  return response.data;
};

export const deactivateNfcTag = async (
  id: string,
): Promise<NfcTagDetailResponse> => {
  const response = await apiClient.patch<NfcTagDetailResponse>(
    `/nfc-tags/${encodeURIComponent(id)}/deactivate`,
  );

  return response.data;
};

export const markNfcTagDamaged = async (
  id: string,
): Promise<NfcTagDetailResponse> => {
  const response = await apiClient.patch<NfcTagDetailResponse>(
    `/nfc-tags/${encodeURIComponent(id)}/damaged`,
  );

  return response.data;
};

export const markNfcTagLost = async (
  id: string,
): Promise<NfcTagDetailResponse> => {
  const response = await apiClient.patch<NfcTagDetailResponse>(
    `/nfc-tags/${encodeURIComponent(id)}/lost`,
  );

  return response.data;
};

export const replaceNfcTag = async (
  id: string,
  payload: ReplaceNfcTagRequest,
): Promise<ReplaceNfcTagResponse> => {
  const response = await apiClient.post<ReplaceNfcTagResponse>(
    `/nfc-tags/${encodeURIComponent(id)}/replace`,
    payload,
  );

  return response.data;
};

export const deleteNfcTag = async (
  id: string,
): Promise<NfcTagDetailResponse> => {
  const response = await apiClient.delete<NfcTagDetailResponse>(
    `/nfc-tags/${encodeURIComponent(id)}`,
  );

  return response.data;
};
