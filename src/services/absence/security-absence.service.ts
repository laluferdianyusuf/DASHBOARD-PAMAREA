import { apiClient } from "@/src/lib/apiClient";
import {
  CreateSecurityAbsenceRequest,
  QuerySecurityAbsence,
  SecurityAbsence,
} from "@/src/types/absence/security-absence";

export const getSecurityAbsences = async (
  query?: QuerySecurityAbsence,
): Promise<SecurityAbsence[]> => {
  const response = await apiClient.get("/security-absences", {
    params: query,
  });

  return response.data;
};

export const getSecurityAbsenceById = async (
  id: string,
): Promise<SecurityAbsence> => {
  const response = await apiClient.get(`/security-absences/${id}`);

  return response.data;
};

export const createSecurityAbsence = async (
  payload: CreateSecurityAbsenceRequest,
): Promise<SecurityAbsence> => {
  const response = await apiClient.post("/security-absences", payload);

  return response.data;
};

export const cancelSecurityAbsence = async (
  id: string,
): Promise<SecurityAbsence> => {
  const response = await apiClient.patch(`/security-absences/${id}/cancel`);

  return response.data;
};
