import React, { useMemo, useState } from "react";
import { PatrolScheduleItem } from "../data/mockData";
import { ShiftOfficerAssignment } from "../utils/security-logic";
import { NavTab } from "./Sidebar";

import {
  AlertCircle,
  CalendarDays,
  Check,
  Clock,
  CloudSun,
  MapPin,
  Moon,
  Plus,
  Save,
  Search,
  Sun,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import { useGetScheduleAssignments } from "../hooks/schedule/usePatrolScheduleAssignment";
import {
  useCreatePatrolSchedule,
  usePatrolSchedules,
} from "../hooks/schedule/usePatrolSchedules";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthContext } from "../hooks/auth/useAuthContext";
import { CreatePatrolSchedulePayload } from "../types";
import { usePatrolPoints } from "../hooks/patrol-point/usePatrolPoints";
import { PaginationComponent } from "./PaginationComponent";

interface JadwalPatroliViewProps {
  selectedSite: string;
  onNavigate: (tab: NavTab) => void;
  schedules?: PatrolScheduleItem[];
  onUpdateSchedules?: (schedules: PatrolScheduleItem[]) => void;
  onAddScheduleAndSyncCalendar?: (
    newSchedule: PatrolScheduleItem,
    dayShiftPayload: {
      day: number;
      dateStr: string;
      shiftType: "Pagi" | "Siang" | "Malam";
      squad: string;
      danru: string;
      sector: string;
      siteName: string;
      requiredCount: number;
      officers: ShiftOfficerAssignment[];
    },
  ) => void;
}

const STATUS_STYLES: Record<string, string> = {
  "Berjalan Aktif": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Perlu Pengganti": "bg-rose-50 text-rose-700 border-rose-200",
  "Selesai Tuntas": "bg-blue-50 text-blue-700 border-blue-200",
  Terjadwal: "bg-slate-100 text-slate-700 border-slate-200",
};

export const JadwalPatroliView: React.FC<JadwalPatroliViewProps> = ({
  selectedSite,
  onNavigate,
  schedules: propSchedules,
  onUpdateSchedules,
}) => {
  const { user } = useAuthContext();
  const siteId = user?.siteId;

  const { data: shifts } = usePatrolSchedules();
  const { data: assignment } = useGetScheduleAssignments();
  const { data: patrolPoints, isLoading: isLoadingPoints } = usePatrolPoints();

  const { mutateAsync: createPS } = useCreatePatrolSchedule();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState("10");

  const listShift = shifts?.data ?? [];
  const scheduleAssignment = assignment ?? [];

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedShift, setSelectedShift] = useState("all");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Form shift
  const [shiftName, setShiftName] = useState("Shift Pagi");
  const [shiftStartTime, setShiftStartTime] = useState("07:00");
  const [shiftEndTime, setShiftEndTime] = useState("15:00");
  const [shiftIntervalMinutes, setShiftIntervalMinutes] = useState(120);
  const [shiftGracePeriodMinutes, setShiftGracePeriodMinutes] = useState(30);
  const [shiftEnforceSequence, setShiftEnforceSequence] = useState(false);

  const [shiftLocationIds, setShiftLocationIds] = useState<string[]>([]);

  const [modalLocationSearch, setModalLocationSearch] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);

  const activePoint = useMemo(() => {
    return patrolPoints?.filter((item) => item.status === "ACTIVE");
  }, [patrolPoints]);

  const filteredSchedules = scheduleAssignment.filter((schedule) => {
    if (selectedShift !== "all") {
      const scheduleName = schedule.schedule?.name?.toLowerCase() ?? "";

      if (!scheduleName.includes(selectedShift.toLowerCase())) {
        return false;
      }
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();

      const match = [
        schedule.id,
        schedule.schedule?.name,
        schedule.user?.fullName,
        schedule.schedule?.site?.name,
      ].some((value) => value?.toLowerCase().includes(query));

      if (!match) return false;
    }

    return true;
  });

  const totalItems = filteredSchedules.length;
  const numericPageSize = Number(pageSize);
  const totalPages = Math.max(1, Math.ceil(totalItems / numericPageSize));

  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * numericPageSize;
  const endIndex = Math.min(startIndex + numericPageSize, totalItems);

  const paginatedUsers = filteredSchedules.slice(startIndex, endIndex);

  const showToast = (message: string) => {
    setSuccessToast(message);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    // Validasi Site
    if (!siteId) {
      setModalError("Site ID tidak ditemukan.");
      return;
    }

    // Validasi nama shift
    if (!shiftName.trim()) {
      setModalError("Nama shift wajib diisi.");
      return;
    }

    // Validasi titik patroli
    if (shiftLocationIds.length === 0) {
      setModalError("Pilih minimal satu titik patroli.");
      return;
    }

    // Ambil titik patroli yang dipilih sesuai urutan pilihan
    const selectedPoints = shiftLocationIds
      .map((id) => activePoint?.find((checkpoint) => checkpoint.id === id))
      .filter((checkpoint) => checkpoint !== undefined);

    if (selectedPoints.length !== shiftLocationIds.length) {
      setModalError("Terdapat titik patroli yang tidak ditemukan.");
      return;
    }

    // Mapping titik patroli ke payload BE
    const points = shiftLocationIds.map((patrolPointId) => ({
      patrolPointId,
      required: true,
    }));

    // Payload create schedule
    const payload: CreatePatrolSchedulePayload = {
      siteId,
      name: shiftName.trim(),
      startTime: shiftStartTime,
      endTime: shiftEndTime,
      intervalMinutes: shiftIntervalMinutes,
      gracePeriodMinutes: shiftGracePeriodMinutes,
      enforceSequence: shiftEnforceSequence,
      points,
    };

    try {
      await createPS(payload);

      setIsAddModalOpen(false);

      showToast(
        `Shift "${shiftName.trim()}" berhasil dibuat dengan ${points.length} titik lokasi.`,
      );
    } catch (error) {
      setModalError("Gagal menambah shift");
    }
  };

  const filteredCheckpoints = activePoint?.filter((checkpoint) => {
    if (!modalLocationSearch.trim()) return true;

    const query = modalLocationSearch.toLowerCase();

    return [
      checkpoint.name,
      checkpoint.id,
      checkpoint.site.code,
      checkpoint.description,
    ].some((value) => value?.toLowerCase().includes(query));
  });

  const getShiftIcon = (shift: string | undefined) => {
    if (shift?.includes("Pagi")) return Sun;
    if (shift?.includes("Sore")) return CloudSun;
    return Moon;
  };

  return (
    <div className="space-y-3">
      {/* Toast */}
      {successToast && (
        <div className="flex items-center justify-between gap-3 rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <div className="flex items-center gap-2">
            <Check className="size-4 shrink-0" />
            <span>{successToast}</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded text-emerald-700 hover:bg-emerald-100"
            onClick={() => setSuccessToast(null)}
          >
            <X className="size-4" />
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b pb-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Jadwal Patroli Lapangan
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pengaturan shift, personel regu, dan rute checkpoint patroli.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded border p-1">
            <Button variant="secondary" size="sm" className="h-8 rounded">
              <CalendarDays className="mr-2 size-4" />
              Tabel
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded"
              onClick={() => onNavigate("kalender")}
            >
              Kalender Shift
            </Button>
          </div>

          <Button
            size="sm"
            className="rounded bg-[#FED400] hover:bg-yellow-400 text-black"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="mr-2 size-4" />
            Tambah Shift
          </Button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <InputGroup className="rounded sm:max-w-sm">
            <InputGroupAddon>
              <Search className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Cari ID, regu, sektor, Danru..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>

          <Select
            value={selectedShift}
            onValueChange={(value) => setSelectedShift(value as string)}
          >
            <SelectTrigger className="w-full rounded sm:w-47.5">
              <SelectValue placeholder="Semua Shift" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Shift</SelectItem>
              <SelectItem value="Pagi">Shift Pagi</SelectItem>
              <SelectItem value="Sore">Shift Sore</SelectItem>
              <SelectItem value="Malam">Shift Malam</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p className="shrink-0 text-sm text-muted-foreground">
          Menampilkan{" "}
          <span className="font-semibold text-foreground">
            {filteredSchedules.length}
          </span>{" "}
          dari {listShift.length} jadwal
        </p>
      </div>

      <div className="">
        <PaginationComponent
          totalItems={filteredSchedules.length}
          startItem={totalItems === 0 ? 0 : startIndex + 1}
          endItem={endIndex}
          pageSize={pageSize}
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          onPageSizeChange={(value) => {
            setPageSize(String(value));
            setCurrentPage(1);
          }}
          onPageChange={(page) => {
            setCurrentPage(Math.max(1, Math.min(page, totalPages)));
          }}
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded border bg-background">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Petugas</TableHead>
                <TableHead className="whitespace-nowrap">Shift</TableHead>
                <TableHead>Jam Operasional</TableHead>
                <TableHead>Titik Patrol</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredSchedules.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-32 text-center text-muted-foreground"
                  >
                    Tidak ada jadwal yang sesuai dengan pencarian.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((schedule) => {
                  const ShiftIcon = getShiftIcon(schedule.schedule?.name);

                  const currentShift = listShift.find(
                    (item) => item.id === schedule.schedule?.id,
                  );

                  // Ambil jumlah titik dari jadwal tersebut
                  const countPoint = currentShift?._count.points ?? 0;

                  return (
                    <TableRow key={schedule.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8 rounded-full">
                            <AvatarFallback className="rounded-full bg-[#003B73] text-xs font-semibold text-white">
                              {schedule.user?.fullName
                                ?.split(" ")
                                .map((name) => name.charAt(0))
                                .slice(0, 2)
                                .join("")
                                .toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="">
                            <p className="text-xs font-medium">
                              {schedule.user?.fullName || "-"}
                            </p>
                            <p className="text-[10px] text-gray-500 font-semibold">
                              {schedule.user?.employeeNumber || "-"}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <ShiftIcon className="size-4 text-muted-foreground" />
                          <div className="">
                            <p className="font-mono text-xs font-semibold text-primary">
                              {schedule.schedule?.name}
                            </p>
                            <p className="text-[10px]">
                              {schedule.schedule?.site?.code}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <span className="text-xs font-semibold">
                            {schedule.schedule?.startTime}
                          </span>{" "}
                          -
                          <span className="text-xs font-semibold">
                            {schedule.schedule?.endTime}
                          </span>
                        </div>
                        <p className="pl-7 text-[10px] font-semibold text-gray-500">
                          WITA
                        </p>
                      </TableCell>

                      <TableCell>
                        <span
                          className={`whitespace-nowrap text-xs font-semibold ${
                            schedule.status === "INACTIVE"
                              ? "text-rose-600"
                              : "text-foreground"
                          }`}
                        >
                          {countPoint} Titik
                        </span>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`rounded whitespace-nowrap font-medium ${
                            STATUS_STYLES[schedule.status] ??
                            STATUS_STYLES.Terjadwal
                          }`}
                        >
                          {schedule.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col justify-between gap-2 border-t bg-muted/30 px-4 py-3 text-xs text-muted-foreground sm:flex-row">
          <span>Data shift tersinkronisasi dengan server komando pusat.</span>
        </div>
      </div>

      {/* Dialog Tambah Shift */}
      <Dialog
        open={isAddModalOpen}
        onOpenChange={(open) => {
          setIsAddModalOpen(open);

          if (!open) {
            setModalError(null);
            setModalLocationSearch("");
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tambah Shift Patroli</DialogTitle>
            <DialogDescription>
              Atur parameter shift, regu, dan checkpoint yang akan dimasukkan ke
              dalam jadwal patroli.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSchedule} className="space-y-5">
            {modalError && (
              <div className="flex items-center gap-2 rounded border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
                <AlertCircle className="size-4 shrink-0" />
                {modalError}
              </div>
            )}

            {/* Informasi Shift */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 border-b pb-2">
                <Clock className="size-4 text-primary" />
                <h3 className="text-sm font-semibold">Informasi Shift</h3>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nama Shift</Label>
                  <Input
                    className="rounded"
                    value={shiftName}
                    onChange={(e) => setShiftName(e.target.value)}
                    placeholder="Contoh: Shift Pagi"
                    required
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Jam Mulai</Label>
                    <Input
                      type="time"
                      className="rounded"
                      value={shiftStartTime}
                      onChange={(e) => setShiftStartTime(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Jam Selesai</Label>
                    <Input
                      type="time"
                      className="rounded"
                      value={shiftEndTime}
                      onChange={(e) => setShiftEndTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Interval Putaran (Menit)</Label>
                  <Input
                    type="number"
                    min={15}
                    max={480}
                    step={15}
                    className="rounded"
                    value={shiftIntervalMinutes}
                    onChange={(e) =>
                      setShiftIntervalMinutes(Number(e.target.value))
                    }
                    required
                  />

                  <div className="flex flex-wrap gap-1.5">
                    {[60, 90, 120, 180].map((minutes) => (
                      <Button
                        key={minutes}
                        type="button"
                        size="sm"
                        variant={
                          shiftIntervalMinutes === minutes
                            ? "default"
                            : "outline"
                        }
                        className={`h-7 rounded px-2 text-xs hover:bg-yellow-400 ${shiftIntervalMinutes === minutes ? "bg-[#FED400] text-black" : ""}`}
                        onClick={() => setShiftIntervalMinutes(minutes)}
                      >
                        {minutes}m
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Batas Toleransi (Menit)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={120}
                    step={5}
                    className="rounded"
                    value={shiftGracePeriodMinutes}
                    onChange={(e) =>
                      setShiftGracePeriodMinutes(Number(e.target.value))
                    }
                    required
                  />

                  <div className="flex flex-wrap gap-1.5">
                    {[15, 30, 45].map((minutes) => (
                      <Button
                        key={minutes}
                        type="button"
                        size="sm"
                        variant={
                          shiftGracePeriodMinutes === minutes
                            ? "default"
                            : "outline"
                        }
                        className={`h-7 rounded px-2 text-xs hover:bg-yellow-400 ${shiftGracePeriodMinutes === minutes ? "bg-[#FED400] text-black" : ""}`}
                        onClick={() => setShiftGracePeriodMinutes(minutes)}
                      >
                        {minutes}m
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-start justify-between gap-4 rounded border p-3">
                <div className="space-y-1">
                  <Label>Wajib Urut Checkpoint</Label>
                  <p className="text-xs text-muted-foreground">
                    Petugas harus melakukan tap checkpoint sesuai urutan yang
                    ditentukan.
                  </p>
                  <Badge variant="outline" className="rounded text-xs">
                    {shiftEnforceSequence ? "Urutan wajib" : "Urutan fleksibel"}
                  </Badge>
                </div>

                <Checkbox
                  checked={shiftEnforceSequence}
                  onCheckedChange={(checked) =>
                    setShiftEnforceSequence(checked === true)
                  }
                  className="mt-1 rounded"
                />
              </div>
            </section>

            {/* Checkpoint */}
            <section className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 text-primary" />
                    <h3 className="text-sm font-semibold">
                      Titik Lokasi Patroli
                    </h3>
                  </div>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {shiftLocationIds.length} titik dipilih. Urutan mengikuti
                    urutan pemilihan.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded"
                    disabled={
                      isLoadingPoints ||
                      !activePoint ||
                      activePoint.length === 0
                    }
                    onClick={() =>
                      setShiftLocationIds(
                        activePoint?.map((checkpoint) => checkpoint.id) ?? [],
                      )
                    }
                  >
                    Pilih Semua
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded"
                    disabled={shiftLocationIds.length === 0}
                    onClick={() => setShiftLocationIds([])}
                  >
                    Kosongkan
                  </Button>
                </div>
              </div>

              {/* Search Checkpoint */}
              <InputGroup className="rounded">
                <InputGroupAddon>
                  <Search className="size-4" />
                </InputGroupAddon>

                <InputGroupInput
                  placeholder="Cari nama, kode checkpoint, site..."
                  value={modalLocationSearch}
                  onChange={(e) => setModalLocationSearch(e.target.value)}
                />
              </InputGroup>

              {/* Checkpoint List */}
              <div className="max-h-56 space-y-1 overflow-y-auto rounded border p-2">
                {isLoadingPoints ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Memuat titik patroli...
                  </p>
                ) : filteredCheckpoints?.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Tidak ada checkpoint yang ditemukan.
                  </p>
                ) : (
                  filteredCheckpoints?.map((checkpoint) => {
                    const isSelected = shiftLocationIds.includes(checkpoint.id);

                    const orderIndex = shiftLocationIds.indexOf(checkpoint.id);

                    return (
                      <label
                        key={checkpoint.id}
                        className={`flex cursor-pointer items-center justify-between gap-3 rounded border p-2.5 transition-colors ${
                          isSelected
                            ? "border-primary/40 bg-primary/5"
                            : "border-transparent hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              setShiftLocationIds((prev) =>
                                checked
                                  ? prev.includes(checkpoint.id)
                                    ? prev
                                    : [...prev, checkpoint.id]
                                  : prev.filter((id) => id !== checkpoint.id),
                              );
                            }}
                            className="rounded"
                          />

                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {checkpoint.name}
                            </p>

                            <p className="truncate text-xs text-muted-foreground">
                              {checkpoint.site?.name ?? "-"} ·{" "}
                              {checkpoint.description ?? "-"}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          {isSelected && (
                            <Badge className="rounded text-xs">
                              #{orderIndex + 1}
                            </Badge>
                          )}

                          <span className="font-mono text-[10px] text-muted-foreground">
                            {checkpoint.id}
                          </span>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </section>

            <DialogFooter className="flex justify-end gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-end">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Batal
                </Button>

                <Button
                  type="submit"
                  className="rounded bg-[#FED400] hover:bg-yellow-400 text-black"
                >
                  <Save className="mr-2 size-4" />
                  Simpan Shift
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
