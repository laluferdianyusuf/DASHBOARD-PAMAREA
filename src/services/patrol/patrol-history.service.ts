import axios from "axios";
import { apiClient } from "../../lib/apiClient";
import type {
  PatrolHistoryGroupedByUserParams,
  PatrolHistoryGroupedByUserResponse,
  PatrolHistoryQuery,
} from "../../types/patrol/patrol-history";

export interface ExportPatrolHistoryPayload {
  startDate: string;
  endDate: string;
  siteId: string;
}

export const exportPatrolHistoryExcelByFilter = async (
  payload: ExportPatrolHistoryPayload,
): Promise<Blob> => {
  try {
    const response = await apiClient.post("/patrols/export-excel", payload, {
      responseType: "blob",
      timeout: 300000,
    });

    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      let responseData: unknown = error.response?.data;

      if (responseData instanceof Blob) {
        const text = await responseData.text();

        try {
          responseData = JSON.parse(text);
        } catch {
          responseData = text;
        }
      }

      const backendMessage =
        typeof responseData === "object" &&
        responseData !== null &&
        "message" in responseData
          ? String(responseData.message)
          : undefined;

      throw new Error(
        backendMessage || error.message || "Gagal mengekspor laporan patroli.",
      );
    }

    throw error;
  }
};

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
