import ExcelJS from "exceljs";
import JSZip from "jszip";
import { toast } from "sonner";

import { getPatrolHistoryGroupedByUser } from "../services/patrol/patrol-history.service";
import { getPhotoUrlForExport } from "./getPhoto";

type PatrolHistoryQuery = NonNullable<
  Parameters<typeof getPatrolHistoryGroupedByUser>[0]
>;

type PatrolHistoryResponse = Awaited<
  ReturnType<typeof getPatrolHistoryGroupedByUser>
>;

type PatrolGroup = PatrolHistoryResponse["data"][number];

type PatrolRecord = PatrolGroup["patrols"][number] & {
  user: PatrolGroup["user"];
};

type PatrolHistoryDateFilter = {
  startDate: string;
  endDate: string;
};

type ExcelPhoto = {
  base64: string;
  extension: "jpeg" | "png";
};

const EXCEL_COLORS = {
  navy: "FF17365D",
  blue: "FF2563EB",
  lightBlue: "FFEFF6FF",
  white: "FFFFFFFF",
  text: "FF1E293B",
  muted: "FF64748B",
  border: "FFE2E8F0",
  alternate: "FFF8FAFC",
  green: "FF15803D",
  lightGreen: "FFDCFCE7",
  red: "FFBE123C",
  lightRed: "FFFFE4E6",
  amber: "FFB45309",
  lightAmber: "FFFEF3C7",
  gray: "FF475569",
  lightGray: "FFF1F5F9",
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Gagal membaca gambar."));
        return;
      }

      resolve(reader.result.split(",")[1]);
    };

    reader.onerror = () => reject(reader.error);

    reader.readAsDataURL(blob);
  });
};

const mapWithConcurrency = async <T, R>(
  items: T[],
  concurrency: number,
  callback: (item: T, index: number) => Promise<R>,
): Promise<R[]> => {
  const results = new Array<R>(items.length);
  let currentIndex = 0;

  const worker = async () => {
    while (true) {
      const index = currentIndex++;

      if (index >= items.length) return;

      results[index] = await callback(items[index], index);
    }
  };

  const workerCount = Math.min(Math.max(1, concurrency), items.length);

  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  return results;
};

const photoCache = new Map<string, Promise<ExcelPhoto | null>>();

const fetchPhotoForExcel = (fileUrl: string): Promise<ExcelPhoto | null> => {
  const imageUrl = getPhotoUrlForExport(fileUrl);

  const cached = photoCache.get(imageUrl);

  if (cached) return cached;

  const request = (async (): Promise<ExcelPhoto | null> => {
    try {
      const response = await fetch(imageUrl);

      if (!response.ok) return null;

      const blob = await response.blob();
      const mimeType = blob.type.toLowerCase();

      if (mimeType.includes("png")) {
        return {
          base64: await blobToBase64(blob),
          extension: "png",
        };
      }

      if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
        return {
          base64: await blobToBase64(blob),
          extension: "jpeg",
        };
      }

      if (!blob.type.startsWith("image/")) return null;

      const bitmap = await createImageBitmap(blob);

      try {
        const canvas = document.createElement("canvas");

        canvas.width = bitmap.width;
        canvas.height = bitmap.height;

        const context = canvas.getContext("2d");

        if (!context) return null;

        context.drawImage(bitmap, 0, 0);

        const dataUrl = canvas.toDataURL("image/png");
        const base64 = dataUrl.split(",")[1];

        if (!base64) return null;

        return {
          base64,
          extension: "png",
        };
      } finally {
        bitmap.close();
      }
    } catch (error) {
      console.error("[Excel] Gagal mengambil foto:", fileUrl, error);

      return null;
    }
  })();

  photoCache.set(imageUrl, request);

  return request;
};

const downloadExcelZip = async (
  files: {
    workbook: ExcelJS.Workbook;
    fileName: string;
  }[],
  zipFileName: string,
) => {
  const zip = new JSZip();

  for (const file of files) {
    const buffer = await file.workbook.xlsx.writeBuffer();

    zip.file(file.fileName, buffer);
  }

  const blob = await zip.generateAsync({
    type: "blob",
    compression: "STORE",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = zipFileName;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 5000);
};

const createExcelWorkbook = (title: string, subject: string) => {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = "PAMAREA";
  workbook.subject = subject;
  workbook.title = title;
  workbook.created = new Date();
  workbook.modified = new Date();

  return workbook;
};

const styleExcelWorksheet = (
  worksheet: ExcelJS.Worksheet,
  title: string,
  subtitle: string,
) => {
  const lastColumn = worksheet.columns.length;

  worksheet.spliceRows(1, 1);

  worksheet.mergeCells(1, 1, 1, lastColumn);
  worksheet.mergeCells(2, 1, 2, lastColumn);

  const titleCell = worksheet.getCell("A1");

  titleCell.value = title;
  titleCell.font = {
    name: "Aptos Display",
    size: 18,
    bold: true,
    color: { argb: EXCEL_COLORS.white },
  };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: EXCEL_COLORS.navy },
  };
  titleCell.alignment = {
    vertical: "middle",
    horizontal: "left",
    indent: 1,
  };

  const subtitleCell = worksheet.getCell("A2");

  subtitleCell.value = subtitle;
  subtitleCell.font = {
    name: "Aptos",
    size: 10,
    color: { argb: EXCEL_COLORS.muted },
    italic: true,
  };
  subtitleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: EXCEL_COLORS.lightBlue },
  };
  subtitleCell.alignment = {
    vertical: "middle",
    indent: 1,
  };

  worksheet.getRow(1).height = 38;
  worksheet.getRow(2).height = 25;
  worksheet.getRow(3).height = 10;

  const headerRow = worksheet.getRow(4);

  worksheet.columns.forEach((column, index) => {
    headerRow.getCell(index + 1).value = column.header?.toString() ?? "";
  });

  headerRow.height = 34;

  headerRow.eachCell((cell) => {
    cell.font = {
      name: "Aptos",
      bold: true,
      size: 10,
      color: { argb: EXCEL_COLORS.white },
    };

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: EXCEL_COLORS.navy },
    };

    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };

    cell.border = {
      bottom: {
        style: "medium",
        color: { argb: EXCEL_COLORS.blue },
      },
    };
  });

  worksheet.views = [
    {
      state: "frozen",
      ySplit: 4,
      showGridLines: false,
    },
  ];

  worksheet.autoFilter = {
    from: { row: 4, column: 1 },
    to: { row: 4, column: lastColumn },
  };

  worksheet.properties.defaultRowHeight = 25;

  worksheet.pageSetup = {
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    paperSize: 9,
    margins: {
      left: 0.25,
      right: 0.25,
      top: 0.5,
      bottom: 0.5,
      header: 0.2,
      footer: 0.2,
    },
  };
};

const styleExcelDataRows = (worksheet: ExcelJS.Worksheet, startRow = 5) => {
  for (let rowNumber = startRow; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber);

    row.height = 25;

    row.eachCell((cell) => {
      cell.font = {
        name: "Aptos",
        size: 10,
        color: { argb: EXCEL_COLORS.text },
      };

      cell.alignment = {
        vertical: "middle",
        wrapText: true,
      };

      cell.border = {
        bottom: {
          style: "thin",
          color: { argb: EXCEL_COLORS.border },
        },
      };

      if (rowNumber % 2 === 0) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: EXCEL_COLORS.alternate },
        };
      }
    });
  }
};

const styleExcelStatus = (cell: ExcelJS.Cell, status?: string | null) => {
  const value = (status ?? "").toUpperCase();

  let fontColor = EXCEL_COLORS.gray;
  let backgroundColor = EXCEL_COLORS.lightGray;

  if (
    ["SUBMITTED", "SELESAI", "COMPLETED", "RESOLVED", "VALID"].includes(value)
  ) {
    fontColor = EXCEL_COLORS.green;
    backgroundColor = EXCEL_COLORS.lightGreen;
  } else if (
    [
      "FAILED",
      "GAGAL",
      "INVALID",
      "MISSED",
      "CANCELLED",
      "DIBATALKAN",
    ].includes(value)
  ) {
    fontColor = EXCEL_COLORS.red;
    backgroundColor = EXCEL_COLORS.lightRed;
  } else if (
    ["IN_PROGRESS", "BERLANGSUNG", "OPEN", "PENDING"].includes(value)
  ) {
    fontColor = EXCEL_COLORS.amber;
    backgroundColor = EXCEL_COLORS.lightAmber;
  }

  cell.font = {
    name: "Aptos",
    size: 9,
    bold: true,
    color: { argb: fontColor },
  };

  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: backgroundColor },
  };

  cell.alignment = {
    vertical: "middle",
    horizontal: "center",
  };
};

const formatDuration = (
  startedAt?: string | Date | null,
  completedAt?: string | Date | null,
) => {
  if (!startedAt || !completedAt) return "-";

  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();

  if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
    return "-";
  }

  const minutes = Math.floor((end - start) / 60000);

  if (minutes < 60) return `${minutes} menit`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours} jam ${remainingMinutes} menit`;
};

const getStatusLabel = (status?: string) => {
  const labels: Record<string, string> = {
    STARTED: "Dimulai",
    VALIDATED: "Tervalidasi",
    IN_PROGRESS: "Berlangsung",
    SUBMITTED: "Selesai",
    FAILED: "Gagal",
    CANCELLED: "Dibatalkan",
  };

  return labels[status ?? ""] ?? status ?? "-";
};

const getWitaDateKey = (value?: string | Date | null): string | null => {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Makassar",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;

  const month = parts.find((part) => part.type === "month")?.value;

  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) return null;

  return `${year}-${month}-${day}`;
};

const getTimestamp = () => {
  return getWitaDateKey(new Date()) ?? new Date().toISOString().slice(0, 10);
};

const getExportLogs = async (
  queryParams: PatrolHistoryQuery,
): Promise<PatrolRecord[]> => {
  const limit = 100;

  const firstResponse = await getPatrolHistoryGroupedByUser({
    ...queryParams,
    page: 1,
    limit,
  });

  const allGroups = [...(firstResponse.data ?? [])];

  const totalPages = firstResponse.pagination?.totalPages ?? 1;

  const remainingPages = Array.from(
    { length: Math.max(0, totalPages - 1) },
    (_, index) => index + 2,
  );

  const pageResponses = await mapWithConcurrency(remainingPages, 4, (page) =>
    getPatrolHistoryGroupedByUser({
      ...queryParams,
      page,
      limit,
    }),
  );

  for (const response of pageResponses) {
    allGroups.push(...(response.data ?? []));
  }

  return allGroups.flatMap((group) =>
    group.patrols.map((patrol) => ({
      ...patrol,
      user: group.user,
    })),
  );
};

export const exportPatrolHistoryExcel = async (
  queryParams: PatrolHistoryQuery,
  selectedSite: string,
  dateFilter: PatrolHistoryDateFilter,
) => {
  const startedTime = performance.now();

  photoCache.clear();

  try {
    toast.info("Menyiapkan data laporan patroli...");

    const allLogs = await getExportLogs(queryParams);

    console.log("[Excel Export] Total data dari API:", allLogs.length);

    const dateFilteredLogs = allLogs.filter((log) => {
      const patrolDate = getWitaDateKey(log.startedAt);

      if (!patrolDate) return false;

      return (
        patrolDate >= dateFilter.startDate && patrolDate <= dateFilter.endDate
      );
    });

    const exportLogs =
      selectedSite === "all"
        ? dateFilteredLogs
        : dateFilteredLogs.filter((log) => log.site?.id === selectedSite);

    if (exportLogs.length === 0) {
      toast.warning("Tidak ada data riwayat patroli untuk diekspor.");
      return;
    }

    const timestamp = getTimestamp();

    const exportedAt = new Intl.DateTimeFormat("id-ID", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "Asia/Makassar",
    }).format(new Date());

    const siteName =
      selectedSite === "all"
        ? "Semua Site"
        : (exportLogs[0]?.site?.name ?? "Site");

    const subtitle = `PAMAREA | ${siteName} | Diekspor ${exportedAt}`;

    const historyWorkbook = createExcelWorkbook(
      "Riwayat Patroli",
      "Laporan pelaksanaan patroli",
    );

    const historySheet = historyWorkbook.addWorksheet("Riwayat Patroli");

    historySheet.columns = [
      { header: "No.", key: "no", width: 8 },
      { header: "ID Sesi", key: "reportNumber", width: 24 },
      { header: "Site", key: "site", width: 22 },
      { header: "Kode Titik", key: "pointCode", width: 16 },
      { header: "Titik Patroli", key: "pointName", width: 25 },
      { header: "NPP Security", key: "employeeNumber", width: 18 },
      { header: "Nama Security", key: "security", width: 25 },
      { header: "Urutan Titik", key: "sequence", width: 14 },
      { header: "Waktu Mulai", key: "startedAt", width: 22 },
      { header: "Waktu Selesai", key: "completedAt", width: 22 },
      { header: "Durasi", key: "duration", width: 18 },
      { header: "Status GPS", key: "gps", width: 16 },
      { header: "Akurasi GPS (m)", key: "accuracy", width: 17 },
      { header: "Jarak Titik (m)", key: "distance", width: 17 },
      { header: "Status NFC", key: "nfc", width: 18 },
      { header: "NFC Bypass", key: "nfcBypass", width: 14 },
      { header: "Alasan Bypass", key: "nfcReason", width: 22 },
      { header: "Catatan Bypass", key: "nfcNote", width: 28 },
      { header: "Status Checkpoint", key: "checkpointStatus", width: 20 },
      { header: "Status Patroli", key: "status", width: 18 },
    ];

    styleExcelWorksheet(historySheet, "LAPORAN RIWAYAT PATROLI", subtitle);

    exportLogs.forEach((log, index) => {
      historySheet.addRow({
        no: index + 1,
        reportNumber: log.reportNumber ?? "-",
        site: log.site?.name ?? "-",
        pointCode: log.patrolPoint?.code ?? "-",
        pointName: log.patrolPoint?.name ?? "-",
        employeeNumber: log.user?.employeeNumber ?? "-",
        security: log.user?.fullName ?? "-",
        sequence: log.checkpoint?.sequence ?? "-",
        startedAt: log.startedAt ? new Date(log.startedAt) : null,
        completedAt: log.completedAt ? new Date(log.completedAt) : null,
        duration: formatDuration(log.startedAt, log.completedAt),
        gps: log.gpsValidationStatus ?? "-",
        accuracy: log.gpsAccuracy ?? "-",
        distance: log.distanceFromPoint ?? "-",
        nfc: log.nfcValidationStatus ?? "-",
        nfcBypass: log.nfcBypass ? "Ya" : "Tidak",
        nfcReason: log.nfcBypassReason ?? "-",
        nfcNote: log.nfcBypassNote ?? "-",
        checkpointStatus: log.checkpoint?.status ?? "-",
        status: getStatusLabel(log.status),
      });
    });

    styleExcelDataRows(historySheet);

    historySheet.getColumn("startedAt").numFmt = "dd mmm yyyy hh:mm";

    historySheet.getColumn("completedAt").numFmt = "dd mmm yyyy hh:mm";

    historySheet.getColumn("accuracy").numFmt = "0.00";
    historySheet.getColumn("distance").numFmt = "0.00";

    exportLogs.forEach((log, index) => {
      const row = historySheet.getRow(index + 5);

      styleExcelStatus(row.getCell(12), log.gpsValidationStatus);

      styleExcelStatus(row.getCell(15), log.nfcValidationStatus);

      styleExcelStatus(row.getCell(19), log.checkpoint?.status);

      styleExcelStatus(row.getCell(20), getStatusLabel(log.status));
    });

    const answerWorkbook = createExcelWorkbook(
      "Jawaban Patroli",
      "Laporan jawaban pertanyaan patroli beserta dokumentasi",
    );

    const answerRecords = exportLogs.flatMap((log) =>
      (log.answers ?? []).map((answer) => ({
        reportNumber: log.reportNumber ?? "-",
        site: log.site?.name ?? "-",
        security: log.user?.fullName ?? "-",
        employeeNumber: log.user?.employeeNumber ?? "-",
        startedAt: log.startedAt,
        point: log.patrolPoint?.name ?? "-",
        question: answer.questionTextSnapshot ?? "-",
        answer: answer.answerLabelSnapshot ?? answer.answerValue ?? "-",
        photos: answer.photos ?? [],
      })),
    );

    const maxAnswerPhotos = Math.max(
      1,
      ...answerRecords.map((item) => item.photos.length),
    );

    const answerSheet = answerWorkbook.addWorksheet("Jawaban");

    answerSheet.columns = [
      { header: "No.", key: "no", width: 8 },
      { header: "ID Sesi", key: "reportNumber", width: 24 },
      { header: "Site", key: "site", width: 22 },
      { header: "NPP Security", key: "employeeNumber", width: 18 },
      { header: "Nama Security", key: "security", width: 25 },
      { header: "Waktu Patroli", key: "startedAt", width: 22 },
      { header: "Titik Patroli", key: "point", width: 25 },
      { header: "Pertanyaan", key: "question", width: 42 },
      { header: "Jawaban", key: "answer", width: 30 },
      { header: "Jumlah Foto", key: "photoCount", width: 14 },
      ...Array.from({ length: maxAnswerPhotos }, (_, index) => ({
        header: `Foto ${index + 1}`,
        key: `photo${index + 1}`,
        width: 20,
      })),
    ];

    styleExcelWorksheet(answerSheet, "LAPORAN JAWABAN PATROLI", subtitle);

    answerRecords.forEach((item, index) => {
      const rowData: Record<string, unknown> = {
        no: index + 1,
        reportNumber: item.reportNumber,
        site: item.site,
        employeeNumber: item.employeeNumber,
        security: item.security,
        startedAt: item.startedAt ? new Date(item.startedAt) : null,
        point: item.point,
        question: item.question,
        answer: item.answer,
        photoCount: item.photos.length,
      };

      item.photos.forEach((_, photoIndex) => {
        rowData[`photo${photoIndex + 1}`] = "";
      });

      answerSheet.addRow(rowData);
    });

    styleExcelDataRows(answerSheet);

    answerSheet.getColumn("startedAt").numFmt = "dd mmm yyyy hh:mm";

    const answerPhotoTasks = answerRecords.flatMap((item, recordIndex) =>
      item.photos.map((photo, photoIndex) => ({
        recordIndex,
        photoIndex,
        fileUrl: photo.fileUrl,
      })),
    );

    console.log("[Excel Export] Total jawaban:", answerRecords.length);

    console.log("[Excel Export] Total foto jawaban:", answerPhotoTasks.length);

    const answerPhotoResults = await mapWithConcurrency(
      answerPhotoTasks,
      6,
      async (task) => ({
        ...task,
        image: await fetchPhotoForExcel(task.fileUrl),
      }),
    );

    for (const result of answerPhotoResults) {
      if (!result.image) continue;

      const imageId = answerWorkbook.addImage({
        base64: result.image.base64,
        extension: result.image.extension,
      });

      const rowNumber = result.recordIndex + 5;
      const columnIndex = 10 + result.photoIndex;

      answerSheet.getRow(rowNumber).height = 75;

      answerSheet.addImage(imageId, {
        tl: {
          col: columnIndex,
          row: rowNumber - 1,
        },
        ext: {
          width: 110,
          height: 65,
        },
        editAs: "oneCell",
      });
    }

    const findingWorkbook = createExcelWorkbook(
      "Temuan Patroli",
      "Laporan temuan patroli beserta dokumentasi",
    );

    const findingRecords = exportLogs.flatMap((log) =>
      (log.findings ?? []).map((finding) => ({
        reportNumber: log.reportNumber ?? "-",
        site: log.site?.name ?? "-",
        employeeNumber: log.user?.employeeNumber ?? "-",
        security: log.user?.fullName ?? "-",
        point: log.patrolPoint?.name ?? "-",
        pointCode: log.patrolPoint?.code ?? "-",
        checkpointSequence: log.checkpoint?.sequence ?? "-",
        startedAt: log.startedAt,
        title: finding.title ?? "-",
        description: finding.description ?? "-",
        severity: finding.severity ?? "-",
        status: finding.status ?? "-",
        resolutionNote: finding.resolutionNote ?? "-",
        resolvedAt: finding.resolvedAt,
        photos: finding.photos ?? [],
      })),
    );

    console.log("[Excel Export] Total patroli:", exportLogs.length);

    console.log("[Excel Export] Total temuan:", findingRecords.length);

    const maxFindingPhotos = Math.max(
      1,
      ...findingRecords.map((item) => item.photos.length),
    );

    const findingSheet = findingWorkbook.addWorksheet("Temuan");

    findingSheet.columns = [
      { header: "No.", key: "no", width: 8 },
      { header: "ID Sesi", key: "reportNumber", width: 24 },
      { header: "Site", key: "site", width: 22 },
      { header: "NPP Security", key: "employeeNumber", width: 18 },
      { header: "Nama Security", key: "security", width: 25 },
      { header: "Titik Patroli", key: "point", width: 25 },
      { header: "Kode Titik", key: "pointCode", width: 16 },
      { header: "Urutan Titik", key: "checkpointSequence", width: 14 },
      { header: "Waktu Patroli", key: "startedAt", width: 22 },
      { header: "Judul Temuan", key: "title", width: 30 },
      { header: "Deskripsi", key: "description", width: 42 },
      { header: "Severity", key: "severity", width: 16 },
      { header: "Status", key: "status", width: 18 },
      { header: "Catatan Penyelesaian", key: "resolutionNote", width: 38 },
      { header: "Waktu Penyelesaian", key: "resolvedAt", width: 22 },
      { header: "Jumlah Foto", key: "photoCount", width: 14 },
      ...Array.from({ length: maxFindingPhotos }, (_, index) => ({
        header: `Foto ${index + 1}`,
        key: `photo${index + 1}`,
        width: 20,
      })),
    ];

    styleExcelWorksheet(findingSheet, "LAPORAN TEMUAN PATROLI", subtitle);

    findingRecords.forEach((item, index) => {
      const rowData: Record<string, unknown> = {
        no: index + 1,
        reportNumber: item.reportNumber,
        site: item.site,
        employeeNumber: item.employeeNumber,
        security: item.security,
        point: item.point,
        pointCode: item.pointCode,
        checkpointSequence: item.checkpointSequence,
        startedAt: item.startedAt ? new Date(item.startedAt) : null,
        title: item.title,
        description: item.description,
        severity: item.severity,
        status: item.status,
        resolutionNote: item.resolutionNote,
        resolvedAt: item.resolvedAt ? new Date(item.resolvedAt) : null,
        photoCount: item.photos.length,
      };

      item.photos.forEach((_, photoIndex) => {
        rowData[`photo${photoIndex + 1}`] = "";
      });

      findingSheet.addRow(rowData);
    });

    styleExcelDataRows(findingSheet);

    findingSheet.getColumn("startedAt").numFmt = "dd mmm yyyy hh:mm";

    findingSheet.getColumn("resolvedAt").numFmt = "dd mmm yyyy hh:mm";

    findingRecords.forEach((item, index) => {
      const row = findingSheet.getRow(index + 5);

      styleExcelStatus(row.getCell(12), item.severity);
      styleExcelStatus(row.getCell(13), item.status);
    });

    const findingPhotoTasks = findingRecords.flatMap((item, recordIndex) =>
      item.photos.map((photo, photoIndex) => ({
        recordIndex,
        photoIndex,
        fileUrl: photo.fileUrl,
      })),
    );

    console.log("[Excel Export] Total foto temuan:", findingPhotoTasks.length);

    const findingPhotoResults = await mapWithConcurrency(
      findingPhotoTasks,
      6,
      async (task) => ({
        ...task,
        image: await fetchPhotoForExcel(task.fileUrl),
      }),
    );

    for (const result of findingPhotoResults) {
      if (!result.image) {
        console.warn(
          "[Excel Export] Foto temuan gagal dimasukkan:",
          result.fileUrl,
        );

        continue;
      }

      const imageId = findingWorkbook.addImage({
        base64: result.image.base64,
        extension: result.image.extension,
      });

      const rowNumber = result.recordIndex + 5;
      const columnIndex = 16 + result.photoIndex;

      findingSheet.getRow(rowNumber).height = 75;

      findingSheet.addImage(imageId, {
        tl: {
          col: columnIndex,
          row: rowNumber - 1,
        },
        ext: {
          width: 110,
          height: 65,
        },
        editAs: "oneCell",
      });
    }

    console.log("[Excel Export] Mulai membuat file ZIP...");

    await downloadExcelZip(
      [
        {
          workbook: historyWorkbook,
          fileName: `01-Riwayat-Patroli-${timestamp}.xlsx`,
        },
        {
          workbook: answerWorkbook,
          fileName: `02-Jawaban-Patroli-${timestamp}.xlsx`,
        },
        {
          workbook: findingWorkbook,
          fileName: `03-Temuan-Patroli-${timestamp}.xlsx`,
        },
      ],
      `Laporan-Patroli-${timestamp}.zip`,
    );

    const durationSeconds = ((performance.now() - startedTime) / 1000).toFixed(
      2,
    );

    console.log(`[Excel Export] Selesai dalam ${durationSeconds} detik.`);

    toast.success("Export Excel berhasil!", {
      description: `ZIP berisi Riwayat Patroli, Jawaban Patroli beserta foto, dan Temuan Patroli beserta foto. Waktu proses: ${durationSeconds} detik.`,
      duration: 7000,
    });
  } catch (error) {
    console.error("[Excel Export] Gagal:", error);

    toast.error("Export Excel gagal.", {
      description:
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat membuat laporan.",
      duration: 7000,
    });
  } finally {
    photoCache.clear();
  }
};
