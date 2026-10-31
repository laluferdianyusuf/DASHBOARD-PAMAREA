// src/types/question/point-question.types.ts
import type { Question } from "./question";

// Data titik patroli yang disertakan dalam relasi pertanyaan
export interface PointQuestionPatrolPoint {
  id: string;
  code: string;
  name: string;
  status: string;
}

export interface PointQuestionCreatedBy {
  id: string;
  username: string;
  fullName: string;
}

export interface PointQuestion {
  id: string;
  patrolPointId: string;
  questionId: string;
  sortOrder: number;
  isRequired: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;

  question?: Question;

  patrolPoint: PointQuestionPatrolPoint;
  createdBy: PointQuestionCreatedBy;
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

export interface RemovePointQuestionResponse {
  success: boolean;
  message: string;
}

// Payload untuk menambahkan pertanyaan ke titik patroli
export interface CreatePointQuestionRequest {
  patrolPointId: string;
  questionId: string;

  sortOrder?: number;
  isRequired?: boolean;
}

// Payload untuk memperbarui relasi pertanyaan
export interface UpdatePointQuestionRequest {
  sortOrder?: number;
  isRequired?: boolean;
}

export interface RemovePointQuestionResponse {
  success: boolean;
  message: string;
}

// Query untuk mencari pertanyaan berdasarkan titik patroli
export interface PointQuestionQuery {
  patrolPointId?: string;
  questionId?: string;

  page?: number;
  limit?: number;

  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Data ringkas relasi pertanyaan
export interface PointQuestionSummary {
  id: string;
  patrolPointId: string;
  questionId: string;

  sortOrder: number;
  isRequired: boolean;
}
