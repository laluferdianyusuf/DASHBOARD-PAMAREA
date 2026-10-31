import React, { useState } from "react";
import {
  CHECKPOINTS,
  PATROL_SCHEDULES,
  PatrolScheduleItem,
  SITES,
} from "../data/mockData";
import { ShiftOfficerAssignment } from "../utils/security-logic";
import { NavTab } from "./Sidebar";

import {
  AlertCircle,
  CalendarDays,
  Check,
  Clock,
  CloudSun,
  Download,
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
  const [internalSchedules, setInternalSchedules] =
    useState<PatrolScheduleItem[]>(PATROL_SCHEDULES);

  const schedules = propSchedules ?? internalSchedules;

  const setSchedules = (
    updater: React.SetStateAction<PatrolScheduleItem[]>,
  ) => {
    const next = typeof updater === "function" ? updater(schedules) : updater;

    onUpdateSchedules?.(next);
    setInternalSchedules(next);
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedShift, setSelectedShift] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [backupModalSchedule, setBackupModalSchedule] =
    useState<PatrolScheduleItem | null>(null);

  const [selectedBackupOfficer, setSelectedBackupOfficer] = useState(
    "Hendra Kurniawan (Cadangan 1)",
  );
  const [backupReason, setBackupReason] = useState("Izin Sakit Terverifikasi");
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Form shift
  const [shiftSiteId, setShiftSiteId] = useState("site-a");
  const [shiftName, setShiftName] = useState("Shift Pagi");
  const [shiftStartTime, setShiftStartTime] = useState("07:00");
  const [shiftEndTime, setShiftEndTime] = useState("15:00");
  const [shiftIntervalMinutes, setShiftIntervalMinutes] = useState(120);
  const [shiftGracePeriodMinutes, setShiftGracePeriodMinutes] = useState(30);
  const [shiftEnforceSequence, setShiftEnforceSequence] = useState(false);

  const [shiftLocationIds, setShiftLocationIds] = useState<string[]>([
    "CP-SDR-001",
    "CP-SDR-002",
    "CP-SDR-003",
  ]);

  const [modalLocationSearch, setModalLocationSearch] = useState("");
  const [modalSquad, setModalSquad] = useState("Regu Alpha");
  const [modalDanru, setModalDanru] = useState("Ahmad Fauzi");
  const [copiedModalJson, setCopiedModalJson] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const filteredSchedules = schedules.filter((schedule) => {
    if (selectedSite !== "all" && schedule.siteId !== selectedSite) {
      return false;
    }

    if (selectedShift !== "all" && !schedule.shift.includes(selectedShift)) {
      return false;
    }

    if (selectedStatus !== "all" && schedule.status !== selectedStatus) {
      return false;
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();

      const match = [
        schedule.id,
        schedule.sector,
        schedule.squad,
        schedule.danru,
        schedule.siteName,
      ].some((value) => value.toLowerCase().includes(query));

      if (!match) return false;
    }

    return true;
  });

  const showToast = (message: string) => {
    setSuccessToast(message);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handlePlotBackup = (e: React.FormEvent) => {
    e.preventDefault();

    if (!backupModalSchedule) return;

    setSchedules((prev) =>
      prev.map((schedule) => {
        if (schedule.id !== backupModalSchedule.id) return schedule;

        return {
          ...schedule,
          assignedCount: schedule.requiredCount,
          guardRatio: `${schedule.requiredCount}/${schedule.requiredCount} Petugas Lengkap (Plot: ${selectedBackupOfficer})`,
          status: "Berjalan Aktif",
        };
      }),
    );

    setBackupModalSchedule(null);

    showToast(
      `Personel ${selectedBackupOfficer} berhasil diplot. Alasan: ${backupReason}`,
    );
  };

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!shiftName.trim()) {
      setModalError("Nama shift wajib diisi.");
      return;
    }

    if (shiftLocationIds.length === 0) {
      setModalError("Pilih minimal satu titik patroli.");
      return;
    }

    const siteObj = SITES.find((site) => site.id === shiftSiteId);

    if (!siteObj) {
      setModalError("Site yang dipilih tidak ditemukan.");
      return;
    }

    const newId = `SCH-2025-0524-${String(schedules.length + 1).padStart(
      2,
      "0",
    )}`;

    const selectedPoints = CHECKPOINTS.filter((checkpoint) =>
      shiftLocationIds.includes(checkpoint.id),
    );

    const locationNames = selectedPoints.map((checkpoint) => checkpoint.name);

    const created: PatrolScheduleItem = {
      id: newId,
      siteId: shiftSiteId,
      siteName: siteObj.name.replace(/^Site [A-D] - /, ""),
      sector: `${selectedPoints.length} Titik (${locationNames
        .slice(0, 2)
        .join(", ")}${locationNames.length > 2 ? "..." : ""})`,
      squad: modalSquad,
      danru: modalDanru,
      shift: `${shiftName} (${shiftStartTime} - ${shiftEndTime})` as any,
      routeName: `Rute ${shiftName} (${
        shiftEnforceSequence ? "Wajib Urut" : "Fleksibel"
      })`,
      checkpointCount: selectedPoints.length,
      frequency: `Setiap ${shiftIntervalMinutes} Menit (Toleransi ${shiftGracePeriodMinutes}m)`,
      guardRatio: "4/4 Petugas",
      assignedCount: 4,
      requiredCount: 4,
      status: "Terjadwal",
      date: "2025-05-24",
    };

    setSchedules([created, ...schedules]);
    setIsAddModalOpen(false);

    showToast(
      `Shift "${shiftName}" berhasil dibuat dengan ${shiftLocationIds.length} titik lokasi.`,
    );
  };

  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Site",
      "Sector",
      "Squad",
      "Danru",
      "Shift",
      "Status",
    ];

    const rows = schedules.map((schedule) =>
      [
        schedule.id,
        schedule.siteName,
        schedule.sector,
        schedule.squad,
        schedule.danru,
        schedule.shift,
        schedule.status,
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(","),
    );

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "Jadwal_Patroli_PAMAREA.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const filteredCheckpoints = CHECKPOINTS.filter((checkpoint) => {
    if (!modalLocationSearch.trim()) return true;

    const query = modalLocationSearch.toLowerCase();

    return [
      checkpoint.name,
      checkpoint.id,
      checkpoint.zoneFloor,
      checkpoint.siteName,
    ].some((value) => value.toLowerCase().includes(query));
  });

  const getShiftIcon = (shift: string) => {
    if (shift.includes("Pagi")) return Sun;
    if (shift.includes("Siang")) return CloudSun;
    return Moon;
  };

  return (
    <div className="space-y-5">
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
            variant="outline"
            size="sm"
            className="rounded"
            onClick={handleExportCSV}
          >
            <Download className="mr-2 size-4" />
            Ekspor CSV
          </Button>

          <Button
            size="sm"
            className="rounded"
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
            <SelectTrigger className="w-full rounded sm:w-[190px]">
              <SelectValue placeholder="Semua Shift" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Shift</SelectItem>
              <SelectItem value="Pagi">Shift Pagi</SelectItem>
              <SelectItem value="Siang">Shift Siang</SelectItem>
              <SelectItem value="Malam">Shift Malam</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={selectedStatus}
            onValueChange={(value) => setSelectedStatus(value as string)}
          >
            <SelectTrigger className="w-full rounded sm:w-[190px]">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="Berjalan Aktif">Berjalan Aktif</SelectItem>
              <SelectItem value="Perlu Pengganti">Perlu Pengganti</SelectItem>
              <SelectItem value="Selesai Tuntas">Selesai Tuntas</SelectItem>
              <SelectItem value="Terjadwal">Terjadwal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p className="shrink-0 text-sm text-muted-foreground">
          Menampilkan{" "}
          <span className="font-semibold text-foreground">
            {filteredSchedules.length}
          </span>{" "}
          dari {schedules.length} jadwal
        </p>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded border bg-background">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="whitespace-nowrap">Kode Jadwal</TableHead>
                <TableHead>Petugas</TableHead>
                <TableHead>Shift</TableHead>
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
                filteredSchedules.map((schedule) => {
                  const ShiftIcon = getShiftIcon(schedule.shift);

                  return (
                    <TableRow key={schedule.id}>
                      <TableCell>
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <span
                            className={`size-2 shrink-0 rounded ${
                              schedule.status === "Berjalan Aktif"
                                ? "bg-emerald-500"
                                : schedule.status === "Perlu Pengganti"
                                  ? "bg-rose-500"
                                  : "bg-slate-400"
                            }`}
                          />
                          <span className="font-mono text-xs font-semibold text-primary">
                            {schedule.id}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <p className="font-medium">{schedule.danru}</p>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <ShiftIcon className="size-4 text-muted-foreground" />
                          <span className="text-xs">{schedule.shift}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span
                          className={`whitespace-nowrap text-xs font-medium ${
                            schedule.status === "Perlu Pengganti"
                              ? "text-rose-600"
                              : "text-foreground"
                          }`}
                        >
                          {schedule.guardRatio}
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
          <span>
            <span className="font-medium text-foreground">Shift aktif:</span>{" "}
            Shift Siang (15:00 - 23:00 WIB)
          </span>
        </div>
      </div>

      {/* Dialog Plot Cadangan */}
      <Dialog
        open={Boolean(backupModalSchedule)}
        onOpenChange={(open) => {
          if (!open) setBackupModalSchedule(null);
        }}
      >
        <DialogContent className="rounded sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Plot Personel Cadangan</DialogTitle>
            <DialogDescription>
              Tetapkan personel pengganti untuk melengkapi kebutuhan petugas
              shift.
            </DialogDescription>
          </DialogHeader>

          {backupModalSchedule && (
            <form onSubmit={handlePlotBackup} className="space-y-4">
              <div className="rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                <p className="font-semibold">
                  {backupModalSchedule.id} - {backupModalSchedule.siteName}
                </p>
                <p className="mt-1 text-xs">
                  {backupModalSchedule.shift} · Kekurangan personel
                </p>
              </div>

              <div className="space-y-2">
                <Label>Personel Cadangan</Label>
                <Select
                  value={selectedBackupOfficer}
                  onValueChange={(value) =>
                    setSelectedBackupOfficer(value as string)
                  }
                >
                  <SelectTrigger className="rounded">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hendra Kurniawan (Cadangan 1)">
                      Hendra Kurniawan (Cadangan 1)
                    </SelectItem>
                    <SelectItem value="Fajar Ramadhan (Cadangan 2)">
                      Fajar Ramadhan (Cadangan 2)
                    </SelectItem>
                    <SelectItem value="Teguh Santoso (Cadangan 3)">
                      Teguh Santoso (Cadangan 3)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Alasan Penugasan</Label>
                <Input
                  className="rounded"
                  value={backupReason}
                  onChange={(e) => setBackupReason(e.target.value)}
                  placeholder="Alasan penugasan cadangan"
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded"
                  onClick={() => setBackupModalSchedule(null)}
                >
                  Batal
                </Button>
                <Button type="submit" className="rounded">
                  Konfirmasi Penugasan
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

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
                  <Label>Lokasi Fasilitas</Label>
                  <Select
                    value={shiftSiteId}
                    onValueChange={(value) => setShiftSiteId(value as string)}
                  >
                    <SelectTrigger className="rounded">
                      <SelectValue placeholder="Pilih site" />
                    </SelectTrigger>
                    <SelectContent>
                      {SITES.filter((site) => site.id !== "all").map((site) => (
                        <SelectItem key={site.id} value={site.id}>
                          {site.id} — {site.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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
                        className="h-7 rounded px-2 text-xs"
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
                        className="h-7 rounded px-2 text-xs"
                        onClick={() => setShiftGracePeriodMinutes(minutes)}
                      >
                        {minutes}m
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Regu</Label>
                  <Input
                    className="rounded"
                    value={modalSquad}
                    onChange={(e) => setModalSquad(e.target.value)}
                    placeholder="Nama regu"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Danru</Label>
                  <Input
                    className="rounded"
                    value={modalDanru}
                    onChange={(e) => setModalDanru(e.target.value)}
                    placeholder="Nama komandan regu"
                  />
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
                    onClick={() =>
                      setShiftLocationIds(
                        CHECKPOINTS.map((checkpoint) => checkpoint.id),
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
                    onClick={() => setShiftLocationIds([])}
                  >
                    Kosongkan
                  </Button>
                </div>
              </div>

              <InputGroup className="rounded">
                <InputGroupAddon>
                  <Search className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder="Cari nama, kode checkpoint, lantai..."
                  value={modalLocationSearch}
                  onChange={(e) => setModalLocationSearch(e.target.value)}
                />
              </InputGroup>

              <div className="max-h-56 space-y-1 overflow-y-auto rounded border p-2">
                {filteredCheckpoints.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Tidak ada checkpoint yang ditemukan.
                  </p>
                ) : (
                  filteredCheckpoints.map((checkpoint) => {
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
                                  ? [...prev, checkpoint.id]
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
                              {checkpoint.zoneFloor} · {checkpoint.siteName}
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

            <DialogFooter className="flex justify-end gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Batal
                </Button>

                <Button type="submit" className="rounded">
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
