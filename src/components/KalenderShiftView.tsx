import React, { useMemo, useState } from "react";
import { INITIAL_OFFICERS_POOL } from "../data/calendarMockData";
import {
  CalendarShiftItem,
  DayShift,
  ShiftOfficerAssignment,
} from "../utils/security-logic";
import { NavTab } from "./Sidebar";

import {
  AlertCircle,
  ArrowLeftRight,
  CalendarDays,
  CalendarPlus,
  CalendarRange,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  PersonStanding,
  ShieldCheck,
  UserMinus,
  UserPlus,
  X,
} from "lucide-react";

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

interface KalenderShiftViewProps {
  onNavigate: (tab: NavTab) => void;
  calendarDays: (DayShift | null)[];
  selectedDay: number;
  onSelectDay: (day: number) => void;
  onAssignOfficerToShift: (
    day: number,
    shiftType: "Pagi" | "Siang" | "Malam",
    officer: ShiftOfficerAssignment,
  ) => void;
  onUnassignOfficerFromShift: (
    day: number,
    shiftType: "Pagi" | "Siang" | "Malam",
    officerId: string,
  ) => void;
}

const POST_OPTIONS = [
  "Pos Utama Gerbang Depan",
  "Pintu Masuk Lobi & Metal Detector",
  "Patroli Koridor & Lift VIP",
  "Pintu Evakuasi Barat & Loading Bay",
  "Pos Timbangan & Dermaga Kontainer",
  "Ruang Server & Genset B2",
  "Patroli Perimeter Selatan & Pagar",
  "Gerbang Timur & Pos X-Ray",
  "Pos Pantau CCTV & Pusat Kendali",
  "Cadangan Siaga / Mobile Patrol",
];

const SHIFT_CONFIG = {
  Pagi: {
    time: "07:00 - 15:00",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    selected: "border-emerald-200 bg-emerald-50/50",
  },
  Siang: {
    time: "15:00 - 23:00",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
    selected: "border-blue-200 bg-blue-50/50",
  },
  Malam: {
    time: "23:00 - 07:00",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    dot: "bg-purple-500",
    selected: "border-purple-200 bg-purple-50/50",
  },
} as const;

const getCurrentMonthLabel = () => {
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(new Date());
};

const getCurrentDayLabel = (day: number) => {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth(), day);

  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

export const KalenderShiftView: React.FC<KalenderShiftViewProps> = ({
  onNavigate,
  calendarDays,
  selectedDay,
  onSelectDay,
  onAssignOfficerToShift,
  onUnassignOfficerFromShift,
}) => {
  const [assignModalShift, setAssignModalShift] = useState<{
    day: number;
    shift: CalendarShiftItem;
  } | null>(null);

  const [selectedOfficerId, setSelectedOfficerId] = useState("");
  const [selectedPost, setSelectedPost] = useState(POST_OPTIONS[0]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const currentMonth = getCurrentMonthLabel();

  const activeDayObj = calendarDays.find(
    (day) => day && day.day === selectedDay,
  );

  const assignedOfficerIds = useMemo(() => {
    if (!assignModalShift) return [];

    return (assignModalShift.shift.officers || []).map(
      (officer) => officer.officerId,
    );
  }, [assignModalShift]);

  const availableOfficers = useMemo(() => {
    return INITIAL_OFFICERS_POOL.filter(
      (officer) => !assignedOfficerIds.includes(officer.officerId),
    );
  }, [assignedOfficerIds]);

  const showToast = (message: string) => {
    setToastMessage(message);

    window.setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleOpenAssignModal = (day: number, shift: CalendarShiftItem) => {
    setAssignModalShift({ day, shift });

    const assignedIds = (shift.officers || []).map(
      (officer) => officer.officerId,
    );

    const available = INITIAL_OFFICERS_POOL.find(
      (officer) => !assignedIds.includes(officer.officerId),
    );

    setSelectedOfficerId(available?.officerId ?? "");
    setSelectedPost(POST_OPTIONS[0]);
  };

  const handleSaveAssignModal = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!assignModalShift || !selectedOfficerId) return;

    const officerObj = INITIAL_OFFICERS_POOL.find(
      (officer) => officer.officerId === selectedOfficerId,
    );

    if (!officerObj) return;

    onAssignOfficerToShift(assignModalShift.day, assignModalShift.shift.type, {
      ...officerObj,
      post: selectedPost,
    });

    showToast(
      `Petugas ${officerObj.officerName} berhasil di-plot ke Shift ${assignModalShift.shift.type} pada tanggal ${assignModalShift.day} ${currentMonth}.`,
    );

    setAssignModalShift(null);
  };

  const handleUnassignOfficer = (
    day: number,
    shift: CalendarShiftItem,
    officer: ShiftOfficerAssignment,
  ) => {
    onUnassignOfficerFromShift(day, shift.type, officer.officerId);

    showToast(
      `Petugas ${officer.officerName} berhasil dilepas dari Shift ${shift.type}.`,
    );
  };

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="flex items-center justify-between gap-3 rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 rounded text-emerald-700 hover:bg-emerald-100 hover:text-emerald-900"
            onClick={() => setToastMessage(null)}
          >
            <X className="size-4" />
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b pb-4 lg:flex-row lg:items-end">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Kalender Shift &amp; Giliran Jaga
          </h1>

          <p className="max-w-2xl text-xs text-muted-foreground">
            Matriks penugasan shift, rotasi regu pengamanan, dan alokasi
            personel per hari operasional.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            className="rounded"
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

      {/* Shift Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded border bg-background px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="text-xs font-semibold text-foreground">
            Legenda Shift:
          </span>

          {(
            Object.entries(SHIFT_CONFIG) as [
              keyof typeof SHIFT_CONFIG,
              (typeof SHIFT_CONFIG)[keyof typeof SHIFT_CONFIG],
            ][]
          ).map(([type, config]) => (
            <div key={type} className="flex items-center gap-2">
              <span className={`size-2.5 rounded ${config.dot}`} />
              <span className="text-xs text-muted-foreground">
                Shift {type} ({config.time})
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
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
            Kekurangan Personel
          </div>
        </div>
      </div>

      {/* Calendar and Daily Detail */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-4">
        {/* Calendar Grid */}
        <div className="overflow-hidden rounded border bg-background xl:col-span-3">
          <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-primary" />
              <span className="text-sm font-semibold">{currentMonth}</span>
            </div>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="size-7 rounded"
                disabled
                aria-label="Bulan sebelumnya"
              >
                <ChevronLeft className="size-4" />
              </Button>

              <Button
                type="button"
                size="icon"
                variant="outline"
                className="size-7 rounded"
                disabled
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

              const isSelected = selectedDay === item.day;
              const hasShortage = item.shifts.some(
                (shift) => shift.count < shift.required,
              );

              return (
                <button
                  key={item.day}
                  type="button"
                  onClick={() => onSelectDay(item.day)}
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
                        title="Terdapat shift yang kekurangan personel"
                      />
                    )}
                  </div>

                  <div className="my-2 space-y-1">
                    {item.shifts.map((shift, shiftIndex) => {
                      const config = SHIFT_CONFIG[shift.type];
                      const isShort = shift.count < shift.required;

                      return (
                        <div
                          key={`${shift.type}-${shiftIndex}`}
                          className={`flex items-center justify-between gap-1 overflow-hidden rounded border px-1.5 py-1 text-[9px] font-medium ${config.color}`}
                          title={`${shift.type} - ${shift.squad} (${shift.count}/${shift.required} personel)`}
                        >
                          <span className="truncate">
                            {shift.type}: {shift.squad.replace("Regu ", "")}
                          </span>

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

        {/* Selected Day Detail */}
        <div className="min-w-0">
          {activeDayObj ? (
            <div className="space-y-4 rounded border bg-background p-4">
              <div className="flex items-start justify-between gap-2 border-b pb-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Detail Roster Harian
                  </p>

                  <h3 className="mt-1 text-sm font-semibold">
                    {getCurrentDayLabel(selectedDay)}
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
                  const isShortage = shift.count < shift.required;
                  const config = SHIFT_CONFIG[shift.type];

                  return (
                    <div
                      key={`${shift.type}-${index}`}
                      className={`space-y-3 rounded border p-3 text-xs ${config.selected}`}
                    >
                      {/* Shift Heading */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-foreground">
                            Shift{" "}
                            {shift.type === "Siang"
                              ? "Siang / Sore"
                              : shift.type}
                          </p>

                          <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                            {config.time}
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
                          {isShortage ? "Kurang Personel" : "Lengkap"}
                        </Badge>
                      </div>

                      <div>
                        <p className="font-medium text-foreground">
                          {shift.squad}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          Danru: {shift.danru || "-"}
                        </p>
                      </div>

                      {shift.sector && (
                        <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                          <MapPin className="mt-0.5 size-3.5 shrink-0" />
                          <span>{shift.sector}</span>
                        </div>
                      )}

                      <Separator />

                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-muted-foreground">
                          Personel:{" "}
                          <span className="text-foreground">
                            {shift.count}/{shift.required}
                          </span>
                        </span>

                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 rounded border-primary px-2 text-[11px] text-primary hover:bg-primary/5"
                          onClick={() =>
                            handleOpenAssignModal(selectedDay, shift)
                          }
                        >
                          <UserPlus className="size-3.5" />
                          Plot Personel
                        </Button>
                      </div>

                      {/* Assigned Officers */}
                      {shift.officers && shift.officers.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Personel Bertugas
                          </p>

                          <div className="divide-y rounded border bg-background">
                            {shift.officers.map((officer) => (
                              <div
                                key={officer.officerId}
                                className="flex items-center justify-between gap-2 px-2.5 py-2"
                              >
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />

                                    <span className="truncate text-[11px] font-semibold text-foreground">
                                      {officer.officerName}
                                    </span>

                                    {officer.callSign && (
                                      <Badge
                                        variant="secondary"
                                        className="rounded px-1 py-0 text-[9px] font-normal"
                                      >
                                        {officer.callSign}
                                      </Badge>
                                    )}
                                  </div>

                                  <p className="mt-0.5 truncate pl-3 text-[10px] text-muted-foreground">
                                    {officer.post || officer.role}
                                  </p>
                                </div>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 shrink-0 rounded text-muted-foreground hover:bg-rose-50 hover:text-rose-600"
                                  title="Lepas personel dari shift"
                                  onClick={() =>
                                    handleUnassignOfficer(
                                      selectedDay,
                                      shift,
                                      officer,
                                    )
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
                            Belum ada personel yang di-plot.
                          </p>

                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs"
                            onClick={() =>
                              handleOpenAssignModal(selectedDay, shift)
                            }
                          >
                            <UserPlus className="size-3.5" />
                            Assign Personel
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {activeDayObj.shifts.length === 0 && (
                  <div className="py-8 text-center">
                    <CalendarDays className="mx-auto size-7 text-muted-foreground/50" />
                    <p className="mt-2 text-xs font-medium">Belum ada shift</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Belum terdapat penugasan pada tanggal ini.
                    </p>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
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

              {/* Handover Notice */}
              <div className="space-y-1.5 rounded border border-blue-200 bg-blue-50 p-3 text-blue-900">
                <p className="flex items-center gap-2 text-xs font-semibold">
                  <ShieldCheck className="size-4" />
                  Prosedur Serah Terima Shift
                </p>

                <p className="text-[11px] leading-relaxed text-blue-700">
                  Apel serah terima giliran jaga wajib dilakukan 15 menit
                  sebelum jam shift dimulai di posko utama masing-masing site.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex min-h-48 flex-col items-center justify-center rounded border bg-background p-5 text-center">
              <CalendarDays className="size-8 text-muted-foreground/50" />

              <p className="mt-3 text-sm font-medium">Pilih Tanggal</p>

              <p className="mt-1 max-w-52 text-xs leading-relaxed text-muted-foreground">
                Pilih tanggal pada kalender untuk melihat dan mengelola plotting
                shift personel sekuriti.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Assign Officer Dialog */}
      <Dialog
        open={!!assignModalShift}
        onOpenChange={(open) => {
          if (!open) setAssignModalShift(null);
        }}
      >
        <DialogContent className="max-w-md rounded">
          <form onSubmit={handleSaveAssignModal}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <UserPlus className="size-5 text-primary" />
                Plot Personel Sekuriti
              </DialogTitle>

              <DialogDescription>
                {assignModalShift && (
                  <>
                    Shift {assignModalShift.shift.type} · {assignModalShift.day}{" "}
                    {currentMonth} · {assignModalShift.shift.squad}
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-5">
              <div className="space-y-2">
                <Label htmlFor="assign-officer">
                  Personel Sekuriti <span className="text-destructive">*</span>
                </Label>

                <Select
                  value={selectedOfficerId}
                  onValueChange={(value) =>
                    setSelectedOfficerId(value as string)
                  }
                  disabled={availableOfficers.length === 0}
                >
                  <SelectTrigger id="assign-officer" className="w-full rounded">
                    <SelectValue placeholder="Pilih personel" />
                  </SelectTrigger>

                  <SelectContent>
                    {availableOfficers.map((officer) => (
                      <SelectItem
                        key={officer.officerId}
                        value={officer.officerId}
                      >
                        {officer.officerName} ({officer.npp})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {availableOfficers.length === 0 && (
                  <p className="flex items-center gap-1.5 text-xs text-amber-600">
                    <AlertCircle className="size-3.5" />
                    Semua personel sudah ditugaskan pada shift ini.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="assign-post">
                  Pos Penugasan <span className="text-destructive">*</span>
                </Label>

                <Select
                  value={selectedPost}
                  onValueChange={(value) => setSelectedPost(value as string)}
                >
                  <SelectTrigger id="assign-post" className="w-full rounded">
                    <SelectValue placeholder="Pilih pos penugasan" />
                  </SelectTrigger>

                  <SelectContent>
                    {POST_OPTIONS.map((post) => (
                      <SelectItem key={post} value={post}>
                        {post}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-start gap-2 rounded border bg-muted/30 p-3 text-xs text-muted-foreground">
                <PersonStanding className="mt-0.5 size-4 shrink-0" />
                <p className="leading-relaxed">
                  Personel yang ditambahkan akan langsung terdaftar di roster
                  harian dan menambah jumlah alokasi pada kalender shift.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="rounded"
                onClick={() => setAssignModalShift(null)}
              >
                Batal
              </Button>

              <Button
                type="submit"
                className="rounded"
                disabled={!selectedOfficerId || availableOfficers.length === 0}
              >
                <Check className="size-4" />
                Plot Personel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
