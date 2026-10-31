import React, { useMemo, useState } from "react";

import { INITIAL_OFFICERS_POOL } from "../data/calendarMockData";
import {
  CheckpointItem,
  CHECKPOINTS,
  EMPTY_SHIFT,
  INITIAL_SHIFTS,
  PatrolScheduleItem,
  ShiftConfig,
  SITES,
} from "../data/mockData";
import {
  DateRangeShiftPayload,
  ShiftOfficerAssignment,
} from "../utils/security-logic";
import { NavTab } from "./Sidebar";

import {
  AlertCircle,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  Users,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TambahJadwalShiftViewProps {
  onNavigate: (tab: NavTab) => void;
  onAddDateRangeScheduleAndSyncCalendar: (
    newSchedules: PatrolScheduleItem[],
    dateRangePayload: DateRangeShiftPayload,
  ) => void;
  calendarDays?: any[];
}

type DialogMode =
  | "create"
  | "edit"
  | "locations"
  | "officers"
  | "schedule"
  | null;

const POST_OPTIONS = [
  "Pos Utama Gerbang Depan",
  "Pintu Masuk Lobi & Metal Detector",
  "Patroli Koridor & Lift VIP",
  "Pintu Evakuasi Barat & Loading Bay",
  "Pos Timbangan & Dermaga Kontainer",
  "Ruang Server & Genset B2",
  "Patroli Perimeter Selatan & Pagar",
  "Gerbang Timur & Pemeriksaan X-Ray",
  "Pos Pantau CCTV & Pusat Kendali",
  "Cadangan Siaga / Mobile Patrol",
];

const SQUAD_OPTIONS = ["Alpha", "Bravo", "Charlie", "Delta"];

const getTodayString = () => {
  const today = new Date();

  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
};

export const TambahJadwalShiftView: React.FC<TambahJadwalShiftViewProps> = ({
  onNavigate,
  onAddDateRangeScheduleAndSyncCalendar,
}) => {
  const [shifts, setShifts] = useState<ShiftConfig[]>(INITIAL_SHIFTS);

  const [search, setSearch] = useState("");
  const [siteFilter, setSiteFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);

  const [form, setForm] = useState<ShiftConfig>(EMPTY_SHIFT);

  const [locationSearch, setLocationSearch] = useState("");
  const [locationSiteFilter, setLocationSiteFilter] = useState("all");

  const [officerSearch, setOfficerSearch] = useState("");

  const [startDate, setStartDate] = useState(getTodayString);
  const [endDate, setEndDate] = useState(getTodayString);

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
  const [modalError, setModalError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedShift = shifts.find((shift) => shift.id === selectedShiftId);

  const availableOfficers = INITIAL_OFFICERS_POOL as ShiftOfficerAssignment[];

  const filteredShifts = useMemo(() => {
    return shifts.filter((shift) => {
      const query = search.toLowerCase();

      const matchesSearch =
        shift.name.toLowerCase().includes(query) ||
        shift.id.toLowerCase().includes(query) ||
        shift.squad.toLowerCase().includes(query) ||
        shift.danru.toLowerCase().includes(query);

      const matchesSite = siteFilter === "all" || shift.siteId === siteFilter;

      const matchesStatus =
        statusFilter === "all" || shift.status === statusFilter;

      return matchesSearch && matchesSite && matchesStatus;
    });
  }, [shifts, search, siteFilter, statusFilter]);

  const activeCount = shifts.filter((shift) => shift.status === "Aktif").length;

  const inactiveCount = shifts.length - activeCount;

  const openCreate = () => {
    setForm({
      ...EMPTY_SHIFT,
      id: "",
    });

    setSelectedShiftId(null);
    setError("");
    setDialogMode("schedule");
  };

  const openEdit = (shift: ShiftConfig) => {
    setForm({
      ...shift,
      locationIds: [...shift.locationIds],
      officers: [...shift.officers],
    });

    setSelectedShiftId(shift.id);
    setError("");
    setDialogMode("edit");
  };

  const openAssignment = (
    shift: ShiftConfig,
    mode: "locations" | "officers" | "schedule",
  ) => {
    setForm({
      ...shift,
      locationIds: [...shift.locationIds],
      officers: [...shift.officers],
    });

    setSelectedShiftId(shift.id);
    setError("");

    setLocationSearch("");
    setOfficerSearch("");

    // Filter checkpoint mengikuti site shift.
    setLocationSiteFilter(shift.siteId);

    setDialogMode(mode);
  };

  const closeDialog = () => {
    setDialogMode(null);
    setError("");
  };

  const updateForm = <K extends keyof ShiftConfig>(
    key: K,
    value: ShiftConfig[K],
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveShift = () => {
    if (!form.siteId || !form.name.trim()) {
      setError("Site dan nama shift wajib diisi.");
      return;
    }

    if (!form.startTime || !form.endTime || form.startTime === form.endTime) {
      setError("Jam mulai dan selesai tidak valid.");
      return;
    }

    if (form.intervalMinutes < 15 || form.intervalMinutes > 480) {
      setError("Interval patroli harus 15-480 menit.");
      return;
    }

    if (form.gracePeriodMinutes < 0 || form.gracePeriodMinutes > 120) {
      setError("Grace period harus 0-120 menit.");
      return;
    }

    if (form.requiredCount < 1) {
      setError("Minimal kebutuhan personel adalah 1.");
      return;
    }

    if (dialogMode === "create") {
      const newShift: ShiftConfig = {
        ...form,
        id: `SHF-${String(Date.now()).slice(-6)}`,
      };

      setShifts((prev) => [...prev, newShift]);
      setSuccess("Shift berhasil ditambahkan.");
    } else {
      setShifts((prev) =>
        prev.map((shift) => (shift.id === form.id ? form : shift)),
      );

      setSuccess("Konfigurasi shift berhasil diperbarui.");
    }

    closeDialog();
  };

  const filteredLocations = useMemo(() => {
    return CHECKPOINTS.filter((checkpoint) => {
      const query = locationSearch.toLowerCase();

      const matchesSearch =
        checkpoint.name.toLowerCase().includes(query) ||
        checkpoint.id.toLowerCase().includes(query) ||
        checkpoint.tagUid.toLowerCase().includes(query) ||
        checkpoint.zoneFloor.toLowerCase().includes(query);

      const matchesSite =
        locationSiteFilter === "all" ||
        checkpoint.siteId === locationSiteFilter;

      return matchesSearch && matchesSite;
    });
  }, [locationSearch, locationSiteFilter]);

  const toggleLocation = (id: string) => {
    setForm((prev) => ({
      ...prev,
      locationIds: prev.locationIds.includes(id)
        ? prev.locationIds.filter((item) => item !== id)
        : [...prev.locationIds, id],
    }));
  };

  const moveLocation = (index: number, direction: "up" | "down") => {
    setForm((prev) => {
      const locations = [...prev.locationIds];

      const target = direction === "up" ? index - 1 : index + 1;

      if (target < 0 || target >= locations.length) {
        return prev;
      }

      [locations[index], locations[target]] = [
        locations[target],
        locations[index],
      ];

      return {
        ...prev,
        locationIds: locations,
      };
    });
  };

  const saveLocations = () => {
    setShifts((prev) =>
      prev.map((shift) =>
        shift.id === form.id
          ? {
              ...shift,
              locationIds: [...form.locationIds],
            }
          : shift,
      ),
    );

    setSuccess("Titik patroli berhasil diperbarui.");
    closeDialog();
  };

  const filteredOfficers = useMemo(() => {
    const query = officerSearch.toLowerCase();

    return availableOfficers.filter((officer) => {
      return (
        officer.officerName.toLowerCase().includes(query) ||
        officer.role.toLowerCase().includes(query) ||
        (officer.npp || "").toLowerCase().includes(query) ||
        (officer.callSign || "").toLowerCase().includes(query)
      );
    });
  }, [availableOfficers, officerSearch]);

  const toggleOfficer = (officer: ShiftOfficerAssignment) => {
    setForm((prev) => {
      const exists = prev.officers.some(
        (item) => item.officerId === officer.officerId,
      );

      return {
        ...prev,
        officers: exists
          ? prev.officers.filter((item) => item.officerId !== officer.officerId)
          : [
              ...prev.officers,
              {
                ...officer,
                post:
                  officer.post ||
                  POST_OPTIONS[prev.officers.length % POST_OPTIONS.length],
              },
            ],
      };
    });
  };

  const updateOfficerPost = (officerId: string, post: string) => {
    setForm((prev) => ({
      ...prev,
      officers: prev.officers.map((officer) =>
        officer.officerId === officerId ? { ...officer, post } : officer,
      ),
    }));
  };

  const updateOfficerRole = (officerId: string, role: string) => {
    setForm((prev) => ({
      ...prev,
      officers: prev.officers.map((officer) =>
        officer.officerId === officerId ? { ...officer, role } : officer,
      ),
    }));
  };

  const saveOfficers = () => {
    setShifts((prev) =>
      prev.map((shift) =>
        shift.id === form.id
          ? {
              ...shift,
              officers: [...form.officers],
              danru:
                form.officers.find((officer) =>
                  officer.role.toLowerCase().includes("komandan"),
                )?.officerName || form.danru,
              squad: form.squad,
              requiredCount: form.requiredCount,
            }
          : shift,
      ),
    );

    setSuccess("Personel shift berhasil diperbarui.");
    closeDialog();
  };

  const handleCreateSchedule = () => {
    if (!selectedShift) return;

    if (!startDate || !endDate || startDate > endDate) {
      setError("Rentang tanggal tidak valid.");
      return;
    }

    if (selectedShift.locationIds.length === 0) {
      setError("Shift belum memiliki titik patroli.");
      return;
    }

    if (selectedShift.officers.length === 0) {
      setError("Shift belum memiliki personel security.");
      return;
    }

    const site = SITES.find((item) => item.id === selectedShift.siteId);

    const checkpoints = selectedShift.locationIds
      .map((id) => CHECKPOINTS.find((cp) => cp.id === id))
      .filter(Boolean) as CheckpointItem[];

    const locationNames = checkpoints.map((checkpoint) => checkpoint.name);

    const shiftType: "Pagi" | "Siang" | "Malam" =
      selectedShift.name.toLowerCase().includes("malam") ||
      selectedShift.startTime >= "22:00"
        ? "Malam"
        : selectedShift.name.toLowerCase().includes("siang") ||
            selectedShift.startTime >= "14:00"
          ? "Siang"
          : "Pagi";

    const siteName = (site?.name || "").replace(/^Site [A-D] - /, "");

    const payload: DateRangeShiftPayload = {
      shiftName: selectedShift.name,
      shiftType,
      startTime: selectedShift.startTime,
      endTime: selectedShift.endTime,
      squad: selectedShift.squad,
      danru: selectedShift.danru,
      locations: [
        {
          siteId: selectedShift.siteId,
          siteName,
          sector: `${checkpoints.length} Titik`,
          selectedPosts: locationNames,
        },
      ],
      startDate,
      endDate,
      requiredCount: selectedShift.requiredCount,
      officers: selectedShift.officers,
    };

    const schedules: PatrolScheduleItem[] = [
      {
        id: `SCH-${Date.now()}`,
        siteId: selectedShift.siteId,
        siteName,
        sector: `${checkpoints.length} Titik (${locationNames
          .slice(0, 2)
          .join(", ")})`,
        squad: selectedShift.squad,
        danru: selectedShift.danru,
        shift:
          `${selectedShift.name} (${selectedShift.startTime} - ${selectedShift.endTime})` as any,
        routeName: `Rute Patroli ${selectedShift.name}`,
        checkpointCount: checkpoints.length,
        frequency: `Setiap ${selectedShift.intervalMinutes} Menit`,
        guardRatio: `${selectedShift.officers.length}/${selectedShift.requiredCount} Petugas`,
        assignedCount: selectedShift.officers.length,
        requiredCount: selectedShift.requiredCount,
        status:
          selectedShift.officers.length >= selectedShift.requiredCount
            ? "Berjalan Aktif"
            : "Terjadwal",
        date: `${startDate} s/d ${endDate}`,
      },
    ];

    onAddDateRangeScheduleAndSyncCalendar(schedules, payload);

    setSuccess("Jadwal berhasil dibuat dan dikirim ke kalender.");

    closeDialog();
    onNavigate("kalender");
  };

  const handleDelete = () => {
    if (!deleteTarget) return;

    setShifts((prev) => prev.filter((shift) => shift.id !== deleteTarget));

    setDeleteTarget(null);
    setSuccess("Shift berhasil dihapus.");
  };

  const toggleStatus = (shift: ShiftConfig) => {
    setShifts((prev) =>
      prev.map((item) =>
        item.id === shift.id
          ? {
              ...item,
              status: item.status === "Aktif" ? "Nonaktif" : "Aktif",
            }
          : item,
      ),
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Manajemen Shift
          </h1>

          <p className="mt-1 text-xs text-muted-foreground">
            Kelola konfigurasi shift, checkpoint, personel, dan penjadwalan.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded"
            onClick={() => onNavigate("jadwal")}
          >
            Daftar Jadwal
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="rounded"
            onClick={() => onNavigate("kalender")}
          >
            <CalendarDays className="mr-2 size-4" />
            Kalender
          </Button>

          <Button size="sm" className="rounded" onClick={openCreate}>
            <Plus className="mr-2 size-4" />
            Tambah Shift
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded border bg-background">
        <div className="space-y-3 border-b p-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xs font-semibold">
                Daftar Konfigurasi Shift
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                Kelola seluruh konfigurasi shift pengamanan.
              </p>
            </div>

            <p className="text-xs text-muted-foreground">
              {filteredShifts.length} dari {shifts.length} shift
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_250px]">
            <InputGroup className="rounded">
              <InputGroupAddon>
                <Search className="size-4 text-muted-foreground" />
              </InputGroupAddon>

              <InputGroupInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama shift, ID, regu, atau Danru..."
              />
            </InputGroup>

            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as string)}
            >
              <SelectTrigger className="rounded w-full">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>

              <SelectContent className={`w-full`}>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="Aktif">Aktif</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Nama Shift</TableHead>
                <TableHead>Jam Operasional</TableHead>
                <TableHead>Interval</TableHead>
                <TableHead>Checkpoint</TableHead>
                <TableHead>Personel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-4 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredShifts.map((shift) => {
                const site = SITES.find((item) => item.id === shift.siteId);

                return (
                  <TableRow key={shift.id}>
                    <TableCell className="pl-4">
                      <div className="text-xs font-medium">{shift.name}</div>

                      <div className="mt-1 text-xs text-muted-foreground">
                        {shift.id} · {shift.squad}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs font-medium">
                        <Clock className="size-3.5 text-muted-foreground" />
                        {shift.startTime} - {shift.endTime}
                      </div>

                      <div className="mt-1 text-xs text-muted-foreground">
                        Grace {shift.gracePeriodMinutes} menit
                      </div>
                    </TableCell>

                    <TableCell className="text-xs">
                      {shift.intervalMinutes} menit
                    </TableCell>

                    <TableCell>
                      <div className="text- font-medium">
                        {shift.locationIds.length} titik
                      </div>

                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto rounded p-0 text-xs"
                        onClick={() => openAssignment(shift, "locations")}
                      >
                        Kelola titik
                      </Button>
                    </TableCell>

                    <TableCell>
                      <div className="text-xs font-medium">
                        {shift.officers.length}/{shift.requiredCount}
                      </div>

                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto rounded p-0 text-xs"
                        onClick={() => openAssignment(shift, "officers")}
                      >
                        Kelola personel
                      </Button>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          shift.status === "Aktif" ? "default" : "secondary"
                        }
                        className="rounded"
                      >
                        {shift.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="pr-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded"
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(shift)}>
                            <Pencil className="mr-2 size-4" />
                            Edit Konfigurasi
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => openAssignment(shift, "locations")}
                          >
                            <MapPin className="mr-2 size-4" />
                            Assign Titik Patroli
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => openAssignment(shift, "officers")}
                          >
                            <Users className="mr-2 size-4" />
                            Assign Personel
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => {
                              setStartDate(getTodayString());
                              setEndDate(getTodayString());
                              openAssignment(shift, "schedule");
                            }}
                          >
                            <CalendarDays className="mr-2 size-4" />
                            Buat Jadwal
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => toggleStatus(shift)}>
                            <RotateCcw className="mr-2 size-4" />
                            {shift.status === "Aktif"
                              ? "Nonaktifkan"
                              : "Aktifkan"}
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteTarget(shift.id)}
                          >
                            <Trash2 className="mr-2 size-4" />
                            Hapus Shift
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}

              {filteredShifts.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-32 text-center text-xs text-muted-foreground"
                  >
                    Tidak ada shift yang ditemukan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-1 border-t px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            Menampilkan {filteredShifts.length} dari {shifts.length} shift
          </span>

          <span>
            {activeCount} aktif · {inactiveCount} nonaktif
          </span>
        </div>
      </div>

      <Dialog
        open={dialogMode === "locations"}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="max-h-full overflow-y-auto rounded sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Titik Patroli</DialogTitle>

            <DialogDescription>
              {form.name} · Pilih checkpoint dan tentukan urutan patroli.
            </DialogDescription>
          </DialogHeader>

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto py-2 lg:grid-cols-5">
            <div className="flex min-h-0 flex-col space-y-3 lg:col-span-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_150px]">
                <InputGroup className="rounded">
                  <InputGroupAddon>
                    <Search className="size-4 text-muted-foreground" />
                  </InputGroupAddon>

                  <InputGroupInput
                    placeholder="Cari checkpoint..."
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                  />
                </InputGroup>

                <Select
                  value={locationSiteFilter}
                  onValueChange={(value) =>
                    setLocationSiteFilter(value as string)
                  }
                >
                  <SelectTrigger className="rounded w-full">
                    <SelectValue placeholder="Semua Site" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">Semua Site</SelectItem>

                    {SITES.filter((site) => site.id !== "all").map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-h-0 overflow-auto rounded border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Checkpoint</TableHead>
                      <TableHead>NFC UID</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredLocations.map((checkpoint) => {
                      const checked = form.locationIds.includes(checkpoint.id);

                      return (
                        <TableRow key={checkpoint.id}>
                          <TableCell>
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() =>
                                toggleLocation(checkpoint.id)
                              }
                            />
                          </TableCell>

                          <TableCell>
                            <p className="text-xs font-medium">
                              {checkpoint.name}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              {checkpoint.id}
                            </p>
                          </TableCell>

                          <TableCell className="font-mono text-xs">
                            {checkpoint.tagUid}
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {filteredLocations.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="h-24 text-center text-xs text-muted-foreground"
                        >
                          Checkpoint tidak ditemukan.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex min-h-0 flex-col rounded border p-3 lg:col-span-2">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold">Urutan Patroli</p>

                  <p className="text-xs text-muted-foreground">
                    {form.locationIds.length} checkpoint dipilih
                  </p>
                </div>

                <Badge variant="secondary" className="rounded">
                  {form.enforceSequence ? "Wajib urut" : "Fleksibel"}
                </Badge>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto">
                {form.locationIds.map((id, index) => {
                  const checkpoint = CHECKPOINTS.find((item) => item.id === id);

                  return (
                    <div
                      key={id}
                      className="flex items-center gap-2 rounded border p-2"
                    >
                      <span className="flex size-6 shrink-0 items-center justify-center rounded bg-primary text-xs text-primary-foreground">
                        {index + 1}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium">
                          {checkpoint?.name || id}
                        </p>

                        <p className="text-[10px] text-muted-foreground">
                          {id}
                        </p>
                      </div>

                      <div className="flex flex-col">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6 rounded"
                          disabled={index === 0}
                          onClick={() => moveLocation(index, "up")}
                        >
                          <ChevronUp className="size-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6 rounded"
                          disabled={index === form.locationIds.length - 1}
                          onClick={() => moveLocation(index, "down")}
                        >
                          <ChevronDown className="size-3.5" />
                        </Button>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 rounded text-destructive"
                        onClick={() => toggleLocation(id)}
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  );
                })}

                {form.locationIds.length === 0 && (
                  <p className="py-10 text-center text-xs text-muted-foreground">
                    Belum ada checkpoint dipilih.
                  </p>
                )}
              </div>
            </div>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <DialogFooter>
            <Button variant="outline" className="rounded" onClick={closeDialog}>
              Batal
            </Button>

            <Button className="rounded" onClick={saveLocations}>
              <Save className="mr-2 size-4" />
              Simpan Titik Patroli
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogMode === "officers"}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Personel Security</DialogTitle>

            <DialogDescription>
              Pilih personel yang akan bertugas pada {form.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 py-2 lg:grid-cols-2">
            <div className="flex min-h-0 flex-col space-y-3">
              <InputGroup className="h-9 rounded">
                <InputGroupAddon>
                  <Search className="size-4 text-muted-foreground" />
                </InputGroupAddon>

                <InputGroupInput
                  value={officerSearch}
                  onChange={(e) => setOfficerSearch(e.target.value)}
                  placeholder="Cari nama, NPP, callsign..."
                />
              </InputGroup>

              <div className="max-h-[420px] overflow-auto rounded border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Personel</TableHead>
                      <TableHead>NPP</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredOfficers.map((officer) => {
                      const checked = form.officers.some(
                        (item) => item.officerId === officer.officerId,
                      );

                      return (
                        <TableRow key={officer.officerId}>
                          <TableCell>
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleOfficer(officer)}
                            />
                          </TableCell>

                          <TableCell>
                            <p className="text-xs font-medium">
                              {officer.officerName}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              {officer.callSign || officer.role}
                            </p>
                          </TableCell>

                          <TableCell className="font-mono text-xs">
                            {officer.npp}
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {filteredOfficers.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="h-24 text-center text-xs text-muted-foreground"
                        >
                          Personel tidak ditemukan.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold">Personel Terpilih</p>

                  <p className="text-xs text-muted-foreground">
                    {form.officers.length}/{form.requiredCount} personel
                  </p>
                </div>

                <Badge
                  variant={
                    form.officers.length >= form.requiredCount
                      ? "default"
                      : "secondary"
                  }
                  className="rounded"
                >
                  {form.officers.length >= form.requiredCount
                    ? "Kuota terpenuhi"
                    : "Belum terpenuhi"}
                </Badge>
              </div>

              <div className="space-y-3 rounded border p-3">
                <div className="space-y-1.5">
                  <Label>Regu</Label>

                  <Select
                    value={form.squad}
                    onValueChange={(value) =>
                      updateForm("squad", value as string)
                    }
                  >
                    <SelectTrigger className="h-9 rounded">
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      {SQUAD_OPTIONS.map((name) => (
                        <SelectItem key={name} value={`Regu ${name}`}>
                          Regu {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Target Personel</Label>

                  <Input
                    className="h-9 rounded"
                    type="number"
                    min={1}
                    value={form.requiredCount}
                    onChange={(e) =>
                      updateForm("requiredCount", Number(e.target.value))
                    }
                  />
                </div>

                <div className="max-h-[300px] space-y-2 overflow-y-auto">
                  {form.officers.map((officer, index) => (
                    <div
                      key={officer.officerId}
                      className="space-y-2 rounded border p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold">
                            {index + 1}. {officer.officerName}
                          </p>

                          <p className="text-[10px] text-muted-foreground">
                            {officer.npp}
                          </p>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 rounded text-destructive"
                          onClick={() => toggleOfficer(officer)}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Jabatan</Label>

                        <Select
                          value={officer.role}
                          onValueChange={(value) =>
                            updateOfficerRole(
                              officer.officerId,
                              value as string,
                            )
                          }
                        >
                          <SelectTrigger className="h-9 rounded text-xs">
                            <SelectValue />
                          </SelectTrigger>

                          <SelectContent>
                            <SelectItem value="Komandan Regu (Danru)">
                              Komandan Regu (Danru)
                            </SelectItem>

                            <SelectItem value="Petugas Lapangan">
                              Petugas Lapangan
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Penempatan Pos</Label>

                        <Select
                          value={officer.post}
                          onValueChange={(value) =>
                            updateOfficerPost(
                              officer.officerId,
                              value as string,
                            )
                          }
                        >
                          <SelectTrigger className="h-9 rounded text-xs">
                            <SelectValue placeholder="Pilih pos" />
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
                    </div>
                  ))}

                  {form.officers.length === 0 && (
                    <p className="py-8 text-center text-xs text-muted-foreground">
                      Belum ada personel dipilih.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <DialogFooter>
            <Button variant="outline" className="rounded" onClick={closeDialog}>
              Batal
            </Button>

            <Button className="rounded" onClick={saveOfficers}>
              <Save className="mr-2 size-4" />
              Simpan Personel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogMode === "schedule"}
        onOpenChange={(open) => !open && closeDialog()}
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
                {filteredLocations.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Tidak ada checkpoint yang ditemukan.
                  </p>
                ) : (
                  filteredLocations.map((checkpoint) => {
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

            <DialogFooter className="flex-col justify-end gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded"
                  onClick={closeDialog}
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

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="rounded">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus konfigurasi shift?</AlertDialogTitle>

            <AlertDialogDescription>
              Shift yang dihapus tidak lagi muncul dalam daftar konfigurasi.
              Pastikan shift tersebut tidak sedang digunakan oleh jadwal aktif.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel className="rounded">Batal</AlertDialogCancel>

            <AlertDialogAction
              onClick={handleDelete}
              className="rounded text-white bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus Shift
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {success && (
        <div className="fixed bottom-5 right-5 z-50 flex max-w-sm items-center gap-3 rounded border bg-background px-4 py-3 shadow-lg">
          <Check className="size-4 shrink-0 text-emerald-600" />

          <span className="flex-1 text-xs font-medium">{success}</span>

          <Button
            variant="ghost"
            size="icon"
            className="size-6 rounded"
            onClick={() => setSuccess("")}
          >
            <X className="size-3" />
          </Button>
        </div>
      )}
    </div>
  );
};
