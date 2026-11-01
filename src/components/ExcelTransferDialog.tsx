import {
  AlertCircle,
  CheckCircle2,
  CloudUpload,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import React, { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { getErrorMessage } from "../helpers/getErrorMessage";

import {
  useDownloadRosterTemplate,
  useImportRoster,
  usePreviewRosterImport,
} from "../hooks/roster/useRosterImport";

interface ExcelTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: string;
}

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const ExcelTransferDialog: React.FC<ExcelTransferDialogProps> = ({
  open,
  onOpenChange,
  siteId,
}) => {
  const now = new Date();

  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [file, setFile] = useState<File | null>(null);
  const [previewCompleted, setPreviewCompleted] = useState(false);

  const downloadMutation = useDownloadRosterTemplate();
  const previewMutation = usePreviewRosterImport();
  const importMutation = useImportRoster();

  const previewResult = previewMutation.data;
  const importResult = importMutation.data;

  const previewErrors = previewResult?.errors ?? [];
  const previewWarnings = previewResult?.warnings ?? [];

  const summary = previewResult?.summary;

  const totalAssignments = summary?.totalAssignment ?? 0;
  const totalUsers = summary?.totalSecurity ?? 0;
  const totalWorkDays = summary?.totalShift ?? 0;
  const totalOffDays = summary?.totalOff ?? 0;

  const hasPreviewErrors =
    previewResult?.valid === false || previewErrors.length > 0;

  const canImport =
    !!file &&
    previewCompleted &&
    !!previewResult &&
    !hasPreviewErrors &&
    !previewMutation.isPending &&
    !importMutation.isPending &&
    !importMutation.isSuccess;

  const isBusy =
    downloadMutation.isPending ||
    previewMutation.isPending ||
    importMutation.isPending;

  const handleClose = (value: boolean) => {
    if (!value) {
      setFile(null);
      setMonth(String(now.getMonth() + 1));
      setYear(String(now.getFullYear()));
      setPreviewCompleted(false);

      previewMutation.reset();
      importMutation.reset();
      downloadMutation.reset();
    }

    onOpenChange(value);
  };

  const handleFileChange = (selectedFile?: File) => {
    if (!selectedFile) {
      setFile(null);
      setPreviewCompleted(false);
      previewMutation.reset();
      importMutation.reset();
      return;
    }

    const validExtension = /\.(xlsx|xls)$/i.test(selectedFile.name);

    if (!validExtension) {
      setFile(null);
      setPreviewCompleted(false);
      previewMutation.reset();
      importMutation.reset();
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setFile(null);
      setPreviewCompleted(false);
      previewMutation.reset();
      importMutation.reset();
      return;
    }

    setFile(selectedFile);
    setPreviewCompleted(false);

    previewMutation.reset();
    importMutation.reset();
  };

  const handleDownloadTemplate = () => {
    if (!siteId || !month || !year) return;

    downloadMutation.mutate({
      siteId,
      month: Number(month),
      year: Number(year),
    });
  };

  const handlePreview = async () => {
    if (!file) return;

    setPreviewCompleted(false);
    importMutation.reset();

    try {
      await previewMutation.mutateAsync(file);
      setPreviewCompleted(true);
    } catch {
      setPreviewCompleted(false);
    }
  };

  const handleImport = async () => {
    if (!file || !canImport) return;

    try {
      await importMutation.mutateAsync(file);
    } catch {
      return;
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreviewCompleted(false);
    previewMutation.reset();
    importMutation.reset();
  };

  const formatError = (error: unknown) => getErrorMessage(error);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="z-50 max-h-[90vh] overflow-y-auto rounded-lg sm:max-w-lg">
        <DialogHeader>
          <div className="flex size-11 items-center justify-center rounded-lg bg-emerald-50">
            <FileSpreadsheet className="size-5 text-emerald-600" />
          </div>

          <DialogTitle>Import Jadwal Patroli</DialogTitle>

          <DialogDescription>
            Download template roster, isi jadwal petugas, kemudian unggah
            kembali untuk melakukan validasi dan import ke sistem.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                <Download className="size-4 text-emerald-600" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Download Template Excel</p>

                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Pilih bulan dan tahun roster yang ingin dibuat.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Bulan</Label>

                <Select
                  value={month}
                  onValueChange={(value) => setMonth(value ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih bulan">
                      {month
                        ? ([
                            "Januari",
                            "Februari",
                            "Maret",
                            "April",
                            "Mei",
                            "Juni",
                            "Juli",
                            "Agustus",
                            "September",
                            "Oktober",
                            "November",
                            "Desember",
                          ][Number(month) - 1] ?? "Pilih bulan")
                        : "Pilih bulan"}
                    </SelectValue>
                  </SelectTrigger>

                  <SelectContent className="z-[999] max-h-60">
                    {[
                      "Januari",
                      "Februari",
                      "Maret",
                      "April",
                      "Mei",
                      "Juni",
                      "Juli",
                      "Agustus",
                      "September",
                      "Oktober",
                      "November",
                      "Desember",
                    ].map((name, index) => (
                      <SelectItem key={index} value={String(index + 1)}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tahun</Label>

                <Input
                  type="number"
                  min={2020}
                  max={2100}
                  value={year}
                  onChange={(event) => setYear(event.target.value)}
                  placeholder="Tahun"
                />
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              disabled={
                !siteId ||
                !month ||
                !year ||
                Number(year) < 2020 ||
                Number(year) > 2100 ||
                downloadMutation.isPending ||
                isBusy
              }
              onClick={handleDownloadTemplate}
            >
              {downloadMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}

              {downloadMutation.isPending
                ? "Mengunduh Template..."
                : "Download Template"}
            </Button>

            {downloadMutation.isError && (
              <p className="flex items-center gap-2 text-xs text-red-600">
                <AlertCircle className="size-4 shrink-0" />
                {formatError(downloadMutation.error)}
              </p>
            )}
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                <Upload className="size-4 text-blue-600" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Upload Roster Excel</p>

                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Unggah template yang sudah diisi untuk diperiksa sebelum
                  disimpan ke sistem.
                </p>
              </div>
            </div>

            <label
              htmlFor="excel-import-file"
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center transition hover:border-emerald-500 hover:bg-emerald-50/30"
            >
              {file ? (
                <>
                  <FileSpreadsheet className="size-8 text-emerald-600" />

                  <p className="mt-2 max-w-full truncate text-sm font-medium">
                    {file.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </>
              ) : (
                <>
                  <CloudUpload className="size-8 text-slate-400" />

                  <p className="mt-2 text-sm font-medium">
                    Klik untuk memilih file
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Format Excel .xlsx atau .xls, maksimal 5 MB
                  </p>
                </>
              )}
            </label>

            <Input
              id="excel-import-file"
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              disabled={isBusy}
              onChange={(event) => {
                handleFileChange(event.target.files?.[0]);
                event.target.value = "";
              }}
            />

            {file && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full gap-2 text-red-600"
                disabled={isBusy}
                onClick={handleRemoveFile}
              >
                <X className="size-4" />
                Hapus File
              </Button>
            )}

            {previewMutation.isError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{formatError(previewMutation.error)}</span>
              </div>
            )}

            {previewMutation.isSuccess && previewCompleted && (
              <div className="space-y-3">
                <div
                  className={`flex items-start gap-2 rounded-lg border p-3 text-xs ${
                    hasPreviewErrors
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {hasPreviewErrors ? (
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  ) : (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                  )}

                  <div>
                    <p className="font-semibold">
                      {hasPreviewErrors
                        ? "Validasi roster ditemukan masalah"
                        : "Validasi roster berhasil"}
                    </p>

                    <p className="mt-1">
                      {hasPreviewErrors
                        ? "Perbaiki kesalahan pada file Excel sebelum melakukan import."
                        : "File sudah lolos validasi dan siap diimport."}
                    </p>
                  </div>
                </div>

                {summary && (
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        label: "Total Assignment",
                        value: totalAssignments,
                      },
                      {
                        label: "Total Petugas",
                        value: totalUsers,
                      },
                      {
                        label: "Hari Kerja",
                        value: totalWorkDays,
                      },
                      {
                        label: "Hari Libur",
                        value: totalOffDays,
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-lg border bg-slate-50 p-3"
                      >
                        <p className="text-xs text-slate-500">{item.label}</p>

                        <p className="mt-1 text-lg font-semibold">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {previewResult?.assignments &&
                  previewResult.assignments.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">
                        Detail Assignment ({previewResult.assignments.length})
                      </p>

                      <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border p-3">
                        {previewResult.assignments.map((assignment, index) => (
                          <div
                            key={`${assignment.userId}-${assignment.scheduleId}-${assignment.startDate}-${index}`}
                            className="flex items-start justify-between gap-3 border-b pb-2 last:border-0 last:pb-0"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold">
                                {assignment.userName || "Petugas"}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {assignment.scheduleName || "Shift"}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {assignment.startDate} - {assignment.endDate}
                              </p>
                            </div>

                            <span className="shrink-0 rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">
                              Baris {assignment.rowNumber}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {previewErrors.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-red-600">
                      Kesalahan ({previewErrors.length})
                    </p>

                    <div className="max-h-36 space-y-2 overflow-y-auto rounded-lg border border-red-200 p-3">
                      {previewErrors.map((error, index) => (
                        <div key={index} className="text-xs text-red-600">
                          <p className="font-medium">
                            {error.row ? `Baris ${error.row}: ` : ""}
                            {error.message}
                          </p>

                          {error.field && (
                            <p className="mt-0.5 text-red-500">
                              Kolom: {error.field}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {previewWarnings.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-amber-600">
                      Peringatan ({previewWarnings.length})
                    </p>

                    <div className="max-h-36 space-y-2 overflow-y-auto rounded-lg border border-amber-200 p-3">
                      {previewWarnings.map((warning, index) => (
                        <div key={index} className="text-xs text-amber-700">
                          <p>
                            {warning.row ? `Baris ${warning.row}: ` : ""}
                            {warning.message}
                          </p>

                          {warning.field && (
                            <p className="mt-0.5">Kolom: {warning.field}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {importMutation.isError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{formatError(importMutation.error)}</span>
              </div>
            )}

            {importMutation.isSuccess && (
              <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0" />

                  <p className="text-sm font-semibold">
                    Import berhasil diproses
                  </p>
                </div>

                {importResult?.message && (
                  <p className="text-xs">{importResult.message}</p>
                )}

                {importResult?.summary && (
                  <div className="space-y-1 text-xs">
                    {Object.entries(importResult.summary).map(
                      ([key, value]) => (
                        <div key={key} className="flex justify-between gap-3">
                          <span className="capitalize">
                            {key.replace(/([A-Z])/g, " $1")}
                          </span>

                          <span className="font-semibold">
                            {String(value ?? "-")}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse justify-end gap-2 border-t pt-4 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isBusy}
          >
            Tutup
          </Button>

          {!previewCompleted ? (
            <Button
              type="button"
              disabled={!file || isBusy}
              onClick={handlePreview}
              className="gap-2"
            >
              {previewMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="size-4" />
              )}

              {previewMutation.isPending
                ? "Memvalidasi..."
                : "Preview & Validasi"}
            </Button>
          ) : (
            <Button
              type="button"
              disabled={!canImport}
              onClick={handleImport}
              className="gap-2"
            >
              {importMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}

              {importMutation.isPending
                ? "Mengimport..."
                : importMutation.isSuccess
                  ? "Import Selesai"
                  : "Import Jadwal"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExcelTransferDialog;
