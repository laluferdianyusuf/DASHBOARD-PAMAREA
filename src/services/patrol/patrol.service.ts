import { apiClient } from "../../lib/apiClient";

import type { PatrolAssignmentToday } from "../../types/patrol/patrol-assigment";

import type {
  StartPatrolRequest,
  //   StartNextPatrolRequest,
  ValidatePatrolLocationRequest,
  ValidatePatrolLocationResponse,
  ValidatePatrolNfcRequest,
  ValidatePatrolNfcResponse,
  BypassPatrolNfcRequest,
  BypassPatrolNfcResponse,
  PatrolResponse,
} from "../../types/patrol/patrol";

import type { SubmitPatrolAnswersRequest } from "../../types/patrol/patrol-answer";

import type {
  SubmitPatrolPhotoRequest,
  PatrolPhoto,
} from "../../types/patrol/patrol-photo";

export const patrolService = {
  /**
   * Mengambil jadwal patroli hari ini.
   * GET /patrols/today
   */
  async getToday(): Promise<PatrolAssignmentToday[]> {
    const response =
      await apiClient.get<PatrolAssignmentToday[]>("/patrols/today");

    return response.data;
  },

  /**
   * Memulai patroli pada checkpoint tertentu.
   * POST /patrols/checkpoints/:checkpointId/start
   */
  async startPatrol(
    checkpointId: string,
    payload: StartPatrolRequest,
  ): Promise<PatrolResponse> {
    const response = await apiClient.post<PatrolResponse>(
      `/patrols/checkpoints/${checkpointId}/start`,
      payload,
    );

    return response.data;
  },

  /**
   * Memulai patroli berikutnya.
   * POST /patrols/start-next
   */
  async startNextPatrol(): Promise<PatrolResponse> {
    const response = await apiClient.post<PatrolResponse>(
      "/patrols/start-next",
    );

    return response.data;
  },

  /**
   * Mengambil detail patroli.
   * GET /patrols/:patrolId
   */
  async getById(patrolId: string): Promise<PatrolResponse> {
    const response = await apiClient.get<PatrolResponse>(
      `/patrols/${patrolId}`,
    );

    return response.data;
  },

  /**
   * Memvalidasi lokasi GPS.
   * POST /patrols/:patrolId/validate-location
   */
  async validateLocation(
    patrolId: string,
    payload: ValidatePatrolLocationRequest,
  ): Promise<ValidatePatrolLocationResponse> {
    const response = await apiClient.post<ValidatePatrolLocationResponse>(
      `/patrols/${patrolId}/validate-location`,
      payload,
    );

    return response.data;
  },

  /**
   * Memvalidasi NFC.
   * POST /patrols/:patrolId/validate-nfc
   */
  async validateNfc(
    patrolId: string,
    payload: ValidatePatrolNfcRequest,
  ): Promise<ValidatePatrolNfcResponse> {
    const response = await apiClient.post<ValidatePatrolNfcResponse>(
      `/patrols/${patrolId}/validate-nfc`,
      payload,
    );

    return response.data;
  },

  /**
   * Melewati validasi NFC.
   * POST /patrols/:patrolId/bypass-nfc
   */
  async bypassNfc(
    patrolId: string,
    payload: BypassPatrolNfcRequest,
  ): Promise<BypassPatrolNfcResponse> {
    const response = await apiClient.post<BypassPatrolNfcResponse>(
      `/patrols/${patrolId}/bypass-nfc`,
      payload,
    );

    return response.data;
  },

  /**
   * Menyimpan jawaban patroli.
   * PUT /patrols/:patrolId/answers
   */
  async submitAnswers(
    patrolId: string,
    payload: SubmitPatrolAnswersRequest,
  ): Promise<PatrolResponse> {
    const response = await apiClient.put<PatrolResponse>(
      `/patrols/${patrolId}/answers`,
      payload,
    );

    return response.data;
  },

  /**
   * Mengunggah foto patroli.
   * POST /patrols/:patrolId/photos
   */
  async uploadPhoto(
    patrolId: string,
    file: File,
    metadata: SubmitPatrolPhotoRequest = {},
  ): Promise<PatrolPhoto> {
    const formData = new FormData();

    formData.append("file", file);

    if (metadata.answerId) {
      formData.append("answerId", metadata.answerId);
    }

    if (metadata.latitude !== undefined) {
      formData.append("latitude", String(metadata.latitude));
    }

    if (metadata.longitude !== undefined) {
      formData.append("longitude", String(metadata.longitude));
    }

    if (metadata.capturedAt) {
      formData.append("capturedAt", metadata.capturedAt);
    }

    const response = await apiClient.post<PatrolPhoto>(
      `/patrols/${patrolId}/photos`,
      formData,
    );

    return response.data;
  },

  /**
   * Mengirimkan hasil patroli.
   * POST /patrols/:patrolId/submit
   */
  async submit(patrolId: string): Promise<PatrolResponse> {
    const response = await apiClient.post<PatrolResponse>(
      `/patrols/${patrolId}/submit`,
    );

    return response.data;
  },
};
