import { apiClient } from "@/src/lib/apiClient";

export interface PatrolWarningPhoto {
  id: string;
  fileUrl: string;
  fileName: string;
  mimeType?: string | null;
  fileSize?: number | null;
  capturedAt?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface PatrolWarningUnsafeAnswer {
  id: string;

  question: {
    id: string;
    code: string;
    text: string;
    type: string;
    isRequired: boolean;
    photoRequirement: string;
  };

  answer: {
    value: string | null;
    label: string | null;
    isUnsafe: boolean;
    selectedOption: {
      id: string;
      value: string;
      label: string;
      isSafe: boolean;
    } | null;
  };

  photos: PatrolWarningPhoto[];
  createdAt: string;
}

export interface PatrolWarningDetail {
  patrol: {
    id: string;
    reportNumber: string;
    startedAt: string | null;
    completedAt: string | null;
    status: string;
  };

  security: {
    id: string;
    fullName: string;
    employeeNumber: string | null;
  };

  site: {
    id: string;
    name: string;
    code: string;
  };

  patrolPoint: {
    id: string;
    name: string;
    code: string;
  };

  unsafeAnswers: PatrolWarningUnsafeAnswer[];
}

export const patrolWarningService = {
  async getByPatrolId(patrolId: string): Promise<PatrolWarningDetail> {
    if (!patrolId) {
      throw new Error("Patrol ID tidak ditemukan");
    }

    const response = await apiClient.get(
      `/patrol-warnings/${encodeURIComponent(patrolId)}`,
    );
    return response.data;
  },
};
