import { apiClient } from "../../lib/apiClient";

import type {
  PointQuestion,
  AssignQuestionPayload,
  UpdatePointQuestionPayload,
  RemovePointQuestionResponse,
} from "../../types/question/point-question";

// POST /point-questions
export const assignQuestion = async (
  payload: AssignQuestionPayload,
): Promise<PointQuestion> => {
  const response = await apiClient.post<PointQuestion>(
    "/point-questions",
    payload,
  );

  return response.data;
};

// GET /point-questions/patrol-point/:patrolPointId
export const getQuestionsByPatrolPoint = async (
  patrolPointId: string,
): Promise<PointQuestion[]> => {
  const response = await apiClient.get<PointQuestion[]>(
    `/point-questions/patrol-point/${patrolPointId}`,
  );

  return response.data;
};

// GET /point-questions/:id
export const getPointQuestionById = async (
  id: string,
): Promise<PointQuestion> => {
  const response = await apiClient.get<PointQuestion>(`/point-questions/${id}`);

  return response.data;
};

// PATCH /point-questions/:id
export const updatePointQuestion = async (
  id: string,
  payload: UpdatePointQuestionPayload,
): Promise<PointQuestion> => {
  const response = await apiClient.patch<PointQuestion>(
    `/point-questions/${id}`,
    payload,
  );

  return response.data;
};

// DELETE /point-questions/:id
export const removeQuestionFromPoint = async (
  id: string,
): Promise<RemovePointQuestionResponse> => {
  const response = await apiClient.delete<RemovePointQuestionResponse>(
    `/point-questions/${id}`,
  );

  return response.data;
};
