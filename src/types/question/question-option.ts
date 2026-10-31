export interface QuestionOption {
  id: string;
  questionId: string;
  value: string;
  label: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  isSafe: boolean;
}

export interface CreateQuestionOptionPayload {
  // value: string;
  label: string;
  isSafe: boolean;
  // sortOrder: number;
}

export interface UpdateQuestionOptionPayload {
  value?: string;
  label?: string;
  sortOrder?: number;
}

// Payload untuk membuat pilihan jawaban
export interface CreateQuestionOptionRequest {
  value: string;
  label: string;
  sortOrder?: number;
}

// Payload untuk memperbarui pilihan jawaban
export interface UpdateQuestionOptionRequest {
  value?: string;
  label?: string;
  sortOrder?: number;
}

// Data pilihan jawaban yang disertakan dalam pertanyaan
export interface QuestionOptionSummary {
  id: string;
  value: string;
  label: string;
  sortOrder: number;
}
