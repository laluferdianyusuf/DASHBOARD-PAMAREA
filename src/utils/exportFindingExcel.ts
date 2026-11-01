import ExcelJS from "exceljs";

import { formatDateTimeWITA } from "../helpers/dateTime";
import { getPhotoUrlForExport } from "./getPhoto";

export interface FindingExcelItem {
  id: string;
  title: string;
  description?: string | null;
  createdAt: string;
  reportedBy?: {
    fullName?: string | null;
    employeeNumber?: string | null;
    username?: string | null;
  } | null;
  patrolPoint?: {
    name?: string | null;
  } | null;
  photos?: Array<{
    id?: string;
    fileUrl: string;
  }> | null;
}

interface ExcelPhoto {
  base64: string;
  extension: "jpeg" | "png";
}

const COLORS = {
  primary: "FF003B73",
  header: "FF00529C",
  white: "FFFFFFFF",
  text: "FF334155",
  muted: "FF64748B",
  border: "FFE2E8F0",
  alternate: "FFF8FAFC",
};

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
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

const fetchPhotoForExcel = async (
  fileUrl: string,
): Promise<ExcelPhoto | null> => {
  try {
    const imageUrl = getPhotoUrlForExport(fileUrl);
    const response = await fetch(imageUrl);

    if (!response.ok) {
      console.error("[Excel] Foto gagal diambil:", response.status);
      return null;
    }

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

    // Konversi format selain PNG/JPEG menjadi PNG.
    const bitmap = await createImageBitmap(blob);

    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;

    const context = canvas.getContext("2d");

    if (!context) {
      bitmap.close();
      return null;
    }

    context.drawImage(bitmap, 0, 0);
    bitmap.close();

    const base64 = canvas.toDataURL("image/png").split(",")[1];

    if (!base64) return null;

    return {
      base64,
      extension: "png",
    };
  } catch (error) {
    console.error("[Excel] Gagal mengambil foto:", error);
    return null;
  }
};

const downloadExcelWorkbook = async (
  workbook: ExcelJS.Workbook,
  fileName: string,
) => {
  const buffer = await workbook.xlsx.writeBuffer();

  const blob = new Blob([new Uint8Array(buffer)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  if (!blob.size) {
    throw new Error("File Excel kosong.");
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

const applyCellBorder = (cell: ExcelJS.Cell) => {
  cell.border = {
    top: { style: "thin", color: { argb: COLORS.border } },
    bottom: { style: "thin", color: { argb: COLORS.border } },
    left: { style: "thin", color: { argb: COLORS.border } },
    right: { style: "thin", color: { argb: COLORS.border } },
  };
};

const applyHeaderStyle = (row: ExcelJS.Row) => {
  row.height = 30;

  row.eachCell((cell) => {
    cell.font = {
      name: "Arial",
      size: 10,
      bold: true,
      color: { argb: COLORS.white },
    };

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: COLORS.header },
    };

    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };

    applyCellBorder(cell);
  });
};

const applyDataStyle = (row: ExcelJS.Row, alternate: boolean) => {
  row.eachCell((cell, columnNumber) => {
    cell.font = {
      name: "Arial",
      size: 10,
      color: { argb: COLORS.text },
    };

    cell.alignment = {
      vertical: "middle",
      horizontal: columnNumber === 1 ? "center" : "left",
      wrapText: true,
    };

    if (alternate) {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: COLORS.alternate },
      };
    }

    applyCellBorder(cell);
  });
};

/**
 * Export laporan temuan hazard ke Excel.
 * Foto tertanam langsung di dalam worksheet.
 */
export const exportFindingExcel = async (
  findings: FindingExcelItem[],
): Promise<void> => {
  if (!findings.length) {
    throw new Error("Tidak ada data temuan untuk diekspor.");
  }

  const workbook = new ExcelJS.Workbook();

  workbook.creator = "PAMAREA Patrol Admin";
  workbook.subject = "Laporan Temuan Hazard";
  workbook.title = "Laporan Temuan Hazard";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Laporan Temuan", {
    views: [{ state: "frozen", ySplit: 5 }],
    pageSetup: {
      paperSize: 9,
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
  });

  // Lebar kolom.
  worksheet.columns = [
    { key: "no", width: 8 },
    { key: "finding", width: 42 },
    { key: "reporter", width: 27 },
    { key: "area", width: 28 },
    { key: "reportedAt", width: 23 },
    { key: "photos", width: 24 },
  ];

  // JUDUL LAPORAN.
  worksheet.mergeCells("A1:F1");

  const titleCell = worksheet.getCell("A1");
  titleCell.value = "LAPORAN TEMUAN HAZARD";
  titleCell.font = {
    name: "Arial",
    size: 16,
    bold: true,
    color: { argb: COLORS.white },
  };
  titleCell.alignment = {
    horizontal: "center",
    vertical: "middle",
  };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: COLORS.primary },
  };

  worksheet.getRow(1).height = 32;

  // SUBJUDUL.
  worksheet.mergeCells("A2:F2");

  const subtitleCell = worksheet.getCell("A2");
  subtitleCell.value = "PAMAREA Patrol Admin | Rekap Laporan Temuan";
  subtitleCell.font = {
    name: "Arial",
    size: 10,
    italic: true,
    color: { argb: COLORS.muted },
  };
  subtitleCell.alignment = {
    horizontal: "center",
    vertical: "middle",
  };

  worksheet.getRow(2).height = 22;

  // INFORMASI EXPORT.
  worksheet.mergeCells("A3:F3");

  const exportDateCell = worksheet.getCell("A3");
  exportDateCell.value = `Tanggal Export: ${formatDateTimeWITA(
    new Date().toISOString(),
  )} WITA`;
  exportDateCell.font = {
    name: "Arial",
    size: 10,
    color: { argb: COLORS.text },
  };

  worksheet.getRow(3).height = 22;

  worksheet.mergeCells("A4:F4");

  const countCell = worksheet.getCell("A4");
  countCell.value = `Total Laporan: ${findings.length} temuan`;
  countCell.font = {
    name: "Arial",
    size: 10,
    bold: true,
    color: { argb: COLORS.primary },
  };

  worksheet.getRow(4).height = 22;

  // HEADER TABEL.
  const headerRow = worksheet.getRow(5);

  headerRow.values = [
    "No.",
    "Temuan Hazard",
    "Pelapor",
    "Area Patrol",
    "Waktu Laporan",
    "Foto Temuan",
  ];

  applyHeaderStyle(headerRow);

  // DATA TEMUAN.
  for (const [index, item] of findings.entries()) {
    const photos = item.photos ?? [];

    const reporterName = item.reportedBy?.fullName || "-";

    const employeeNumber =
      item.reportedBy?.employeeNumber || item.reportedBy?.username || "-";

    const row = worksheet.addRow({
      no: index + 1,
      finding: `${item.title || "-"}\n${item.description || "-"}`,
      reporter: `${reporterName}\nID: ${employeeNumber}`,
      area: item.patrolPoint?.name || "-",
      reportedAt: formatDateTimeWITA(item.createdAt),
      photos: "",
    });

    // Tinggi baris menyesuaikan jumlah foto.
    row.height = photos.length > 0 ? Math.max(65, photos.length * 65) : 35;

    applyDataStyle(row, index % 2 === 1);

    // FOTO TEMUAN.
    for (const [photoIndex, photo] of photos.entries()) {
      const image = await fetchPhotoForExcel(photo.fileUrl);

      if (!image) {
        console.warn(
          `[Excel] Foto temuan nomor ${index + 1} tidak berhasil dimasukkan.`,
        );
        continue;
      }

      const imageId = workbook.addImage({
        base64: image.base64,
        extension: image.extension,
      });

      worksheet.addImage(imageId, {
        tl: {
          col: 5,
          row: row.number - 1,
          nativeRowOff: photoIndex * 75 * 9525,
        },
        ext: {
          width: 105,
          height: 75,
        },
        editAs: "oneCell",
      });
    }
  }

  // FILTER TABEL.
  worksheet.autoFilter = {
    from: "A5",
    to: "F5",
  };

  // PENGATURAN CETAK.
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
    "&LPAMAREA Patrol Admin&RLaporan Temuan Hazard";

  // DOWNLOAD.
  const timestamp = new Date()
    .toLocaleDateString("sv-SE", {
      timeZone: "Asia/Makassar",
    })
    .replaceAll("-", "");

  await downloadExcelWorkbook(
    workbook,
    `Laporan_Temuan_Hazard_${timestamp}.xlsx`,
  );
};
