import { apiClient } from "../../lib/apiClient";
import type { Finding, FindingListResponse, FindingQuery } from "../../types";
export interface ResolveFindingRequest {
  resolutionNote: string;
}

export const getFindingFeed = async (
  query?: FindingQuery,
): Promise<FindingListResponse> => {
  const response = await apiClient.get<FindingListResponse>("/findings", {
    params: query,
  });
  return response.data;
};

export const getFindingFeedById = async (id: string): Promise<Finding> => {
  const response = await apiClient.get<Finding>(`/findings/${id}`);
  return response.data;
};

export const resolveFinding = async (
  id: string,
  data: ResolveFindingRequest,
) => {
  const response = await apiClient.patch(`/findings/${id}/resolve`, data);

  return response.data;
};
