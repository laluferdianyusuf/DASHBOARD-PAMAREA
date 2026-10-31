import { apiClient } from "../../lib/apiClient";
import type { PatrolCheckpoint } from "../../types/patrol/patrol-checkpoint";

export const getPatrolCheckpointById = async (
  id: string,
): Promise<PatrolCheckpoint> => {
  const response = await apiClient.get<PatrolCheckpoint>(
    `/patrol-checkpoints/${id}`,
  );

  return response.data;
};
