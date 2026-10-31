import {
  CheckCircle2,
  Edit,
  Link2,
  Plus,
  RefreshCw,
  Search,
  Unlink,
  X,
} from "lucide-react";
import React, { useMemo, useState } from "react";

import {
  useCreatePatrolPoint,
  usePatrolPoints,
  useUpdatePatrolPoint,
} from "../hooks/patrol-point/usePatrolPoints";

import type {
  CreatePatrolPointRequest,
  PatrolPointResponse,
  UpdatePatrolPointRequest,
} from "../types/patrol-point/patrolPoint";

import type { PatrolPointStatus } from "../types/enums/prisma-enums";

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

import { useNfcTags } from "../hooks/nfc/useNfc";

import { getErrorMessage } from "../helpers/getErrorMessage";
import {
  useAssignNfc,
  useUnassignNfc,
} from "../hooks/patrol-point-nfc/usePatroPointNfc";
import type { NfcAssignment } from "../types";
import type { NfcTagResponse } from "../types/nfc/nfc";

interface TitikPatroliViewProps {
  selectedSite: string;
}

interface PointForm {
  siteId: string;
  code: string;
  name: string;
  description: string;
  latitude: string;
  longitude: string;
  radiusMeters: string;
  status: PatrolPointStatus;
}

const EMPTY_FORM: PointForm = {
  siteId: "",
  code: "",
  name: "",
  description: "",
  latitude: "",
  longitude: "",
  radiusMeters: "10",
  status: "INACTIVE" as PatrolPointStatus,
};

const getActiveAssignment = (
  point: PatrolPointResponse,
): NfcAssignment | undefined => {
  const nfcAssignments = point.nfcAssignments?.find(
    (assignment) => assignment.status === "ACTIVE" && !assignment.unassignedAt,
  );

  return nfcAssignments;
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "Aktif";

    case "INACTIVE":
      return "Nonaktif";

    case "MAINTENANCE":
      return "Pemeliharaan";

    default:
      return status;
  }
};

const getStatusClass = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "INACTIVE":
      return "border-slate-200 bg-slate-50 text-slate-600";

    case "MAINTENANCE":
      return "border-amber-200 bg-amber-50 text-amber-700";

    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
};

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-medium text-slate-600">{label}</Label>

    {children}
  </div>
);

export const TitikPatroliView: React.FC<TitikPatroliViewProps> = ({
  selectedSite,
}) => {
  const {
    data: pointsData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = usePatrolPoints(
    selectedSite !== "all" ? { siteId: selectedSite } : undefined,
  );

  const { data: nfcData } = useNfcTags();

  const createMutation = useCreatePatrolPoint();

  const updateMutation = useUpdatePatrolPoint();

  const assignNfcMutation = useAssignNfc();

  const unassignNfcMutation = useUnassignNfc();

  const checkpoints = (
    Array.isArray(pointsData) ? pointsData : []
  ) as PatrolPointResponse[];

  const nfcTags = (Array.isArray(nfcData) ? nfcData : []) as NfcTagResponse[];

  const [searchQuery, setSearchQuery] = useState("");

  const [selectedStatus, setSelectedStatus] = useState("all");

  const [selectedNfcStatus, setSelectedNfcStatus] = useState("all");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [editingCheckpoint, setEditingCheckpoint] =
    useState<PatrolPointResponse | null>(null);

  const [assigningCheckpoint, setAssigningCheckpoint] =
    useState<PatrolPointResponse | null>(null);

  const [unassigningCheckpoint, setUnassigningCheckpoint] =
    useState<PatrolPointResponse | null>(null);

  const [selectedNfcId, setSelectedNfcId] = useState("");

  const [form, setForm] = useState<PointForm>(EMPTY_FORM);

  const [formError, setFormError] = useState("");

  const [actionError, setActionError] = useState("");

  const [toastMessage, setToastMessage] = useState("");

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const isNfcProcessing =
    assignNfcMutation.isPending || unassignNfcMutation.isPending;

  const showToast = (message: string) => {
    setToastMessage(message);

    window.setTimeout(() => {
      setToastMessage("");
    }, 3500);
  };

  const filteredCheckpoints = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return checkpoints.filter((point) => {
      const activeAssignment = getActiveAssignment(point);

      const assigned = Boolean(activeAssignment);

      if (selectedStatus !== "all" && point.status !== selectedStatus) {
        return false;
      }

      if (selectedNfcStatus === "assigned" && !assigned) {
        return false;
      }

      if (selectedNfcStatus === "unassigned" && assigned) {
        return false;
      }

      if (!query) {
        return true;
      }

      const uid = activeAssignment?.nfcTag?.uid ?? "";

      return (
        point.code.toLowerCase().includes(query) ||
        point.name.toLowerCase().includes(query) ||
        (point.description ?? "").toLowerCase().includes(query) ||
        (point.site?.name ?? "").toLowerCase().includes(query) ||
        uid.toLowerCase().includes(query)
      );
    });
  }, [checkpoints, searchQuery, selectedStatus, selectedNfcStatus]);

  const updateForm = <K extends keyof PointForm>(
    key: K,
    value: PointForm[K],
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const openAddDialog = () => {
    setForm({
      ...EMPTY_FORM,
      siteId: selectedSite !== "all" ? selectedSite : "",
    });

    setFormError("");

    setIsAddModalOpen(true);
  };

  const openEditDialog = (point: PatrolPointResponse) => {
    setForm({
      siteId: point.siteId,
      code: point.code,
      name: point.name,
      description: point.description ?? "",
      latitude: String(point.latitude),
      longitude: String(point.longitude),
      radiusMeters: String(point.radiusMeters),
      status: point.status,
    });

    setFormError("");

    setEditingCheckpoint(point);
  };

  const closeFormDialog = () => {
    setIsAddModalOpen(false);

    setEditingCheckpoint(null);

    setFormError("");

    setForm(EMPTY_FORM);
  };

  const validateForm = () => {
    const latitude = Number(form.latitude);

    const longitude = Number(form.longitude);

    const radiusMeters = Number(form.radiusMeters);

    if (!form.siteId.trim()) {
      return "Site wajib diisi.";
    }

    if (!form.code.trim() || !form.name.trim()) {
      return "Kode dan nama titik wajib diisi.";
    }

    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      return "Latitude harus berada antara -90 sampai 90.";
    }

    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      return "Longitude harus berada antara -180 sampai 180.";
    }

    if (!Number.isFinite(radiusMeters) || radiusMeters <= 0) {
      return "Radius harus lebih besar dari 0.";
    }

    return null;
  };

  const getCreateFormPayload = (): CreatePatrolPointRequest => ({
    siteId: form.siteId.trim(),
    code: form.code.trim(),
    name: form.name.trim(),
    description: form.description.trim() || null,
    latitude: Number(form.latitude),
    longitude: Number(form.longitude),
    radiusMeters: Number(form.radiusMeters),
  });

  const getUpdateFormPayload = (): UpdatePatrolPointRequest => ({
    code: form.code.trim(),
    name: form.name.trim(),
    description: form.description.trim() || null,
    latitude: Number(form.latitude),
    longitude: Number(form.longitude),
    radiusMeters: Number(form.radiusMeters),
  });

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError("");

    try {
      const payload = getCreateFormPayload();

      await createMutation.mutateAsync(payload);

      closeFormDialog();

      showToast("Titik patroli berhasil ditambahkan.");
    } catch (err) {
      setFormError(getErrorMessage(err));
    }
  };

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingCheckpoint) return;

    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError("");

    try {
      const payload = getUpdateFormPayload();

      await updateMutation.mutateAsync({
        id: editingCheckpoint.id,
        payload,
      });

      closeFormDialog();

      showToast("Titik patroli berhasil diperbarui.");
    } catch (err) {
      setFormError(getErrorMessage(err));
    }
  };

  const availableNfcTags = nfcTags.filter((tag) => tag.status === "UNASSIGNED");

  const handleAssignNfc = async () => {
    if (!assigningCheckpoint || !selectedNfcId) {
      setActionError("Pilih NFC terlebih dahulu.");
      return;
    }

    setActionError("");

    try {
      await assignNfcMutation.mutateAsync({
        patrolPointId: assigningCheckpoint.id,
        nfcTagId: selectedNfcId,
      });

      setAssigningCheckpoint(null);

      setSelectedNfcId("");

      showToast("NFC berhasil ditautkan ke titik patroli.");
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  const handleUnassignNfc = async () => {
    if (!unassigningCheckpoint) return;

    const assignment = getActiveAssignment(unassigningCheckpoint);

    if (!assignment) {
      setActionError("Titik patroli tidak memiliki NFC aktif.");
      return;
    }

    setActionError("");

    try {
      await unassignNfcMutation.mutateAsync({
        patrolPointId: unassigningCheckpoint.id,
        reason: "NFC dilepas melalui manajemen titik patroli",
      });

      setUnassigningCheckpoint(null);

      showToast("NFC berhasil dilepas dari titik patroli.");
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  const renderFormFields = () => (
    <div className="space-y-4">
      <Field label="Kode Titik">
        <Input
          required
          value={form.code}
          onChange={(event) => updateForm("code", event.target.value)}
          placeholder="CP-001"
          className="h-9 rounded text-xs"
        />
      </Field>

      <Field label="Nama Titik">
        <Input
          required
          value={form.name}
          onChange={(event) => updateForm("name", event.target.value)}
          placeholder="Nama titik patroli"
          className="h-9 rounded text-xs"
        />
      </Field>

      <Field label="Subarea">
        <Input
          value={form.description}
          onChange={(event) => updateForm("description", event.target.value)}
          placeholder="Subarea lokasi"
          className="h-9 rounded text-xs"
        />
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Latitude">
          <Input
            required
            type="number"
            step="any"
            value={form.latitude}
            onChange={(event) => updateForm("latitude", event.target.value)}
            className="h-9 rounded text-xs"
          />
        </Field>

        <Field label="Longitude">
          <Input
            required
            type="number"
            step="any"
            value={form.longitude}
            onChange={(event) => updateForm("longitude", event.target.value)}
            className="h-9 rounded text-xs"
          />
        </Field>
      </div>

      <Field label="Radius (Meter)">
        <Input
          required
          type="number"
          min="1"
          value={form.radiusMeters}
          onChange={(event) => updateForm("radiusMeters", event.target.value)}
          className="h-9 rounded text-xs"
        />
      </Field>

      {formError && (
        <div className="rounded border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          {formError}
        </div>
      )}
    </div>
  );
  return (
    <div className="space-y-5">
      {toastMessage && (
        <div className="flex items-center justify-between rounded border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4" />
            {toastMessage}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => setToastMessage("")}
          >
            <X className="size-4" />
          </Button>
        </div>
      )}

      <div className="flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Manajemen Titik Patroli
          </h1>

          <p className="mt-1 text-xs text-slate-500">
            Kelola lokasi checkpoint dan penautan NFC.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded"
            disabled={isFetching}
            onClick={() => refetch()}
          >
            <RefreshCw
              className={`mr-1.5 size-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          <Button
            size="sm"
            className="h-9 rounded bg-[#FED400] text-black hover:bg-[#e9c300]"
            onClick={openAddDialog}
          >
            <Plus className="mr-1.5 size-4" />
            Tambah Titik
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded border border-slate-200 bg-white p-3 md:flex-row">
        <InputGroup className="rounded">
          <InputGroupAddon>
            <Search className="size-4 text-slate-400" />
          </InputGroupAddon>

          <InputGroupInput
            placeholder="Cari kode, nama, site, atau UID NFC..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </InputGroup>

        <Select
          value={selectedStatus}
          onValueChange={(value) => setSelectedStatus(value ?? "all")}
        >
          <SelectTrigger className="h-9 rounded text-xs md:w-44">
            <span className="truncate">
              {{
                all: "Semua Status",
                ACTIVE: "Aktif",
                INACTIVE: "Nonaktif",
                MAINTENANCE: "Pemeliharaan",
              }[selectedStatus] ?? "Status titik"}
            </span>
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="ACTIVE">Aktif</SelectItem>
            <SelectItem value="INACTIVE">Nonaktif</SelectItem>
            <SelectItem value="MAINTENANCE">Pemeliharaan</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={selectedNfcStatus}
          onValueChange={(value) => setSelectedNfcStatus(value ?? "all")}
        >
          <SelectTrigger className="h-9 rounded text-xs md:w-48">
            <span className="truncate">
              {{
                all: "Semua NFC",
                assigned: "Sudah Ditautkan",
                unassigned: "Belum Ditautkan",
              }[selectedNfcStatus] ?? "Status NFC"}
            </span>
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">Semua NFC</SelectItem>
            <SelectItem value="assigned">Sudah Ditautkan</SelectItem>
            <SelectItem value="unassigned">Belum Ditautkan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="text-xs">Kode</TableHead>

                <TableHead className="text-xs">Nama Titik</TableHead>

                <TableHead className="text-xs">Site</TableHead>

                <TableHead className="text-xs">Koordinat</TableHead>

                <TableHead className="text-xs">Radius</TableHead>

                <TableHead className="text-center text-xs">NFC</TableHead>

                <TableHead className="text-center text-xs">Status</TableHead>

                <TableHead className="text-center text-xs">Aksi</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-32 text-center text-xs text-slate-500"
                  >
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <p className="mb-2 text-xs text-rose-600">
                      {getErrorMessage(error)}
                    </p>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => refetch()}
                    >
                      Coba Lagi
                    </Button>
                  </TableCell>
                </TableRow>
              ) : filteredCheckpoints.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-32 text-center text-xs text-slate-500"
                  >
                    Tidak ada data titik patroli.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCheckpoints.map((point) => {
                  const assignment = getActiveAssignment(point);

                  const assigned = Boolean(assignment);

                  return (
                    <TableRow key={point.id} className="text-xs">
                      <TableCell className="font-mono font-semibold text-blue-600">
                        {point.code}
                      </TableCell>

                      <TableCell className="min-w-44">
                        <p className="font-medium text-slate-900">
                          {point.name}
                        </p>

                        {point.description && (
                          <p className="mt-1 max-w-xs truncate text-[11px] text-slate-500">
                            {point.description}
                          </p>
                        )}
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-slate-600">
                        {point.site?.name ?? point.siteId}
                      </TableCell>

                      <TableCell className="whitespace-nowrap font-mono text-[11px] text-slate-500">
                        {point.latitude}, {point.longitude}
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        {point.radiusMeters} m
                      </TableCell>

                      <TableCell className="text-center">
                        {assigned ? (
                          <div className="space-y-1">
                            <Badge
                              variant="outline"
                              className="rounded border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700"
                            >
                              <CheckCircle2 className="mr-1 size-3" />
                              Ditautkan
                            </Badge>

                            <p className="font-mono text-[10px] text-slate-500">
                              {assignment?.nfcTag?.uid ?? "-"}
                            </p>
                          </div>
                        ) : (
                          <Badge
                            variant="outline"
                            className="rounded border-slate-200 bg-slate-50 text-[10px] text-slate-500"
                          >
                            Belum Ditautkan
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={`rounded text-[10px] ${getStatusClass(
                            point.status,
                          )}`}
                        >
                          {getStatusLabel(point.status)}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {assigned ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="flex items-center gap-1 rounded border-rose-200 text-rose-600 hover:bg-rose-50"
                              title="Lepas NFC"
                              onClick={() => {
                                setActionError("");
                                setUnassigningCheckpoint(point);
                              }}
                            >
                              <Unlink className="size-3.5" />
                              <span>Lepas</span>
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="rounded flex items-center gap-1 border-blue-200 text-blue-600 hover:bg-blue-50"
                              title="Tautkan NFC"
                              onClick={() => {
                                setActionError("");
                                setSelectedNfcId("");
                                setAssigningCheckpoint(point);
                              }}
                            >
                              <Link2 className="size-3.5" />
                              <span>Tautkan</span>
                            </Button>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="rounded flx items-center gap-1"
                            title="Edit titik"
                            onClick={() => openEditDialog(point)}
                          >
                            <Edit className="size-3.5" />
                            <span>edit</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog
        open={isAddModalOpen}
        onOpenChange={(open) => {
          if (!open) closeFormDialog();
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto rounded">
          <DialogHeader>
            <DialogTitle className="text-base">
              Tambah Titik Patroli
            </DialogTitle>

            <DialogDescription className="text-xs">
              Isi data titik patroli baru.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4">
            {renderFormFields()}

            <Separator />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="rounded"
                onClick={closeFormDialog}
              >
                Batal
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded bg-blue-600 hover:bg-blue-700"
              >
                {createMutation.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingCheckpoint)}
        onOpenChange={(open) => {
          if (!open) closeFormDialog();
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto rounded">
          <DialogHeader>
            <DialogTitle className="text-base">Edit Titik Patroli</DialogTitle>

            <DialogDescription className="text-xs">
              Perbarui informasi titik patroli.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="space-y-4">
            {renderFormFields()}

            <Separator />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="rounded"
                onClick={closeFormDialog}
              >
                Batal
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded bg-blue-600 hover:bg-blue-700"
              >
                {updateMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(assigningCheckpoint)}
        onOpenChange={(open) => {
          if (!open && !isNfcProcessing) {
            setAssigningCheckpoint(null);
            setSelectedNfcId("");
            setActionError("");
          }
        }}
      >
        <DialogContent className="max-w-md rounded">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Link2 className="size-5 text-blue-600" />
              Tautkan NFC
            </DialogTitle>

            <DialogDescription className="text-xs">
              Pilih NFC yang akan ditautkan ke titik patroli.
            </DialogDescription>
          </DialogHeader>

          {assigningCheckpoint && (
            <div className="rounded border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Titik patroli</p>

              <p className="mt-1 text-sm font-semibold">
                {assigningCheckpoint.name}
              </p>

              <p className="mt-1 font-mono text-xs text-blue-600">
                {assigningCheckpoint.code}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs">Pilih NFC</Label>

            <Select
              value={selectedNfcId}
              onValueChange={(value) => setSelectedNfcId(value ?? "")}
              disabled={isNfcProcessing}
            >
              <SelectTrigger className="h-10 w-full rounded text-xs">
                <span className="truncate">
                  {selectedNfcId
                    ? (() => {
                        const selectedTag = availableNfcTags.find(
                          (tag) => tag.id === selectedNfcId,
                        );

                        return selectedTag
                          ? `${selectedTag.label ?? "Tanpa Label"} - ${selectedTag.uid ?? "No UID"}`
                          : "NFC tidak ditemukan";
                      })()
                    : "Pilih NFC yang tersedia"}
                </span>
              </SelectTrigger>

              <SelectContent>
                {availableNfcTags.length === 0 ? (
                  <SelectItem value="none" disabled>
                    Tidak ada NFC tersedia
                  </SelectItem>
                ) : (
                  availableNfcTags.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id}>
                      {tag.label ?? "Tanpa Label"} - {tag.uid ?? "No UID"}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <p className="text-[11px] text-slate-500">
              Hanya NFC dengan status UNASSIGNED yang dapat dipilih.
            </p>
          </div>

          {actionError && (
            <p className="rounded border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              {actionError}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded"
              disabled={isNfcProcessing}
              onClick={() => {
                setAssigningCheckpoint(null);
                setSelectedNfcId("");
                setActionError("");
              }}
            >
              Batal
            </Button>

            <Button
              type="button"
              disabled={
                isNfcProcessing ||
                !selectedNfcId ||
                selectedNfcId === "none" ||
                availableNfcTags.length === 0
              }
              onClick={handleAssignNfc}
              className="rounded bg-blue-600 hover:bg-blue-700"
            >
              {assignNfcMutation.isPending ? "Memproses..." : "Tautkan NFC"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(unassigningCheckpoint)}
        onOpenChange={(open) => {
          if (!open && !isNfcProcessing) {
            setUnassigningCheckpoint(null);
            setActionError("");
          }
        }}
      >
        <AlertDialogContent className="rounded">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-base">
              <Unlink className="size-5 text-rose-600" />
              Lepas Tautan NFC?
            </AlertDialogTitle>

            <AlertDialogDescription className="text-xs">
              NFC akan dilepas dari titik patroli. Status titik patroli akan
              berubah menjadi INACTIVE dan NFC menjadi UNASSIGNED. Riwayat
              assignment tetap tersimpan di backend.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {unassigningCheckpoint && (
            <div className="rounded border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Titik patroli</p>

              <p className="mt-1 text-sm font-semibold">
                {unassigningCheckpoint.name}
              </p>

              <p className="mt-1 font-mono text-xs text-blue-600">
                {unassigningCheckpoint.code}
              </p>

              <Separator className="my-2" />

              <p className="text-xs text-slate-500">NFC UID</p>

              <p className="mt-1 font-mono text-xs font-semibold">
                {getActiveAssignment(unassigningCheckpoint)?.nfcTag?.uid ?? "-"}
              </p>
            </div>
          )}

          {actionError && (
            <p className="rounded border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              {actionError}
            </p>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel className="rounded" disabled={isNfcProcessing}>
              Batal
            </AlertDialogCancel>

            <AlertDialogAction
              disabled={isNfcProcessing}
              onClick={(event) => {
                event.preventDefault();
                void handleUnassignNfc();
              }}
              className="rounded bg-rose-600 hover:bg-rose-700"
            >
              {unassignNfcMutation.isPending ? "Memproses..." : "Lepas NFC"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TitikPatroliView;
