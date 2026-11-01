import {
  downloadRosterTemplate,
  importRoster,
  previewRosterImport,
  RosterImportPreview,
  RosterImportResult,
  RosterTemplateParams,
} from "@/src/services/roster/roster-import.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const getErrorMessage = (error: unknown): string => {
  const axiosError = error as {
    response?: {
      data?: {
        message?: string | string[];
      };
    };
    message?: string;
  };

  const message = axiosError.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(", ");
  }

  return message || axiosError.message || "Terjadi kesalahan";
};

export const useDownloadRosterTemplate = () => {
  return useMutation({
    mutationFn: (params: RosterTemplateParams) =>
      downloadRosterTemplate(params),

    onSuccess: (blob, params) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `roster-${params.month}-${params.year}.xlsx`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    },
  });
};

export const usePreviewRosterImport = () => {
  return useMutation<RosterImportPreview, Error, File>({
    mutationFn: previewRosterImport,
  });
};

export const useImportRoster = () => {
  const queryClient = useQueryClient();

  return useMutation<RosterImportResult, Error, File>({
    mutationFn: importRoster,

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["patrol-schedule-roster"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["patrol-schedules"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["patrol-schedule-assignments"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["patrol-schedule-assignment"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["patrol-rounds"],
        }),
      ]);
    },
  });
};

export { getErrorMessage };
