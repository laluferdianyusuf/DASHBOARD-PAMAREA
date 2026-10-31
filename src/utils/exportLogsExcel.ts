import ExcelJS from "exceljs";
import { formatDateTimeWITA } from "../helpers/dateTime";
import { formatAction, formatModule, getActionStatus } from "./logFormatters";

export interface LogsExcelItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
  user?: {
    id: string;
    fullName: string | null;
    employeeNumber?: string | null;
    role?: {
      id: string;
      name: string;
    } | null;
  } | null;
}

export const exportLogsExcel = async (logs: LogsExcelItem[]): Promise<void> => {
  if (logs.length === 0) {
    throw new Error("Tidak ada data log untuk diekspor.");
  }

  const workbook = new ExcelJS.Workbook();

  workbook.creator = "PAMAREA";
  workbook.subject = "Laporan Audit Aktivitas";
  workbook.title = "Laporan Data Logs PAMAREA";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Data Logs", {
    views: [{ state: "frozen", ySplit: 5 }],
  });

  // Lebar kolom
  worksheet.columns = [
    { key: "no", width: 8 },
    { key: "createdAt", width: 25 },
    { key: "user", width: 30 },
    { key: "activity", width: 38 },
    { key: "module", width: 24 },
    { key: "status", width: 18 },
  ];

  // Judul laporan
  worksheet.mergeCells("A1:F1");

  const titleCell = worksheet.getCell("A1");
  titleCell.value = "LAPORAN AUDIT AKTIVITAS PAMAREA";
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

  // Subjudul
  worksheet.mergeCells("A2:F2");

  const subtitleCell = worksheet.getCell("A2");
  subtitleCell.value = "Riwayat Aktivitas Pengguna dan Sistem";
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

  // Waktu ekspor
  worksheet.mergeCells("A3:F3");

  const exportDateCell = worksheet.getCell("A3");
  exportDateCell.value = `Diekspor pada: ${formatDateTimeWITA(
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

  // Jumlah data
  worksheet.mergeCells("A4:F4");

  const totalCell = worksheet.getCell("A4");
  totalCell.value = `Total Aktivitas: ${logs.length} data`;
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

  // Header tabel
  const headerRow = worksheet.addRow([
    "No.",
    "Waktu (WITA)",
    "User",
    "Aktivitas",
    "Modul",
    "Status",
  ]);

  headerRow.height = 28;

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

  // Data aktivitas
  for (const [index, log] of logs.entries()) {
    const status = getActionStatus(log.action);

    const row = worksheet.addRow([
      index + 1,
      formatDateTimeWITA(log.createdAt),
      log.user?.fullName ?? "Pengguna tidak tersedia",
      `${formatAction(log.action)}\n${
        log.entityId ? `ID: ${log.entityId}` : "ID entitas tidak tersedia"
      }`,
      formatModule(log.entityType),
      status === "Failed" ? "Gagal" : "Tercatat",
    ]);

    row.height = 42;

    row.eachCell((cell, columnNumber) => {
      cell.font = {
        name: "Arial",
        size: 10,
        color: { argb: "FF334155" },
      };

      cell.alignment = {
        vertical: "middle",
        horizontal:
          columnNumber === 1 || columnNumber === 6 ? "center" : "left",
        wrapText: true,
      };

      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };

      // Warna baris selang-seling
      if (index % 2 === 1) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF1F5F9" },
        };
      }
    });

    // Warna khusus status
    const statusCell = row.getCell(6);

    if (status === "Failed") {
      statusCell.font = {
        name: "Arial",
        size: 10,
        bold: true,
        color: { argb: "FFE11D48" },
      };

      statusCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFE4E6" },
      };
    } else {
      statusCell.font = {
        name: "Arial",
        size: 10,
        bold: true,
        color: { argb: "FF059669" },
      };

      statusCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD1FAE5" },
      };
    }
  }

  // Filter otomatis pada header tabel
  worksheet.autoFilter = {
    from: "A5",
    to: `F${worksheet.rowCount}`,
  };

  // Unduh Excel
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
  link.download = `Laporan_Logs_PAMAREA_${new Date()
    .toISOString()
    .slice(0, 10)}.xlsx`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};
