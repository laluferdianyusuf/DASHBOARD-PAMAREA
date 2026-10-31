import { apiClient } from "../../lib/apiClient";

import type {
  Question,
  CreateQuestionPayload,
  UpdateQuestionPayload,
  QuestionQuery,
  QuestionDeleteOptionResponse,
} from "../../types/question/question";

import type {
  QuestionOption,
  CreateQuestionOptionPayload,
  UpdateQuestionOptionPayload,
} from "../../types/question/question-option";

// GET /questions
export const getQuestions = async (
  params?: QuestionQuery,
): Promise<Question[]> => {
  const response = await apiClient.get<Question[]>("/questions", {
    params,
  });

  return response.data;
};

// GET /questions/active
export const getActiveQuestions = async (
  patrolPointId?: string,
): Promise<Question[]> => {
  const response = await apiClient.get<Question[]>("/questions/active", {
    params: patrolPointId ? { patrolPointId } : undefined,
  });

  return response.data;
};

// GET /questions/:id
export const getQuestionById = async (id: string): Promise<Question> => {
  const response = await apiClient.get<Question>(`/questions/${id}`);

  return response.data;
};

// POST /questions
export const createQuestion = async (
  payload: CreateQuestionPayload,
): Promise<Question> => {
  const response = await apiClient.post<Question>("/questions", payload);

  return response.data;
};

// PATCH /questions/:id
export const updateQuestion = async (
  id: string,
  payload: UpdateQuestionPayload,
): Promise<Question> => {
  const response = await apiClient.patch<Question>(`/questions/${id}`, payload);

  return response.data;
};

// PATCH /questions/:id/activate
export const activateQuestion = async (id: string): Promise<Question> => {
  const response = await apiClient.patch<Question>(`/questions/${id}/activate`);

  return response.data;
};

// PATCH /questions/:id/deactivate
export const deactivateQuestion = async (id: string): Promise<Question> => {
  const response = await apiClient.patch<Question>(
    `/questions/${id}/deactivate`,
  );

  return response.data;
};

// POST /questions/:id/options
export const createQuestionOption = async (
  questionId: string,
  payload: CreateQuestionOptionPayload,
): Promise<QuestionOption> => {
  const response = await apiClient.post<QuestionOption>(
    `/questions/${questionId}/options`,
    payload,
  );

  return response.data;
};

// PATCH /questions/options/:optionId
export const updateQuestionOption = async (
  optionId: string,
  payload: UpdateQuestionOptionPayload,
): Promise<QuestionOption> => {
  const response = await apiClient.patch<QuestionOption>(
    `/questions/options/${optionId}`,
    payload,
  );

  return response.data;
};

// PATCH /questions/options/:optionId/delete
export const deleteQuestionOption = async (
  optionId: string,
): Promise<QuestionDeleteOptionResponse> => {
  const response = await apiClient.patch<QuestionDeleteOptionResponse>(
    `/questions/options/${optionId}/delete`,
  );

  return response.data;
};
