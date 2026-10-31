import { useMutation, useQuery } from "@tanstack/react-query";

import {
  exportPatrolHistoryExcel,
  getPatrolHistoryGroupedByUser,
} from "../../services/patrol/patrol-history.service";

import type {
  PatrolHistoryGroupedByUserParams,
  PatrolHistoryQuery,
} from "../../types/patrol/patrol-history";
type ExportParams = Pick<
  PatrolHistoryQuery,
  "search" | "status" | "startDate" | "endDate"
>;

/**
 * Mengambil riwayat patroli yang dikelompokkan berdasarkan user.
 */
export const usePatrolHistoryGroupedByUser = (
  params: PatrolHistoryGroupedByUserParams = {},
) => {
  return useQuery({
    queryKey: ["patrol-history", "grouped-by-user", params],

    queryFn: () => getPatrolHistoryGroupedByUser(params),

    retry: false,

    staleTime: 30_000,
  });
};

export const useExportPatrolHistoryExcel = () => {
  return useMutation({
    mutationFn: (params: ExportParams) => exportPatrolHistoryExcel(params),

    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "data-patroli-pamarea.xlsx";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    },

    onError: (error) => {
      console.error("Gagal mengekspor data patroli:", error);
    },
  });
};
