import { CheckCircle2, Edit, Link2, Search, Unlink } from "lucide-react";

import React, { useEffect, useMemo, useState } from "react";

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

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

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

import type { NfcTagResponse } from "../types/nfc/nfc";

import AssignNfcDialog from "./patrolPoints/AssignNfcDialog";

import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  getActiveAssignment,
  getStatusClass,
  getStatusLabel,
} from "../utils/patrolPointUtils";
import { PaginationComponent } from "./PaginationComponent";
import PointFormDialog from "./patrolPoints/PointFormDialog";
import { PointForm } from "./patrolPoints/TitikPatroliFormDialog";
import { TitikPatroliHeader } from "./patrolPoints/TitikPatroliHeader";
import UnassignNfcDialog from "./patrolPoints/UnassignNfcDialog";

interface TitikPatroliViewProps {
  selectedSite: string;
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

  const availableNfcTags = useMemo(
    () => nfcTags.filter((tag) => tag.status === "UNASSIGNED"),
    [nfcTags],
  );

  const [searchQuery, setSearchQuery] = useState("");

  const [selectedStatus, setSelectedStatus] = useState("all");

  const [selectedNfcStatus, setSelectedNfcStatus] = useState("all");

  const [pageSize, setPageSize] = useState("10");

  const [currentPage, setCurrentPage] = useState(1);

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

  const [columnFilters, setColumnFilters] = useState({
    code: "",
    name: "",
    site: "",
    coordinates: "",
    radius: "",
    nfc: "",
    status: "",
  });

  const handleColumnFilterChange = (
    key: keyof typeof columnFilters,
    value: string,
  ) => {
    setColumnFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const isNfcProcessing =
    assignNfcMutation.isPending || unassignNfcMutation.isPending;

  const filteredCheckpoints = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return checkpoints.filter((point) => {
      const activeAssignment = getActiveAssignment(point);
      const uid = activeAssignment?.nfcTag?.uid ?? "";
      const assigned = Boolean(activeAssignment);

      const globalMatch =
        !query ||
        point.code.toLowerCase().includes(query) ||
        point.name.toLowerCase().includes(query) ||
        (point.description ?? "").toLowerCase().includes(query) ||
        (point.site?.name ?? "").toLowerCase().includes(query) ||
        uid.toLowerCase().includes(query);

      const columnMatch =
        point.code.toLowerCase().includes(columnFilters.code.toLowerCase()) &&
        point.name.toLowerCase().includes(columnFilters.name.toLowerCase()) &&
        (point.site?.name ?? point.siteId)
          .toLowerCase()
          .includes(columnFilters.site.toLowerCase()) &&
        `${point.latitude}, ${point.longitude}`
          .toLowerCase()
          .includes(columnFilters.coordinates.toLowerCase()) &&
        String(point.radiusMeters)
          .toLowerCase()
          .includes(columnFilters.radius.toLowerCase()) &&
        (uid.toLowerCase().includes(columnFilters.nfc.toLowerCase()) ||
          (columnFilters.nfc.toLowerCase().includes("belum") && !assigned) ||
          (columnFilters.nfc.toLowerCase().includes("ditautkan") &&
            assigned)) &&
        getStatusLabel(point.status)
          .toLowerCase()
          .includes(columnFilters.status.toLowerCase());

      if (selectedStatus !== "all" && point.status !== selectedStatus) {
        return false;
      }

      if (selectedNfcStatus === "assigned" && !assigned) {
        return false;
      }

      if (selectedNfcStatus === "unassigned" && assigned) {
        return false;
      }

      return globalMatch && columnMatch;
    });
  }, [
    checkpoints,
    searchQuery,
    selectedStatus,
    selectedNfcStatus,
    columnFilters,
  ]);
  const totalItems = filteredCheckpoints.length;

  const itemsPerPage = Number(pageSize);

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const paginatedCheckpoints = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;

    return filteredCheckpoints.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCheckpoints, currentPage, itemsPerPage]);

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;

  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handlePageSizeChange = (value: string | null) => {
    if (!value) return;

    setPageSize(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;

    setCurrentPage(page);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    selectedStatus,
    selectedNfcStatus,
    selectedSite,
    columnFilters,
  ]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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
    if (isSubmitting) return;

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

      setIsAddModalOpen(false);

      setForm(EMPTY_FORM);

      toast.success("Titik patroli berhasil ditambahkan.");
    } catch (err) {
      toast.error("Gagal menambahkan titik patroli.", {
        description: getErrorMessage(err),
      });
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

      setEditingCheckpoint(null);
      setForm(EMPTY_FORM);

      toast.success("Titik patroli berhasil diperbarui.");
    } catch (err) {
      toast.error("Gagal memperbarui titik patroli.", {
        description: getErrorMessage(err),
      });
    }
  };

  const openAssignDialog = (point: PatrolPointResponse) => {
    setActionError("");

    setSelectedNfcId("");

    setAssigningCheckpoint(point);
  };

  const closeAssignDialog = () => {
    if (isNfcProcessing) return;

    setAssigningCheckpoint(null);

    setSelectedNfcId("");

    setActionError("");
  };

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

      toast.success("NFC berhasil ditautkan ke titik patroli.");
    } catch (err) {
      toast.error("Gagal menautkan NFC.", {
        description: getErrorMessage(err),
      });
    }
  };

  const openUnassignDialog = (point: PatrolPointResponse) => {
    setActionError("");

    setUnassigningCheckpoint(point);
  };

  const closeUnassignDialog = () => {
    if (isNfcProcessing) return;

    setUnassigningCheckpoint(null);

    setActionError("");
  };

  const handleUnassignNfc = async () => {
    if (!unassigningCheckpoint) return;

    const assignment = getActiveAssignment(unassigningCheckpoint);

    if (!assignment) {
      setActionError("Titik patroli tidak memiliki NFC aktif.");
      return;
    }

    try {
      await unassignNfcMutation.mutateAsync({
        patrolPointId: unassigningCheckpoint.id,
        reason: "NFC dilepas melalui manajemen titik patroli",
      });

      setUnassigningCheckpoint(null);

      toast.success("NFC berhasil dilepas dari titik patroli.");
    } catch (err) {
      toast.error("Gagal melepas NFC.", {
        description: getErrorMessage(err),
      });
    }
  };

  return (
    <div className="space-y-3">
      <TitikPatroliHeader
        isFetching={isFetching}
        onAdd={openAddDialog}
        onRefresh={refetch}
      />

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

      <div className="">
        <PaginationComponent
          totalItems={totalItems}
          startItem={startItem}
          endItem={endItem}
          pageSize={pageSize}
          currentPage={currentPage}
          totalPages={totalPages ?? 1}
          onPageSizeChange={handlePageSizeChange}
          onPageChange={handlePageChange}
        />
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

              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead>
                  <Input
                    value={columnFilters.code}
                    onChange={(e) =>
                      handleColumnFilterChange("code", e.target.value)
                    }
                    placeholder="Cari kode..."
                    className="h-7 rounded text-[11px] font-normal"
                  />
                </TableHead>

                <TableHead>
                  <Input
                    value={columnFilters.name}
                    onChange={(e) =>
                      handleColumnFilterChange("name", e.target.value)
                    }
                    placeholder="Cari nama titik..."
                    className="h-7 rounded text-[11px] font-normal"
                  />
                </TableHead>

                <TableHead>
                  <Input
                    value={columnFilters.site}
                    onChange={(e) =>
                      handleColumnFilterChange("site", e.target.value)
                    }
                    placeholder="Cari site..."
                    className="h-7 rounded text-[11px] font-normal"
                  />
                </TableHead>

                <TableHead>
                  <Input
                    value={columnFilters.coordinates}
                    onChange={(e) =>
                      handleColumnFilterChange("coordinates", e.target.value)
                    }
                    placeholder="Cari coordinates"
                    className="h-7 min-w-0 rounded text-[11px] font-normal"
                  />
                </TableHead>

                <TableHead>
                  <Input
                    value={columnFilters.radius}
                    onChange={(e) =>
                      handleColumnFilterChange("radius", e.target.value)
                    }
                    placeholder="Cari radius..."
                    className="h-7 rounded text-[11px] font-normal"
                  />
                </TableHead>

                <TableHead className="text-center">
                  <Select
                    value={selectedNfcStatus}
                    onValueChange={(value) =>
                      setSelectedNfcStatus(value ?? "all")
                    }
                  >
                    <SelectTrigger className="h-7 rounded text-[11px]">
                      <span>
                        {{
                          all: "Semua",
                          assigned: "Ditautkan",
                          unassigned: "Belum",
                        }[selectedNfcStatus] ?? "Semua"}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua NFC</SelectItem>
                      <SelectItem value="assigned">Sudah Ditautkan</SelectItem>
                      <SelectItem value="unassigned">
                        Belum Ditautkan
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </TableHead>

                <TableHead className="text-center">
                  <Select
                    value={selectedStatus}
                    onValueChange={(value) => setSelectedStatus(value ?? "all")}
                  >
                    <SelectTrigger className="h-7 rounded text-[11px]">
                      <span>
                        {{
                          all: "Semua",
                          ACTIVE: "Aktif",
                          INACTIVE: "Nonaktif",
                          MAINTENANCE: "Pemeliharaan",
                        }[selectedStatus] ?? "Semua"}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="ACTIVE">Aktif</SelectItem>
                      <SelectItem value="INACTIVE">Nonaktif</SelectItem>
                      <SelectItem value="MAINTENANCE">Pemeliharaan</SelectItem>
                    </SelectContent>
                  </Select>
                </TableHead>

                <TableHead />
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
                paginatedCheckpoints.map((point) => {
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
                              onClick={() => openUnassignDialog(point)}
                            >
                              <Unlink className="size-3.5" />
                              <span>Lepas</span>
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="flex items-center gap-1 rounded border-blue-200 text-blue-600 hover:bg-blue-50"
                              title="Tautkan NFC"
                              onClick={() => openAssignDialog(point)}
                            >
                              <Link2 className="size-3.5" />
                              <span>Tautkan</span>
                            </Button>
                          )}

                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-1 rounded"
                            title="Edit titik"
                            onClick={() => openEditDialog(point)}
                          >
                            <Edit className="size-3.5" />
                            <span>Edit</span>
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

      <PointFormDialog
        open={isAddModalOpen}
        mode="create"
        form={form}
        formError={formError}
        isSubmitting={isSubmitting}
        isCreatePending={createMutation.isPending}
        isUpdatePending={updateMutation.isPending}
        onFormChange={(key, value) => updateForm(key, value)}
        onSubmit={handleCreate}
        onClose={closeFormDialog}
      />

      <PointFormDialog
        open={Boolean(editingCheckpoint)}
        mode="edit"
        form={form}
        formError={formError}
        isSubmitting={isSubmitting}
        isCreatePending={createMutation.isPending}
        isUpdatePending={updateMutation.isPending}
        onFormChange={(key, value) => updateForm(key, value)}
        onSubmit={handleUpdate}
        onClose={closeFormDialog}
      />

      <AssignNfcDialog
        open={Boolean(assigningCheckpoint)}
        checkpoint={assigningCheckpoint}
        availableNfcTags={availableNfcTags}
        selectedNfcId={selectedNfcId}
        actionError={actionError}
        isProcessing={isNfcProcessing}
        isAssigning={assignNfcMutation.isPending}
        onSelectedNfcChange={setSelectedNfcId}
        onConfirm={handleAssignNfc}
        onClose={closeAssignDialog}
      />

      <UnassignNfcDialog
        open={Boolean(unassigningCheckpoint)}
        checkpoint={unassigningCheckpoint}
        actionError={actionError}
        isProcessing={isNfcProcessing}
        isUnassigning={unassignNfcMutation.isPending}
        getActiveAssignment={getActiveAssignment}
        onConfirm={handleUnassignNfc}
        onClose={closeUnassignDialog}
      />
    </div>
  );
};

export default TitikPatroliView;
