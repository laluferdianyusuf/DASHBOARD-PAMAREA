import { apiClient } from "@/src/lib/apiClient";

export interface PointQuestion {
  id: string;
  patrolPointId: string;
  questionId: string;
  sortOrder: number;
  isRequired: boolean;
  question: {
    id: string;
    code: string;
    questionText: string;
    questionType: "YES_NO" | "SINGLE_CHOICE" | "TEXT";
    isRequired: boolean;
    photoRequirement: string;
    status: "ACTIVE" | "INACTIVE";
    options: {
      id: string;
      value: string;
      label: string;
      sortOrder: number;
      isSafe: boolean;
    }[];
  };
  patrolPoint: {
    id: string;
    code: string;
    name: string;
    status: string;
  };
  createdBy?: {
    id: string;
    username: string;
    fullName: string;
  };
}

export interface AssignQuestionPayload {
  patrolPointId: string;
  questionId: string;
  sortOrder?: number;
  isRequired?: boolean;
}

export interface UpdatePointQuestionPayload {
  sortOrder?: number;
  isRequired?: boolean;
}

export const assignQuestion = async (
  payload: AssignQuestionPayload,
): Promise<PointQuestion> => {
  const response = await apiClient.post("/point-questions", payload);
  return response.data;
};

export const getQuestionsByPatrolPoint = async (
  patrolPointId: string,
): Promise<PointQuestion[]> => {
  const response = await apiClient.get(
    `/point-questions/patrol-point/${patrolPointId}`,
  );

  return response.data;
};

export const getPointQuestionById = async (
  id: string,
): Promise<PointQuestion> => {
  const response = await apiClient.get(`/point-questions/${id}`);
  return response.data;
};

export const updatePointQuestion = async (
  id: string,
  payload: UpdatePointQuestionPayload,
): Promise<PointQuestion> => {
  const response = await apiClient.patch(`/point-questions/${id}`, payload);
  return response.data;
};

export const unassignQuestion = async (id: string) => {
  const response = await apiClient.delete(`/point-questions/${id}`);
  return response.data;
};
