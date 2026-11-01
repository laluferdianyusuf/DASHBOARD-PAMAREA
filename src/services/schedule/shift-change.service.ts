import { apiClient } from "../../lib/apiClient";
import type {
  ShiftChange,
  ShiftChangeParams,
  ShiftChangeResponse,
} from "../../types/schedule/shift-change";

export const changeShift = async (
  payload: ShiftChange,
): Promise<ShiftChangeResponse> => {
  const response = await apiClient.post<ShiftChangeResponse>(
    `/shift-changes/swap`,
    payload,
  );

  return response.data;
};

export const getShiftChanges = async (
  params?: ShiftChangeParams,
): Promise<ShiftChangeResponse> => {
  const response = await apiClient.get<ShiftChangeResponse>("/shift-changes", {
    params,
  });

  return response.data;
};
