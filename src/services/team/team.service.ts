import { apiClient } from "../../lib/apiClient";
import type { ApiResponse } from "../../types";
import type {
  CreateTeamPayload,
  DeleteTeamResponse,
  QueryTeamParams,
  Team,
  UpdateTeamPayload,
} from "../../types/team/team";

export const teamService = {
  async getAll(params?: QueryTeamParams): Promise<Team[]> {
    const response = await apiClient.get<Team[]>("/teams", {
      params,
    });

    return response.data;
  },

  async getActive(siteId?: string): Promise<Team[]> {
    const response = await apiClient.get<Team[]>("/teams/active", {
      params: siteId ? { siteId } : undefined,
    });

    return response.data;
  },

  async getById(id: string): Promise<Team> {
    const response = await apiClient.get<Team>(`/teams/${id}`);

    return response.data;
  },

  async create(payload: CreateTeamPayload): Promise<ApiResponse<Team>> {
    const response = await apiClient.post<ApiResponse<Team>>("/teams", payload);

    return response.data;
  },

  async update(id: string, payload: UpdateTeamPayload): Promise<Team> {
    const response = await apiClient.patch<Team>(`/teams/${id}`, payload);

    return response.data;
  },

  async delete(id: string): Promise<DeleteTeamResponse> {
    const response = await apiClient.delete<DeleteTeamResponse>(`/teams/${id}`);

    return response.data;
  },
};
