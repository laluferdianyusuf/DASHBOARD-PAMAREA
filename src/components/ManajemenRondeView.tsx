import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
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
import React, { useMemo, useState } from "react";

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
import { Input } from "@/components/ui/input";
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
import {
  MOCK_ASSIGNMENTS,
  PatrolAssignment,
  PatrolCheckpoint,
  PatrolRound,
  RoundStatus,
  ShiftType,
} from "../data/mockData";

interface ManajemenRondeViewProps {
  /**
   * Isi callback ini dengan request API:
   * PATCH /patrol-rounds/:roundId/checkpoints/order
   *
   * Body:
   * {
   *   checkpointIds: string[]
   * }
   */
  onSaveRoundOrder?: (
    roundId: string,
    checkpointIds: string[],
  ) => Promise<void>;
}

const SHIFT_OPTIONS = [
  { value: "all", label: "Semua Shift" },
  { value: "PAGI", label: "Shift Pagi" },
  { value: "SIANG", label: "Shift Siang" },
  { value: "MALAM", label: "Shift Malam" },
];

const STATUS_LABELS: Record<RoundStatus, string> = {
  PENDING: "Belum Dimulai",
  IN_PROGRESS: "Sedang Berjalan",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

const STATUS_CLASSES: Record<RoundStatus, string> = {
  PENDING: "border-slate-200 bg-slate-50 text-slate-600",
  IN_PROGRESS: "border-blue-200 bg-blue-50 text-blue-700",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CANCELLED: "border-red-200 bg-red-50 text-red-700",
};

const formatDate = (date: string) => {
  if (!date) return "-";

  return new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const getRoundStatusCounts = (assignments: PatrolAssignment[]) => {
  const rounds = assignments.flatMap((assignment) => assignment.rounds);

  return {
    total: rounds.length,
    pending: rounds.filter((round) => round.status === "PENDING").length,
    progress: rounds.filter((round) => round.status === "IN_PROGRESS").length,
    completed: rounds.filter((round) => round.status === "COMPLETED").length,
  };
};

const ManajemenRondeView: React.FC<ManajemenRondeViewProps> = ({
  onSaveRoundOrder,
}) => {
  const [assignments, setAssignments] =
    useState<PatrolAssignment[]>(MOCK_ASSIGNMENTS);

  const [selectedDate, setSelectedDate] = useState("2026-10-31");
  const [selectedSite, setSelectedSite] = useState("all");
  const [selectedShift, setSelectedShift] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [expandedAssignments, setExpandedAssignments] = useState<string[]>([
    "ASN-001",
  ]);

  const [editingRound, setEditingRound] = useState<{
    assignmentId: string;
    round: PatrolRound;
  } | null>(null);

  const [draftCheckpoints, setDraftCheckpoints] = useState<PatrolCheckpoint[]>(
    [],
  );

  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const filteredAssignments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return assignments.filter((assignment) => {
      if (selectedDate && assignment.date !== selectedDate) {
        return false;
      }

      if (selectedSite !== "all" && assignment.siteId !== selectedSite) {
        return false;
      }

      if (selectedShift !== "all" && assignment.shift !== selectedShift) {
        return false;
      }

      if (query) {
        const matches = [
          assignment.npp,
          assignment.fullName,
          assignment.squadName,
          assignment.siteName,
        ].some((value) => value.toLowerCase().includes(query));

        if (!matches) return false;
      }

      return true;
    });
  }, [assignments, selectedDate, selectedSite, selectedShift, searchQuery]);

  const groupedAssignments = useMemo(() => {
    const shifts: ShiftType[] = ["PAGI", "SIANG", "MALAM"];

    return shifts
      .map((shift) => ({
        shift,
        label:
          SHIFT_OPTIONS.find((option) => option.value === shift)?.label ||
          shift,
        assignments: filteredAssignments.filter(
          (assignment) => assignment.shift === shift,
        ),
      }))
      .filter((group) => group.assignments.length > 0);
  }, [filteredAssignments]);

  const summary = useMemo(
    () => getRoundStatusCounts(filteredAssignments),
    [filteredAssignments],
  );

  const totalCheckpoints = useMemo(
    () =>
      filteredAssignments.reduce(
        (total, assignment) =>
          total +
          assignment.rounds.reduce(
            (roundTotal, round) => roundTotal + round.checkpoints.length,
            0,
          ),
        0,
      ),
    [filteredAssignments],
  );

  // ----------------------------------------------------------
  // TOAST
  // ----------------------------------------------------------

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(""), 3000);
  };

  // ----------------------------------------------------------
  // EXPAND ASSIGNMENT
  // ----------------------------------------------------------

  const toggleAssignment = (assignmentId: string) => {
    setExpandedAssignments((previous) =>
      previous.includes(assignmentId)
        ? previous.filter((id) => id !== assignmentId)
        : [...previous, assignmentId],
    );
  };

  // ----------------------------------------------------------
  // OPEN ROUND EDITOR
  // ----------------------------------------------------------

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

  // ----------------------------------------------------------
  // REORDER CHECKPOINT
  // ----------------------------------------------------------

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

    const { assignmentId, round } = editingRound;

    const checkpointIds = draftCheckpoints.map((checkpoint) => checkpoint.id);

    if (
      checkpointIds.length !== round.checkpoints.length ||
      new Set(checkpointIds).size !== checkpointIds.length
    ) {
      showToast("Urutan checkpoint tidak valid.");
      return;
    }

    try {
      setIsSaving(true);

      if (onSaveRoundOrder) {
        await onSaveRoundOrder(round.id, checkpointIds);
      }

      setAssignments((previous) =>
        previous.map((assignment) => {
          if (assignment.id !== assignmentId) {
            return assignment;
          }

          return {
            ...assignment,
            rounds: assignment.rounds.map((item) => {
              if (item.id !== round.id) {
                return item;
              }

              return {
                ...item,
                checkpoints: draftCheckpoints.map((checkpoint, index) => ({
                  ...checkpoint,
                  sequence: index + 1,
                })),
              };
            }),
          };
        }),
      );

      setEditingRound(null);
      setDraftCheckpoints([]);

      showToast("Urutan checkpoint berhasil diperbarui.");
    } catch (error) {
      console.error("Gagal menyimpan urutan checkpoint:", error);
      showToast("Gagal menyimpan urutan checkpoint.");
    } finally {
      setIsSaving(false);
    }
  };

  const resetFilters = () => {
    setSelectedDate("");
    setSelectedSite("all");
    setSelectedShift("all");
    setSearchQuery("");
  };

  const renderRoundStatus = (status: RoundStatus) => (
    <Badge
      variant="outline"
      className={`rounded text-[10px] font-medium ${STATUS_CLASSES[status]}`}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );

  return (
    <div className="space-y-5">
      {/* HEADER */}
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
          onClick={() => {
            setAssignments(MOCK_ASSIGNMENTS);
            resetFilters();
            showToast("Data ditampilkan ulang.");
          }}
        >
          <RefreshCw className="mr-2 size-3.5" />
          Reset Tampilan
        </Button>
      </div>

      {/* TOAST */}
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

      {/* FILTER */}
      <div className="space-y-3 border bg-white p-3">
        <div className="flex items-center gap-2">
          <Search className="size-4 text-muted-foreground" />
          <p className="text-sm font-semibold">Filter Data</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Pencarian Personel</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="NPP, nama, atau regu..."
                className="h-9 rounded pl-9 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Tanggal Jadwal</Label>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="h-9 rounded pl-9 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Site</Label>
            <Select
              value={selectedSite}
              onValueChange={(value) => setSelectedSite(value as string)}
            >
              <SelectTrigger className="h-9 rounded text-xs">
                <SelectValue placeholder="Pilih site" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Site</SelectItem>
                <SelectItem value="SITE-01">Site Utama</SelectItem>
                <SelectItem value="SITE-02">Site Gudang</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Shift</Label>
            <Select
              value={selectedShift}
              onValueChange={(value) => setSelectedShift(value as string)}
            >
              <SelectTrigger className="h-9 rounded text-xs">
                <SelectValue placeholder="Pilih shift" />
              </SelectTrigger>
              <SelectContent>
                {SHIFT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end">
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

      {/* ASSIGNMENT LIST */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Daftar Personel dan Ronde</h2>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {selectedDate ? formatDate(selectedDate) : "Seluruh tanggal"}
              {" · "}
              {filteredAssignments.length} personel ditemukan
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
              key={group.shift}
              className="overflow-hidden border bg-white"
            >
              {/* SHIFT HEADER */}
              <div className="flex flex-col justify-between gap-2 border-b bg-slate-50 px-4 py-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded bg-white text-slate-600">
                    <Clock3 className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{group.label}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {group.shift === "PAGI"
                        ? "07:00 - 15:00"
                        : group.shift === "SIANG"
                          ? "15:00 - 23:00"
                          : "23:00 - 07:00"}
                    </p>
                  </div>
                </div>

                <Badge variant="secondary" className="w-fit rounded">
                  {group.assignments.length} Personel
                </Badge>
              </div>

              {/* PERSONNEL TABLE */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Personel</TableHead>
                    <TableHead>Regu</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead className="text-center">Total Ronde</TableHead>
                    <TableHead className="text-center">Selesai</TableHead>
                    <TableHead className="text-right">Detail</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {group.assignments.map((assignment) => {
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
                              onClick={() => toggleAssignment(assignment.id)}
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
                            {assignment.siteName}
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
                              onClick={() => toggleAssignment(assignment.id)}
                            >
                              {expanded ? "Tutup" : "Lihat Ronde"}
                            </Button>
                          </TableCell>
                        </TableRow>

                        {/* ROUND DETAIL */}
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
                                      {assignment.shiftLabel}
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
                                            (a, b) => a.sequence - b.sequence,
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
                                                  {round.id}
                                                </p>
                                              </TableCell>

                                              <TableCell className="whitespace-nowrap text-xs">
                                                {round.scheduledStartAt}
                                                {" - "}
                                                {round.scheduledEndAt}
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
                                                        {checkpoint.sequence}.{" "}
                                                        {checkpoint.name}
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

      <Dialog
        open={!!editingRound}
        onOpenChange={(open) => {
          if (!open && !isSaving) {
            setEditingRound(null);
            setDraftCheckpoints([]);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto rounded">
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
              {/* ROUND INFORMATION */}
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
                    {editingRound.round.scheduledStartAt}
                    {" - "}
                    {editingRound.round.scheduledEndAt}
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

              {/* INSTRUCTION */}
              <div className="flex items-start gap-2 border border-blue-200 bg-blue-50 p-3">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-blue-600" />
                <p className="text-[11px] leading-relaxed text-blue-800">
                  Urutan yang disimpan hanya berlaku untuk ronde ini. Ronde lain
                  dan rute default tidak akan berubah.
                </p>
              </div>

              {/* CHECKPOINT LIST */}
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
                          disabled={index === 0}
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
                          disabled={index === draftCheckpoints.length - 1}
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
              className="rounded"
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
