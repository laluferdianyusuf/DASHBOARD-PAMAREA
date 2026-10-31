import ExcelJS from "exceljs";
import { formatDateTimeWITA } from "../helpers/dateTime";
import { getPhotoUrl } from "./getPhoto";

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
/**
 * Export laporan temuan hazard ke Excel.
 */
export const exportFindingExcel = async (
  findings: FindingExcelItem[],
): Promise<void> => {
  if (findings.length === 0) {
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

  // Lebar masing-masing kolom.
  worksheet.columns = [
    { key: "no", width: 8 },
    { key: "finding", width: 45 },
    { key: "reporter", width: 28 },
    { key: "area", width: 32 },
    { key: "reportedAt", width: 25 },
    { key: "photos", width: 38 },
  ];

  // HEADER LAPORAN.
  worksheet.mergeCells("A1:F1");

  const titleCell = worksheet.getCell("A1");
  titleCell.value = "LAPORAN TEMUAN HAZARD";
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

  // INFORMASI LAPORAN.
  worksheet.mergeCells("A2:F2");

  const subtitleCell = worksheet.getCell("A2");
  subtitleCell.value = "PAMAREA Patrol Admin | Rekap Laporan Temuan";
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

  worksheet.mergeCells("A3:F3");

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
    horizontal: "left",
    vertical: "middle",
  };

  worksheet.getRow(3).height = 22;

  worksheet.mergeCells("A4:F4");

  const countCell = worksheet.getCell("A4");
  countCell.value = `Total Laporan: ${findings.length} temuan`;
  countCell.font = {
    name: "Arial",
    size: 10,
    bold: true,
    color: { argb: "FF003B73" },
  };
  countCell.alignment = {
    horizontal: "left",
    vertical: "middle",
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

  // ISI DATA + FOTO TEMUAN

  for (const [index, item] of findings.entries()) {
    const reporterName = item.reportedBy?.fullName || "-";

    const employeeNumber =
      item.reportedBy?.employeeNumber || item.reportedBy?.username || "-";

    const photos = item.photos ?? [];

    // Siapkan URL foto yang dapat diakses melalui browser.
    const photoUrls = photos.map((photo) => {
      return getPhotoUrl(photo.fileUrl);
    });

    const row = worksheet.addRow({
      no: index + 1,
      finding: `${item.title || "-"}\n${item.description || "-"}`,
      reporter: `${reporterName}\nID: ${employeeNumber}`,
      area: item.patrolPoint?.name || "-",
      reportedAt: formatDateTimeWITA(item.createdAt),
      photos: photoUrls.length > 0 ? photoUrls.join("\n") : "Tidak ada foto",
    });

    // Tinggi baris mengikuti jumlah URL foto.
    row.height = Math.max(35, photoUrls.length * 30);

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

      if (index % 2 === 1) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF1F5F9" },
        };
      }
    });

    // Jadikan setiap URL foto sebagai hyperlink yang bisa diklik.
    const photoCell = row.getCell(6);

    if (photos.length > 0) {
      const imageUrl = getPhotoUrl(photos[0].fileUrl);

      photoCell.value = {
        text: "Lihat Foto 1",
        hyperlink: imageUrl,
        tooltip: "Klik untuk membuka foto temuan",
      };

      photoCell.font = {
        name: "Arial",
        size: 10,
        color: { argb: "FF0563C1" },
        underline: true,
      };
    }
  }

  // Filter tabel Excel.
  worksheet.autoFilter = {
    from: "A5",
    to: "F5",
  };

  // Pengaturan cetak.
  worksheet.pageSetup.printTitlesRow = "1:5";
  worksheet.pageSetup.margins = {
    left: 0.25,
    right: 0.25,
    top: 0.5,
    bottom: 0.5,
    header: 0.2,
    footer: 0.2,
  };

  // Footer halaman.
  worksheet.headerFooter.oddFooter =
    "&LPAMAREA Patrol Admin&RLaporan Temuan Hazard";

  // Generate file Excel menggunakan ExcelJS.
  const buffer = await workbook.xlsx.writeBuffer();

  // Pastikan data biner dibungkus sebagai Uint8Array.
  const excelData = new Uint8Array(buffer);

  const blob = new Blob([excelData], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  // Validasi file sebelum diunduh.
  if (blob.size === 0) {
    throw new Error("File Excel kosong dan tidak dapat diunduh.");
  }

  // Buat URL untuk file Excel.
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  const timestamp = new Date()
    .toLocaleDateString("sv-SE", {
      timeZone: "Asia/Makassar",
    })
    .replaceAll("-", "");

  link.href = url;
  link.download = `Laporan_Temuan_Hazard_${timestamp}.xlsx`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  // Jangan hapus URL terlalu cepat sebelum browser memproses download.
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
};
