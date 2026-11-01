import { apiClient } from "../../lib/apiClient";

import type {
  GetAllRoundsGroupedByUserParams,
  GetPatrolRoundsByUserParams,
  PatrolRoundListResponse,
  PatrolRoundQuery,
  StartPatrolRoundResponse,
} from "../../types/patrol/patrol-round";
import type { PatrolRoundsGroupedByUserResponse } from "../../types/patrol/patrol-round-group";
import type { PatrolRoundDetail } from "../../types/schedule/patrol-round";

// Mengambil daftar ronde patroli
export const getPatrolRounds = async (
  params?: PatrolRoundQuery,
): Promise<PatrolRoundListResponse> => {
  const response = await apiClient.get<PatrolRoundListResponse>(
    "/patrol-rounds",
    { params },
  );

  return response.data;
};

export const getAllRoundsGroupedByUser = async (
  params?: GetAllRoundsGroupedByUserParams,
): Promise<PatrolRoundsGroupedByUserResponse> => {
  const response = await apiClient.get<PatrolRoundsGroupedByUserResponse>(
    "/patrol-rounds/all/grouped-by-user",
    {
      params,
    },
  );

  console.log("[GROUPED ROUNDS]", response.data);

  return response.data;
};

export const getPatrolRoundsByUser = async ({
  userId,
  date,
}: GetPatrolRoundsByUserParams): Promise<PatrolRoundListResponse> => {
  if (!userId) {
    throw new Error("User ID wajib diisi.");
  }

  const response = await apiClient.get<PatrolRoundListResponse>(
    `patrol-rounds/users/${userId}/rounds`,
    {
      params: date ? { date } : undefined,
    },
  );

  return response.data;
};

export const getPatrolRoundById = async (
  roundId: string,
): Promise<PatrolRoundDetail> => {
  const response = await apiClient.get<PatrolRoundDetail>(
    `/patrol-rounds/${roundId}`,
  );

  return response.data;
};

// Memulai ronde patroli
export const startPatrolRound = async (
  roundId: string,
): Promise<StartPatrolRoundResponse> => {
  const response = await apiClient.post<StartPatrolRoundResponse>(
    `/patrol-rounds/${roundId}/start`,
  );

  return response.data;
};

export const reorderPatrolRoundCheckpoints = async (
  roundId: string,
  checkpointIds: string[],
) => {
  const response = await apiClient.patch(
    `/patrol-rounds/${roundId}/checkpoints/order`,
    { checkpointIds },
  );

  return response.data;
};
