import React, { useMemo, useState } from "react";

import axios from "axios";

import {
  AlertCircle,
  CalendarDays,
  Check,
  Clock,
  MapPin,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";

import { NavTab } from "./Sidebar";

import { useAuthContext } from "../hooks/auth/useAuthContext";
import { usePatrolPoints } from "../hooks/patrol-point/usePatrolPoints";

import {
  useCreatePatrolSchedule,
  useDeletePatrolSchedule,
  usePatrolScheduleActivate,
  usePatrolSchedules,
  useUpdatePatrolSchedule,
} from "../hooks/schedule/usePatrolSchedules";

import {
  useCreateScheduleAssignment,
  useGetScheduleAssignments,
} from "../hooks/schedule/usePatrolScheduleAssignment";

import { useAddNewPoint } from "../hooks/schedule/usePatrolSchedulePoint";
import { useSecurityUsers } from "../hooks/users/useUsers";

import {
  AddSchedulePointPayload,
  CreatePatrolSchedulePayload,
  CreateScheduleAssignmentPayload,
  PatrolScheduleListItem,
} from "../types";

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
import { Switch } from "@/components/ui/switch";
interface TambahJadwalShiftViewProps {
  onNavigate: (tab: NavTab) => void;
  onAddDateRangeScheduleAndSyncCalendar: (
    newSchedules: any[],
    dateRangePayload: any,
  ) => void;
}

type DialogMode = "create" | "locations" | "officers" | "edit" | null;

interface ScheduleForm {
  name: string;
  startTime: string;
  endTime: string;
  intervalMinutes: number;
  gracePeriodMinutes: number;
  enforceSequence: boolean;
}

const INITIAL_FORM: ScheduleForm = {
  name: "",
  startTime: "07:00",
  endTime: "15:00",
  intervalMinutes: 120,
  gracePeriodMinutes: 30,
  enforceSequence: false,
};

const getTodayString = () => {
  const today = new Date();

  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
};

const formatStatus = (status: string) => {
  const statusMap: Record<string, string> = {
    DRAFT: "Draft",
    ACTIVE: "Aktif",
    INACTIVE: "Nonaktif",
    ARCHIVED: "Diarsipkan",
  };

  return statusMap[status] ?? status;
};

const getStatusVariant = (
  status: string,
): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "ACTIVE":
      return "default";
    case "DRAFT":
      return "secondary";
    case "INACTIVE":
      return "outline";
    case "ARCHIVED":
      return "destructive";
    default:
      return "outline";
  }
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;

    if (Array.isArray(message)) {
      return message.join(", ");
    }

    if (typeof message === "string") {
      return message;
    }
  }

  return fallback;
};

export const TambahJadwalShiftView: React.FC<TambahJadwalShiftViewProps> = ({
  onNavigate,
}) => {
  // ====================================================
  // AUTH
  // ====================================================

  const { user } = useAuthContext();

  const siteId = user?.siteId;

  const {
    data: patrolSchedules,
    isLoading: isLoadingSchedules,
    isError: isSchedulesError,
    refetch: refetchSchedules,
  } = usePatrolSchedules();
  const {
    data: patrolPoints,
    isLoading: isLoadingPoints,
    isError: isPointsError,
  } = usePatrolPoints();
  const { data: scheduleAssignments, isLoading: isLoadingAssignments } =
    useGetScheduleAssignments();
  const { data: securityUsers, isLoading: isLoadingUsers } = useSecurityUsers();

  const { mutateAsync: createSchedule, isPending: isCreatingSchedule } =
    useCreatePatrolSchedule();
  const { mutateAsync: addSchedulePoint, isPending: isAddingPoint } =
    useAddNewPoint();
  const { mutateAsync: assignUser, isPending: isAssigningUser } =
    useCreateScheduleAssignment();
  const { mutateAsync: updateShift, isPending: isUpdating } =
    useUpdatePatrolSchedule();
  const { mutate: activateSchedule, isPending: isActivating } =
    usePatrolScheduleActivate();
  const { mutateAsync: deleteSchedule, isPending: isDeleting } =
    useDeletePatrolSchedule();

  const schedules = patrolSchedules?.data ?? [];

  const assignments = scheduleAssignments ?? [];

  const points = patrolPoints ?? [];

  const users = securityUsers?.data ?? [];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [dialogMode, setDialogMode] = useState<DialogMode>(null);

  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(
    null,
  );

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const [form, setForm] = useState<ScheduleForm>(INITIAL_FORM);

  // CREATE SCHEDULE CHECKPOINTS
  const [selectedPointIds, setSelectedPointIds] = useState<string[]>([]);

  const [modalLocationSearch, setModalLocationSearch] = useState("");

  // ADD CHECKPOINT
  const [patrolPointId, setPatrolPointId] = useState("");

  const [insertAtSequence, setInsertAtSequence] = useState(1);

  const [required, setRequired] = useState(true);

  // ASSIGN USER
  const [selectedUserId, setSelectedUserId] = useState("");

  const [startDate, setStartDate] = useState(getTodayString());

  const [endDate, setEndDate] = useState("");

  const [officerSearch, setOfficerSearch] = useState("");

  // UPDATE SHIFT
  const [updateName, setUpdateName] = useState("");
  const [updateStartTime, setUpdateStartTime] = useState("");
  const [updateEndTime, setUpdateEndTime] = useState("");
  const [updateIntervalMinutes, setUpdateIntervalMinutes] = useState(120);
  const [updateGracePeriodMinutes, setUpdateGracePeriodMinutes] = useState(30);
  const [updateEnforceSequence, setUpdateEnforceSequence] = useState(true);

  // FEEDBACK
  const [modalError, setModalError] = useState("");

  const [success, setSuccess] = useState("");

  const [error, setError] = useState("");

  const activePoints = useMemo(() => {
    return points.filter((point) => {
      return point.status === "ACTIVE" && (!siteId || point.siteId === siteId);
    });
  }, [points, siteId]);

  const activeUsers = useMemo(() => {
    return users.filter((item) => {
      const allowedRoles = ["SECURITY", "DANRU_SECURITY", "CHIEF_SECURITY"];

      return (
        item.status === "ACTIVE" &&
        allowedRoles.includes(item.role?.name ?? "") &&
        (!siteId || item.siteId === siteId)
      );
    });
  }, [users, siteId]);

  const selectedSchedule = useMemo(() => {
    return schedules.find((schedule) => schedule.id === selectedScheduleId);
  }, [schedules, selectedScheduleId]);

  const filteredSchedules = useMemo(() => {
    const query = search.trim().toLowerCase();

    return schedules.filter((schedule) => {
      const matchesSearch =
        schedule.name.toLowerCase().includes(query) ||
        schedule.id.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" || schedule.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [schedules, search, statusFilter]);

  const activeCount = schedules.filter(
    (schedule) => schedule.status === "ACTIVE",
  ).length;

  const draftCount = schedules.filter(
    (schedule) => schedule.status === "DRAFT",
  ).length;

  const inactiveCount = schedules.filter(
    (schedule) =>
      schedule.status === "INACTIVE" || schedule.status === "ARCHIVED",
  ).length;

  const filteredPoints = useMemo(() => {
    const query = modalLocationSearch.trim().toLowerCase();

    return activePoints.filter((point) => {
      return (
        point.name.toLowerCase().includes(query) ||
        point.id.toLowerCase().includes(query) ||
        (point.description ?? "").toLowerCase().includes(query) ||
        (point.site?.name ?? "").toLowerCase().includes(query)
      );
    });
  }, [activePoints, modalLocationSearch]);

  const filteredUsers = useMemo(() => {
    const query = officerSearch.trim().toLowerCase();

    return activeUsers.filter((item) => {
      return (
        item.fullName.toLowerCase().includes(query) ||
        (item.employeeNumber ?? "").toLowerCase().includes(query) ||
        (item.team?.name ?? "").toLowerCase().includes(query) ||
        (item.role?.name ?? "").toLowerCase().includes(query)
      );
    });
  }, [activeUsers, officerSearch]);

  // ====================================================
  // ASSIGNMENT HELPERS
  // ====================================================

  const getScheduleAssignments = (scheduleId: string) => {
    return assignments.filter((item) => item.scheduleId === scheduleId);
  };

  const getAssignedUsers = (scheduleId: string) => {
    const scheduleAssignment = getScheduleAssignments(scheduleId);

    return Array.from(
      new Map(
        scheduleAssignment
          .filter((item) => item.user != null)
          .map((item) => [item.user!.id, item.user!]),
      ).values(),
    );
  };

  // ====================================================
  // DIALOG HANDLERS
  // ====================================================

  const resetCreateForm = () => {
    setForm(INITIAL_FORM);
    setSelectedPointIds([]);
    setModalLocationSearch("");
    setModalError("");
  };

  const closeDialog = () => {
    setDialogMode(null);
    setModalError("");
    setOfficerSearch("");
  };

  const openCreate = () => {
    resetCreateForm();
    setSelectedScheduleId(null);
    setDialogMode("create");
  };

  const openAddPoint = (scheduleId: string) => {
    setSelectedScheduleId(scheduleId);
    setPatrolPointId("");
    setInsertAtSequence(1);
    setRequired(true);
    setModalError("");
    setDialogMode("locations");
  };

  const openAssignUser = (scheduleId: string) => {
    setSelectedScheduleId(scheduleId);
    setSelectedUserId("");
    setStartDate(getTodayString());
    setEndDate("");
    setOfficerSearch("");
    setModalError("");
    setDialogMode("officers");
  };

  // ====================================================
  // FORM HANDLERS
  // ====================================================

  const updateForm = <K extends keyof ScheduleForm>(
    key: K,
    value: ScheduleForm[K],
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const openEditSchedule = (schedule: PatrolScheduleListItem) => {
    setSelectedScheduleId(schedule.id);

    setUpdateName(schedule.name);
    setUpdateStartTime(schedule.startTime);
    setUpdateEndTime(schedule.endTime);
    setUpdateIntervalMinutes(schedule.intervalMinutes);
    setUpdateGracePeriodMinutes(schedule.gracePeriodMinutes);
    setUpdateEnforceSequence(schedule.enforceSequence);

    setDialogMode("edit");
  };

  const togglePoint = (pointId: string, checked: boolean) => {
    setSelectedPointIds((prev) => {
      if (checked) {
        if (prev.includes(pointId)) return prev;

        return [...prev, pointId];
      }

      return prev.filter((id) => id !== pointId);
    });
  };

  const selectAllPoints = () => {
    setSelectedPointIds(activePoints.map((point) => point.id));
  };

  const clearAllPoints = () => {
    setSelectedPointIds([]);
  };

  // ====================================================
  // CREATE SCHEDULE
  // ====================================================

  const handleCreateSchedule = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setModalError("");

    if (!siteId) {
      setModalError("Site pengguna tidak ditemukan. Silakan login kembali.");
      return;
    }

    if (!form.name.trim()) {
      setModalError("Nama shift wajib diisi.");
      return;
    }

    if (!form.startTime || !form.endTime) {
      setModalError("Jam mulai dan jam selesai wajib diisi.");
      return;
    }

    if (form.startTime === form.endTime) {
      setModalError("Jam mulai dan selesai tidak boleh sama.");
      return;
    }

    if (
      !Number.isInteger(form.intervalMinutes) ||
      form.intervalMinutes < 15 ||
      form.intervalMinutes > 480
    ) {
      setModalError("Interval patroli harus antara 15 sampai 480 menit.");
      return;
    }

    if (
      !Number.isInteger(form.gracePeriodMinutes) ||
      form.gracePeriodMinutes < 0 ||
      form.gracePeriodMinutes > 120
    ) {
      setModalError("Grace period harus antara 0 sampai 120 menit.");
      return;
    }

    if (selectedPointIds.length === 0) {
      setModalError("Pilih minimal satu titik patroli.");
      return;
    }

    const validPointIds = new Set(activePoints.map((point) => point.id));

    const invalidPoint = selectedPointIds.some((id) => !validPointIds.has(id));

    if (invalidPoint) {
      setModalError(
        "Terdapat checkpoint yang tidak aktif atau tidak ditemukan.",
      );
      return;
    }

    const payload: CreatePatrolSchedulePayload = {
      siteId,
      name: form.name.trim(),
      startTime: form.startTime,
      endTime: form.endTime,
      intervalMinutes: form.intervalMinutes,
      gracePeriodMinutes: form.gracePeriodMinutes,
      enforceSequence: form.enforceSequence,
      points: selectedPointIds.map((id) => ({
        patrolPointId: id,
        required: true,
      })),
    };

    try {
      await createSchedule(payload);

      setSuccess(
        `Shift ${form.name.trim()} berhasil dibuat dengan ${selectedPointIds.length} checkpoint.`,
      );

      closeDialog();
      resetCreateForm();
    } catch (err) {
      console.error("Gagal membuat schedule:", err);

      setModalError(getErrorMessage(err, "Gagal membuat jadwal patroli."));
    }
  };

  const handleEditSchedule = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSchedule) {
      return;
    }

    if (!updateName.trim()) {
      setModalError("Nama jadwal wajib diisi.");
      return;
    }

    if (!updateStartTime || !updateEndTime) {
      setModalError("Waktu mulai dan selesai wajib diisi.");
      return;
    }

    if (updateStartTime === updateEndTime) {
      setModalError("Waktu mulai dan selesai tidak boleh sama.");
      return;
    }

    if (updateIntervalMinutes <= 0 || updateGracePeriodMinutes < 0) {
      setModalError("Interval atau grace period tidak valid.");
      return;
    }

    const payload = {
      name: updateName.trim(),
      startTime: updateStartTime,
      endTime: updateEndTime,
      intervalMinutes: updateIntervalMinutes,
      gracePeriodMinutes: updateGracePeriodMinutes,
      enforceSequence: updateEnforceSequence,
    };

    try {
      await updateShift({ id: selectedSchedule.id, payload });

      setSuccess("Berhasil update shift");
      closeDialog();
    } catch (error) {
      setModalError("Gagal saat update schedule");
    }
  };

  // ====================================================
  // ADD SCHEDULE POINT
  // ====================================================

  const handleAddPoint = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setModalError("");

    if (!selectedScheduleId) {
      setModalError("Jadwal patroli tidak ditemukan.");
      return;
    }

    if (!patrolPointId) {
      setModalError("Pilih checkpoint terlebih dahulu.");
      return;
    }

    if (!Number.isInteger(insertAtSequence) || insertAtSequence < 1) {
      setModalError("Urutan checkpoint minimal 1.");
      return;
    }

    const selectedPoint = activePoints.find(
      (point) => point.id === patrolPointId,
    );

    if (!selectedPoint) {
      setModalError("Checkpoint tidak aktif atau tidak ditemukan.");
      return;
    }

    const payload: AddSchedulePointPayload = {
      patrolPointId,
      insertAtSequence,
      required,
    };

    try {
      await addSchedulePoint({
        scheduleId: selectedScheduleId,
        payload,
      });

      setSuccess(`Checkpoint ${selectedPoint.name} berhasil ditambahkan.`);

      closeDialog();
    } catch (err) {
      console.error("Gagal menambahkan checkpoint:", err);

      setModalError(
        getErrorMessage(err, "Gagal menambahkan checkpoint ke jadwal."),
      );
    }
  };

  // ====================================================
  // ASSIGN USER
  // ====================================================

  const handleAssignUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setModalError("");

    if (!selectedScheduleId) {
      setModalError("Jadwal tidak ditemukan.");
      return;
    }

    if (!selectedUserId) {
      setModalError("Pilih personel terlebih dahulu.");
      return;
    }

    if (!startDate) {
      setModalError("Tanggal mulai wajib diisi.");
      return;
    }

    if (endDate && endDate < startDate) {
      setModalError("Tanggal akhir tidak boleh lebih awal dari tanggal mulai.");
      return;
    }

    const selectedUser = activeUsers.find((item) => item.id === selectedUserId);

    if (!selectedUser) {
      setModalError("Personel tidak aktif atau tidak ditemukan.");
      return;
    }

    const alreadyAssigned = getScheduleAssignments(selectedScheduleId).some(
      (item) => item.userId === selectedUserId && item.status === "ACTIVE",
    );

    if (alreadyAssigned) {
      setModalError(
        "Personel tersebut sudah memiliki assignment aktif pada shift ini.",
      );
      return;
    }

    const payload: CreateScheduleAssignmentPayload = {
      userId: selectedUserId,
      startDate,
      endDate: endDate || null,
    };

    try {
      await assignUser({
        scheduleId: selectedScheduleId,
        payload,
      });

      setSuccess(`${selectedUser.fullName} berhasil ditugaskan ke shift.`);

      closeDialog();
    } catch (err) {
      console.error("Gagal assign personel:", err);

      setModalError(
        getErrorMessage(err, "Gagal menugaskan personel ke shift."),
      );
    }
  };

  // ====================================================
  // ACTIVATE SCHEDULE
  // ====================================================

  const handleActivateSchedule = (scheduleId: string) => {
    setError("");

    activateSchedule(scheduleId, {
      onSuccess: () => {
        setSuccess("Jadwal patroli berhasil diaktifkan.");
      },
      onError: (err) => {
        console.error("Gagal mengaktifkan jadwal:", err);

        setError(getErrorMessage(err, "Gagal mengaktifkan jadwal patroli."));
      },
    });
  };

  // ====================================================
  // DELETE SCHEDULE
  // ====================================================

  const handleDeleteSchedule = async () => {
    if (!deleteTarget || isDeleting) return;

    try {
      await deleteSchedule(deleteTarget);

      setSuccess("Jadwal patroli berhasil dihapus.");

      setDeleteTarget(null);
    } catch (err) {
      console.error("Gagal menghapus jadwal:", err);

      setError(getErrorMessage(err, "Gagal menghapus jadwal patroli."));

      setDeleteTarget(null);
    }
  };

  // ====================================================
  // LOADING
  // ====================================================

  const isLoading =
    isLoadingSchedules ||
    isLoadingPoints ||
    isLoadingAssignments ||
    isLoadingUsers;

  // ====================================================
  // RENDER
  // ====================================================

  const registeredPatrolPoints = useMemo(() => {
    if (!selectedSchedule) return [];

    return activePoints
      .flatMap((point) =>
        (point.schedulePoints ?? [])
          .filter(
            (schedulePoint) => schedulePoint.scheduleId === selectedSchedule.id,
          )
          .map((schedulePoint) => ({
            id: schedulePoint.id,
            patrolPointId: point.id,
            code: point.code,
            name: point.name,
            sequence: schedulePoint.sequence,
            required: schedulePoint.required,
          })),
      )
      .sort((a, b) => a.sequence - b.sequence);
  }, [activePoints, selectedSchedule]);

  const availablePatrolPoints = useMemo(() => {
    const registeredIds = new Set(
      registeredPatrolPoints.map((point) => point.patrolPointId),
    );

    return activePoints.filter((point) => !registeredIds.has(point.id));
  }, [activePoints, registeredPatrolPoints]);

  return (
    <div className="space-y-5">
      {/* HEADER */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Manajemen Shift
          </h1>

          <p className="mt-1 text-xs text-muted-foreground">
            Kelola konfigurasi shift, checkpoint, dan personel patroli.
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

          <Button
            size="sm"
            className="rounded bg-[#FED400] hover:bg-yello-400 text-black"
            onClick={openCreate}
          >
            <Plus className="mr-2 size-4" />
            Tambah Shift
          </Button>
        </div>
      </div>

      {/* SUMMARY */}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded border bg-background p-4">
          <p className="text-xs text-muted-foreground">Shift Aktif</p>

          <p className="mt-1 text-2xl font-semibold text-emerald-600">
            {activeCount}
          </p>
        </div>

        <div className="rounded border bg-background p-4">
          <p className="text-xs text-muted-foreground">Shift Draft</p>

          <p className="mt-1 text-2xl font-semibold">{draftCount}</p>
        </div>

        <div className="rounded border bg-background p-4">
          <p className="text-xs text-muted-foreground">Nonaktif / Arsip</p>

          <p className="mt-1 text-2xl font-semibold text-muted-foreground">
            {inactiveCount}
          </p>
        </div>
      </div>

      {/* MAIN TABLE */}

      <div className="overflow-hidden rounded border bg-background">
        <div className="space-y-3 border-b p-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xs font-semibold">
                Daftar Konfigurasi Shift
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                Data konfigurasi shift berdasarkan database patroli.
              </p>
            </div>

            <p className="text-xs text-muted-foreground">
              {filteredSchedules.length} dari {schedules.length} shift
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_220px]">
            <InputGroup className="rounded">
              <InputGroupAddon>
                <Search className="size-4 text-muted-foreground" />
              </InputGroupAddon>

              <InputGroupInput
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nama shift atau ID..."
              />
            </InputGroup>

            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value ?? "")}
            >
              <SelectTrigger className="w-full rounded">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>

                <SelectItem value="DRAFT">Draft</SelectItem>

                <SelectItem value="ACTIVE">Aktif</SelectItem>

                <SelectItem value="INACTIVE">Nonaktif</SelectItem>

                <SelectItem value="ARCHIVED">Diarsipkan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap pl-4">
                  Nama Shift
                </TableHead>

                <TableHead className="whitespace-nowrap">
                  Jam Operasional
                </TableHead>

                <TableHead className="whitespace-nowrap">Interval</TableHead>

                <TableHead className="whitespace-nowrap">Checkpoint</TableHead>

                <TableHead className="whitespace-nowrap">Personel</TableHead>

                <TableHead className="whitespace-nowrap">Status</TableHead>

                <TableHead className="pr-4 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoadingSchedules ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center text-xs text-muted-foreground"
                  >
                    Memuat data konfigurasi shift...
                  </TableCell>
                </TableRow>
              ) : isSchedulesError ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="size-5 text-destructive" />

                      <p className="text-xs text-destructive">
                        Gagal mengambil data jadwal patroli.
                      </p>

                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded"
                        onClick={() => refetchSchedules()}
                      >
                        Coba Lagi
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredSchedules.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center text-xs text-muted-foreground"
                  >
                    Tidak ada konfigurasi shift yang ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSchedules.map((schedule) => {
                  const assignedUsers = getAssignedUsers(schedule.id);

                  const pointCount = schedule._count?.points ?? 0;

                  return (
                    <TableRow key={schedule.id}>
                      {/* NAMA SHIFT */}

                      <TableCell className="pl-4">
                        <div className="text-xs font-medium">
                          {schedule.name}
                        </div>

                        <div className="mt-1 text-[10px] text-muted-foreground">
                          {schedule.site?.code ?? "-"}
                        </div>
                      </TableCell>

                      {/* JAM OPERASIONAL */}

                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                          <Clock className="size-3.5 text-muted-foreground" />
                          {schedule.startTime} - {schedule.endTime}
                        </div>

                        <div className="mt-1 text-xs text-muted-foreground">
                          Grace {schedule.gracePeriodMinutes} menit
                        </div>
                      </TableCell>

                      {/* INTERVAL */}

                      <TableCell className="text-xs">
                        {schedule.intervalMinutes} menit
                      </TableCell>

                      {/* CHECKPOINT */}

                      <TableCell>
                        <div className="text-xs font-medium">
                          {pointCount} Titik
                        </div>

                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto rounded p-0 text-xs"
                          onClick={() => openAddPoint(schedule.id)}
                        >
                          Kelola titik
                        </Button>
                      </TableCell>

                      {/* PERSONEL */}

                      <TableCell>
                        <div className="text-xs font-medium">
                          {assignedUsers.length} Personel
                        </div>

                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto rounded p-0 text-xs"
                          onClick={() => openAssignUser(schedule.id)}
                        >
                          Kelola personel
                        </Button>
                      </TableCell>

                      {/* STATUS */}

                      <TableCell>
                        <Badge
                          variant={getStatusVariant(schedule.status)}
                          className="rounded"
                        >
                          {formatStatus(schedule.status)}
                        </Badge>
                      </TableCell>

                      {/* ACTION */}

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
                            <DropdownMenuItem
                              onClick={() => openEditSchedule(schedule)}
                            >
                              <RotateCcw className="mr-2 size-4" />
                              Edit Konfigurasi
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => openAddPoint(schedule.id)}
                            >
                              <MapPin className="mr-2 size-4" />
                              Assign Titik Patroli
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => openAssignUser(schedule.id)}
                            >
                              <Users className="mr-2 size-4" />
                              Assign Personel
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {schedule.status === "DRAFT" && (
                              <DropdownMenuItem
                                disabled={isActivating}
                                onClick={() =>
                                  handleActivateSchedule(schedule.id)
                                }
                              >
                                <Check className="mr-2 size-4" />
                                Aktifkan Shift
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteTarget(schedule.id)}
                            >
                              <Trash2 className="mr-2 size-4" />
                              Hapus Shift
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-1 border-t px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            Menampilkan {filteredSchedules.length} dari {schedules.length} shift
          </span>

          <span>
            {activeCount} aktif · {draftCount} draft · {inactiveCount} lainnya
          </span>
        </div>
      </div>

      {/* DIALOG CREATE SCHEDULE */}
      <Dialog
        open={dialogMode === "create"}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tambah Shift Patroli</DialogTitle>

            <DialogDescription>
              Atur konfigurasi shift dan checkpoint patroli yang akan digunakan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSchedule} className="space-y-5">
            {modalError && (
              <div className="flex items-start gap-2 rounded border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />

                <span>{modalError}</span>
              </div>
            )}

            {/* INFORMASI SHIFT */}

            <section className="space-y-3">
              <div className="flex items-center gap-2 border-b pb-2">
                <Clock className="size-4 text-primary" />

                <h3 className="text-sm font-semibold">Informasi Shift</h3>
              </div>
              <div></div>
              <div className="space-y-2">
                <Label>Nama Shift</Label>

                <Input
                  className="rounded"
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
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
                    value={form.startTime}
                    onChange={(event) =>
                      updateForm("startTime", event.target.value)
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Jam Selesai</Label>

                  <Input
                    type="time"
                    className="rounded"
                    value={form.endTime}
                    onChange={(event) =>
                      updateForm("endTime", event.target.value)
                    }
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
                    value={form.intervalMinutes}
                    onChange={(event) =>
                      updateForm("intervalMinutes", Number(event.target.value))
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
                          form.intervalMinutes === minutes
                            ? "default"
                            : "outline"
                        }
                        className={`h-7 rounded px-2 text-xs hover:bg-yellow-300 ${
                          form.intervalMinutes === minutes
                            ? "bg-[#FED400] text-black"
                            : ""
                        }`}
                        onClick={() => updateForm("intervalMinutes", minutes)}
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
                    value={form.gracePeriodMinutes}
                    onChange={(event) =>
                      updateForm(
                        "gracePeriodMinutes",
                        Number(event.target.value),
                      )
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
                          form.gracePeriodMinutes === minutes
                            ? "default"
                            : "outline"
                        }
                        className={`h-7 rounded px-2 text-xs hover:bg-yellow-300 ${
                          form.gracePeriodMinutes === minutes
                            ? "bg-[#FED400] text-black"
                            : ""
                        }`}
                        onClick={() =>
                          updateForm("gracePeriodMinutes", minutes)
                        }
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

                  <Badge variant="outline" className="rounded">
                    {form.enforceSequence ? "Urutan wajib" : "Urutan fleksibel"}
                  </Badge>
                </div>

                <Checkbox
                  checked={form.enforceSequence}
                  onCheckedChange={(checked) =>
                    updateForm("enforceSequence", checked === true)
                  }
                  className="mt-1 rounded"
                />
              </div>
            </section>

            {/* CHECKPOINT */}

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
                    {selectedPointIds.length} checkpoint dipilih. Urutan
                    mengikuti urutan pemilihan.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded"
                    disabled={activePoints.length === 0}
                    onClick={selectAllPoints}
                  >
                    Pilih Semua
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded"
                    onClick={clearAllPoints}
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
                  placeholder="Cari nama atau checkpoint..."
                  value={modalLocationSearch}
                  onChange={(event) =>
                    setModalLocationSearch(event.target.value)
                  }
                />
              </InputGroup>

              <div className="max-h-60 space-y-1 overflow-y-auto rounded border p-2">
                {isLoadingPoints ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    Memuat checkpoint...
                  </p>
                ) : isPointsError ? (
                  <p className="py-6 text-center text-xs text-destructive">
                    Gagal mengambil data checkpoint.
                  </p>
                ) : filteredPoints.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    Tidak ada checkpoint aktif yang ditemukan.
                  </p>
                ) : (
                  filteredPoints.map((point) => {
                    const isSelected = selectedPointIds.includes(point.id);

                    const orderIndex = selectedPointIds.indexOf(point.id);

                    return (
                      <label
                        key={point.id}
                        className={`flex cursor-pointer items-center justify-between gap-3 rounded border p-2.5 transition-colors ${
                          isSelected
                            ? "border-primary/40 bg-primary/5"
                            : "border-transparent hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) =>
                              togglePoint(point.id, checked === true)
                            }
                            className="rounded"
                          />

                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium">
                              {point.name}
                            </p>

                            <p className="truncate text-[10px] text-muted-foreground">
                              {point.site?.name ?? "-"} ·{" "}
                              {point.description ?? "-"}
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
                            {point.code ?? point.id}
                          </span>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </section>

            {/* FOOTER */}

            <DialogFooter className="border-t pt-4">
              <Button
                type="button"
                variant="outline"
                className="rounded"
                onClick={closeDialog}
                disabled={isCreatingSchedule}
              >
                Batal
              </Button>

              <Button
                type="submit"
                className="rounded bg-[#FED400] hover:bg-yellow-400 text-black"
                disabled={isCreatingSchedule}
              >
                {isCreatingSchedule ? (
                  <>
                    <RotateCcw className="mr-2 size-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 size-4" />
                    Simpan Shift
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG UPDATE CHECKPOINT */}
      <Dialog
        open={dialogMode === "edit"}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog();
            setSelectedScheduleId(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Jadwal Patroli</DialogTitle>
            <DialogDescription>
              Perbarui konfigurasi jadwal patroli yang dipilih.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSchedule} className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Jadwal</Label>
              <Input
                value={updateName}
                onChange={(e) => setUpdateName(e.target.value)}
                placeholder="Contoh: Shift Pagi"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Jam Mulai</Label>
                <Input
                  type="time"
                  value={updateStartTime}
                  onChange={(e) => setUpdateStartTime(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Jam Selesai</Label>
                <Input
                  type="time"
                  value={updateEndTime}
                  onChange={(e) => setUpdateEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Interval (Menit)</Label>
                <Input
                  type="number"
                  min={1}
                  value={updateIntervalMinutes}
                  onChange={(e) =>
                    setUpdateIntervalMinutes(Number(e.target.value))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Grace Period (Menit)</Label>
                <Input
                  type="number"
                  min={0}
                  value={updateGracePeriodMinutes}
                  onChange={(e) =>
                    setUpdateGracePeriodMinutes(Number(e.target.value))
                  }
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded border p-3">
              <div>
                <Label>Urutan Checkpoint</Label>
                <p className="text-xs text-muted-foreground">
                  Petugas harus mengikuti urutan checkpoint.
                </p>
              </div>

              <Switch
                checked={updateEnforceSequence}
                onCheckedChange={setUpdateEnforceSequence}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="rounded"
                onClick={() => closeDialog()}
                disabled={isUpdating}
              >
                Batal
              </Button>

              <Button type="submit" className="rounded" disabled={isUpdating}>
                {isUpdating ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG ADD CHECKPOINT */}
      <Dialog
        open={dialogMode === "locations"}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent className="rounded sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Titik Patroli</DialogTitle>

            <DialogDescription>
              {selectedSchedule?.name ?? "Jadwal patroli"}. Tambahkan checkpoint
              ke konfigurasi shift.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddPoint} className="space-y-4">
            {modalError && (
              <div className="rounded border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                {modalError}
              </div>
            )}

            <div className="space-y-2">
              <Label>Checkpoint</Label>

              <Select
                value={patrolPointId}
                onValueChange={(value) => setPatrolPointId(value ?? "")}
              >
                <SelectTrigger className="w-full rounded">
                  <SelectValue placeholder="Pilih checkpoint" />
                </SelectTrigger>

                <SelectContent>
                  {availablePatrolPoints.map((point) => (
                    <SelectItem key={point.id} value={point.id}>
                      {point.name} ({point.code ?? point.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Masukkan pada urutan ke-</Label>

              <Input
                type="number"
                min={1}
                className="rounded"
                value={insertAtSequence}
                onChange={(event) =>
                  setInsertAtSequence(Number(event.target.value))
                }
                required
              />

              <p className="text-[11px] text-muted-foreground">
                Urutan checkpoint ditentukan berdasarkan posisi yang dimasukkan.
              </p>
            </div>

            <div className="flex items-center justify-between rounded border p-3">
              <div>
                <Label>Checkpoint Wajib</Label>

                <p className="text-xs text-muted-foreground">
                  Checkpoint wajib diselesaikan petugas.
                </p>
              </div>

              <Checkbox
                checked={required}
                onCheckedChange={(checked) => setRequired(checked === true)}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="rounded"
                onClick={closeDialog}
                disabled={isAddingPoint}
              >
                Batal
              </Button>

              <Button
                type="submit"
                className="rounded"
                disabled={isAddingPoint}
              >
                {isAddingPoint ? (
                  "Menyimpan..."
                ) : (
                  <>
                    <Save className="mr-2 size-4" />
                    Simpan Checkpoint
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG ASSIGN PERSONEL */}

      <Dialog
        open={dialogMode === "officers"}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Personel Security</DialogTitle>

            <DialogDescription>
              Pilih personel yang akan ditugaskan pada{" "}
              {selectedSchedule?.name ?? "shift"}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAssignUser} className="space-y-4">
            {modalError && (
              <div className="rounded border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                {modalError}
              </div>
            )}

            <div className="space-y-2">
              <Label>Cari Personel</Label>

              <InputGroup className="rounded">
                <InputGroupAddon>
                  <Search className="size-4" />
                </InputGroupAddon>

                <InputGroupInput
                  placeholder="Cari nama, NPP, atau regu..."
                  value={officerSearch}
                  onChange={(event) => setOfficerSearch(event.target.value)}
                />
              </InputGroup>
            </div>

            <div className="max-h-60 space-y-1 overflow-y-auto rounded border p-2">
              {isLoadingUsers ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  Memuat personel...
                </p>
              ) : filteredUsers.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  Tidak ada personel aktif ditemukan.
                </p>
              ) : (
                filteredUsers.map((officer) => {
                  const selected = selectedUserId === officer.id;

                  return (
                    <button
                      key={officer.id}
                      type="button"
                      onClick={() => setSelectedUserId(officer.id)}
                      className={`flex w-full items-center justify-between gap-3 rounded border p-3 text-left transition-colors ${
                        selected
                          ? "border-primary bg-primary/5"
                          : "border-transparent hover:bg-muted/50"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium">
                          {officer.fullName}
                        </p>

                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {officer.employeeNumber ?? "-"} ·{" "}
                          {officer.team?.name ?? "Tanpa Regu"}
                        </p>

                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {officer.role?.name ?? "-"}
                        </p>
                      </div>

                      {selected && (
                        <Check className="size-4 shrink-0 text-primary" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            <div className="space-y-2">
              <Label>Tanggal Mulai Bertugas</Label>

              <Input
                type="date"
                className="rounded"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Tanggal Selesai</Label>

              <Input
                type="date"
                className="rounded"
                min={startDate}
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />

              <p className="text-[10px] text-muted-foreground">
                Kosongkan jika penugasan tidak memiliki tanggal akhir.
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="rounded"
                onClick={closeDialog}
                disabled={isAssigningUser}
              >
                Batal
              </Button>

              <Button
                type="submit"
                className="rounded"
                disabled={isAssigningUser || isLoadingUsers}
              >
                {isAssigningUser ? (
                  "Menyimpan..."
                ) : (
                  <>
                    <Users className="mr-2 size-4" />
                    Assign Personel
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="rounded">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus konfigurasi shift?</AlertDialogTitle>

            <AlertDialogDescription>
              Data shift akan dihapus melalui API backend. Pastikan jadwal
              tersebut tidak sedang digunakan oleh penugasan atau aktivitas
              patroli.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel className="rounded" disabled={isDeleting}>
              Batal
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleDeleteSchedule();
              }}
              disabled={isDeleting}
              className="rounded bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Menghapus..." : "Hapus Shift"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ERROR NOTIFICATION */}

      {error && (
        <div className="fixed bottom-5 right-5 z-50 flex max-w-sm items-center gap-3 rounded border border-destructive/30 bg-background px-4 py-3 shadow-lg">
          <AlertCircle className="size-4 shrink-0 text-destructive" />

          <span className="flex-1 text-xs font-medium">{error}</span>

          <Button
            variant="ghost"
            size="icon"
            className="size-6 rounded"
            onClick={() => setError("")}
          >
            <X className="size-3" />
          </Button>
        </div>
      )}

      {/* SUCCESS NOTIFICATION */}

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

export default TambahJadwalShiftView;
