import ExcelJS from "exceljs";
import { formatDateTimeWITA } from "../helpers/dateTime";
import type { SecurityLeaderboardItem } from "./security-logic";

const downloadExcelWorkbook = async (
  workbook: ExcelJS.Workbook,
  fileName: string,
) => {
  const buffer = await workbook.xlsx.writeBuffer();

  const blob = new Blob([new Uint8Array(buffer)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  if (!blob.size) {
    throw new Error("File Excel kosong dan tidak dapat diunduh.");
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
};

export const exportSecurityLeaderboardExcel = async (
  officers: SecurityLeaderboardItem[],
): Promise<void> => {
  if (officers.length === 0) {
    throw new Error("Tidak ada data monitoring untuk diekspor.");
  }

  const workbook = new ExcelJS.Workbook();

  workbook.creator = "PAMAREA Patrol Admin";
  workbook.subject = "Laporan Monitoring Kinerja Security";
  workbook.title = "Monitoring Kinerja Security";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Monitoring Security", {
    views: [{ state: "frozen", ySplit: 5 }],
    pageSetup: {
      paperSize: 9,
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
  });

  worksheet.columns = [
    { key: "rank", width: 9 },
    { key: "name", width: 28 },
    { key: "npp", width: 18 },
    { key: "role", width: 16 },
    { key: "squad", width: 22 },
    { key: "site", width: 25 },
    { key: "compliance", width: 17 },
    { key: "onTime", width: 17 },
    { key: "score", width: 13 },
    { key: "checkpoints", width: 18 },
    { key: "findings", width: 17 },
    { key: "resolved", width: 20 },
    { key: "status", width: 22 },
    { key: "badge", width: 20 },
  ];

  // Judul laporan
  worksheet.mergeCells("A1:N1");

  const titleCell = worksheet.getCell("A1");
  titleCell.value = "LAPORAN MONITORING KINERJA SECURITY";
  titleCell.font = {
    name: "Arial",
    size: 16,
    bold: true,
    color: { argb: "FFFFFFFF" },
  };
  titleCell.alignment = {
    horizontal: "center",
    vertical: "middle",
  };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF003B73" },
  };

  worksheet.getRow(1).height = 32;

  // Subtitle
  worksheet.mergeCells("A2:N2");

  const subtitleCell = worksheet.getCell("A2");
  subtitleCell.value = "PAMAREA Patrol Admin | Rekapitulasi Kinerja Security";
  subtitleCell.font = {
    name: "Arial",
    size: 10,
    italic: true,
    color: { argb: "FF64748B" },
  };
  subtitleCell.alignment = {
    horizontal: "center",
    vertical: "middle",
  };

  worksheet.getRow(2).height = 23;

  // Tanggal export
  worksheet.mergeCells("A3:N3");

  const exportDateCell = worksheet.getCell("A3");
  exportDateCell.value = `Tanggal Export: ${formatDateTimeWITA(
    new Date().toISOString(),
  )} WITA`;
  exportDateCell.font = {
    name: "Arial",
    size: 10,
    color: { argb: "FF334155" },
  };
  exportDateCell.alignment = {
    vertical: "middle",
  };

  worksheet.getRow(3).height = 22;

  // Total data
  worksheet.mergeCells("A4:N4");

  const countCell = worksheet.getCell("A4");
  countCell.value = `Total Security: ${officers.length} orang`;
  countCell.font = {
    name: "Arial",
    size: 10,
    bold: true,
    color: { argb: "FF003B73" },
  };
  countCell.alignment = {
    vertical: "middle",
  };

  worksheet.getRow(4).height = 22;

  // Header tabel
  const headerRow = worksheet.getRow(5);

  headerRow.values = [
    "Rank",
    "Nama Security",
    "NPP",
    "Role",
    "Regu",
    "Site",
    "Kepatuhan Patroli",
    "Ketepatan Waktu",
    "Skor KPI",
    "Checkpoint Di-scan",
    "Laporan Temuan",
    "Insiden Diselesaikan",
    "Status",
    "Predikat",
  ];

  headerRow.height = 32;

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
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };

    cell.border = {
      top: { style: "thin", color: { argb: "FFCBD5E1" } },
      bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
      left: { style: "thin", color: { argb: "FFCBD5E1" } },
      right: { style: "thin", color: { argb: "FFCBD5E1" } },
    };
  });

  // Isi data
  officers.forEach((officer, index) => {
    const row = worksheet.addRow({
      rank: officer.rank,
      name: officer.name || "-",
      npp: officer.npp || "-",
      role: officer.role || "-",
      squad: officer.squad || "-",
      site: officer.siteName || "-",
      compliance: `${officer.complianceRate}%`,
      onTime: `${officer.onTimeRate}%`,
      score: officer.score,
      checkpoints: officer.totalCheckpointsScanned,
      findings: officer.findingsReported,
      resolved: officer.incidentsResolved,
      status: officer.status || "-",
      badge: officer.badgeTitle || "-",
    });

    row.height = 25;

    row.eachCell((cell, columnNumber) => {
      cell.font = {
        name: "Arial",
        size: 10,
        color: { argb: "FF334155" },
      };

      cell.alignment = {
        vertical: "middle",
        horizontal: [1, 7, 8, 9, 10, 11, 12].includes(columnNumber)
          ? "center"
          : "left",
        wrapText: true,
      };

      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };

      if (index % 2 === 1) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF1F5F9" },
        };
      }
    });

    // Penekanan pada skor KPI
    const scoreCell = row.getCell(9);
    scoreCell.font = {
      name: "Arial",
      size: 10,
      bold: true,
      color:
        officer.score >= 85
          ? { argb: "FF047857" }
          : officer.score >= 70
            ? { argb: "FFB45309" }
            : { argb: "FFB91C1C" },
    };
  });

  worksheet.autoFilter = {
    from: "A5",
    to: "N5",
  };

  worksheet.pageSetup.printTitlesRow = "1:5";
  worksheet.pageSetup.margins = {
    left: 0.25,
    right: 0.25,
    top: 0.5,
    bottom: 0.5,
    header: 0.2,
    footer: 0.2,
  };

  worksheet.headerFooter.oddFooter =
    "&LPAMAREA Patrol Admin&RLaporan Monitoring Kinerja Security";

  const timestamp = new Date()
    .toLocaleDateString("sv-SE", {
      timeZone: "Asia/Makassar",
    })
    .replaceAll("-", "");

  await downloadExcelWorkbook(
    workbook,
    `Monitoring_Kinerja_Security_${timestamp}.xlsx`,
  );
};
