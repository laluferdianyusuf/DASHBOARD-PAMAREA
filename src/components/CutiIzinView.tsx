import React, { useState } from "react";
import { INITIAL_OFFICERS_POOL } from "../data/calendarMockData";
import type {
  DayShift,
  SecurityLeaveRecord,
  ShiftOfficerAssignment,
} from "../utils/security-logic";
import { NavTab } from "./Sidebar";

import {
  AlertCircle,
  ArrowLeftRight,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  ShieldCheck,
  UserRoundX,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CutiIzinViewProps {
  onNavigate: (tab: NavTab) => void;
  calendarDays: (DayShift | null)[];
  leaveRecords: SecurityLeaveRecord[];
  onSubmitLeave: (
    leaveRecord: SecurityLeaveRecord,
    backupOfficer?: ShiftOfficerAssignment,
  ) => void;
}

const getTodayLocalDate = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};

export const CutiIzinView: React.FC<CutiIzinViewProps> = ({
  onNavigate,
  calendarDays: _calendarDays,
  leaveRecords,
  onSubmitLeave,
}) => {
  const [officerId, setOfficerId] = useState(
    () =>
      INITIAL_OFFICERS_POOL.find((off) => off.officerId === "USR-004")
        ?.officerId ??
      INITIAL_OFFICERS_POOL[0]?.officerId ??
      "",
  );

  const [leaveType, setLeaveType] =
    useState<SecurityLeaveRecord["leaveType"]>("Cuti Tahunan");

  const [startDate, setStartDate] = useState(getTodayLocalDate);
  const [endDate, setEndDate] = useState(getTodayLocalDate);

  const [reason, setReason] = useState(
    "Cuti tahunan keperluan keluarga di luar kota",
  );

  const [backupOfficerId, setBackupOfficerId] = useState(
    () =>
      INITIAL_OFFICERS_POOL.find((off) => off.officerId === "USR-009")
        ?.officerId ??
      INITIAL_OFFICERS_POOL.find((off) => off.officerId !== officerId)
        ?.officerId ??
      "",
  );

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const selectedOfficer = INITIAL_OFFICERS_POOL.find(
    (off) => off.officerId === officerId,
  );

  const selectedBackup = INITIAL_OFFICERS_POOL.find(
    (off) => off.officerId === backupOfficerId,
  );

  const availableBackupOfficers = INITIAL_OFFICERS_POOL.filter(
    (off) => off.officerId !== officerId,
  );

  // Hitung total durasi cuti, termasuk tanggal mulai dan selesai.
  const diffDays = (() => {
    if (!startDate || !endDate) return 0;

    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      start > end
    ) {
      return 0;
    }

    return (
      Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );
  })();

  const handleOfficerChange = (value: string) => {
    setOfficerId(value);

    if (value === backupOfficerId) {
      const alternative = INITIAL_OFFICERS_POOL.find(
        (off) => off.officerId !== value,
      );

      setBackupOfficerId(alternative?.officerId ?? "");
    }

    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setFormError(null);
    setSuccessMessage(null);

    if (!selectedOfficer) {
      setFormError("Silakan pilih personel security yang mengajukan.");
      return;
    }

    if (!selectedBackup) {
      setFormError("Silakan tentukan petugas pengganti.");
      return;
    }

    if (officerId === backupOfficerId) {
      setFormError(
        "Petugas yang mengajukan cuti tidak bisa menjadi pengganti dirinya sendiri.",
      );
      return;
    }

    if (!startDate || !endDate) {
      setFormError("Tanggal mulai dan selesai wajib diisi.");
      return;
    }

    if (new Date(`${startDate}T00:00:00`) > new Date(`${endDate}T00:00:00`)) {
      setFormError(
        "Tanggal mulai tidak boleh lebih lambat dari tanggal selesai.",
      );
      return;
    }

    if (!reason.trim()) {
      setFormError("Alasan cuti/izin wajib dicantumkan.");
      return;
    }

    const newRecord: SecurityLeaveRecord = {
      id: `LEV-${Date.now().toString().slice(-4)}`,
      officerId,
      officerName: selectedOfficer.officerName,
      leaveType,
      startDate,
      endDate,
      reason: reason.trim(),
      backupOfficerId: selectedBackup.officerId,
      backupOfficerName: selectedBackup.officerName,
      status: "Disetujui",
      createdAt: getTodayLocalDate(),
    };

    onSubmitLeave(newRecord, selectedBackup);

    setSuccessMessage(
      `Pengajuan ${leaveType} untuk ${selectedOfficer.officerName} berhasil disetujui. Petugas pengganti: ${selectedBackup.officerName}. Kalender shift telah disinkronkan.`,
    );

    window.setTimeout(() => {
      setSuccessMessage(null);
    }, 6000);
  };

  const handleReset = () => {
    setStartDate(getTodayLocalDate());
    setEndDate(getTodayLocalDate());
    setReason("");
    setFormError(null);
    setSuccessMessage(null);
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="flex flex-col gap-3 rounded border border-emerald-200 bg-emerald-50 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            <p className="text-xs font-medium text-emerald-800">
              {successMessage}
            </p>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={() => onNavigate("kalender")}
            className="bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <CalendarDays className="mr-1.5 size-4" />
            Lihat Kalender Shift
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b pb-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Pengajuan Cuti, Izin & Sakit Personel
          </h1>

          <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
            Pengelolaan ketidakhadiran personel security, penunjukan petugas
            pengganti, dan penyesuaian kalender shift.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onNavigate("kalender")}
          >
            <CalendarDays className="mr-1.5 size-4" />
            Kalender Shift
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => onNavigate("tukar-shift")}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <ArrowLeftRight className="mr-1.5 size-4" />
            Tukar Shift
          </Button>
        </div>
      </div>

      {/* Form and Information */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Form */}
        <div className="space-y-5 lg:col-span-2">
          <div className="flex items-center gap-2 border-b pb-3">
            <UserRoundX className="size-5 text-amber-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Formulir Pengajuan Cuti / Izin / Sakit
            </h2>
          </div>

          {formError && (
            <div className="flex items-start gap-2 rounded border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Personel and Leave Type */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="officerId" className="text-xs">
                  Personel Security Pemohon
                  <span className="ml-1 text-rose-500">*</span>
                </Label>

                <Select
                  value={officerId}
                  onValueChange={(value) =>
                    handleOfficerChange(value as string)
                  }
                >
                  <SelectTrigger id="officerId" className="w-full">
                    <SelectValue placeholder="Pilih personel" />
                  </SelectTrigger>

                  <SelectContent>
                    {INITIAL_OFFICERS_POOL.map((off) => (
                      <SelectItem key={off.officerId} value={off.officerId}>
                        {off.officerName} - {off.role} (
                        {off.callSign || off.npp})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <p className="text-[11px] text-muted-foreground">
                  Pos Penugasan:{" "}
                  <span className="font-semibold text-slate-700">
                    {selectedOfficer?.post || "Pos Utama"}
                  </span>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="leaveType" className="text-xs">
                  Jenis Ketidakhadiran
                  <span className="ml-1 text-rose-500">*</span>
                </Label>

                <Select
                  value={leaveType}
                  onValueChange={(value) =>
                    setLeaveType(value as SecurityLeaveRecord["leaveType"])
                  }
                >
                  <SelectTrigger id="leaveType" className="w-full">
                    <SelectValue placeholder="Pilih jenis ketidakhadiran" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="Cuti Tahunan">Cuti Tahunan</SelectItem>
                    <SelectItem value="Izin Urusan Penting">
                      Izin Urusan Penting / Keluarga
                    </SelectItem>
                    <SelectItem value="Sakit (Surat Dokter)">
                      Sakit (Dengan Keterangan Dokter)
                    </SelectItem>
                    <SelectItem value="Dispensasi Dinas Luar">
                      Dispensasi Pelatihan / Dinas Luar
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-3 rounded border bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label className="flex items-center gap-1.5 text-xs">
                  <CalendarDays className="size-4 text-slate-500" />
                  Rentang Tanggal Cuti / Izin
                  <span className="text-rose-500">*</span>
                </Label>

                <Badge
                  variant="outline"
                  className="rounded border-amber-200 bg-amber-50 text-amber-800"
                >
                  <Clock className="mr-1 size-3" />
                  Total Durasi: {diffDays} Hari
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="startDate"
                    className="text-xs text-muted-foreground"
                  >
                    Tanggal Mulai
                  </Label>

                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="endDate"
                    className="text-xs text-muted-foreground"
                  >
                    Tanggal Selesai
                  </Label>

                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-white"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Backup Officer */}
            <div className="space-y-2">
              <Label htmlFor="backupOfficer" className="text-xs">
                Petugas Cadangan / Pengganti
                <span className="ml-1 text-rose-500">*</span>
              </Label>

              <Select
                value={backupOfficerId}
                onValueChange={(value) => setBackupOfficerId(value as string)}
              >
                <SelectTrigger id="backupOfficer" className="w-full">
                  <SelectValue placeholder="Pilih petugas pengganti" />
                </SelectTrigger>

                <SelectContent>
                  {availableBackupOfficers.map((off) => (
                    <SelectItem key={off.officerId} value={off.officerId}>
                      {off.officerName} ({off.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <p className="text-[11px] text-muted-foreground">
                Petugas ini akan menggantikan{" "}
                <span className="font-semibold text-slate-700">
                  {selectedOfficer?.officerName || "personel pemohon"}
                </span>{" "}
                pada periode {startDate || "-"} s/d {endDate || "-"} di Kalender
                Shift.
              </p>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-xs">
                Alasan / Keterangan Tambahan
                <span className="ml-1 text-rose-500">*</span>
              </Label>

              <Textarea
                id="reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Tuliskan alasan pengajuan cuti atau keterangan surat dokter..."
                className="resize-none text-xs"
                required
              />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" onClick={handleReset}>
                Reset
              </Button>

              <Button
                type="submit"
                disabled={
                  !INITIAL_OFFICERS_POOL.length ||
                  !selectedOfficer ||
                  !selectedBackup
                }
                className="bg-amber-600 text-white hover:bg-amber-700"
              >
                <ClipboardCheck className="mr-1.5 size-4" />
                Setujui & Terapkan ke Kalender
              </Button>
            </div>
          </form>
        </div>

        {/* Information Panel */}
        <div className="space-y-5">
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b pb-3">
              <ShieldCheck className="size-5 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Kebijakan Absensi & Cuti
              </h3>
            </div>

            <ul className="list-disc space-y-3 pl-4 text-xs leading-relaxed text-muted-foreground">
              <li>
                Maksimal satu personel per regu yang dapat mengambil cuti
                bersamaan agar kuota pos tetap aman.
              </li>
              <li>
                Wajib menyertakan personel pengganti resmi untuk menjaga
                kontinuitas penjagaan.
              </li>
              <li>
                Izin sakit lebih dari satu hari wajib melampirkan surat
                keterangan dokter resmi.
              </li>
              <li>
                Kalender shift menggunakan label Cadangan Cuti untuk memudahkan
                inspeksi supervisor.
              </li>
            </ul>
          </div>

          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Kesiapan Tim Cadangan
              </h3>
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground">
              Personel cadangan siaga dapat dimobilisasi untuk mengisi pos yang
              ditinggalkan selama periode cuti atau izin.
            </p>

            <div className="rounded border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-[11px] text-emerald-700">
                Status Pos Hari Ini
              </p>
              <p className="mt-1 text-sm font-bold text-emerald-800">
                100% Terisi
              </p>
              <p className="mt-1 text-[11px] text-emerald-700">
                Tidak ada kekosongan pos yang terdata.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Leave Records Table */}
      <div className="space-y-3">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-5 text-amber-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Daftar Cuti & Izin Personel Aktif
            </h2>
          </div>

          <Badge variant="secondary" className="w-fit rounded">
            {leaveRecords.length} Permohonan Terdata
          </Badge>
        </div>

        <div className="overflow-hidden rounded border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="text-xs">ID Cuti</TableHead>
                  <TableHead className="text-xs">Nama Personel</TableHead>
                  <TableHead className="text-xs">Jenis Izin</TableHead>
                  <TableHead className="text-xs">Rentang Tanggal</TableHead>
                  <TableHead className="text-xs">Petugas Pengganti</TableHead>
                  <TableHead className="text-xs">Alasan</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {leaveRecords.length > 0 ? (
                  leaveRecords.map((leave) => (
                    <TableRow key={leave.id}>
                      <TableCell className="whitespace-nowrap font-mono text-xs font-semibold text-blue-600">
                        {leave.id}
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-xs font-semibold text-slate-900">
                        {leave.officerName}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className="rounded border-amber-200 bg-amber-50 text-[10px] text-amber-800"
                        >
                          {leave.leaveType}
                        </Badge>
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-xs font-medium">
                        {leave.startDate} s/d {leave.endDate}
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-xs">
                        {leave.backupOfficerName ? (
                          <span className="font-medium text-emerald-700">
                            {leave.backupOfficerName}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            Belum ditentukan
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="max-w-[220px] truncate text-xs text-muted-foreground">
                        {leave.reason}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className="rounded border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700"
                        >
                          {leave.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-24 text-center text-xs text-muted-foreground"
                    >
                      Belum ada data pengajuan cuti atau izin.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};
