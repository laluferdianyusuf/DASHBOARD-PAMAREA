// import type { PatrolPhoto } from "./patrol-photo";

import type {
  PhotoRequirement,
  QuestionStatus,
  QuestionType,
} from "../enums/prisma-enums";

export interface PatrolAnswer {
  id: string;
  patrolId: string;
  questionId: string;
  questionTextSnapshot: string;
  answerValue?: string | null;
  answerLabelSnapshot?: string | null;
  createdAt: string;
  updatedAt: string;

  // photos?: PatrolPhoto[];
}

export interface PatrolQuestionOption {
  id: string;
  questionId: string;
  value: string;
  label: string;
  sortOrder: number;
  createdAt: string;
}

export interface PatrolQuestion {
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
  options: PatrolQuestionOption[];
}

export interface PatrolAnswerResponse {
  id: string;
  patrolId: string;
  questionId: string;
  questionTextSnapshot: string;
  answerValue: string | null;
  answerLabelSnapshot: string | null;
  createdAt: string;
  updatedAt: string;
  question: PatrolQuestion;
  photos: import("./patrol-photo").PatrolPhoto[];
}

export interface SubmitPatrolAnswerItem {
  questionId: string;
  answerValue?: string;
  answerLabel?: string;
}
export interface SubmitPatrolAnswersRequest {
  answers: SubmitPatrolAnswerItem[];
}
export interface CreatePatrolAnswerRequest {
  patrolId: string;
  questionId: string;
  answerValue?: string | null;
  answerLabelSnapshot?: string | null;
}

export interface UpdatePatrolAnswerRequest {
  answerValue?: string | null;
  answerLabelSnapshot?: string | null;
}

export interface PatrolAnswerQuery {
  patrolId?: string;
  questionId?: string;
}
