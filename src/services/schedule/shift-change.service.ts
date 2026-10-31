import { apiClient } from "../../lib/apiClient";
import type {
  ShiftChange,
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
