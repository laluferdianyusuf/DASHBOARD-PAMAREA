import React, { useEffect, useMemo, useState } from "react";
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
  UserRoundX,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

import { format } from "date-fns";
import { toast } from "sonner";
import { formatDate } from "../helpers/dateTime";
import { unwrapArray } from "../helpers/unwrapArray";
import { useAbsences, useCreateAbsence } from "../hooks/absence/useAbsence";
import { useUsers } from "../hooks/users/useUsers";
import type { UserResponse } from "../types";
import {
  AbsenceType,
  SecurityAbsence,
} from "../types/absence/security-absence";
import { DatePicker } from "./DatePicker";

interface CutiIzinViewProps {
  selectedSite: string;
  onNavigate: (tab: NavTab) => void;
  calendarDays: (DayShift | null)[];
  leaveRecords: SecurityLeaveRecord[];
  onSubmitLeave: (
    leaveRecord: SecurityLeaveRecord,
    backupOfficer?: ShiftOfficerAssignment,
  ) => void;
}

type SecurityUserOption = {
  id: string;
  fullName: string;
  role: string;
  npp: string;
};

const getTodayLocalDate = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};

const getAbsenceTypeLabel = (type: AbsenceType | string) => {
  const labels: Record<string, string> = {
    CUTI: "Cuti Tahunan",
    IZIN: "Izin Urusan Penting",
    SAKIT: "Sakit (Surat Dokter)",
    ALPHA: "Dispensasi Pelatihan / Dinas Luar",
  };

  return labels[type] ?? type;
};

const normalizeSecurityUser = (user: UserResponse): SecurityUserOption => {
  return {
    id: user.id,
    fullName: user.fullName,
    role: user.role?.name ?? "",
    npp: user.employeeNumber ?? "",
  };
};

export const CutiIzinView: React.FC<CutiIzinViewProps> = ({
  selectedSite,
  onNavigate,
  calendarDays: _calendarDays,
  leaveRecords: _initialLeaveRecords,
  onSubmitLeave: _onSubmitLeave,
}) => {
  const {
    data: leaveRecordsData,
    isLoading,
    isError,
  } = useAbsences({
    siteId: selectedSite !== "all" ? selectedSite : undefined,
  });

  const {
    data: usersData,
    isLoading: isUsersLoading,
    isError: isUsersError,
  } = useUsers();

  const createAbsence = useCreateAbsence();

  const leaveRecords = useMemo<SecurityAbsence[]>(() => {
    if (Array.isArray(leaveRecordsData)) {
      return leaveRecordsData as SecurityAbsence[];
    }

    const response = leaveRecordsData as
      | { data?: SecurityAbsence[] }
      | undefined;

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    return [];
  }, [leaveRecordsData]);

  const users = useMemo(
    () => unwrapArray<UserResponse>(usersData),
    [usersData],
  );

  const [officerId, setOfficerId] = useState("");
  const [backupOfficerId, setBackupOfficerId] = useState("");

  const [leaveType, setLeaveType] = useState<AbsenceType>("CUTI");

  const [startDate, setStartDate] = useState(getTodayLocalDate);
  const [endDate, setEndDate] = useState(getTodayLocalDate);

  const [reason, setReason] = useState(
    "Cuti tahunan keperluan keluarga di luar kota",
  );

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (users.length === 0) {
      setOfficerId("");
      return;
    }

    setOfficerId((current) => {
      if (current && users.some((user) => user.id === current)) {
        return current;
      }

      return users[0].id;
    });
  }, [users]);

  useEffect(() => {
    if (users.length === 0) {
      setBackupOfficerId("");
      return;
    }

    setBackupOfficerId((current) => {
      if (
        current &&
        current !== officerId &&
        users.some((user) => user.id === current)
      ) {
        return current;
      }

      return users.find((user) => user.id !== officerId)?.id ?? "";
    });
  }, [users, officerId]);

  const selectedOfficer = users.find((user) => user.id === officerId);

  const selectedBackup = users.find((user) => user.id === backupOfficerId);

  const availableBackupOfficers = users.filter((user) => user.id !== officerId);

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
      const alternative = users.find((user) => user.id !== value);

      setBackupOfficerId(alternative?.id ?? "");
    }

    setFormError(null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setFormError(null);
    setSuccessMessage(null);

    if (!officerId || !startDate || !endDate || !leaveType) {
      toast.error("Lengkapi data ketidakhadiran terlebih dahulu.");
      return;
    }

    if (startDate > endDate) {
      toast.error("Tanggal selesai tidak boleh sebelum tanggal mulai.");
      return;
    }

    if (!selectedOfficer) {
      toast.error("Pilih security pemohon yang valid.");
      return;
    }

    if (!selectedBackup) {
      toast.error("Pilih petugas pengganti terlebih dahulu.");
      return;
    }

    if (officerId === backupOfficerId) {
      toast.error("Petugas pengganti tidak boleh sama dengan pemohon.");
      return;
    }

    createAbsence.mutate(
      {
        userId: officerId,
        replacementUserId: backupOfficerId,
        type: leaveType,
        startDate,
        endDate,
        reason: reason.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Ketidakhadiran berhasil dibuat.");

          setSuccessMessage(
            "Pengajuan ketidakhadiran berhasil dibuat dan diterapkan ke kalender shift.",
          );

          setStartDate(getTodayLocalDate());
          setEndDate(getTodayLocalDate());
          setReason("");
        },

        onError: (error: any) => {
          const message =
            error?.response?.data?.message || "Terjadi kesalahan pada server.";

          toast.error("Gagal membuat ketidakhadiran", {
            description: Array.isArray(message) ? message.join(", ") : message,
          });
        },
      },
    );
  };

  const handleReset = () => {
    setOfficerId(users[0]?.id ?? "");

    setBackupOfficerId(
      users.find((user) => user.id !== users[0]?.id)?.id ?? "",
    );

    setLeaveType("CUTI");
    setStartDate(getTodayLocalDate());
    setEndDate(getTodayLocalDate());
    setReason("");
    setFormError(null);
    setSuccessMessage(null);
  };

  const tableRecords = useMemo(() => {
    return leaveRecords.map((leave) => {
      const record = leave as unknown as {
        id: string;
        type: string;
        startDate: string;
        endDate: string;
        reason?: string | null;
        user?: {
          fullName?: string;
        };
        replacements?: Array<{
          replacementUser?: {
            fullName?: string;
          };
        }>;
      };

      const replacement = record.replacements?.[0];

      return {
        id: record.id,
        officerName: record.user?.fullName ?? "-",
        leaveType: getAbsenceTypeLabel(record.type),
        startDate: record.startDate,
        endDate: record.endDate,
        backupOfficerName: replacement?.replacementUser?.fullName ?? null,
        reason: record.reason || "-",
      };
    });
  }, [leaveRecords]);

  return (
    <div className="space-y-6">
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
            className="bg-[#FED400] text-black hover:bg-[#e9c300]"
          >
            <ArrowLeftRight className="mr-1.5 size-4" />
            Tukar Shift
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-5 text-amber-600" />

              <h2 className="text-sm font-bold text-slate-900">
                Daftar Cuti & Izin Personel Aktif
              </h2>
            </div>

            <Badge variant="secondary" className="w-fit rounded">
              {tableRecords.length} Permohonan Terdata
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
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-24 text-center text-xs text-muted-foreground"
                      >
                        Memuat data ketidakhadiran...
                      </TableCell>
                    </TableRow>
                  ) : isError ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-24 text-center text-xs text-rose-500"
                      >
                        Gagal mengambil data ketidakhadiran.
                      </TableCell>
                    </TableRow>
                  ) : tableRecords.length > 0 ? (
                    tableRecords.map((leave) => (
                      <TableRow key={leave.id}>
                        <TableCell className="whitespace-nowrap font-mono text-xs font-semibold text-blue-600">
                          {leave.id.slice(0, 7).toUpperCase()}
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
                          {formatDate(leave.startDate)} s/d{" "}
                          {formatDate(leave.endDate)}
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
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
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

        <div className="space-y-5">
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="officerId" className="text-xs">
                  Security Pemohon
                  <span className="ml-1 text-rose-500">*</span>
                </Label>

                <Select
                  value={officerId}
                  onValueChange={(value) => handleOfficerChange(value ?? "")}
                  disabled={isUsersLoading || isUsersError}
                >
                  <SelectTrigger id="officerId" className="w-full">
                    <SelectValue placeholder="Pilih personel">
                      {(() => {
                        const selectedUser = users.find(
                          (user) => user.id === officerId,
                        );

                        return selectedUser
                          ? `${selectedUser.fullName} - ${selectedUser.role?.name ?? "-"} (${selectedUser.employeeNumber ?? "-"})`
                          : "Pilih personel";
                      })()}
                    </SelectValue>
                  </SelectTrigger>

                  <SelectContent className={`w-full`}>
                    {users.map((off) => (
                      <SelectItem key={off.id} value={off.id}>
                        {off.fullName} - {off.role?.name} (
                        {off.employeeNumber || "-"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <p className="text-[11px] text-muted-foreground">
                  Pos Penugasan:{" "}
                  <span className="font-semibold text-slate-700">
                    {selectedOfficer?.role?.name || "Security"}
                  </span>
                </p>
              </div>

              {/* JENIS IZIN */}
              <div className="space-y-2">
                <Label htmlFor="leaveType" className="text-xs">
                  Jenis Izin
                  <span className="ml-1 text-rose-500">*</span>
                </Label>

                <Select
                  value={leaveType}
                  onValueChange={(value) => setLeaveType(value as AbsenceType)}
                >
                  <SelectTrigger id="leaveType" className="w-full">
                    <SelectValue placeholder="Pilih jenis ketidakhadiran" />
                  </SelectTrigger>

                  <SelectContent className={`w-full`}>
                    <SelectItem value="CUTI">Cuti Tahunan</SelectItem>
                    <SelectItem value="IZIN">
                      Izin Urusan Penting / Keluarga
                    </SelectItem>
                    <SelectItem value="SAKIT">
                      Sakit (Dengan Keterangan Dokter)
                    </SelectItem>
                    <SelectItem value="ALPHA">
                      Dispensasi Pelatihan / Dinas Luar
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

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

                  <DatePicker
                    value={
                      startDate ? new Date(`${startDate}T00:00:00`) : undefined
                    }
                    onChange={(date) => {
                      if (!date) return;
                      setStartDate(format(date, "yyyy-MM-dd"));
                      setFormError(null);
                      setSuccessMessage(null);
                    }}
                    placeholder="Pilih tanggal mulai"
                    className="w-full rounded"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="endDate"
                    className="text-xs text-muted-foreground"
                  >
                    Tanggal Selesai
                  </Label>

                  <DatePicker
                    value={
                      endDate ? new Date(`${endDate}T00:00:00`) : undefined
                    }
                    onChange={(date) => {
                      if (!date) return;
                      setEndDate(format(date, "yyyy-MM-dd"));
                      setFormError(null);
                      setSuccessMessage(null);
                    }}
                    placeholder="Pilih tanggal selesai"
                    className="w-full rounded"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="backupOfficer" className="text-xs">
                Petugas Cadangan / Pengganti
                <span className="ml-1 text-rose-500">*</span>
              </Label>

              <Select
                value={backupOfficerId}
                onValueChange={(value) => setBackupOfficerId(value ?? "")}
                disabled={isUsersLoading || isUsersError}
              >
                <SelectTrigger id="backupOfficer" className="w-full">
                  <SelectValue placeholder="Pilih personel">
                    {(() => {
                      const selectedUser = users.find(
                        (user) => user.id === backupOfficerId,
                      );

                      return selectedUser
                        ? `${selectedUser.fullName} - ${selectedUser.role?.name ?? "-"} (${selectedUser.employeeNumber ?? "-"})`
                        : "Pilih personel";
                    })()}
                  </SelectValue>
                </SelectTrigger>

                <SelectContent className={`w-full`}>
                  {availableBackupOfficers.map((off) => (
                    <SelectItem key={off.id} value={off.id}>
                      {off.fullName ?? "Security"} (
                      {off.role?.name ?? "Security"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <p className="text-[11px] text-muted-foreground">
                Petugas ini akan menggantikan{" "}
                <span className="font-semibold text-slate-700">
                  {selectedOfficer?.fullName || "security pemohon"}
                </span>{" "}
                pada periode {startDate || "-"} s/d {endDate || "-"} di Kalender
                Shift.
              </p>
            </div>

            {/* REASON */}
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

            {/* ACTIONS */}
            <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" onClick={handleReset}>
                Reset
              </Button>

              <Button
                type="submit"
                disabled={
                  createAbsence.isPending ||
                  isUsersLoading ||
                  isUsersError ||
                  users.length === 0 ||
                  !selectedOfficer ||
                  !selectedBackup
                }
                className="bg-amber-600 text-white hover:bg-amber-700"
              >
                <ClipboardCheck className="mr-1.5 size-4" />

                {createAbsence.isPending
                  ? "Menyimpan..."
                  : "Setujui & Terapkan ke Kalender"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
