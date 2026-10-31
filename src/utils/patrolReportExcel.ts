import ExcelJS from "exceljs";
import { formatDateTimeWITA } from "../helpers/dateTime";
import { getPhotoUrl } from "./getPhoto";

// ============================================================
// TYPES
// ============================================================

export interface PatrolReportPhoto {
  fileUrl?: string | null;
  fileName?: string | null;
  capturedAt?: string | null;
}

export interface PatrolReportAnswer {
  id?: string;
  questionTextSnapshot?: string | null;
  answerValue?: string | number | boolean | null;
  answerLabelSnapshot?: string | null;
  photos?: PatrolReportPhoto[];
}

export interface PatrolReportFinding {
  id: string;
  title?: string | null;
  description?: string | null;
  severity?: string | null;
  status?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  patrolPoint?: {
    name?: string | null;
  } | null;
  reportedBy?: {
    fullName?: string | null;
  } | null;
  assignedTo?: {
    fullName?: string | null;
  } | null;
  resolvedBy?: {
    fullName?: string | null;
  } | null;
  photos?: PatrolReportPhoto[];
}

export interface PatrolReportItem {
  id: string;
  reportNumber?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  status?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  gpsAccuracy?: number | null;
  distanceFromPoint?: number | null;
  gpsValidationStatus?: string | null;
  nfcUidSnapshot?: string | null;
  nfcValidationStatus?: string | null;
  nfcBypass?: boolean;
  nfcBypassReason?: string | null;
  nfcBypassNote?: string | null;

  site?: {
    id?: string;
    name?: string | null;
  } | null;

  patrolPoint?: {
    id?: string;
    name?: string | null;
  } | null;

  checkpoint?: {
    id?: string;
    name?: string | null;
  } | null;

  answers?: PatrolReportAnswer[];
  photos?: PatrolReportPhoto[];
  findings?: PatrolReportFinding[];
}

export interface PatrolReportUser {
  id: string;
  employeeNumber?: string | null;
  fullName?: string | null;
  username?: string | null;
  patrols: PatrolReportItem[];
}

export interface PatrolReportExcelResponse {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  totalUsers?: number;
  totalPatrols?: number;
  data: PatrolReportUser[];
}

// ============================================================
// HELPERS
// ============================================================

const safeText = (
  value: string | number | boolean | null | undefined,
): string | number | boolean => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return value;
};

const formatDate = (value?: string | null): string => {
  if (!value) return "-";

  try {
    return formatDateTimeWITA(value);
  } catch {
    return value;
  }
};

const formatEnum = (value?: string | null): string => {
  if (!value) return "-";

  const labels: Record<string, string> = {
    SUBMITTED: "Selesai dikirim",
    IN_PROGRESS: "Sedang berlangsung",
    OPEN: "Terbuka",
    RESOLVED: "Selesai ditangani",
    LOW: "Rendah",
    MEDIUM: "Sedang",
    HIGH: "Tinggi",
    CRITICAL: "Kritis",
    VALID: "Valid",
    INVALID: "Tidak valid",
    BYPASSED: "Dilewati",
    DAMAGED: "Rusak",
    LOST: "Hilang",
  };

  return labels[value] ?? value.replace(/_/g, " ");
};

const getPointName = (patrol: PatrolReportItem): string => {
  return patrol.patrolPoint?.name ?? patrol.checkpoint?.name ?? "-";
};

const getAnswerValue = (answer: PatrolReportAnswer): string => {
  const label = answer.answerLabelSnapshot;
  const value = answer.answerValue;

  if (value === null || value === undefined || value === "") {
    return label ?? "-";
  }

  if (typeof value === "boolean") {
    return value ? "Ya" : "Tidak";
  }

  if (label && String(label) !== String(value)) {
    return `${value} (${label})`;
  }

  return String(value);
};

const getDuration = (
  startedAt?: string | null,
  completedAt?: string | null,
): string => {
  if (!startedAt || !completedAt) return "-";

  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();

  if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
    return "-";
  }

  const minutes = Math.floor((end - start) / 60000);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0) {
    return `${hours} jam ${remainingMinutes} menit`;
  }

  return `${remainingMinutes} menit`;
};

const addHyperlink = (
  cell: ExcelJS.Cell,
  fileUrl: string,
  fileName?: string | null,
): void => {
  if (!fileUrl || fileUrl === "-") {
    cell.value = "-";
    return;
  }

  cell.value = {
    text: fileName || "Buka Foto",
    hyperlink: fileUrl,
    tooltip: fileUrl,
  };

  cell.font = {
    name: "Arial",
    size: 10,
    color: { argb: "FF0563C1" },
    underline: true,
  };

  cell.alignment = {
    vertical: "middle",
    horizontal: "left",
    wrapText: true,
  };
};

// ============================================================
// WORKSHEET STYLING
// ============================================================

const styleWorksheet = (
  worksheet: ExcelJS.Worksheet,
  headerRowNumber: number,
): void => {
  worksheet.views = [
    {
      state: "frozen",
      ySplit: headerRowNumber,
    },
  ];

  const headerRow = worksheet.getRow(headerRowNumber);
  headerRow.height = 30;

  headerRow.eachCell((cell) => {
    cell.font = {
      name: "Arial",
      size: 10,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF00529C" },
    };

    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };

    cell.border = {
      top: { style: "thin", color: { argb: "FF003B73" } },
      bottom: { style: "thin", color: { argb: "FF003B73" } },
      left: { style: "thin", color: { argb: "FFFFFFFF" } },
      right: { style: "thin", color: { argb: "FFFFFFFF" } },
    };
  });

  for (
    let rowNumber = headerRowNumber + 1;
    rowNumber <= worksheet.rowCount;
    rowNumber++
  ) {
    const row = worksheet.getRow(rowNumber);

    row.eachCell((cell, columnNumber) => {
      cell.font = {
        name: "Arial",
        size: 10,
        color: { argb: "FF334155" },
      };

      cell.alignment = {
        vertical: "middle",
        horizontal: columnNumber === 1 ? "center" : "left",
        wrapText: true,
      };

      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };

      if (rowNumber % 2 === 0) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF1F5F9" },
        };
      }
    });
  }
};

const addReportTitle = (
  worksheet: ExcelJS.Worksheet,
  lastColumn: number,
  title: string,
  subtitle: string,
  total: number,
): void => {
  const lastCol = worksheet.getColumn(lastColumn).letter;

  worksheet.mergeCells(`A1:${lastCol}1`);

  const titleCell = worksheet.getCell("A1");
  titleCell.value = title;

  titleCell.font = {
    name: "Arial",
    size: 16,
    bold: true,
    color: { argb: "FFFFFFFF" },
  };

  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF003B73" },
  };

  titleCell.alignment = {
    horizontal: "center",
    vertical: "middle",
  };

  worksheet.getRow(1).height = 32;

  worksheet.mergeCells(`A2:${lastCol}2`);

  const subtitleCell = worksheet.getCell("A2");
  subtitleCell.value = subtitle;

  subtitleCell.font = {
    name: "Arial",
    size: 11,
    italic: true,
    color: { argb: "FF475569" },
  };

  subtitleCell.alignment = {
    horizontal: "center",
    vertical: "middle",
  };

  worksheet.getRow(2).height = 24;

  worksheet.mergeCells(`A3:${lastCol}3`);

  const exportDateCell = worksheet.getCell("A3");
  exportDateCell.value = `Diekspor pada: ${formatDate(
    new Date().toISOString(),
  )}`;

  exportDateCell.font = {
    name: "Arial",
    size: 9,
    color: { argb: "FF64748B" },
  };

  exportDateCell.alignment = {
    horizontal: "center",
    vertical: "middle",
  };

  worksheet.getRow(3).height = 20;

  worksheet.mergeCells(`A4:${lastCol}4`);

  const totalCell = worksheet.getCell("A4");
  totalCell.value = `Total Data: ${total} baris`;

  totalCell.font = {
    name: "Arial",
    size: 10,
    bold: true,
    color: { argb: "FF334155" },
  };

  totalCell.alignment = {
    horizontal: "left",
    vertical: "middle",
  };

  worksheet.getRow(4).height = 22;
};

const styleStatusCell = (cell: ExcelJS.Cell, value: string): void => {
  const normalized = value.toUpperCase();

  let background = "FFE2E8F0";
  let foreground = "FF334155";

  if (
    ["SUBMITTED", "COMPLETED", "RESOLVED", "VALID", "ACTIVE"].includes(
      normalized,
    )
  ) {
    background = "FFD1FAE5";
    foreground = "FF059669";
  } else if (
    ["INVALID", "CRITICAL", "HIGH", "OPEN", "CANCELLED"].includes(normalized)
  ) {
    background = "FFFFE4E6";
    foreground = "FFE11D48";
  } else if (
    ["IN_PROGRESS", "MEDIUM", "BYPASSED", "DAMAGED", "LOST"].includes(
      normalized,
    )
  ) {
    background = "FFFEF3C7";
    foreground = "FF92400E";
  }

  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: background },
  };

  cell.font = {
    name: "Arial",
    size: 10,
    bold: true,
    color: { argb: foreground },
  };
};

// ============================================================
// MAIN EXPORT FUNCTION
// ============================================================

export interface PatrolReportExcelRow {
  patrol: PatrolReportItem;
  user: PatrolReportUser;
}

export const exportPatrolReportExcel = async (
  filteredPatrols: PatrolReportExcelRow[],
): Promise<void> => {
  if (!filteredPatrols.length) {
    throw new Error("Tidak ada data patroli untuk diekspor.");
  }
  const patrolRows = filteredPatrols;
  // Data API dikelompokkan berdasarkan user.
  // Flatten menjadi satu array patroli.
  // const patrolRows = response.data.flatMap((user) =>
  //   (user.patrols ?? []).map((patrol) => ({
  //     user,
  //     patrol,
  //   })),
  // );

  if (patrolRows.length === 0) {
    throw new Error("Tidak ada data patroli untuk diekspor.");
  }

  const answerRows = patrolRows.flatMap(({ user, patrol }) =>
    (patrol.answers ?? []).map((answer) => ({
      user,
      patrol,
      answer,
    })),
  );

  const findingRows = patrolRows.flatMap(({ user, patrol }) =>
    (patrol.findings ?? []).map((finding) => ({
      user,
      patrol,
      finding,
    })),
  );

  const workbook = new ExcelJS.Workbook();

  workbook.creator = "PAMAREA";
  workbook.subject = "Laporan Patroli Satpam";
  workbook.title = "Laporan Patroli PAMAREA";
  workbook.created = new Date();
  workbook.modified = new Date();

  // ==========================================================
  // SHEET 1: DATA PATROLI
  // ==========================================================

  const patrolSheet = workbook.addWorksheet("Data Patroli");

  patrolSheet.columns = [
    { key: "no", width: 8 },
    { key: "employeeNumber", width: 18 },
    { key: "fullName", width: 28 },
    { key: "reportNumber", width: 25 },
    { key: "site", width: 25 },
    { key: "patrolPoint", width: 25 },
    { key: "startedAt", width: 25 },
    { key: "completedAt", width: 25 },
    { key: "duration", width: 20 },
    { key: "status", width: 22 },
    { key: "latitude", width: 16 },
    { key: "longitude", width: 16 },
    { key: "gpsAccuracy", width: 18 },
    { key: "distanceFromPoint", width: 20 },
    { key: "gpsValidation", width: 22 },
    { key: "nfcUid", width: 25 },
    { key: "nfcValidation", width: 22 },
    { key: "nfcBypass", width: 16 },
    { key: "nfcBypassReason", width: 20 },
    { key: "nfcBypassNote", width: 35 },
  ];

  addReportTitle(
    patrolSheet,
    patrolSheet.columns.length,
    "LAPORAN PATROLI PAMAREA",
    "Rekapitulasi aktivitas patroli petugas keamanan",
    patrolRows.length,
  );

  patrolSheet.addRow([
    "No.",
    "Nomor Pegawai",
    "Nama Petugas",
    "Nomor Laporan",
    "Lokasi",
    "Titik Pemeriksaan",
    "Waktu Mulai (WITA)",
    "Waktu Selesai (WITA)",
    "Durasi",
    "Status Patroli",
    "Latitude",
    "Longitude",
    "Akurasi GPS (m)",
    "Jarak dari Titik (m)",
    "Validasi GPS",
    "UID NFC",
    "Validasi NFC",
    "Bypass NFC",
    "Alasan Bypass",
    "Catatan Bypass",
  ]);

  patrolRows.forEach(({ user, patrol }, index) => {
    const row = patrolSheet.addRow([
      index + 1,
      safeText(user.employeeNumber),
      safeText(user.fullName),
      safeText(patrol.reportNumber),
      safeText(patrol.site?.name),
      getPointName(patrol),
      formatDate(patrol.startedAt),
      formatDate(patrol.completedAt),
      getDuration(patrol.startedAt, patrol.completedAt),
      formatEnum(patrol.status),
      safeText(patrol.latitude),
      safeText(patrol.longitude),
      safeText(patrol.gpsAccuracy),
      safeText(patrol.distanceFromPoint),
      formatEnum(patrol.gpsValidationStatus),
      safeText(patrol.nfcUidSnapshot),
      formatEnum(patrol.nfcValidationStatus),
      patrol.nfcBypass ? "Ya" : "Tidak",
      formatEnum(patrol.nfcBypassReason),
      safeText(patrol.nfcBypassNote),
    ]);

    row.height = 36;

    styleStatusCell(row.getCell(10), patrol.status ?? "");

    styleStatusCell(row.getCell(15), patrol.gpsValidationStatus ?? "");

    styleStatusCell(row.getCell(17), patrol.nfcValidationStatus ?? "");
  });

  styleWorksheet(patrolSheet, 5);

  patrolSheet.autoFilter = {
    from: "A5",
    to: `T${patrolSheet.rowCount}`,
  };

  // ==========================================================
  // SHEET 2: JAWABAN CHECKLIST
  // ==========================================================

  const answerSheet = workbook.addWorksheet("Jawaban Checklist");

  answerSheet.columns = [
    { key: "no", width: 8 },
    { key: "employeeNumber", width: 18 },
    { key: "fullName", width: 28 },
    { key: "reportNumber", width: 25 },
    { key: "startedAt", width: 25 },
    { key: "patrolPoint", width: 25 },
    { key: "question", width: 45 },
    { key: "answer", width: 30 },
    { key: "photoCount", width: 16 },
    { key: "photoUrls", width: 55 },
  ];

  addReportTitle(
    answerSheet,
    answerSheet.columns.length,
    "LAPORAN JAWABAN CHECKLIST PATROLI",
    "Detail pertanyaan, jawaban, dan dokumentasi checklist",
    answerRows.length,
  );

  answerSheet.addRow([
    "No.",
    "Nomor Pegawai",
    "Nama Petugas",
    "Nomor Laporan",
    "Waktu Patroli (WITA)",
    "Titik Pemeriksaan",
    "Pertanyaan",
    "Jawaban",
    "Jumlah Foto",
    "URL Foto",
  ]);

  answerRows.forEach(({ user, patrol, answer }, index) => {
    const row = answerSheet.addRow([
      index + 1,
      safeText(user.employeeNumber),
      safeText(user.fullName),
      safeText(patrol.reportNumber),
      formatDate(patrol.startedAt),
      getPointName(patrol),
      safeText(answer.questionTextSnapshot),
      getAnswerValue(answer),
      answer.photos?.length ?? 0,
      (answer.photos ?? [])
        .map((photo) => getPhotoUrl(photo.fileUrl))
        .filter((url) => url !== "-")
        .join("\n") || "-",
    ]);

    row.height = 45;

    const photos = answer.photos ?? [];
    const photoCell = row.getCell(10);

    if (photos.length === 0) {
      photoCell.value = "-";
    } else {
      const validPhotos = photos
        .map((photo) => ({
          url: getPhotoUrl(photo.fileUrl),
          fileName: photo.fileName,
        }))
        .filter((photo) => photo.url && photo.url !== "-");

      if (validPhotos.length === 1) {
        addHyperlink(photoCell, validPhotos[0].url, validPhotos[0].fileName);
      } else if (validPhotos.length > 1) {
        photoCell.value = validPhotos.map((photo) => ({
          text: photo.fileName || "Buka Foto",
          hyperlink: photo.url,
          tooltip: photo.url,
        }));

        photoCell.font = {
          name: "Arial",
          size: 10,
          color: { argb: "FF0563C1" },
          underline: true,
        };
      } else {
        photoCell.value = "-";
      }
    }
  });

  styleWorksheet(answerSheet, 5);

  answerSheet.autoFilter = {
    from: "A5",
    to: `J${answerSheet.rowCount}`,
  };

  // ==========================================================
  // SHEET 3: TEMUAN PATROLI
  // ==========================================================

  const findingSheet = workbook.addWorksheet("Temuan Patroli");

  findingSheet.columns = [
    { key: "no", width: 8 },
    { key: "employeeNumber", width: 18 },
    { key: "fullName", width: 28 },
    { key: "reportNumber", width: 25 },
    { key: "patrolPoint", width: 25 },
    { key: "title", width: 32 },
    { key: "description", width: 50 },
    { key: "severity", width: 18 },
    { key: "status", width: 20 },
    { key: "createdAt", width: 25 },
    { key: "updatedAt", width: 25 },
    { key: "reportedBy", width: 28 },
    { key: "assignedTo", width: 28 },
    { key: "resolvedBy", width: 28 },
    { key: "photoCount", width: 16 },
    { key: "photoUrls", width: 55 },
  ];

  addReportTitle(
    findingSheet,
    findingSheet.columns.length,
    "LAPORAN TEMUAN PATROLI PAMAREA",
    "Rekapitulasi temuan, tingkat risiko, tindak lanjut, dan dokumentasi",
    findingRows.length,
  );

  findingSheet.addRow([
    "No.",
    "Nomor Pegawai",
    "Nama Petugas",
    "Nomor Laporan",
    "Titik Pemeriksaan",
    "Judul Temuan",
    "Deskripsi",
    "Tingkat Keparahan",
    "Status Temuan",
    "Waktu Dibuat (WITA)",
    "Waktu Diperbarui (WITA)",
    "Dilaporkan Oleh",
    "Ditugaskan Kepada",
    "Diselesaikan Oleh",
    "Jumlah Foto",
    "URL Foto",
  ]);

  findingRows.forEach(({ user, patrol, finding }, index) => {
    const photos = finding.photos ?? [];

    const row = findingSheet.addRow([
      index + 1,
      safeText(user.employeeNumber),
      safeText(user.fullName),
      safeText(patrol.reportNumber),
      finding.patrolPoint?.name ?? getPointName(patrol),
      safeText(finding.title),
      safeText(finding.description),
      formatEnum(finding.severity),
      formatEnum(finding.status),
      formatDate(finding.createdAt),
      formatDate(finding.updatedAt),
      finding.reportedBy?.fullName ?? "-",
      finding.assignedTo?.fullName ?? "-",
      finding.resolvedBy?.fullName ?? "-",
      photos.length,
      photos
        .map((photo) => getPhotoUrl(photo.fileUrl))
        .filter((url) => url !== "-")
        .join("\n") || "-",
    ]);

    row.height = 45;

    styleStatusCell(row.getCell(8), finding.severity ?? "");

    styleStatusCell(row.getCell(9), finding.status ?? "");

    const photoCell = row.getCell(16);

    const validPhotos = photos
      .map((photo) => ({
        url: getPhotoUrl(photo.fileUrl),
        fileName: photo.fileName,
      }))
      .filter((photo) => photo.url && photo.url !== "-");

    if (validPhotos.length === 1) {
      addHyperlink(photoCell, validPhotos[0].url, validPhotos[0].fileName);
    } else if (validPhotos.length > 1) {
      photoCell.value = validPhotos.map((photo) => ({
        text: photo.fileName || "Buka Foto",
        hyperlink: photo.url,
        tooltip: photo.url,
      }));

      photoCell.font = {
        name: "Arial",
        size: 10,
        color: { argb: "FF0563C1" },
        underline: true,
      };
    } else {
      photoCell.value = "-";
    }
  });

  styleWorksheet(findingSheet, 5);

  findingSheet.autoFilter = {
    from: "A5",
    to: `P${findingSheet.rowCount}`,
  };

  // ==========================================================
  // DOWNLOAD EXCEL
  // ==========================================================

  const buffer = await workbook.xlsx.writeBuffer();
  const excelData = new Uint8Array(buffer);

  const blob = new Blob([excelData], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  if (blob.size === 0) {
    throw new Error("File Excel kosong.");
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `Laporan_Patroli_PAMAREA_${new Date()
    .toISOString()
    .slice(0, 10)}.xlsx`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};
