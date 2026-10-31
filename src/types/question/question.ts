import type {
  QuestionType,
  PhotoRequirement,
  QuestionStatus,
} from "../enums/prisma-enums";
import type { QuestionOption } from "./question-option";

export interface Question {
  id: string;
  code: string;
  questionText: string;
  questionType: QuestionType;
  isRequired: boolean;
  photoRequirement: PhotoRequirement;
  status: QuestionStatus;
  createdById: string;
  createdAt: string;
  updatedAt: string;

  createdBy?: QuestionCreatedBy;
  options: QuestionOption[];
  _count?: QuestionCount;
}

export interface QuestionCreatedBy {
  id: string;
  username: string;
  fullName: string;
}

export interface QuestionCount {
  pointQuestions: number;
  patrolAnswers: number;
}

// Payload untuk membuat pertanyaan
export interface CreateQuestionPayload {
  code?: string;
  questionText: string;

  questionType: QuestionType;
  isRequired?: boolean;
  photoRequirement?: PhotoRequirement;
  // status?: QuestionStatus;
}

// Payload untuk memperbarui pertanyaan
export interface UpdateQuestionPayload {
  code?: string;
  questionText?: string;

  questionType?: QuestionType;
  isRequired?: boolean;
  photoRequirement?: PhotoRequirement;
  status?: QuestionStatus;
}

// Query untuk pencarian dan filter pertanyaan
export interface QuestionQuery {
  search?: string;
  questionType?: QuestionType;
  status?: QuestionStatus;

  page?: number;
  limit?: number;

  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Data ringkas pertanyaan
export interface QuestionSummary {
  id: string;
  code: string;
  questionText: string;
  questionType: QuestionType;
  isRequired: boolean;
  photoRequirement: PhotoRequirement;
  status: QuestionStatus;
}

export interface QuestionDeleteOptionResponse {
  success: boolean;
  message: string;
}
