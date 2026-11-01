import {
  AlertCircle,
  ArrowLeftRight,
  CalendarDays,
  CalendarPlus,
  CalendarRange,
  Check,
  ChevronLeft,
  ChevronRight,
  MapPin,
  PersonStanding,
  UserMinus,
  UserPlus,
  X,
} from "lucide-react";

import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import { NavTab } from "./Sidebar";

import {
  useMonthlyRoster,
  usePatrolSchedules,
} from "../hooks/schedule/usePatrolSchedules";

import { useSecurityUsers } from "../hooks/users/useUsers";

import {
  useCreateScheduleAssignment,
  useUnassignScheduleAssignment,
} from "../hooks/schedule/usePatrolScheduleAssignment";

import type {
  DayItem,
  RosterOfficer,
  RosterUser,
  Schedule,
  SecurityUser,
  ShiftItem,
} from "../types";

interface KalenderShiftViewProps {
  onNavigate: (tab: NavTab) => void;
  siteId: string;
}

const SHIFT_COLORS = [
  {
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    selected: "border-emerald-200 bg-emerald-50/50",
  },
  {
    color: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
    selected: "border-blue-200 bg-blue-50/50",
  },
  {
    color: "bg-purple-50 text-purple-700 border-purple-200",
    dot: "bg-purple-500",
    selected: "border-purple-200 bg-purple-50/50",
  },
  {
    color: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    selected: "border-amber-200 bg-amber-50/50",
  },
];

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatTime = (value?: string | null) => {
  if (!value) return "-";

  if (/^\d{2}:\d{2}/.test(value)) {
    return value.substring(0, 5);
  }

  const date = new Date(value);

  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  return value;
};

const getScheduleTime = (schedule: Schedule) => {
  return `${formatTime(schedule.startTime)} - ${formatTime(schedule.endTime)}`;
};

const getMonthLabel = (date: Date) =>
  new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(date);

const getDayLabel = (date: Date) =>
  new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

const getShiftColor = (index: number) =>
  SHIFT_COLORS[index % SHIFT_COLORS.length];

const getScheduleId = (shift: ShiftItem) => shift.scheduleId;

const getErrorMessage = (error: unknown): string => {
  if (typeof error === "string") {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data;

    const message =
      responseData?.message ?? responseData?.error ?? responseData?.detail;

    if (Array.isArray(message)) {
      return message.join(", ");
    }

    if (typeof message === "string" && message.trim()) {
      return message;
    }

    if (error.response?.status === 400) {
      return "Data yang dikirim tidak valid.";
    }

    if (error.response?.status === 401) {
      return "Sesi login berakhir. Silakan login kembali.";
    }

    if (error.response?.status === 403) {
      return "Kamu tidak memiliki izin untuk melakukan tindakan ini.";
    }

    if (error.response?.status === 404) {
      return "Data yang diminta tidak ditemukan.";
    }

    if (error.response?.status === 409) {
      return "Terjadi konflik penugasan. Security mungkin sudah memiliki jadwal pada waktu tersebut.";
    }

    if (error.response?.status === 422) {
      return "Data tidak dapat diproses oleh server.";
    }

    if (error.response && error.response.status >= 500) {
      return "Terjadi kesalahan pada server. Silakan coba kembali.";
    }

    if (error.code === "ERR_NETWORK") {
      return "Tidak dapat terhubung ke server. Periksa koneksi internet.";
    }

    return error.message || "Gagal menghubungi server.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Terjadi kesalahan yang tidak diketahui.";
};

const normalizeArrayResponse = <T,>(response: unknown): T[] => {
  if (Array.isArray(response)) {
    return response as T[];
  }

  if (!response || typeof response !== "object") {
    return [];
  }

  const result = response as any;

  const data = result?.data?.data ?? result?.data ?? result?.items ?? [];

  return Array.isArray(data) ? data : [];
};

export const KalenderShiftView: React.FC<KalenderShiftViewProps> = ({
  onNavigate,
  siteId,
}) => {
  const [currentMonthDate, setCurrentMonthDate] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );

  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));

  const [assignModalShift, setAssignModalShift] = useState<{
    date: string;
    shift: ShiftItem;
  } | null>(null);

  const [selectedOfficerId, setSelectedOfficerId] = useState("");

  const month = currentMonthDate.getMonth() + 1;
  const year = currentMonthDate.getFullYear();

  const {
    data: usersData,
    isLoading: usersLoading,
    isError: usersError,
    error: usersErrorObject,
  } = useSecurityUsers();

  const users: SecurityUser[] = useMemo(() => {
    return normalizeArrayResponse<SecurityUser>(usersData);
  }, [usersData]);

  const {
    data: schedulesResponse,
    isLoading: schedulesLoading,
    isError: schedulesError,
    error: schedulesErrorObject,
  } = usePatrolSchedules();

  const schedules: Schedule[] = useMemo(() => {
    return normalizeArrayResponse<Schedule>(schedulesResponse);
  }, [schedulesResponse]);

  const {
    data: rosterResponse,
    isLoading: rosterLoading,
    isError: rosterError,
    error: rosterErrorObject,
  } = useMonthlyRoster({
    siteId,
    month,
    year,
  });

  const roster: RosterUser[] = useMemo(() => {
    return normalizeArrayResponse<RosterUser>(rosterResponse);
  }, [rosterResponse]);

  const assignMutation = useCreateScheduleAssignment();

  const unassignMutation = useUnassignScheduleAssignment();

  useEffect(() => {
    if (!usersError) return;

    toast.error("Gagal mengambil data security", {
      description: getErrorMessage(usersErrorObject),
      duration: 6000,
    });
  }, [usersError, usersErrorObject]);

  useEffect(() => {
    if (!schedulesError) return;

    toast.error("Gagal mengambil data shift", {
      description: getErrorMessage(schedulesErrorObject),
      duration: 6000,
    });
  }, [schedulesError, schedulesErrorObject]);

  useEffect(() => {
    if (!rosterError) return;

    toast.error("Gagal mengambil data roster", {
      description: getErrorMessage(rosterErrorObject),
      duration: 6000,
    });
  }, [rosterError, rosterErrorObject]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    const startOffset = (firstDay.getDay() + 6) % 7;

    const result: (DayItem | null)[] = [];

    for (let i = 0; i < startOffset; i++) {
      result.push(null);
    }

    const today = formatDate(new Date());

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = formatDate(new Date(year, month - 1, day));

      const shifts: ShiftItem[] = schedules.map((schedule) => {
        const officers: RosterOfficer[] = [];

        roster.forEach((user) => {
          const entries = user.dates?.[date] ?? [];

          entries.forEach((entry: any) => {
            if (
              entry.scheduleId === schedule.id &&
              (entry.type === "ASSIGNMENT" || entry.type === "REPLACEMENT")
            ) {
              const assignmentId =
                entry.type === "REPLACEMENT"
                  ? entry.replacementId
                  : entry.assignmentId;

              if (!assignmentId) return;

              officers.push({
                assignmentId,
                officerId: user.userId,
                officerName: user.fullName,
                employeeNumber: user.employeeNumber,
                scheduleId: schedule.id,
                scheduleName: schedule.name,
                startTime: entry.startTime ?? schedule.startTime,
                endTime: entry.endTime ?? schedule.endTime,
                type: entry.type,
              });
            }
          });
        });

        return {
          scheduleId: schedule.id,
          type: schedule.name,
          time: getScheduleTime(schedule),
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          officers,
          count: officers.length,
          required: 1,
          squad: schedule.name,
          danru: "-",
          sector: "-",
        };
      });

      result.push({
        day,
        date,
        isToday: date === today,
        shifts,
      });
    }

    return result;
  }, [month, year, schedules, roster]);

  const activeDayObj = calendarDays.find((item) => item?.date === selectedDate);

  const assignedOfficerIds = useMemo(() => {
    if (!assignModalShift) return [];

    return assignModalShift.shift.officers.map((officer) => officer.officerId);
  }, [assignModalShift]);

  const availableOfficers = useMemo(() => {
    return users.filter((user) => !assignedOfficerIds.includes(user.id));
  }, [users, assignedOfficerIds]);

  const handlePreviousMonth = () => {
    const next = new Date(year, month - 2, 1);

    setCurrentMonthDate(next);
    setSelectedDate(formatDate(next));
  };

  const handleNextMonth = () => {
    const next = new Date(year, month, 1);

    setCurrentMonthDate(next);
    setSelectedDate(formatDate(next));
  };

  const handleToday = () => {
    const today = new Date();

    setCurrentMonthDate(new Date(today.getFullYear(), today.getMonth(), 1));

    setSelectedDate(formatDate(today));
  };

  const handleOpenAssignModal = (date: string, shift: ShiftItem) => {
    setAssignModalShift({ date, shift });

    const available = users.find(
      (user) =>
        !shift.officers.some((officer) => officer.officerId === user.id),
    );

    setSelectedOfficerId(available?.id ?? "");
  };

  const handleCloseAssignModal = () => {
    if (assignMutation.isPending) return;

    setAssignModalShift(null);
    setSelectedOfficerId("");
  };

  const handleSaveAssignModal = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!assignModalShift) {
      toast.error("Shift belum dipilih.");
      return;
    }

    if (!selectedOfficerId) {
      toast.error("Pilih security terlebih dahulu.");
      return;
    }

    const { date, shift } = assignModalShift;

    const selectedOfficer = users.find((user) => user.id === selectedOfficerId);

    assignMutation.mutate(
      {
        scheduleId: getScheduleId(shift),
        payload: {
          userId: selectedOfficerId,
          startDate: date,
          endDate: date,
        },
      },
      {
        onSuccess: () => {
          toast.success("Security berhasil ditugaskan", {
            description: `${
              selectedOfficer?.fullName ?? "Security"
            } berhasil ditambahkan ke shift ${shift.type} tanggal ${date}.`,
          });

          setAssignModalShift(null);
          setSelectedOfficerId("");
        },

        onError: (error) => {
          toast.error("Gagal menugaskan security", {
            description: getErrorMessage(error),
            duration: 6000,
          });
        },
      },
    );
  };

  const handleUnassignOfficer = (shift: ShiftItem, officer: RosterOfficer) => {
    if (officer.type === "REPLACEMENT") {
      toast.warning("Tidak dapat melepas security pengganti", {
        description:
          "Security pengganti harus dilepas melalui pengelolaan penggantian shift.",
      });

      return;
    }

    unassignMutation.mutate(
      {
        scheduleId: shift.scheduleId,
        assignmentId: officer.assignmentId,
      },
      {
        onSuccess: () => {
          toast.success("Security berhasil dilepas", {
            description: `${officer.officerName} telah dilepas dari shift ${shift.type}.`,
          });
        },

        onError: (error) => {
          toast.error("Gagal melepas security", {
            description: getErrorMessage(error),
            duration: 6000,
          });
        },
      },
    );
  };

  const isLoading = rosterLoading || schedulesLoading;

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 border-b pb-4 lg:flex-row lg:items-end">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">
            Kalender Shift &amp; Giliran Jaga
          </h1>

          <p className="max-w-2xl text-xs text-muted-foreground">
            Matriks penugasan shift, rotasi regu pengamanan, dan alokasi
            security per hari operasional.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            className="rounded bg-amber-600 text-white hover:bg-amber-700"
            onClick={() => onNavigate("tambah-jadwal")}
          >
            <CalendarPlus className="size-4" />
            Tambah Shift
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="rounded"
            onClick={() => onNavigate("tukar-shift")}
          >
            <ArrowLeftRight className="size-4" />
            Tukar Shift
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

          <Separator
            orientation="vertical"
            className="mx-1 hidden h-7 sm:block"
          />

          <div className="inline-flex items-center rounded border bg-muted/40 p-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 rounded text-xs text-muted-foreground"
              onClick={() => onNavigate("jadwal")}
            >
              <CalendarRange className="size-4" />
              Tabel
            </Button>

            <Button
              size="sm"
              variant="secondary"
              className="h-8 rounded text-xs"
            >
              <CalendarDays className="size-4" />
              Kalender
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded border bg-background px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="text-xs font-semibold">Shift:</span>

          {schedules.map((schedule, index) => {
            const config = getShiftColor(index);

            return (
              <div key={schedule.id} className="flex items-center gap-2">
                <span className={`size-2.5 rounded ${config.dot}`} />

                <span className="text-xs text-muted-foreground">
                  {schedule.name} ({getScheduleTime(schedule)})
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs"
            onClick={() => onNavigate("tambah-jadwal")}
          >
            <CalendarPlus className="size-3.5" />
            Plotting Shift Baru
          </Button>

          <div className="flex items-center gap-1.5 text-xs text-rose-600">
            <span className="size-2 rounded-full bg-rose-500" />
            Kekurangan Security
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="rounded border bg-background p-8 text-center text-sm text-muted-foreground">
          Memuat data kalender shift...
        </div>
      )}

      {!isLoading && schedulesError && (
        <div className="rounded border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4" />
            Gagal mengambil data shift: {getErrorMessage(schedulesErrorObject)}
          </div>
        </div>
      )}

      {!isLoading && rosterError && (
        <div className="rounded border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4" />
            Gagal mengambil data roster: {getErrorMessage(rosterErrorObject)}
          </div>
        </div>
      )}

      {!isLoading && !rosterError && !schedulesError && (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-4">
          <div className="overflow-hidden self-baseline rounded border bg-background xl:col-span-3">
            <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="size-4 text-primary" />

                <span className="text-sm font-semibold">
                  {getMonthLabel(currentMonthDate)}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="size-7 rounded"
                  onClick={handlePreviousMonth}
                  aria-label="Bulan sebelumnya"
                >
                  <ChevronLeft className="size-4" />
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 rounded text-xs"
                  onClick={handleToday}
                >
                  Hari ini
                </Button>

                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="size-7 rounded"
                  onClick={handleNextMonth}
                  aria-label="Bulan berikutnya"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 border-b bg-muted/30 text-center">
              {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map(
                (day, index) => (
                  <div
                    key={day}
                    className={`py-2.5 text-[11px] font-semibold ${
                      index >= 5 ? "text-rose-600" : "text-muted-foreground"
                    }`}
                  >
                    {day}
                  </div>
                ),
              )}
            </div>

            <div className="grid auto-rows-fr grid-cols-7">
              {calendarDays.map((item, index) => {
                if (!item) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="min-h-28 border-b border-r bg-muted/10"
                    />
                  );
                }

                const isSelected = selectedDate === item.date;

                const hasShortage = item.shifts.some(
                  (shift) => shift.count < shift.required,
                );

                return (
                  <button
                    key={item.date}
                    type="button"
                    onClick={() => setSelectedDate(item.date)}
                    className={`flex min-h-28 flex-col justify-between border-b border-r p-2 text-left transition-colors ${
                      isSelected
                        ? "bg-primary/5 ring-2 ring-inset ring-primary"
                        : item.isToday
                          ? "bg-blue-50/40 hover:bg-muted/50"
                          : "hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`flex size-6 items-center justify-center rounded-full text-xs font-semibold ${
                          item.isToday
                            ? "bg-primary text-primary-foreground"
                            : isSelected
                              ? "bg-foreground text-background"
                              : "text-foreground"
                        }`}
                      >
                        {item.day}
                      </span>

                      {hasShortage && (
                        <span
                          className="size-2 rounded-full bg-rose-500"
                          title="Terdapat shift yang kekurangan security"
                        />
                      )}
                    </div>

                    <div className="my-2 space-y-1">
                      {item.shifts.map((shift, shiftIndex) => {
                        const config = getShiftColor(shiftIndex);
                        const isShort = shift.count < shift.required;

                        return (
                          <div
                            key={shift.scheduleId}
                            className={`flex items-center justify-between gap-1 overflow-hidden rounded border px-1.5 py-1 text-[9px] font-medium ${config.color}`}
                            title={`${shift.type} (${shift.count}/${shift.required})`}
                          >
                            <span className="truncate">{shift.type}</span>

                            <span
                              className={`shrink-0 ${
                                isShort ? "font-bold text-rose-600" : ""
                              }`}
                            >
                              {shift.count}/{shift.required}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-w-0">
            {activeDayObj ? (
              <div className="space-y-4 rounded border bg-background p-4">
                <div className="flex items-start justify-between gap-2 border-b pb-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Detail Roster Harian
                    </p>

                    <h3 className="mt-1 text-sm font-semibold">
                      {getDayLabel(new Date(`${activeDayObj.date}T00:00:00`))}
                    </h3>

                    {activeDayObj.isToday && (
                      <Badge
                        variant="secondary"
                        className="mt-1 rounded text-[10px]"
                      >
                        Hari Ini
                      </Badge>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 shrink-0 rounded"
                    onClick={() => onNavigate("tambah-jadwal")}
                  >
                    <CalendarPlus className="size-3.5" />
                    Shift
                  </Button>
                </div>

                <div className="space-y-4">
                  {activeDayObj.shifts.map((shift, index) => {
                    const config = getShiftColor(index);
                    const isShortage = shift.count < shift.required;

                    return (
                      <div
                        key={shift.scheduleId}
                        className={`space-y-3 rounded border p-3 text-xs ${config.selected}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-foreground">
                              {shift.type}
                            </p>

                            <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                              {shift.time}
                            </p>
                          </div>

                          <Badge
                            variant="outline"
                            className={`rounded text-[10px] ${
                              isShortage
                                ? "border-rose-200 bg-rose-50 text-rose-700"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {isShortage ? "Kurang Security" : "Lengkap"}
                          </Badge>
                        </div>

                        <div>
                          <p className="font-medium text-foreground">
                            {shift.squad}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <MapPin className="size-3.5 shrink-0" />
                          <span>Lokasi mengikuti site dan jadwal</span>
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-muted-foreground">
                            Security:{" "}
                            <span className="text-foreground">
                              {shift.count}
                            </span>
                          </span>

                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 rounded border-primary px-2 text-[11px] text-primary hover:bg-primary/5"
                            onClick={() =>
                              handleOpenAssignModal(activeDayObj.date, shift)
                            }
                          >
                            <UserPlus className="size-3.5" />
                            Plot Security
                          </Button>
                        </div>

                        {shift.officers.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                              Security Bertugas
                            </p>

                            <div className="divide-y rounded border bg-background">
                              {shift.officers.map((officer) => (
                                <div
                                  key={`${officer.type}-${officer.assignmentId}-${officer.officerId}`}
                                  className="flex items-center justify-between gap-2 px-2.5 py-2"
                                >
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />

                                      <span className="truncate text-[11px] font-semibold text-foreground">
                                        {officer.officerName}
                                      </span>

                                      {officer.employeeNumber && (
                                        <Badge
                                          variant="secondary"
                                          className="rounded px-1 py-0 text-[9px] font-normal"
                                        >
                                          {officer.employeeNumber}
                                        </Badge>
                                      )}
                                    </div>

                                    <p className="mt-0.5 truncate pl-3 text-[10px] text-muted-foreground">
                                      {officer.type === "REPLACEMENT"
                                        ? "Security pengganti"
                                        : "Security terjadwal"}
                                    </p>
                                  </div>

                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="size-7 shrink-0 rounded text-muted-foreground hover:bg-rose-50 hover:text-rose-600"
                                    title={
                                      officer.type === "REPLACEMENT"
                                        ? "Kelola melalui penggantian shift"
                                        : "Lepas security dari shift"
                                    }
                                    disabled={
                                      unassignMutation.isPending ||
                                      officer.type === "REPLACEMENT"
                                    }
                                    onClick={() =>
                                      handleUnassignOfficer(shift, officer)
                                    }
                                  >
                                    <X className="size-3.5" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2 rounded border border-dashed bg-background/70 p-3 text-center">
                            <p className="text-[11px] text-muted-foreground">
                              Belum ada security yang di-plot.
                            </p>

                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-xs"
                              onClick={() =>
                                handleOpenAssignModal(activeDayObj.date, shift)
                              }
                            >
                              <UserPlus className="size-3.5" />
                              Assign Security
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {activeDayObj.shifts.length === 0 && (
                    <div className="py-8 text-center">
                      <CalendarDays className="mx-auto size-7 text-muted-foreground/50" />

                      <p className="mt-2 text-xs font-medium">
                        Belum ada shift
                      </p>

                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Belum terdapat jadwal pada tanggal ini.
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-auto min-h-9 rounded px-2 py-2 text-[10px]"
                    onClick={() => onNavigate("tukar-shift")}
                  >
                    <ArrowLeftRight className="size-3.5 shrink-0" />
                    Tukar Shift
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-auto min-h-9 rounded px-2 py-2 text-[10px]"
                    onClick={() => onNavigate("cuti-izin")}
                  >
                    <UserMinus className="size-3.5 shrink-0" />
                    Cuti / Izin
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex min-h-48 flex-col items-center justify-center rounded border bg-background p-5 text-center">
                <CalendarDays className="size-8 text-muted-foreground/50" />

                <p className="mt-3 text-sm font-medium">Pilih Tanggal</p>

                <p className="mt-1 max-w-52 text-xs leading-relaxed text-muted-foreground">
                  Pilih tanggal pada kalender untuk melihat dan mengelola
                  plotting shift security.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <Dialog
        open={!!assignModalShift}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseAssignModal();
          }
        }}
      >
        <DialogContent className="max-w-md rounded">
          <form onSubmit={handleSaveAssignModal}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <UserPlus className="size-5 text-primary" />
                Plot Security
              </DialogTitle>

              <DialogDescription>
                {assignModalShift && (
                  <>
                    {assignModalShift.shift.type} · {assignModalShift.date} ·{" "}
                    {assignModalShift.shift.time}
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-5">
              <div className="space-y-2">
                <Label htmlFor="assign-officer">
                  Security <span className="text-destructive">*</span>
                </Label>

                <Select
                  value={selectedOfficerId}
                  onValueChange={(value) => setSelectedOfficerId(value ?? "")}
                  disabled={
                    usersLoading ||
                    usersError ||
                    availableOfficers.length === 0 ||
                    assignMutation.isPending
                  }
                >
                  <SelectTrigger id="assign-officer" className="w-full rounded">
                    <SelectValue placeholder="Pilih security">
                      {(() => {
                        const selectedOfficer = users.find(
                          (user) => user.id === selectedOfficerId,
                        );

                        if (!selectedOfficer) return undefined;

                        return `${selectedOfficer.fullName}${
                          selectedOfficer.employeeNumber
                            ? ` (${selectedOfficer.employeeNumber})`
                            : ""
                        }`;
                      })()}
                    </SelectValue>
                  </SelectTrigger>

                  <SelectContent>
                    {availableOfficers.map((officer) => (
                      <SelectItem key={officer.id} value={officer.id}>
                        {officer.fullName}
                        {officer.employeeNumber
                          ? ` (${officer.employeeNumber})`
                          : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {usersLoading && (
                  <p className="text-xs text-muted-foreground">
                    Memuat security...
                  </p>
                )}

                {usersError && (
                  <p className="text-xs text-rose-600">
                    Gagal mengambil data security.
                  </p>
                )}

                {!usersLoading &&
                  !usersError &&
                  availableOfficers.length === 0 && (
                    <p className="flex items-center gap-1.5 text-xs text-amber-600">
                      <AlertCircle className="size-3.5" />
                      Semua security sudah ditugaskan pada shift ini.
                    </p>
                  )}
              </div>

              {/* INFORMATION */}

              <div className="flex items-start gap-2 rounded border bg-muted/30 p-3 text-xs text-muted-foreground">
                <PersonStanding className="mt-0.5 size-4 shrink-0" />

                <p className="leading-relaxed">
                  Penugasan akan disimpan ke backend untuk tanggal yang dipilih.
                  Jam shift mengikuti jadwal yang tersimpan di database.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="rounded"
                disabled={assignMutation.isPending}
                onClick={handleCloseAssignModal}
              >
                Batal
              </Button>

              <Button
                type="submit"
                className="rounded"
                disabled={
                  !selectedOfficerId ||
                  availableOfficers.length === 0 ||
                  assignMutation.isPending
                }
              >
                <Check className="size-4" />

                {assignMutation.isPending ? "Menyimpan..." : "Plot Security"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
