import React, { useState } from "react";
import { INITIAL_OFFICERS_POOL } from "../data/calendarMockData";
import { DayShift, ShiftSwapRecord } from "../utils/security-logic";
import { NavTab } from "./Sidebar";

import {
  AlertCircle,
  ArrowLeftRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  History,
  Info,
  ShieldCheck,
  UserMinus,
  X,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

interface TukarShiftViewProps {
  onNavigate: (tab: NavTab) => void;
  calendarDays: (DayShift | null)[];
  swapRecords: ShiftSwapRecord[];
  onExecuteSwap: (swapRequest: {
    dateStr: string;
    officerAId: string;
    officerAName: string;
    shiftTypeA: "Pagi" | "Siang" | "Malam";
    postA?: string;
    officerBId: string;
    officerBName: string;
    shiftTypeB: "Pagi" | "Siang" | "Malam";
    postB?: string;
    reason: string;
  }) => void;
}

type ShiftType = "Pagi" | "Siang" | "Malam";

const SHIFT_OPTIONS: {
  value: ShiftType;
  label: string;
  time: string;
  badgeClass: string;
}[] = [
  {
    value: "Pagi",
    label: "Shift Pagi",
    time: "07:00 - 15:00",
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  {
    value: "Siang",
    label: "Shift Siang",
    time: "15:00 - 23:00",
    badgeClass: "border-blue-200 bg-blue-50 text-blue-700",
  },
  {
    value: "Malam",
    label: "Shift Malam",
    time: "23:00 - 07:00",
    badgeClass: "border-purple-200 bg-purple-50 text-purple-700",
  },
];

const getTodayLocalDate = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};

const formatDate = (dateString: string) => {
  if (!dateString) return "-";

  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) return dateString;

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

const getShiftBadgeClass = (shift: string) => {
  switch (shift) {
    case "Pagi":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Siang":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "Malam":
      return "border-purple-200 bg-purple-50 text-purple-700";
    default:
      return "border-muted bg-muted text-muted-foreground";
  }
};

export const TukarShiftView: React.FC<TukarShiftViewProps> = ({
  onNavigate,
  calendarDays,
  swapRecords,
  onExecuteSwap,
}) => {
  const [selectedDate, setSelectedDate] = useState(getTodayLocalDate);

  const [officerAId, setOfficerAId] = useState(
    INITIAL_OFFICERS_POOL[2]?.officerId ??
      INITIAL_OFFICERS_POOL[0]?.officerId ??
      "",
  );

  const [shiftTypeA, setShiftTypeA] = useState<ShiftType>("Siang");

  const [officerBId, setOfficerBId] = useState(
    INITIAL_OFFICERS_POOL[4]?.officerId ??
      INITIAL_OFFICERS_POOL[1]?.officerId ??
      "",
  );

  const [shiftTypeB, setShiftTypeB] = useState<ShiftType>("Malam");

  const [reason, setReason] = useState(
    "Penyesuaian jadwal dan keperluan keluarga.",
  );

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const dayNumber = Number(selectedDate.split("-")[2]);

  const currentDayObj = calendarDays.find(
    (day) => day && day.day === dayNumber,
  );

  const officerAObj = INITIAL_OFFICERS_POOL.find(
    (officer) => officer.officerId === officerAId,
  );

  const officerBObj = INITIAL_OFFICERS_POOL.find(
    (officer) => officer.officerId === officerBId,
  );

  const isSameOfficer = officerAId === officerBId;
  const isSameShift = shiftTypeA === shiftTypeB;

  const handleSubmitSwap = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setFormError(null);
    setSuccessMessage(null);

    if (!selectedDate) {
      setFormError("Tanggal pertukaran shift wajib dipilih.");
      return;
    }

    if (!officerAId || !officerBId) {
      setFormError("Kedua personel wajib dipilih.");
      return;
    }

    if (isSameOfficer) {
      setFormError(
        "Petugas 1 dan Petugas 2 tidak boleh merupakan orang yang sama.",
      );
      return;
    }

    if (isSameShift) {
      setFormError(
        "Shift asal kedua petugas tidak boleh sama. Pilih shift yang berbeda.",
      );
      return;
    }

    if (!reason.trim()) {
      setFormError("Alasan pertukaran jaga wajib dicantumkan.");
      return;
    }

    if (!officerAObj || !officerBObj) {
      setFormError("Data personel tidak ditemukan.");
      return;
    }

    onExecuteSwap({
      dateStr: selectedDate,
      officerAId,
      officerAName: officerAObj.officerName,
      shiftTypeA,
      postA: officerAObj.post || "Pos Jaga",
      officerBId,
      officerBName: officerBObj.officerName,
      shiftTypeB,
      postB: officerBObj.post || "Pos Jaga",
      reason: reason.trim(),
    });

    setSuccessMessage(
      `Pertukaran shift tanggal ${formatDate(selectedDate)} berhasil diterapkan. ${officerAObj.officerName} bertukar dengan ${officerBObj.officerName}.`,
    );
  };

  const handleResetForm = () => {
    setSelectedDate(getTodayLocalDate());

    setOfficerAId(
      INITIAL_OFFICERS_POOL[2]?.officerId ??
        INITIAL_OFFICERS_POOL[0]?.officerId ??
        "",
    );

    setShiftTypeA("Siang");

    setOfficerBId(
      INITIAL_OFFICERS_POOL[4]?.officerId ??
        INITIAL_OFFICERS_POOL[1]?.officerId ??
        "",
    );

    setShiftTypeB("Malam");

    setReason("");
    setFormError(null);
    setSuccessMessage(null);
  };

  return (
    <div className="space-y-5">
      {/* Success Notification */}
      {successMessage && (
        <Alert className="rounded border-emerald-200 bg-emerald-50 text-emerald-800">
          <CheckCircle2 className="size-4 text-emerald-600" />

          <AlertDescription className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <span className="text-xs font-medium">{successMessage}</span>

            <div className="flex shrink-0 items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded border-emerald-300 bg-white text-xs text-emerald-700 hover:bg-emerald-100"
                onClick={() => onNavigate("kalender")}
              >
                <CalendarDays className="size-3.5" />
                Buka Kalender
              </Button>

              <Button
                size="icon"
                variant="ghost"
                className="size-8 rounded text-emerald-700 hover:bg-emerald-100"
                onClick={() => setSuccessMessage(null)}
              >
                <X className="size-4" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b pb-4 md:flex-row md:items-end">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Pertukaran Shift
          </h1>

          <p className="max-w-2xl text-xs text-muted-foreground">
            Kelola pertukaran jadwal jaga antar personel dan sinkronkan
            perubahan dengan kalender operasional.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="rounded"
            onClick={() => onNavigate("kalender")}
          >
            <CalendarDays className="size-4" />
            Kalender Shift
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="rounded"
            onClick={() => onNavigate("cuti-izin")}
          >
            <UserMinus className="size-4" />
            Cuti &amp; Izin
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Swap Form */}
        <div className="space-y-5 rounded border bg-background p-4 sm:p-5 xl:col-span-2">
          <div className="flex items-center gap-2 border-b pb-3">
            <ArrowLeftRight className="size-5 text-primary" />

            <div>
              <h2 className="text-sm font-semibold">
                Formulir Pertukaran Shift
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Lengkapi data kedua personel yang akan bertukar jadwal.
              </p>
            </div>
          </div>

          {/* Form Error */}
          {formError && (
            <Alert variant="destructive" className="rounded">
              <AlertCircle className="size-4" />
              <AlertDescription className="text-xs">
                {formError}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmitSwap} className="space-y-5">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="swap-date">
                Tanggal Pertukaran <span className="text-destructive">*</span>
              </Label>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  id="swap-date"
                  type="date"
                  value={selectedDate}
                  onChange={(event) => {
                    setSelectedDate(event.target.value);
                    setFormError(null);
                  }}
                  className="w-full rounded sm:w-52"
                  required
                />

                {currentDayObj ? (
                  <Badge
                    variant="outline"
                    className="w-fit rounded border-emerald-200 bg-emerald-50 text-emerald-700"
                  >
                    <CheckCircle2 className="mr-1 size-3" />
                    {currentDayObj.shifts.length} Shift Terjadwal
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Tidak ditemukan data roster untuk tanggal ini.
                  </span>
                )}
              </div>
            </div>

            <Separator />

            {/* Officers */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Officer A */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-blue-600" />
                    <h3 className="text-xs font-semibold">Petugas Pemohon</h3>
                  </div>

                  <Badge
                    variant="outline"
                    className={`rounded text-[10px] ${getShiftBadgeClass(shiftTypeA)}`}
                  >
                    Shift {shiftTypeA}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="officer-a" className="text-xs">
                    Nama Personel
                  </Label>

                  <Select
                    value={officerAId}
                    onValueChange={(value) => {
                      setOfficerAId(value as string);
                      setFormError(null);
                    }}
                  >
                    <SelectTrigger id="officer-a" className="w-full rounded">
                      <SelectValue placeholder="Pilih personel" />
                    </SelectTrigger>

                    <SelectContent>
                      {INITIAL_OFFICERS_POOL.map((officer) => (
                        <SelectItem
                          key={officer.officerId}
                          value={officer.officerId}
                        >
                          {officer.officerName} (
                          {officer.callSign || officer.npp})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shift-a" className="text-xs">
                    Shift yang Ditinggalkan
                  </Label>

                  <Select
                    value={shiftTypeA}
                    onValueChange={(value) => {
                      setShiftTypeA(value as ShiftType);
                      setFormError(null);
                    }}
                  >
                    <SelectTrigger id="shift-a" className="w-full rounded">
                      <SelectValue placeholder="Pilih shift" />
                    </SelectTrigger>

                    <SelectContent>
                      {SHIFT_OPTIONS.map((shift) => (
                        <SelectItem key={shift.value} value={shift.value}>
                          {shift.label} ({shift.time})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded border bg-muted/30 p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Informasi Personel
                  </p>

                  <p className="mt-1 text-xs font-semibold text-foreground">
                    {officerAObj?.officerName || "Belum dipilih"}
                  </p>

                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {officerAObj?.role || "-"} · {officerAObj?.npp || "-"}
                  </p>

                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Pos saat ini: {officerAObj?.post || "Pos Jaga Utama"}
                  </p>
                </div>
              </div>

              {/* Officer B */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-purple-600" />
                    <h3 className="text-xs font-semibold">Petugas Penukar</h3>
                  </div>

                  <Badge
                    variant="outline"
                    className={`rounded text-[10px] ${getShiftBadgeClass(shiftTypeB)}`}
                  >
                    Shift {shiftTypeB}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="officer-b" className="text-xs">
                    Nama Personel
                  </Label>

                  <Select
                    value={officerBId}
                    onValueChange={(value) => {
                      setOfficerBId(value as string);
                      setFormError(null);
                    }}
                  >
                    <SelectTrigger id="officer-b" className="w-full rounded">
                      <SelectValue placeholder="Pilih personel" />
                    </SelectTrigger>

                    <SelectContent>
                      {INITIAL_OFFICERS_POOL.map((officer) => (
                        <SelectItem
                          key={officer.officerId}
                          value={officer.officerId}
                        >
                          {officer.officerName} (
                          {officer.callSign || officer.npp})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shift-b" className="text-xs">
                    Shift yang Ditinggalkan
                  </Label>

                  <Select
                    value={shiftTypeB}
                    onValueChange={(value) => {
                      setShiftTypeB(value as ShiftType);
                      setFormError(null);
                    }}
                  >
                    <SelectTrigger id="shift-b" className="w-full rounded">
                      <SelectValue placeholder="Pilih shift" />
                    </SelectTrigger>

                    <SelectContent>
                      {SHIFT_OPTIONS.map((shift) => (
                        <SelectItem key={shift.value} value={shift.value}>
                          {shift.label} ({shift.time})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded border bg-muted/30 p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Informasi Personel
                  </p>

                  <p className="mt-1 text-xs font-semibold text-foreground">
                    {officerBObj?.officerName || "Belum dipilih"}
                  </p>

                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {officerBObj?.role || "-"} · {officerBObj?.npp || "-"}
                  </p>

                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Pos saat ini: {officerBObj?.post || "Pos Jaga Cadangan"}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="swap-reason">
                Alasan Pertukaran <span className="text-destructive">*</span>
              </Label>

              <Textarea
                id="swap-reason"
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                  setFormError(null);
                }}
                rows={3}
                placeholder="Tuliskan alasan pertukaran shift..."
                className="resize-none rounded text-xs"
                required
              />
            </div>

            {/* Swap Preview */}
            <div className="space-y-3 rounded border border-cyan-200 bg-cyan-50/60 p-3">
              <div className="flex items-center gap-2 text-cyan-800">
                <ArrowLeftRight className="size-4" />
                <span className="text-xs font-semibold">
                  Preview Pertukaran Shift
                </span>
              </div>

              {isSameOfficer || isSameShift ? (
                <p className="text-xs text-rose-600">
                  {isSameOfficer
                    ? "Pilih dua personel yang berbeda."
                    : "Pilih dua shift yang berbeda."}
                </p>
              ) : (
                <div className="space-y-2 text-xs text-cyan-900">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">
                      {officerAObj?.officerName || "Petugas 1"}
                    </span>

                    <Badge
                      variant="outline"
                      className={`rounded text-[10px] ${getShiftBadgeClass(shiftTypeA)}`}
                    >
                      {shiftTypeA}
                    </Badge>

                    <ArrowLeftRight className="size-3.5" />

                    <Badge
                      variant="outline"
                      className={`rounded text-[10px] ${getShiftBadgeClass(shiftTypeB)}`}
                    >
                      {shiftTypeB}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">
                      {officerBObj?.officerName || "Petugas 2"}
                    </span>

                    <Badge
                      variant="outline"
                      className={`rounded text-[10px] ${getShiftBadgeClass(shiftTypeB)}`}
                    >
                      {shiftTypeB}
                    </Badge>

                    <ArrowLeftRight className="size-3.5" />

                    <Badge
                      variant="outline"
                      className={`rounded text-[10px] ${getShiftBadgeClass(shiftTypeA)}`}
                    >
                      {shiftTypeA}
                    </Badge>
                  </div>

                  <Separator className="bg-cyan-200" />

                  <p className="text-[11px] text-cyan-700">
                    Pertukaran akan diterapkan pada tanggal{" "}
                    <span className="font-semibold">
                      {formatDate(selectedDate)}
                    </span>
                    .
                  </p>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex flex-col-reverse justify-end gap-2 border-t pt-4 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="rounded"
                onClick={handleResetForm}
              >
                Reset Form
              </Button>

              <Button
                type="submit"
                className="rounded"
                disabled={
                  !officerAId ||
                  !officerBId ||
                  isSameOfficer ||
                  isSameShift ||
                  !reason.trim()
                }
              >
                <ArrowLeftRight className="size-4" />
                Terapkan Pertukaran Shift
              </Button>
            </div>
          </form>
        </div>

        {/* SOP Information */}
        <div className="space-y-4">
          <div className="space-y-3 rounded border bg-background p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              <h3 className="text-sm font-semibold">SOP Pertukaran Shift</h3>
            </div>

            <Separator />

            <div className="space-y-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-semibold text-foreground">
                  1
                </span>
                <p>
                  Pertukaran shift harus diajukan minimal 6 jam sebelum shift
                  dimulai.
                </p>
              </div>

              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-semibold text-foreground">
                  2
                </span>
                <p>
                  Kedua personel wajib memiliki kualifikasi atau sertifikasi
                  pengamanan yang setara.
                </p>
              </div>

              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-semibold text-foreground">
                  3
                </span>
                <p>Pergantian posisi dicatat dalam audit log PAMAREA.</p>
              </div>

              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-semibold text-foreground">
                  4
                </span>
                <p>
                  Komandan Regu (Danru) perlu melakukan verifikasi pertukaran.
                </p>
              </div>
            </div>
          </div>

          {/* Standard Shift Schedule */}
          <div className="space-y-3 rounded border bg-[#101b35] p-4 text-white">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-blue-300" />
              <h3 className="text-xs font-semibold">Jadwal Shift Standar</h3>
            </div>

            <Separator className="bg-white/15" />

            <div className="space-y-3">
              {SHIFT_OPTIONS.map((shift) => (
                <div
                  key={shift.value}
                  className="flex items-center justify-between gap-2 text-xs"
                >
                  <span className="text-slate-300">{shift.label}</span>
                  <span className="font-mono font-medium text-white">
                    {shift.time}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-slate-400">
              Seluruh waktu menggunakan WIB.
            </p>
          </div>

          {/* Information */}
          <Alert className="rounded">
            <Info className="size-4" />
            <AlertDescription className="text-xs leading-relaxed">
              Pastikan kedua personel telah menyetujui pertukaran sebelum
              perubahan diterapkan pada kalender operasional.
            </AlertDescription>
          </Alert>
        </div>
      </div>

      {/* Swap History */}
      <div className="overflow-hidden rounded border bg-background">
        <div className="flex flex-col justify-between gap-2 border-b px-4 py-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <History className="size-4 text-primary" />

            <div>
              <h3 className="text-sm font-semibold">
                Riwayat Pertukaran Shift
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Catatan transaksi pertukaran shift.
              </p>
            </div>
          </div>

          <Badge variant="secondary" className="w-fit rounded">
            {swapRecords.length} Transaksi
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="whitespace-nowrap">
                  ID Transaksi
                </TableHead>

                <TableHead className="whitespace-nowrap">Tanggal</TableHead>

                <TableHead className="min-w-40">Petugas 1</TableHead>

                <TableHead className="text-center">Pertukaran</TableHead>

                <TableHead className="min-w-40">Petugas 2</TableHead>

                <TableHead className="min-w-48">Alasan</TableHead>

                <TableHead className="min-w-36">Status</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {swapRecords.length > 0 ? (
                swapRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="whitespace-nowrap font-mono text-xs font-medium text-primary">
                      {record.id}
                    </TableCell>

                    <TableCell className="whitespace-nowrap text-xs font-medium">
                      {formatDate(record.dateStr)}
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-foreground">
                          {record.officerA.officerName}
                        </p>

                        <Badge
                          variant="outline"
                          className={`rounded text-[10px] ${getShiftBadgeClass(record.officerA.shiftType)}`}
                        >
                          Shift {record.officerA.shiftType}
                        </Badge>
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <ArrowLeftRight className="mx-auto size-4 text-cyan-600" />
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-foreground">
                          {record.officerB.officerName}
                        </p>

                        <Badge
                          variant="outline"
                          className={`rounded text-[10px] ${getShiftBadgeClass(record.officerB.shiftType)}`}
                        >
                          Shift {record.officerB.shiftType}
                        </Badge>
                      </div>
                    </TableCell>

                    <TableCell>
                      <p
                        className="max-w-56 truncate text-xs text-muted-foreground"
                        title={record.reason}
                      >
                        {record.reason}
                      </p>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <Badge
                          variant="outline"
                          className="rounded border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700"
                        >
                          {record.status}
                        </Badge>

                        <p className="text-[10px] text-muted-foreground">
                          Disetujui: {record.approvedBy || "-"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <History className="size-7 text-muted-foreground/50" />

                      <p className="text-xs font-medium">
                        Belum ada riwayat pertukaran
                      </p>

                      <p className="text-[11px] text-muted-foreground">
                        Transaksi pertukaran shift akan muncul di sini.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="border-t px-4 py-2.5">
          <p className="text-[11px] text-muted-foreground">
            Menampilkan {swapRecords.length} riwayat pertukaran shift.
          </p>
        </div>
      </div>
    </div>
  );
};
