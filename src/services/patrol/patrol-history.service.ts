import { apiClient } from "../../lib/apiClient";
import type {
  PatrolHistoryGroupedByUserParams,
  PatrolHistoryGroupedByUserResponse,
  PatrolHistoryQuery,
} from "../../types/patrol/patrol-history";

export const getPatrolHistoryGroupedByUser = async (
  params: PatrolHistoryGroupedByUserParams = {},
): Promise<PatrolHistoryGroupedByUserResponse> => {
  const response = await apiClient.get<PatrolHistoryGroupedByUserResponse>(
    "/patrols/history/grouped-by-user",
    {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 20,

        ...(params.search?.trim() ? { search: params.search.trim() } : {}),

        ...(params.status ? { status: params.status } : {}),

        ...(params.startDate ? { startDate: params.startDate } : {}),

        ...(params.endDate ? { endDate: params.endDate } : {}),
      },
    },
  );

  return response.data;
};

export const exportPatrolHistoryExcel = async (
  params: Pick<
    PatrolHistoryQuery,
    "search" | "status" | "startDate" | "endDate"
  > = {},
): Promise<Blob> => {
  const response = await apiClient.get("/patrols/export/excel", {
    params: {
      ...(params.search && { search: params.search }),
      ...(params.status && { status: params.status }),
      ...(params.startDate && { startDate: params.startDate }),
      ...(params.endDate && { endDate: params.endDate }),
    },
    responseType: "blob",
  });

  return response.data;
};
