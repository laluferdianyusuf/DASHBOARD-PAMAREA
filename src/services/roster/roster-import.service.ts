import { apiClient } from "@/src/lib/apiClient";

export interface RosterTemplateParams {
  siteId: string;
  month: number;
  year: number;
}

export interface RosterImportPreview {
  valid?: boolean;
  siteId?: string;
  month?: number;
  year?: number;
  summary?: {
    totalSecurity?: number;
    totalAssignment?: number;
    totalShift?: number;
    totalOff?: number;
  };
  assignments?: Array<{
    rowNumber: number;
    userId: string;
    userName?: string;
    scheduleId: string;
    scheduleName?: string;
    startDate: string;
    endDate: string;
    startDay?: number;
    endDay?: number;
  }>;
  errors?: Array<{
    row?: number;
    field?: string;
    message: string;
  }>;
  warnings?: Array<{
    row?: number;
    field?: string;
    message: string;
  }>;
  [key: string]: unknown;
}

export interface RosterImportResult {
  success?: boolean;
  message?: string;
  summary?: {
    totalAssignments?: number;
    successfulAssignments?: number;
    failedAssignments?: number;
    [key: string]: unknown;
  };
  assignments?: unknown[];
  generationResults?: unknown[];
  [key: string]: unknown;
}

export const downloadRosterTemplate = async (
  params: RosterTemplateParams,
): Promise<Blob> => {
  const response = await apiClient.get("/patrol-schedules/roster/template", {
    params,
    responseType: "blob",
  });

  return response.data;
};

export const previewRosterImport = async (
  file: File,
): Promise<RosterImportPreview> => {
  const formData = new FormData();
  formData.append("file", file, file.name);

  const response = await apiClient.post(
    "/patrol-schedules/roster/preview",
    formData,
    {
      transformRequest: [(data) => data],
    },
  );

  console.log("PREVIEW RAW RESPONSE:", response.data);
  console.log("PREVIEW RESPONSE DATA:", response.data?.data);

  return response.data?.data ?? response.data;
};

export const importRoster = async (file: File): Promise<RosterImportResult> => {
  if (!(file instanceof File)) {
    throw new Error("File Excel tidak valid");
  }

  const formData = new FormData();
  formData.append("file", file, file.name);

  const response = await apiClient.post(
    "/patrol-schedules/roster/import",
    formData,
    {
      headers: {
        "Content-Type": undefined,
      },
      transformRequest: [(data) => data],
    },
  );

  return response.data?.data ?? response.data;
};
