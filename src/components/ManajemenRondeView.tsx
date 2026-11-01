import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  GripVertical,
  RefreshCw,
  Route,
  Search,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
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
import { formatDate, formatTime } from "../helpers/dateTime";

import {
  usePatrolRoundsGroupedByUser,
  useReorderPatrolRoundCheckpoints,
} from "../hooks/schedule/usePatrolRound";

import { usePatrolSchedules } from "../hooks/schedule/usePatrolSchedules";
import {
  ApiGroupedResponse,
  PatrolAssignment,
  PatrolCheckpoint,
  PatrolRound,
  PatrolScheduleOption,
  ScheduleGroup,
} from "../services/schedule/rounds-grouped";
import { PatrolRoundStatus } from "../types";
import { DatePicker } from "./DatePicker";

const STATUS_LABELS: Record<PatrolRoundStatus, string> = {
  PENDING: "Belum Dimulai",
  IN_PROGRESS: "Sedang Berjalan",
  COMPLETED: "Selesai",
  PARTIAL: "Selesai Sebagian",
  MISSED: "Terlewat",
  CANCELLED: "Dibatalkan",
};

const STATUS_CLASSES: Record<PatrolRoundStatus, string> = {
  PENDING: "border-slate-200 bg-slate-50 text-slate-600",
  IN_PROGRESS: "border-blue-200 bg-blue-50 text-blue-700",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  PARTIAL: "border-amber-200 bg-amber-50 text-amber-700",
  MISSED: "border-red-200 bg-red-50 text-red-700",
  CANCELLED: "border-red-200 bg-red-50 text-red-700",
};

const getDateKey = (date: string) => date.slice(0, 10);

const mapGroupedRoundsToAssignments = (
  response?: ApiGroupedResponse,
): PatrolAssignment[] => {
  if (!response?.data) return [];

  const grouped = new Map<string, PatrolAssignment>();

  response.data.forEach(({ user, rounds }) => {
    rounds.forEach((round) => {
      const date = getDateKey(round.scheduleDate.date);

      const scheduleId = round.schedule.id;
      const scheduleName = round.schedule.name;

      const siteId = round.schedule.site?.id ?? "";
      const siteName = round.schedule.site?.name ?? "-";

      const assignmentId = [user.id, date, siteId, scheduleId].join("-");

      const checkpoints: PatrolCheckpoint[] = round.checkpoints.map(
        (checkpoint) => ({
          id: checkpoint.id,
          sequence: checkpoint.sequence,
          name: checkpoint.pointNameSnapshot,
          code: checkpoint.pointCodeSnapshot ?? "-",
          required: checkpoint.required,
        }),
      );

      const mappedRound: PatrolRound = {
        id: round.id,
        roundNumber: round.roundNumber,
        status: round.status,
        scheduledStartAt: round.scheduledStartAt,
        scheduledEndAt: round.scheduledEndAt,
        checkpoints,
      };

      const existing = grouped.get(assignmentId);

      if (existing) {
        existing.rounds.push(mappedRound);
      } else {
        grouped.set(assignmentId, {
          id: assignmentId,
          userId: user.id,
          date,

          scheduleId,
          scheduleName,

          fullName: user.fullName,
          npp: user.employeeNumber ?? "-",
          squadName: user.teamName ?? "-",

          siteId,
          siteName,

          rounds: [mappedRound],
        });
      }
    });
  });

  return Array.from(grouped.values()).map((assignment) => ({
    ...assignment,
    rounds: [...assignment.rounds].sort(
      (a, b) => a.roundNumber - b.roundNumber,
    ),
  }));
};

const ManajemenRondeView: React.FC<{
  selectedSite: string;
}> = ({ selectedSite }) => {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedShift, setSelectedShift] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchQuery]);

  const {
    data: schedulesResponse,
    isLoading: isSchedulesLoading,
    isError: isSchedulesError,
  } = usePatrolSchedules();

  const schedules: PatrolScheduleOption[] = useMemo(() => {
    const responseData = schedulesResponse?.data ?? [];

    return responseData.map((schedule: PatrolScheduleOption) => ({
      id: schedule.id,
      name: schedule.name,
    }));
  }, [schedulesResponse]);

  const shiftOptions = useMemo(
    () => [
      {
        value: "all",
        label: "Semua Shift",
      },
      ...schedules.map((schedule) => ({
        value: schedule.id,
        label: schedule.name,
      })),
    ],
    [schedules],
  );

  const {
    data: roundsResponse,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = usePatrolRoundsGroupedByUser({
    date: selectedDate || undefined,

    siteId: selectedSite !== "all" ? selectedSite : undefined,

    scheduleId: selectedShift !== "all" ? selectedShift : undefined,

    search: debouncedSearch || undefined,
  });

  console.log(roundsResponse);

  const assignments = useMemo(
    () =>
      mapGroupedRoundsToAssignments(
        roundsResponse as unknown as ApiGroupedResponse | undefined,
      ),
    [roundsResponse],
  );

  const [expandedAssignments, setExpandedAssignments] = useState<string[]>([]);

  const [editingRound, setEditingRound] = useState<{
    assignmentId: string;
    round: PatrolRound;
  } | null>(null);

  const [draftCheckpoints, setDraftCheckpoints] = useState<PatrolCheckpoint[]>(
    [],
  );

  const [toastMessage, setToastMessage] = useState("");

  const reorderMutation = useReorderPatrolRoundCheckpoints(
    editingRound?.round.id ?? "",
  );

  const isSaving = reorderMutation.isPending;

  const groupedAssignments = useMemo(() => {
    const grouped = new Map<string, ScheduleGroup>();

    assignments.forEach((assignment) => {
      if (!grouped.has(assignment.scheduleId)) {
        grouped.set(assignment.scheduleId, {
          scheduleId: assignment.scheduleId,
          scheduleName: assignment.scheduleName,
          assignments: [],
        });
      }

      grouped.get(assignment.scheduleId)!.assignments.push(assignment);
    });

    return Array.from(grouped.values()).sort((a, b) =>
      a.scheduleName.localeCompare(b.scheduleName),
    );
  }, [assignments]);

  const totalPersonnel = useMemo(
    () => new Set(assignments.map((assignment) => assignment.userId)).size,
    [assignments],
  );

  const showToast = (message: string) => {
    setToastMessage(message);

    window.setTimeout(() => {
      setToastMessage("");
    }, 3000);
  };

  const toggleAssignment = (assignmentId: string) => {
    setExpandedAssignments((previous) =>
      previous.includes(assignmentId)
        ? previous.filter((id) => id !== assignmentId)
        : [...previous, assignmentId],
    );
  };

  const openRoundEditor = (assignmentId: string, round: PatrolRound) => {
    if (round.status !== "PENDING") {
      showToast("Hanya ronde yang belum dimulai yang dapat diubah.");
      return;
    }

    const ordered = [...round.checkpoints].sort(
      (a, b) => a.sequence - b.sequence,
    );

    setDraftCheckpoints(ordered);

    setEditingRound({
      assignmentId,
      round,
    });
  };

  const moveCheckpoint = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= draftCheckpoints.length) {
      return;
    }

    setDraftCheckpoints((previous) => {
      const updated = [...previous];

      [updated[index], updated[targetIndex]] = [
        updated[targetIndex],
        updated[index],
      ];

      return updated.map((checkpoint, checkpointIndex) => ({
        ...checkpoint,
        sequence: checkpointIndex + 1,
      }));
    });
  };

  const saveRoundOrder = async () => {
    if (!editingRound) return;

    const { round } = editingRound;

    const checkpointIds = draftCheckpoints.map((checkpoint) => checkpoint.id);

    if (
      checkpointIds.length !== round.checkpoints.length ||
      new Set(checkpointIds).size !== checkpointIds.length
    ) {
      showToast("Urutan checkpoint tidak valid.");
      return;
    }

    try {
      await reorderMutation.mutateAsync(checkpointIds);

      setEditingRound(null);
      setDraftCheckpoints([]);

      showToast("Urutan checkpoint berhasil diperbarui.");

      await refetch();
    } catch (error) {
      console.error("Gagal menyimpan urutan checkpoint:", error);

      showToast(
        error instanceof Error
          ? error.message
          : "Gagal menyimpan urutan checkpoint.",
      );
    }
  };

  const resetFilters = () => {
    setSelectedDate("");
    setSelectedShift("all");
    setSearchQuery("");
    setDebouncedSearch("");
  };

  const renderRoundStatus = (status: PatrolRoundStatus) => (
    <Badge
      variant="outline"
      className={`rounded text-[10px] font-medium ${STATUS_CLASSES[status]}`}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 border-b pb-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Manajemen Ronde Patroli
          </h1>

          <p className="mt-1 text-xs text-muted-foreground">
            Kelola ronde personel dan urutan checkpoint pada setiap ronde.
          </p>
        </div>

        <Button
          variant="outline"
          className="h-9 rounded text-xs"
          disabled={isFetching}
          onClick={() => void refetch()}
        >
          <RefreshCw
            className={`mr-2 size-3.5 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {toastMessage && (
        <div className="flex items-center justify-between border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <Check className="size-4" />
            {toastMessage}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded"
            onClick={() => setToastMessage("")}
          >
            <X className="size-4" />
          </Button>
        </div>
      )}

      <div className="space-y-3 border bg-white p-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Pencarian Personel</Label>

            <InputGroup className="w-full rounded">
              <InputGroupAddon>
                <Search className="size-4 text-slate-400" />
              </InputGroupAddon>

              <InputGroupInput
                placeholder="Cari kode, nama, atau username..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </InputGroup>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Tanggal Jadwal</Label>

            <div className="flex gap-1">
              <div className="min-w-0 flex-1">
                <DatePicker
                  value={
                    selectedDate
                      ? new Date(`${selectedDate}T00:00:00`)
                      : undefined
                  }
                  onChange={(date) => {
                    setSelectedDate(date ? format(date, "yyyy-MM-dd") : "");
                  }}
                  placeholder="Pilih tanggal"
                  className="w-full rounded"
                />
              </div>

              {selectedDate && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-9 shrink-0 rounded"
                  onClick={() => setSelectedDate("")}
                  title="Hapus tanggal"
                >
                  <X className="size-3.5" />
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Pilih Shift</Label>

            <Select
              value={selectedShift}
              onValueChange={(value) => setSelectedShift(value ?? "all")}
              disabled={isSchedulesLoading || isSchedulesError}
            >
              <SelectTrigger className="w-full rounded text-xs">
                <SelectValue placeholder="Pilih shift">
                  {shiftOptions.find((option) => option.value === selectedShift)
                    ?.label ?? "Pilih shift"}
                </SelectValue>
              </SelectTrigger>

              <SelectContent>
                {shiftOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isSchedulesLoading && (
              <p className="text-[10px] text-muted-foreground">
                Memuat daftar shift...
              </p>
            )}

            {isSchedulesError && (
              <p className="text-[10px] text-red-600">
                Gagal mengambil daftar shift.
              </p>
            )}
          </div>

          <div className="flex items-end justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded text-xs"
              onClick={resetFilters}
            >
              <RefreshCw className="mr-2 size-3.5" />
              Reset Filter
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="border bg-white py-12 text-center">
          <RefreshCw className="mx-auto size-6 animate-spin text-slate-400" />

          <p className="mt-3 text-sm font-medium">
            Memuat data ronde patroli...
          </p>
        </div>
      ) : isError ? (
        <div className="border border-red-200 bg-red-50 py-8 text-center">
          <p className="text-sm font-medium text-red-700">
            Gagal mengambil data ronde patroli.
          </p>

          <p className="mt-1 text-xs text-red-600">
            {error instanceof Error ? error.message : "Terjadi kesalahan."}
          </p>

          <Button
            variant="outline"
            size="sm"
            className="mt-3 rounded"
            onClick={() => void refetch()}
          >
            <RefreshCw className="mr-2 size-3.5" />
            Coba Lagi
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">
                  Daftar Personel dan Ronde
                </h2>

                <p className="mt-1 text-[11px] text-muted-foreground">
                  {selectedDate ? formatDate(selectedDate) : "Seluruh tanggal"}
                  {" · "}
                  {totalPersonnel} personel
                  {" · "}
                  {roundsResponse?.totalRounds ?? 0} ronde
                </p>
              </div>
            </div>

            {groupedAssignments.length === 0 ? (
              <div className="border bg-white py-12 text-center">
                <Users className="mx-auto size-8 text-slate-300" />

                <p className="mt-3 text-sm font-medium">
                  Tidak ada personel ditemukan
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Coba ubah filter atau kata kunci pencarian.
                </p>
              </div>
            ) : (
              groupedAssignments.map((group) => (
                <section
                  key={group.scheduleId}
                  className="overflow-hidden border bg-white"
                >
                  {/* SCHEDULE HEADER */}

                  <div className="flex flex-col justify-between gap-2 border-b bg-slate-50 px-4 py-3 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded bg-white text-slate-600">
                        <Clock3 className="size-4" />
                      </div>

                      <div>
                        <p className="text-sm font-semibold">
                          {group.scheduleName}
                        </p>

                        <p className="text-[11px] text-muted-foreground">
                          Jadwal patroli
                        </p>
                      </div>
                    </div>

                    <Badge variant="secondary" className="w-fit rounded">
                      {group.assignments.length} Personel
                    </Badge>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8" />
                        <TableHead>Personel</TableHead>
                        <TableHead>Regu</TableHead>
                        <TableHead>Shift</TableHead>
                        <TableHead className="text-center">
                          Total Ronde
                        </TableHead>
                        <TableHead className="text-center">Selesai</TableHead>
                        <TableHead className="text-right">Detail</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {group.assignments.map((assignment) => {
                        console.log(group);

                        const expanded = expandedAssignments.includes(
                          assignment.id,
                        );

                        const completedRounds = assignment.rounds.filter(
                          (round) => round.status === "COMPLETED",
                        ).length;

                        return (
                          <React.Fragment key={assignment.id}>
                            <TableRow>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 rounded"
                                  onClick={() =>
                                    toggleAssignment(assignment.id)
                                  }
                                >
                                  {expanded ? (
                                    <ChevronDown className="size-4" />
                                  ) : (
                                    <ChevronRight className="size-4" />
                                  )}
                                </Button>
                              </TableCell>

                              <TableCell>
                                <div className="min-w-[150px]">
                                  <p className="text-xs font-semibold">
                                    {assignment.fullName}
                                  </p>

                                  <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                                    {assignment.npp}
                                  </p>
                                </div>
                              </TableCell>

                              <TableCell className="text-xs">
                                {assignment.squadName}
                              </TableCell>

                              <TableCell className="text-xs">
                                {assignment.scheduleName}
                              </TableCell>

                              <TableCell className="text-center text-xs font-medium">
                                {assignment.rounds.length}
                              </TableCell>

                              <TableCell className="text-center text-xs">
                                {completedRounds}/{assignment.rounds.length}
                              </TableCell>

                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 rounded text-xs"
                                  onClick={() =>
                                    toggleAssignment(assignment.id)
                                  }
                                >
                                  {expanded ? "Tutup" : "Lihat Ronde"}
                                </Button>
                              </TableCell>
                            </TableRow>

                            {expanded && (
                              <TableRow>
                                <TableCell
                                  colSpan={7}
                                  className="bg-slate-50/70 p-3"
                                >
                                  <div className="space-y-3">
                                    <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                                      <div>
                                        <p className="text-xs font-semibold">
                                          Ronde Patroli
                                        </p>

                                        <p className="text-[10px] text-muted-foreground">
                                          {assignment.fullName}
                                          {" · "}
                                          {assignment.scheduleName}
                                        </p>
                                      </div>

                                      <p className="text-[10px] text-muted-foreground">
                                        {assignment.rounds.length} ronde
                                      </p>
                                    </div>

                                    <div className="overflow-hidden border bg-white">
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead className="w-20">
                                              Ronde
                                            </TableHead>

                                            <TableHead>Waktu</TableHead>

                                            <TableHead>Checkpoint</TableHead>

                                            <TableHead>Status</TableHead>

                                            <TableHead className="text-right">
                                              Aksi
                                            </TableHead>
                                          </TableRow>
                                        </TableHeader>

                                        <TableBody>
                                          {assignment.rounds
                                            .slice()
                                            .sort(
                                              (a, b) =>
                                                a.roundNumber - b.roundNumber,
                                            )
                                            .map((round) => {
                                              const orderedCheckpoints = [
                                                ...round.checkpoints,
                                              ].sort(
                                                (a, b) =>
                                                  a.sequence - b.sequence,
                                              );

                                              const canEdit =
                                                round.status === "PENDING";

                                              return (
                                                <TableRow key={round.id}>
                                                  <TableCell>
                                                    <span className="text-xs font-semibold">
                                                      Ronde {round.roundNumber}
                                                    </span>

                                                    <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                                                      {round.id
                                                        .slice(0, 7)
                                                        .toUpperCase()}
                                                    </p>
                                                  </TableCell>

                                                  <TableCell className="whitespace-nowrap text-xs">
                                                    {formatTime(
                                                      round.scheduledStartAt,
                                                    )}
                                                    {" - "}
                                                    {formatTime(
                                                      round.scheduledEndAt,
                                                    )}
                                                  </TableCell>

                                                  <TableCell>
                                                    <div className="flex max-w-[480px] flex-wrap gap-1">
                                                      {orderedCheckpoints.map(
                                                        (checkpoint) => (
                                                          <Badge
                                                            key={checkpoint.id}
                                                            variant="outline"
                                                            className="rounded bg-white text-[10px] font-normal"
                                                          >
                                                            {
                                                              checkpoint.sequence
                                                            }
                                                            . {checkpoint.name}
                                                          </Badge>
                                                        ),
                                                      )}
                                                    </div>
                                                  </TableCell>

                                                  <TableCell>
                                                    {renderRoundStatus(
                                                      round.status,
                                                    )}
                                                  </TableCell>

                                                  <TableCell className="text-right">
                                                    <Button
                                                      variant="outline"
                                                      size="sm"
                                                      disabled={!canEdit}
                                                      className="h-8 rounded text-xs"
                                                      onClick={() =>
                                                        openRoundEditor(
                                                          assignment.id,
                                                          round,
                                                        )
                                                      }
                                                    >
                                                      <Route className="mr-1.5 size-3.5" />
                                                      Atur Urutan
                                                    </Button>
                                                  </TableCell>
                                                </TableRow>
                                              );
                                            })}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                </section>
              ))
            )}
          </div>
        </>
      )}

      <Dialog
        open={!!editingRound}
        onOpenChange={(open) => {
          if (!open && !isSaving) {
            setEditingRound(null);
            setDraftCheckpoints([]);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-xl sm:max-w-2xl overflow-y-auto rounded">
          <DialogHeader>
            <DialogTitle className="text-base">
              Atur Urutan Checkpoint
            </DialogTitle>

            <DialogDescription className="text-xs">
              Geser checkpoint menggunakan tombol naik dan turun untuk
              menentukan urutan patroli.
            </DialogDescription>
          </DialogHeader>

          {editingRound && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 border bg-slate-50 p-3">
                <div>
                  <p className="text-[10px] text-muted-foreground">Personel</p>

                  <p className="mt-1 text-xs font-semibold">
                    {
                      assignments.find(
                        (item) => item.id === editingRound.assignmentId,
                      )?.fullName
                    }
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-muted-foreground">Ronde</p>

                  <p className="mt-1 text-xs font-semibold">
                    Ronde {editingRound.round.roundNumber}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-muted-foreground">Waktu</p>

                  <p className="mt-1 text-xs font-semibold">
                    {formatTime(editingRound.round.scheduledStartAt)}
                    {" - "}
                    {formatTime(editingRound.round.scheduledEndAt)}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-muted-foreground">
                    Jumlah Checkpoint
                  </p>

                  <p className="mt-1 text-xs font-semibold">
                    {draftCheckpoints.length} checkpoint
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 border border-blue-200 bg-blue-50 p-3">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-blue-600" />

                <p className="text-[11px] leading-relaxed text-blue-800">
                  Urutan yang disimpan hanya berlaku untuk ronde ini. Ronde lain
                  dan rute default tidak akan berubah.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">
                    Urutan Checkpoint
                  </Label>

                  <span className="text-[10px] text-muted-foreground">
                    Gunakan tombol panah untuk mengubah urutan
                  </span>
                </div>

                {draftCheckpoints.length === 0 ? (
                  <div className="border py-8 text-center text-xs text-muted-foreground">
                    Belum ada checkpoint pada ronde ini.
                  </div>
                ) : (
                  draftCheckpoints.map((checkpoint, index) => (
                    <div
                      key={checkpoint.id}
                      className="flex items-center gap-2 border bg-white p-2.5"
                    >
                      <GripVertical className="size-4 shrink-0 text-slate-300" />

                      <div className="flex size-7 shrink-0 items-center justify-center bg-slate-100 text-xs font-semibold">
                        {index + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold">
                          {checkpoint.name}
                        </p>

                        <div className="mt-0.5 flex items-center gap-2">
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {checkpoint.code}
                          </span>

                          {checkpoint.required && (
                            <Badge
                              variant="outline"
                              className="rounded px-1.5 py-0 text-[9px]"
                            >
                              Wajib
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={index === 0 || isSaving}
                          className="size-8 rounded"
                          title="Pindah ke atas"
                          onClick={() => moveCheckpoint(index, "up")}
                        >
                          <ArrowUp className="size-3.5" />
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={
                            index === draftCheckpoints.length - 1 || isSaving
                          }
                          className="size-8 rounded"
                          title="Pindah ke bawah"
                          onClick={() => moveCheckpoint(index, "down")}
                        >
                          <ArrowDown className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border p-3">
                <p className="mb-2 text-xs font-semibold">Preview Rute</p>

                <div className="flex flex-wrap items-center gap-1.5">
                  {draftCheckpoints.map((checkpoint, index) => (
                    <React.Fragment key={checkpoint.id}>
                      <Badge
                        variant="secondary"
                        className="rounded text-[10px]"
                      >
                        {index + 1}. {checkpoint.name}
                      </Badge>

                      {index < draftCheckpoints.length - 1 && (
                        <ChevronRight className="size-3 text-slate-400" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded"
              disabled={isSaving}
              onClick={() => {
                setEditingRound(null);
                setDraftCheckpoints([]);
              }}
            >
              Batal
            </Button>

            <Button
              type="button"
              className="rounded bg-amber-600 text-white hover:bg-amber-700"
              disabled={isSaving || draftCheckpoints.length === 0}
              onClick={saveRoundOrder}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="mr-2 size-3.5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Check className="mr-2 size-3.5" />
                  Simpan Urutan
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManajemenRondeView;
