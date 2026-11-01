import { format } from "date-fns";
import {
  AlertCircle,
  ArrowLeftRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  History,
  Info,
  UserMinus,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import axios from "axios";
import { toast } from "sonner";
import { formatDate, formatTime } from "../helpers/dateTime";
import { unwrapArray } from "../helpers/unwrapArray";
import { useGetScheduleAssignments } from "../hooks/schedule/usePatrolScheduleAssignment";
import { usePatrolSchedules } from "../hooks/schedule/usePatrolSchedules";
import {
  useChangeShift,
  useShiftChanges,
} from "../hooks/schedule/useShiftChange";
import { useActiveUsers } from "../hooks/users/useUsers";
import {
  PatrolSchedule,
  ScheduleAssignmentDetailResponse,
  UserResponse,
} from "../types";
import type {
  ShiftChange,
  ShiftChangeResponse,
} from "../types/schedule/shift-change";
import { DatePicker } from "./DatePicker";
import type { NavTab } from "./Sidebar";

interface TukarShiftViewProps {
  onNavigate: (tab: NavTab) => void;
}

const getTodayLocalDate = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};

const getShiftBadgeClass = (shiftName?: string) => {
  const value = (shiftName ?? "").toLowerCase();
  if (value.includes("pagi"))
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (value.includes("siang"))
    return "border-blue-200 bg-blue-50 text-blue-700";
  if (value.includes("malam"))
    return "border-purple-200 bg-purple-50 text-purple-700";
  return "border-muted bg-muted text-muted-foreground";
};

const getRoleName = (role?: UserResponse["role"]) => {
  if (typeof role === "string") return role;
  return role?.name ?? "-";
};

const isAssignmentActiveOnDate = (
  assignment: ScheduleAssignmentDetailResponse,
  selectedDate: string,
) => {
  if (assignment.status && assignment.status !== "ACTIVE") return false;

  const startDate = assignment.startDate
    ? String(assignment.startDate).slice(0, 10)
    : null;
  const endDate = assignment.endDate
    ? String(assignment.endDate).slice(0, 10)
    : null;

  if (startDate && selectedDate < startDate) return false;
  if (endDate && selectedDate > endDate) return false;
  return true;
};

const getAssignmentLabel = (
  assignment: ScheduleAssignmentDetailResponse,
  usersById: Map<string, UserResponse>,
  schedulesById: Map<string, PatrolSchedule>,
) => {
  const user =
    (assignment.userId && usersById.get(assignment.userId)) || assignment.user;
  const schedule =
    (assignment.scheduleId && schedulesById.get(assignment.scheduleId)) ||
    assignment.schedule;

  const personName = user?.fullName ?? user?.username ?? "Personel";
  const employeeNumber = user?.employeeNumber
    ? ` (${user.employeeNumber})`
    : "";
  const shiftName = schedule?.name ?? "Shift";
  const start = formatTime(schedule?.startTime);
  const end = formatTime(schedule?.endTime);
  const time = start && end ? ` · ${start} - ${end}` : "";

  return `${personName}${employeeNumber} — ${shiftName}${time}`;
};

export const TukarShiftView: React.FC<TukarShiftViewProps> = ({
  onNavigate,
}) => {
  const { data: usersData, isLoading: isUsersLoading } = useActiveUsers();
  const { data: schedulesData, isLoading: isSchedulesLoading } =
    usePatrolSchedules();
  const { data: assignmentsData, isLoading: isAssignmentsLoading } =
    useGetScheduleAssignments();

  const [selectedDate, setSelectedDate] = useState(getTodayLocalDate);
  const [firstAssignmentId, setFirstAssignmentId] = useState("");
  const [secondAssignmentId, setSecondAssignmentId] = useState("");
  const [reason, setReason] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    data: shiftChangesData,
    isLoading: isHistoryLoading,
    isError: isHistoryError,
    refetch: refetchHistory,
  } = useShiftChanges({ effectiveDate: selectedDate });

  const changeShiftMutation = useChangeShift();

  const users = useMemo(
    () => unwrapArray<UserResponse>(usersData),
    [usersData],
  );
  console.log(users);

  const schedules = useMemo(
    () => unwrapArray<PatrolSchedule>(schedulesData),
    [schedulesData],
  );
  const assignments = useMemo(
    () => unwrapArray<ScheduleAssignmentDetailResponse>(assignmentsData),
    [assignmentsData],
  );
  const shiftChanges = useMemo(
    () => unwrapArray<ShiftChangeResponse>(shiftChangesData),
    [shiftChangesData],
  );

  const usersById = useMemo(
    () => new Map(users.map((user) => [user.id, user])),
    [users],
  );
  const schedulesById = useMemo(
    () => new Map(schedules.map((schedule) => [schedule.id, schedule])),
    [schedules],
  );

  const availableAssignments = useMemo(
    () =>
      assignments.filter(
        (assignment) =>
          isAssignmentActiveOnDate(assignment, selectedDate) &&
          Boolean(
            (assignment.userId && usersById.has(assignment.userId)) ||
            assignment.user,
          ) &&
          Boolean(
            (assignment.scheduleId &&
              schedulesById.has(assignment.scheduleId)) ||
            assignment.schedule,
          ),
      ),
    [assignments, selectedDate, usersById, schedulesById],
  );

  const firstAssignment = availableAssignments.find(
    (assignment) => assignment.id === firstAssignmentId,
  );
  const secondAssignment = availableAssignments.find(
    (assignment) => assignment.id === secondAssignmentId,
  );

  const firstUser =
    (firstAssignment?.userId && usersById.get(firstAssignment.userId)) ||
    firstAssignment?.user;

  const secondUser =
    (secondAssignment?.userId && usersById.get(secondAssignment.userId)) ||
    secondAssignment?.user;

  const firstSchedule =
    (firstAssignment?.scheduleId &&
      schedulesById.get(firstAssignment.scheduleId)) ||
    firstAssignment?.schedule;
  const secondSchedule =
    (secondAssignment?.scheduleId &&
      schedulesById.get(secondAssignment.scheduleId)) ||
    secondAssignment?.schedule;

  const isSameAssignment = firstAssignmentId === secondAssignmentId;
  const isSameUser = Boolean(firstUser?.id) && firstUser?.id === secondUser?.id;
  const isSameShift =
    Boolean(firstSchedule?.id) && firstSchedule?.id === secondSchedule?.id;

  useEffect(() => {
    if (
      firstAssignmentId &&
      !availableAssignments.some((item) => item.id === firstAssignmentId)
    ) {
      setFirstAssignmentId("");
    }
    if (
      secondAssignmentId &&
      !availableAssignments.some((item) => item.id === secondAssignmentId)
    ) {
      setSecondAssignmentId("");
    }
  }, [availableAssignments, firstAssignmentId, secondAssignmentId]);

  const handleResetForm = () => {
    setSelectedDate(getTodayLocalDate());
    setFirstAssignmentId("");
    setSecondAssignmentId("");
    setReason("");
    setFormError(null);
    setSuccessMessage(null);
  };

  const handleSubmitSwap = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedDate) {
      toast.error("Tanggal pertukaran shift wajib dipilih.");
      return;
    }

    if (!firstAssignmentId || !secondAssignmentId) {
      toast.error("Kedua assignment personel wajib dipilih.");
      return;
    }

    if (isSameAssignment || isSameUser) {
      toast.error("Pilih dua assignment dari personel yang berbeda.");
      return;
    }

    if (isSameShift) {
      toast.error("Kedua personel harus memiliki jadwal shift berbeda.");
      return;
    }

    if (!reason.trim()) {
      toast.error("Alasan pertukaran jaga wajib dicantumkan.");
      return;
    }

    try {
      const payload = {
        firstAssignmentId,
        secondAssignmentId,
        effectiveDate: selectedDate,
        reason: reason.trim(),
      } as ShiftChange;

      await changeShiftMutation.mutateAsync(payload);

      const firstName =
        firstUser?.fullName ?? firstUser?.username ?? "Petugas 1";

      const secondName =
        secondUser?.fullName ?? secondUser?.username ?? "Petugas 2";

      toast.success("Pertukaran shift berhasil diajukan", {
        description: `${firstName} bertukar dengan ${secondName} pada ${formatDate(selectedDate)}.`,
      });

      setReason("");
      await refetchHistory();
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message
        : error instanceof Error
          ? error.message
          : "Gagal mengajukan pertukaran shift.";

      toast.error("Gagal mengajukan pertukaran shift", {
        description: Array.isArray(message) ? message.join(", ") : message,
      });
    }
  };

  const isInitialLoading =
    isUsersLoading || isSchedulesLoading || isAssignmentsLoading;
  const isSubmitting = changeShiftMutation.isPending;

  const selectedFirstAssignment = availableAssignments.find(
    (assignment) => assignment.id === firstAssignmentId,
  );

  const selectedSecondAssignment = availableAssignments.find(
    (assignment) => assignment.id === secondAssignmentId,
  );

  return (
    <div className="space-y-5">
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
            className="rounded text-black bg-[#FED400] hover:bg-[#e9c300]"
            onClick={() => onNavigate("cuti-izin")}
          >
            <UserMinus className="size-4" />
            Cuti &amp; Izin
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="space-y-5 rounded border bg-background p-4 sm:p-5 xl:col-span-2">
          <div className="flex items-center gap-2 border-b pb-3">
            <ArrowLeftRight className="size-5 text-primary" />
            <div>
              <h2 className="text-sm font-semibold">
                Formulir Pertukaran Shift
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Pilih dua assignment personel yang akan saling ditukar.
              </p>
            </div>
          </div>

          {formError && (
            <Alert variant="destructive" className="rounded">
              <AlertCircle className="size-4" />
              <AlertDescription className="text-xs">
                {formError}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmitSwap} className="space-y-5">
            <div className="space-y-2">
              <Label>
                Tanggal Pertukaran <span className="text-destructive">*</span>
              </Label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <DatePicker
                  value={
                    selectedDate
                      ? new Date(`${selectedDate}T00:00:00`)
                      : undefined
                  }
                  onChange={(date) => {
                    if (!date) return;
                    setSelectedDate(format(date, "yyyy-MM-dd"));
                    setFormError(null);
                    setSuccessMessage(null);
                  }}
                  placeholder="Pilih tanggal pertukaran"
                  className="w-full rounded sm:w-52"
                />
                <Badge
                  variant="outline"
                  className="w-fit h-8 rounded border-emerald-200 bg-emerald-50 text-emerald-700"
                >
                  <CheckCircle2 className="mr-1 size-4" />
                  {availableAssignments.length} Assignment tersedia
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-blue-600" />
                    <h3 className="text-xs font-semibold">Petugas Pemohon</h3>
                  </div>
                  {firstSchedule && (
                    <Badge
                      variant="outline"
                      className={`rounded text-[10px] ${getShiftBadgeClass(
                        firstSchedule.name,
                      )}`}
                    >
                      {firstSchedule.name}
                    </Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="first-assignment" className="text-xs">
                    Personel &amp; Shift
                  </Label>
                  <Select
                    value={firstAssignmentId}
                    onValueChange={(value) => {
                      setFirstAssignmentId(value ?? "");
                      setFormError(null);
                    }}
                    disabled={
                      isInitialLoading || availableAssignments.length === 0
                    }
                  >
                    <SelectTrigger
                      id="first-assignment"
                      className="w-full rounded"
                    >
                      <SelectValue placeholder="Pilih personel dan shift">
                        {selectedFirstAssignment
                          ? getAssignmentLabel(
                              selectedFirstAssignment,
                              usersById,
                              schedulesById,
                            )
                          : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className={`w-full`}>
                      {availableAssignments.map((assignment) => (
                        <SelectItem
                          key={assignment.id}
                          value={assignment.id}
                          disabled={assignment.id === secondAssignmentId}
                        >
                          {getAssignmentLabel(
                            assignment,
                            usersById,
                            schedulesById,
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded border bg-muted/30 p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Informasi Assignment
                  </p>
                  <p className="mt-1 text-xs font-semibold text-foreground">
                    {firstUser?.fullName ??
                      firstUser?.username ??
                      "Belum dipilih"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {getRoleName(firstUser?.role)} ·{" "}
                    {firstUser?.employeeNumber ?? "-"}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Shift: {firstSchedule?.name ?? "-"}
                    {firstSchedule?.startTime && firstSchedule?.endTime
                      ? ` (${formatTime(firstSchedule.startTime)} - ${formatTime(
                          firstSchedule.endTime,
                        )})`
                      : ""}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-purple-600" />
                    <h3 className="text-xs font-semibold">Petugas Penukar</h3>
                  </div>
                  {secondSchedule && (
                    <Badge
                      variant="outline"
                      className={`rounded text-[10px] ${getShiftBadgeClass(
                        secondSchedule.name,
                      )}`}
                    >
                      {secondSchedule.name}
                    </Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="second-assignment" className="text-xs">
                    Personel &amp; Shift
                  </Label>
                  <Select
                    value={secondAssignmentId}
                    onValueChange={(value) => {
                      setSecondAssignmentId(value ?? "");
                      setFormError(null);
                    }}
                    disabled={
                      isInitialLoading || availableAssignments.length === 0
                    }
                  >
                    <SelectTrigger
                      id="second-assignment"
                      className="w-full rounded"
                    >
                      <SelectValue placeholder="Pilih personel dan shift">
                        {selectedSecondAssignment
                          ? getAssignmentLabel(
                              selectedSecondAssignment,
                              usersById,
                              schedulesById,
                            )
                          : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className={`w-full`}>
                      {availableAssignments.map((assignment) => (
                        <SelectItem
                          key={assignment.id}
                          value={assignment.id}
                          disabled={assignment.id === firstAssignmentId}
                        >
                          {getAssignmentLabel(
                            assignment,
                            usersById,
                            schedulesById,
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded border bg-muted/30 p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Informasi Assignment
                  </p>
                  <p className="mt-1 text-xs font-semibold text-foreground">
                    {secondUser?.fullName ??
                      secondUser?.username ??
                      "Belum dipilih"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {getRoleName(secondUser?.role)} ·{" "}
                    {secondUser?.employeeNumber ?? "-"}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Shift: {secondSchedule?.name ?? "-"}
                    {secondSchedule?.startTime && secondSchedule?.endTime
                      ? ` (${formatTime(secondSchedule.startTime)} - ${formatTime(
                          secondSchedule.endTime,
                        )})`
                      : ""}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

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

            <div className="flex flex-col-reverse justify-end gap-2 border-t pt-4 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="rounded"
                onClick={handleResetForm}
                disabled={isSubmitting}
              >
                Reset Form
              </Button>
              <Button
                type="submit"
                className="rounded"
                disabled={
                  isInitialLoading ||
                  isSubmitting ||
                  !firstAssignmentId ||
                  !secondAssignmentId ||
                  isSameAssignment ||
                  isSameUser ||
                  isSameShift ||
                  !reason.trim()
                }
              >
                <ArrowLeftRight className="size-4" />
                {isSubmitting ? "Memproses..." : "Terapkan Pertukaran Shift"}
              </Button>
            </div>
          </form>

          {isInitialLoading && (
            <p className="text-xs text-muted-foreground">
              Memuat data personel, jadwal, dan assignment...
            </p>
          )}
          {!isInitialLoading && availableAssignments.length === 0 && (
            <Alert className="rounded">
              <Info className="size-4" />
              <AlertDescription className="text-xs">
                Tidak ada assignment aktif untuk tanggal yang dipilih.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-3 rounded border bg-background p-4">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="size-4 text-primary" />
              <h3 className="text-sm font-semibold">
                Preview Pertukaran Shift
              </h3>
            </div>
            <Separator />
            {!firstAssignment || !secondAssignment ? (
              <p className="text-xs text-muted-foreground">
                Pilih dua assignment untuk melihat preview pertukaran.
              </p>
            ) : isSameUser || isSameShift ? (
              <p className="text-xs text-rose-600">
                {isSameUser
                  ? "Pilih dua personel yang berbeda."
                  : "Pilih dua jadwal shift yang berbeda."}
              </p>
            ) : (
              <div className="space-y-2 text-xs text-cyan-900">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">
                    {firstUser?.fullName ?? firstUser?.username}
                  </span>
                  <Badge
                    variant="outline"
                    className={`rounded text-[10px] ${getShiftBadgeClass(
                      firstSchedule?.name,
                    )}`}
                  >
                    {firstSchedule?.name}
                  </Badge>
                  <ArrowLeftRight className="size-3.5" />
                  <Badge
                    variant="outline"
                    className={`rounded text-[10px] ${getShiftBadgeClass(
                      secondSchedule?.name,
                    )}`}
                  >
                    {secondSchedule?.name}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">
                    {secondUser?.fullName ?? secondUser?.username}
                  </span>
                  <Badge
                    variant="outline"
                    className={`rounded text-[10px] ${getShiftBadgeClass(
                      secondSchedule?.name,
                    )}`}
                  >
                    {secondSchedule?.name}
                  </Badge>
                  <ArrowLeftRight className="size-3.5" />
                  <Badge
                    variant="outline"
                    className={`rounded text-[10px] ${getShiftBadgeClass(
                      firstSchedule?.name,
                    )}`}
                  >
                    {firstSchedule?.name}
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

          <div className="space-y-3 rounded border bg-[#101b35] p-4 text-white">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-blue-300" />
              <h3 className="text-xs font-semibold">Jadwal Shift</h3>
            </div>
            <Separator className="bg-white/15" />
            {schedules.length > 0 ? (
              <div className="space-y-3">
                {schedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="text-slate-300">{schedule.name}</span>
                    <span className="font-mono font-medium text-white">
                      {formatTime(schedule.startTime) || "-"} -{" "}
                      {formatTime(schedule.endTime) || "-"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-300">
                Data jadwal shift belum tersedia.
              </p>
            )}
            <p className="text-[10px] text-slate-400">
              Waktu mengikuti konfigurasi jadwal dari backend.
            </p>
          </div>

          <Alert className="rounded">
            <Info className="size-4" />
            <AlertDescription className="text-xs leading-relaxed">
              Pastikan kedua personel telah menyetujui pertukaran sebelum
              perubahan diterapkan pada kalender operasional.
            </AlertDescription>
          </Alert>
        </div>
      </div>

      <div className="overflow-hidden rounded border bg-background">
        <div className="flex flex-col justify-between gap-2 border-b px-4 py-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <History className="size-4 text-primary" />
            <div>
              <h3 className="text-sm font-semibold">
                Riwayat Pertukaran Shift
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Catatan transaksi pertukaran shift dari backend.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="w-fit rounded">
              {shiftChanges.length} Transaksi
            </Badge>
            <Button
              size="sm"
              variant="outline"
              className="h-8 rounded"
              onClick={() => refetchHistory()}
              disabled={isHistoryLoading}
            >
              Muat ulang
            </Button>
          </div>
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
              {isHistoryLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-xs">
                    Memuat riwayat pertukaran shift...
                  </TableCell>
                </TableRow>
              ) : isHistoryError ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="size-6 text-destructive" />
                      <p className="text-xs font-medium">
                        Gagal mengambil riwayat pertukaran.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => refetchHistory()}
                      >
                        Coba lagi
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : shiftChanges.length > 0 ? (
                shiftChanges.map((record) => {
                  const firstRecordUser = record.firstAssignment?.user;
                  const secondRecordUser = record.secondAssignment?.user;
                  const firstRecordSchedule = record.firstAssignment?.schedule;
                  const secondRecordSchedule =
                    record.secondAssignment?.schedule;

                  return (
                    <TableRow key={record.id}>
                      <TableCell className="whitespace-nowrap font-mono text-xs font-medium text-primary">
                        {record.id}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs font-medium">
                        {formatDate(record.effectiveDate)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-foreground">
                            {firstRecordUser?.fullName ??
                              firstRecordUser?.username ??
                              "-"}
                          </p>
                          <Badge
                            variant="outline"
                            className={`rounded text-[10px] ${getShiftBadgeClass(
                              firstRecordSchedule?.name,
                            )}`}
                          >
                            {firstRecordSchedule?.name ?? "Shift -"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <ArrowLeftRight className="mx-auto size-4 text-cyan-600" />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-foreground">
                            {secondRecordUser?.fullName ??
                              secondRecordUser?.username ??
                              "-"}
                          </p>
                          <Badge
                            variant="outline"
                            className={`rounded text-[10px] ${getShiftBadgeClass(
                              secondRecordSchedule?.name,
                            )}`}
                          >
                            {secondRecordSchedule?.name ?? "Shift -"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p
                          className="max-w-56 truncate text-xs text-muted-foreground"
                          title={record.reason ?? ""}
                        >
                          {record.reason || "-"}
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
                            {record.approvedAt
                              ? `Disetujui: ${formatDate(record.approvedAt)}`
                              : record.approvedById
                                ? `Approver: ${record.approvedById}`
                                : "Belum disetujui"}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
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
            Menampilkan {shiftChanges.length} riwayat pertukaran shift untuk
            tanggal {formatDate(selectedDate)}.
          </p>
        </div>
      </div>
    </div>
  );
};
