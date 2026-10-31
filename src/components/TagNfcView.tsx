import React, { useMemo, useState } from "react";

import {
  AlertTriangle,
  CheckCircle2,
  Contact2,
  Link2,
  Link2Off,
  Pencil,
  Radio,
  RefreshCw,
  Search,
  Trash2,
  Unlink,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

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

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

import {
  useActivateNfc,
  useCreateNfcTag,
  useDeleteNfcTag,
  useMarkNfcTagDamaged,
  useMarkNfcTagLost,
  useNfcTags,
  useReplaceNfcTag,
  useUpdateNfcTag,
} from "../hooks/nfc/useNfc";

import {
  useAssignNfc,
  useUnassignNfc,
} from "../hooks/patrol-point-nfc/usePatroPointNfc";

import { usePatrolPoints } from "../hooks/patrol-point/usePatrolPoints";
import type { NfcTagResponse } from "../types/nfc/nfc";
import { PatrolPointResponse } from "../types/patrol-point/patrolPoint";
import { TagNfcDialogs } from "./TagNfcDialogs";

interface CheckpointOption {
  id: string;
  code: string;
  name: string;
  siteId: string;
  siteName?: string;
  status?: string;
}

interface NfcAssignment {
  id?: string;
  patrolPointId?: string;
  assignedAt?: string;
  unassignedAt?: string | null;
  status?: string;
  patrolPoint?: {
    id: string;
    code: string;
    name: string;
    siteId?: string;
  };
}

type NfcTagItem = NfcTagResponse & {
  assignments?: NfcAssignment[];
  nfcAssignments?: NfcAssignment[];
  _count?: {
    assignments?: number;
    nfcAssignments?: number;
    patrols: number;
  };
};

interface TagNfcViewProps {
  selectedSite: string;
  checkpoints?: CheckpointOption[];
}

interface SelectOption {
  value: string;
  label: string;
}

const SelectField: React.FC<{
  label?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
}> = ({
  label,
  value,
  onValueChange,
  options,
  placeholder = "Pilih opsi",
  disabled = false,
}) => {
  const selectedOption = options.find((option) => option.value === value);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <Label className="text-xs font-semibold text-slate-700">{label}</Label>
      )}

      <Select
        value={value}
        onValueChange={(selectedValue) => onValueChange(selectedValue ?? "")}
        disabled={disabled}
      >
        <SelectTrigger className="w-full rounded text-xs">
          <span className="truncate">
            {selectedOption?.label ?? placeholder}
          </span>
        </SelectTrigger>

        <SelectContent className="rounded">
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="text-xs"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "Aktif";

    case "UNASSIGNED":
      return "Belum Ditautkan";

    case "INACTIVE":
      return "Nonaktif";

    case "DAMAGED":
      return "Tag Rusak";

    case "LOST":
      return "Tag Hilang";

    case "REPLACED":
      return "Diganti";

    default:
      return status;
  }
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "success";

    case "UNASSIGNED":
      return "warning";

    case "INACTIVE":
    case "REPLACED":
      return "warning";

    default:
      return "danger";
  }
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const variant = getStatusVariant(status);

  const styles: Record<string, string> = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    danger: "border-rose-200 bg-rose-50 text-rose-700",
  };

  return (
    <Badge
      variant="outline"
      className={`rounded text-[11px] font-semibold ${styles[variant]}`}
    >
      {getStatusLabel(status)}
    </Badge>
  );
};

const getTagAssignments = (tag: NfcTagItem): NfcAssignment[] => {
  return tag.nfcAssignments ?? tag.assignments ?? [];
};

const getActiveAssignment = (tag: NfcTagItem): NfcAssignment | undefined => {
  return getTagAssignments(tag).find((assignment) => {
    const activeStatus = !assignment.status || assignment.status === "ACTIVE";

    return activeStatus && !assignment.unassignedAt;
  });
};

const isTagAssigned = (tag: NfcTagItem): boolean => {
  return Boolean(getActiveAssignment(tag));
};

const getAssignmentPatrolPointId = (tag: NfcTagItem): string => {
  const assignment = getActiveAssignment(tag);

  return assignment?.patrolPointId ?? assignment?.patrolPoint?.id ?? "";
};

const getAssignmentCheckpointName = (tag: NfcTagItem): string => {
  const assignment = getActiveAssignment(tag);

  if (!assignment) return "";

  return assignment.patrolPoint?.name ?? "Patrol point";
};

const getAssignmentCheckpointCode = (tag: NfcTagItem): string => {
  const assignment = getActiveAssignment(tag);

  return assignment?.patrolPoint?.code ?? "";
};

export const TagNfcView: React.FC<TagNfcViewProps> = ({ selectedSite }) => {
  const { data: pointsData } = usePatrolPoints(
    selectedSite !== "all" ? { siteId: selectedSite } : undefined,
  );

  const {
    data: nfcData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useNfcTags();

  const nfcTags = useMemo<NfcTagItem[]>(() => {
    if (!Array.isArray(nfcData)) return [];

    return nfcData as NfcTagItem[];
  }, [nfcData]);

  const checkpoints = (
    Array.isArray(pointsData) ? pointsData : []
  ) as PatrolPointResponse[];

  const createNfc = useCreateNfcTag();
  const deleteNfc = useDeleteNfcTag();

  const assignNfcMutation = useAssignNfc();
  const unassignNfcMutation = useUnassignNfc();

  const activateNfc = useActivateNfc();
  const updateNfc = useUpdateNfcTag();

  const markDamagedNfc = useMarkNfcTagDamaged();
  const markLostNfc = useMarkNfcTagLost();
  const markReplacedNfc = useReplaceNfcTag();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const [diagnosingTag, setDiagnosingTag] = useState<NfcTagItem | null>(null);

  const [editingTag, setEditingTag] = useState<NfcTagItem | null>(null);

  const [deletingTag, setDeletingTag] = useState<NfcTagItem | null>(null);

  const [unassigningTag, setUnassigningTag] = useState<NfcTagItem | null>(null);

  const [assigningTag, setAssigningTag] = useState<NfcTagItem | null>(null);

  const [damagingTag, setDamagingTag] = useState<NfcTagItem | null>(null);

  const [losingTag, setLosingTag] = useState<NfcTagItem | null>(null);

  const [replacingTag, setReplacingTag] = useState<NfcTagItem | null>(null);

  const [selectedCheckpointToAssign, setSelectedCheckpointToAssign] =
    useState("");

  const [replacementNfcId, setReplacementNfcId] = useState("");

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [formError, setFormError] = useState("");

  const [newTagUid, setNewTagUid] = useState("");
  const [newTagLabel, setNewTagLabel] = useState("");
  const [newTagCheckpointId, setNewTagCheckpointId] = useState("");

  const [editLabel, setEditLabel] = useState("");

  const showToast = (message: string) => {
    setToastMessage(message);

    window.setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const filteredTags = useMemo(() => {
    return nfcTags.filter((tag) => {
      const assignment = getActiveAssignment(tag);
      const assigned = Boolean(assignment);

      if (
        selectedSite !== "all" &&
        selectedSite &&
        assignment?.patrolPoint?.siteId &&
        assignment.patrolPoint.siteId !== selectedSite
      ) {
        return false;
      }

      if (selectedStatus === "unassigned" && assigned) {
        return false;
      }

      if (
        selectedStatus !== "all" &&
        selectedStatus !== "unassigned" &&
        tag.status !== selectedStatus
      ) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();

        const checkpointName = assignment?.patrolPoint?.name ?? "";

        const checkpointCode = assignment?.patrolPoint?.code ?? "";

        const match =
          tag.uid.toLowerCase().includes(query) ||
          (tag.label ?? "").toLowerCase().includes(query) ||
          checkpointName.toLowerCase().includes(query) ||
          checkpointCode.toLowerCase().includes(query);

        if (!match) return false;
      }

      return true;
    });
  }, [nfcTags, selectedSite, selectedStatus, searchQuery]);

  const availableCheckpoints = useMemo(() => {
    return checkpoints.filter((checkpoint) => {
      if (
        selectedSite &&
        selectedSite !== "all" &&
        checkpoint.siteId !== selectedSite
      ) {
        return false;
      }

      return checkpoint.status !== "ACTIVE";
    });
  }, [checkpoints, selectedSite]);

  const checkpointOptions: SelectOption[] = availableCheckpoints.map(
    (checkpoint) => ({
      value: checkpoint.id,
      label: `${checkpoint.code} - ${checkpoint.name}`,
    }),
  );

  const replacementOptions: SelectOption[] = useMemo(() => {
    return nfcTags
      .filter((tag) => {
        if (tag.id === replacingTag?.id) return false;

        if (tag.status !== "UNASSIGNED") return false;

        if (isTagAssigned(tag)) return false;

        return true;
      })
      .map((tag) => ({
        value: tag.id,
        label: `${tag.uid}${tag.label ? ` - ${tag.label}` : ""}`,
      }));
  }, [nfcTags, replacingTag]);

  const generateRandomUid = () => {
    const generatedUid = Array.from({ length: 4 }, () =>
      Math.floor(Math.random() * 256)
        .toString(16)
        .toUpperCase()
        .padStart(2, "0"),
    ).join("");

    setNewTagUid(generatedUid);
  };

  const handleRegisterTag = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");

    const normalizedUid = newTagUid.trim().toUpperCase();

    if (!/^[0-9A-F]+$/.test(normalizedUid)) {
      setFormError("UID harus berupa karakter hexadecimal.");
      return;
    }

    if (!normalizedUid) {
      setFormError("UID NFC wajib diisi.");
      return;
    }

    try {
      const created = await createNfc.mutateAsync({
        uid: normalizedUid,
        label: newTagLabel.trim() || undefined,
      });

      if (newTagCheckpointId && created?.id) {
        await assignNfcMutation.mutateAsync({
          patrolPointId: newTagCheckpointId,
          nfcTagId: created.id,
        });
      }

      setIsRegisterModalOpen(false);
      setNewTagUid("");
      setNewTagLabel("");
      setNewTagCheckpointId("");
      setFormError("");

      await refetch();

      showToast(`Tag NFC ${normalizedUid} berhasil didaftarkan.`);
    } catch (err: any) {
      setFormError(
        err?.response?.data?.message ??
          err?.message ??
          "Gagal mendaftarkan tag NFC.",
      );
    }
  };

  const handleOpenEdit = (tag: NfcTagItem) => {
    setEditingTag(tag);
    setEditLabel(tag.label ?? "");
    setFormError("");
  };

  const handleSaveEditTag = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!editingTag) return;

    setFormError("");

    try {
      await updateNfc.mutateAsync({
        id: editingTag.id,
        payload: {
          label: editLabel.trim() || null,
        },
      });

      const uid = editingTag.uid;

      setEditingTag(null);

      await refetch();

      showToast(`Label Tag NFC ${uid} berhasil diperbarui.`);
    } catch (err: any) {
      setFormError(
        err?.response?.data?.message ??
          err?.message ??
          "Gagal memperbarui tag NFC.",
      );
    }
  };

  const handleDeleteTag = async () => {
    if (!deletingTag) return;

    const tag = deletingTag;

    try {
      await deleteNfc.mutateAsync(tag.id);

      setDeletingTag(null);

      await refetch();

      showToast(`Tag ${tag.uid} berhasil dinonaktifkan.`);
    } catch (err: any) {
      setFormError(
        err?.response?.data?.message ??
          err?.message ??
          "Gagal menonaktifkan tag NFC.",
      );
    }
  };

  const handleActivateTag = async (tag: NfcTagItem) => {
    try {
      await activateNfc.mutateAsync(tag.id);

      await refetch();

      showToast(`Tag NFC ${tag.uid} berhasil diaktifkan.`);
    } catch (err: any) {
      setFormError(
        err?.response?.data?.message ??
          err?.message ??
          "Gagal mengaktifkan NFC.",
      );
    }
  };

  const handleConfirmUnassignTag = async () => {
    if (!unassigningTag) return;

    const tag = unassigningTag;

    const patrolPointId = getAssignmentPatrolPointId(tag);

    if (!patrolPointId) {
      setFormError("Patrol point dari assignment tidak ditemukan.");
      return;
    }

    try {
      await unassignNfcMutation.mutateAsync({
        patrolPointId,
      });

      setUnassigningTag(null);

      await refetch();

      showToast(`Tag NFC ${tag.uid} berhasil dilepas dari checkpoint.`);
    } catch (err: any) {
      setFormError(
        err?.response?.data?.message ??
          err?.message ??
          "Gagal melepas tautan NFC.",
      );
    }
  };

  const handleConfirmAssignTag = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    if (!assigningTag) return;

    if (!selectedCheckpointToAssign) {
      setFormError("Pilih checkpoint terlebih dahulu.");
      return;
    }

    try {
      await assignNfcMutation.mutateAsync({
        patrolPointId: selectedCheckpointToAssign,
        nfcTagId: assigningTag.id,
      });

      const uid = assigningTag.uid;

      setAssigningTag(null);
      setSelectedCheckpointToAssign("");
      setFormError("");

      await refetch();

      showToast(`Tag NFC ${uid} berhasil ditautkan.`);
    } catch (err: any) {
      setFormError(
        err?.response?.data?.message ?? err?.message ?? "Gagal menautkan NFC.",
      );
    }
  };

  const handleConfirmDamagedTag = async () => {
    if (!damagingTag) return;

    const tag = damagingTag;

    try {
      await markDamagedNfc.mutateAsync(tag.id);

      setDamagingTag(null);

      await refetch();

      showToast(`Tag NFC ${tag.uid} berhasil ditandai sebagai rusak.`);
    } catch (err: any) {
      setFormError(
        err?.response?.data?.message ??
          err?.message ??
          "Gagal menandai NFC sebagai rusak.",
      );
    }
  };

  const handleConfirmLostTag = async () => {
    if (!losingTag) return;

    const tag = losingTag;

    try {
      await markLostNfc.mutateAsync(tag.id);

      setLosingTag(null);

      await refetch();

      showToast(`Tag NFC ${tag.uid} berhasil ditandai sebagai hilang.`);
    } catch (err: any) {
      setFormError(
        err?.response?.data?.message ??
          err?.message ??
          "Gagal menandai NFC sebagai hilang.",
      );
    }
  };

  const handleConfirmReplaceTag = async () => {
    if (!replacingTag) return;

    if (!replacementNfcId) {
      setFormError("Pilih NFC pengganti terlebih dahulu.");
      return;
    }

    try {
      await markReplacedNfc.mutateAsync({
        id: replacingTag.id,
        payload: {
          newNfcTagId: replacementNfcId,
        },
      });

      const oldUid = replacingTag.uid;

      setReplacingTag(null);
      setReplacementNfcId("");
      setFormError("");

      await refetch();

      showToast(`Tag NFC ${oldUid} berhasil diganti.`);
    } catch (err: any) {
      setFormError(
        err?.response?.data?.message ??
          err?.message ??
          "Gagal mengganti tag NFC.",
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center text-xs text-slate-500">
        Memuat data tag NFC dari server...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="border border-rose-200 bg-rose-50 p-4 rounded">
        <p className="text-xs font-semibold text-rose-700">
          Gagal mengambil data NFC.
        </p>

        <p className="mt-1 text-xs text-rose-600">
          {(error as any)?.message ?? "Terjadi kesalahan pada server."}
        </p>

        <Button
          size="sm"
          variant="outline"
          className="mt-3 rounded text-xs"
          onClick={() => refetch()}
        >
          <RefreshCw className="mr-1.5 size-3.5" />
          Coba Lagi
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* TOAST */}

      {toastMessage && (
        <div className="flex items-center justify-between gap-3 border border-emerald-200 bg-emerald-50 p-3 rounded animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-800">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 rounded text-emerald-700"
            onClick={() => setToastMessage(null)}
          >
            <X className="size-4" />
          </Button>
        </div>
      )}

      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-slate-900">
            Manajemen Tag NFC & RFID Checkpoint
          </h1>

          <p className="mt-1 max-w-3xl text-xs text-slate-500">
            Inventaris tag identifikasi fisik, pemantauan kualitas sinyal RF,
            pengelolaan tautan checkpoint, dan enkripsi anti-spoofing.
          </p>
        </div>

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
      </div>

      <div className="flex gap-3 border border-slate-200 bg-white p-3 rounded lg:flex-row lg:items-center">
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

        <div className="grid gap-2 sm:grid-cols-2 lg:flex">
          <SelectField
            value={selectedStatus}
            onValueChange={setSelectedStatus}
            options={[
              { value: "all", label: "Semua Status Koneksi" },
              { value: "unassigned", label: "Belum Ditautkan" },
              { value: "ACTIVE", label: "Aktif" },
              { value: "INACTIVE", label: "Nonaktif" },
              { value: "DAMAGED", label: "Tag Rusak" },
              { value: "LOST", label: "Tag Hilang" },
              { value: "REPLACED", label: "Diganti" },
            ]}
          />
        </div>

        <div className="shrink-0 text-xs text-slate-500">
          Menampilkan{" "}
          <span className="font-semibold text-slate-900">
            {filteredTags.length}
          </span>{" "}
          dari {nfcTags.length} tag
        </div>
      </div>

      <div className="overflow-hidden border border-slate-200 bg-white rounded">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="whitespace-nowrap text-[11px] font-semibold uppercase">
                  UID Tag Fisik
                </TableHead>

                <TableHead className="whitespace-nowrap text-[11px] font-semibold uppercase">
                  Titik Checkpoint
                </TableHead>

                <TableHead className="whitespace-nowrap text-center text-[11px] font-semibold uppercase">
                  Status
                </TableHead>

                <TableHead className="whitespace-nowrap text-center text-[11px] font-semibold uppercase">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredTags.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-32 text-center text-xs text-slate-500"
                  >
                    Tidak ada tag yang sesuai dengan filter pencarian.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTags.map((tag) => {
                  const assigned = isTagAssigned(tag);

                  const checkpointName = getAssignmentCheckpointName(tag);

                  const checkpointCode = getAssignmentCheckpointCode(tag);

                  return (
                    <TableRow key={tag.id} className="text-xs">
                      <TableCell>
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <Contact2 className="size-4 text-slate-400" />

                          <div>
                            <span className="font-mono font-semibold text-blue-600">
                              {tag.uid}
                            </span>

                            {tag.label && (
                              <p className="mt-0.5 text-[11px] text-slate-500">
                                {tag.label}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        {assigned ? (
                          <div className="min-w-40">
                            <div className="flex items-center gap-1 font-semibold text-slate-900">
                              <Radio className="size-3.5 text-blue-600" />
                              {checkpointName}
                            </div>

                            <div className="mt-1 font-mono text-[11px] text-blue-600">
                              {checkpointCode ||
                                getAssignmentPatrolPointId(tag)}
                            </div>
                          </div>
                        ) : (
                          <Badge
                            variant="outline"
                            className="rounded border-amber-200 bg-amber-50 text-[11px] text-amber-700"
                          >
                            <Link2Off className="mr-1 size-3" />
                            Belum Ditautkan
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-center">
                        <StatusBadge status={tag.status} />
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {assigned ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 rounded border-rose-200 bg-rose-50 px-2 text-[11px] text-rose-600 hover:bg-rose-100 hover:text-rose-800"
                              title="Lepas Hubungan Checkpoint"
                              onClick={() => {
                                setFormError("");
                                setUnassigningTag(tag);
                              }}
                              disabled={unassignNfcMutation.isPending}
                            >
                              <Unlink className="size-3.5 sm:mr-1" />
                              <span className="hidden md:inline">Lepas</span>
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 rounded border-blue-200 bg-blue-50 px-2 text-[11px] text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                              title="Tautkan ke Checkpoint"
                              onClick={() => {
                                setFormError("");
                                setAssigningTag(tag);
                                setSelectedCheckpointToAssign(
                                  availableCheckpoints[0]?.id || "",
                                );
                              }}
                              disabled={availableCheckpoints.length === 0}
                            >
                              <Link2 className="size-3.5 sm:mr-1" />
                              <span className="hidden md:inline">Tautkan</span>
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded border-blue-200 bg-blue-50 px-2 text-[11px] text-blue-700 hover:bg-blue-100 hover:text-blue-600"
                            title="Edit Label Tag"
                            onClick={() => handleOpenEdit(tag)}
                          >
                            <Pencil className="size-3.5" />
                            <span>Edit</span>
                          </Button>

                          {tag.status === "INACTIVE" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded 
                              border-emerald-200 bg-emerald-50 px-2 text-[11px] text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
                              title="Aktifkan NFC"
                              onClick={() => handleActivateTag(tag)}
                              disabled={activateNfc.isPending}
                            >
                              <CheckCircle2 className="size-3.5" />
                              <span>Aktifkan</span>
                            </Button>
                          )}

                          {tag.status === "ACTIVE" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className=" rounded border-amber-200 bg-amber-50 px-2 text-[11px] text-amber-700 hover:bg-amber-100 hover:text-amber-800"
                              title="Tandai NFC Rusak"
                              onClick={() => {
                                setFormError("");
                                setDamagingTag(tag);
                              }}
                              disabled={markDamagedNfc.isPending}
                            >
                              <AlertTriangle className="size-3.5" />
                              <span>Rusak</span>
                            </Button>
                          )}

                          {tag.status === "ACTIVE" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded border-rose-200 bg-rose-50 px-2 text-[11px] text-rose-700 hover:bg-rose-100 hover:text-rose-800"
                              title="Tandai NFC Hilang"
                              onClick={() => {
                                setFormError("");
                                setLosingTag(tag);
                              }}
                              disabled={markLostNfc.isPending}
                            >
                              <Radio className="size-3.5" />
                              <span>Hilang</span>
                            </Button>
                          )}

                          {tag.status === "ACTIVE" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className=" rounded border-blue-200 bg-blue-50 px-2 text-[11px] text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                              title="Ganti NFC"
                              onClick={() => {
                                setFormError("");
                                setReplacementNfcId("");
                                setReplacingTag(tag);
                              }}
                              disabled={
                                markReplacedNfc.isPending ||
                                replacementOptions.length === 0
                              }
                            >
                              <RefreshCw className="size-3.5" />
                              <span>Ganti</span>
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 rounded text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                            title="Nonaktifkan Tag"
                            onClick={() => {
                              setFormError("");
                              setDeletingTag(tag);
                            }}
                            disabled={assigned || deleteNfc.isPending}
                          >
                            <Trash2 className="size-3.5" />
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

      <TagNfcDialogs
        diagnosingTag={diagnosingTag}
        editingTag={editingTag}
        deletingTag={deletingTag}
        unassigningTag={unassigningTag}
        assigningTag={assigningTag}
        damagingTag={damagingTag}
        losingTag={losingTag}
        replacingTag={replacingTag}
        isRegisterModalOpen={isRegisterModalOpen}
        newTagUid={newTagUid}
        newTagLabel={newTagLabel}
        newTagCheckpointId={newTagCheckpointId}
        editLabel={editLabel}
        formError={formError}
        selectedCheckpointToAssign={selectedCheckpointToAssign}
        replacementNfcId={replacementNfcId}
        checkpointOptions={checkpointOptions}
        replacementOptions={replacementOptions}
        availableCheckpointsCount={availableCheckpoints.length}
        createPending={createNfc.isPending}
        assignPending={assignNfcMutation.isPending}
        unassignPending={unassignNfcMutation.isPending}
        updatePending={updateNfc.isPending}
        deletePending={deleteNfc.isPending}
        activatePending={activateNfc.isPending}
        damagedPending={markDamagedNfc.isPending}
        lostPending={markLostNfc.isPending}
        replacePending={markReplacedNfc.isPending}
        setDiagnosingTag={setDiagnosingTag}
        setEditingTag={setEditingTag}
        setDeletingTag={setDeletingTag}
        setUnassigningTag={setUnassigningTag}
        setAssigningTag={setAssigningTag}
        setDamagingTag={setDamagingTag}
        setLosingTag={setLosingTag}
        setReplacingTag={setReplacingTag}
        setIsRegisterModalOpen={setIsRegisterModalOpen}
        setNewTagUid={setNewTagUid}
        setNewTagLabel={setNewTagLabel}
        setNewTagCheckpointId={setNewTagCheckpointId}
        setEditLabel={setEditLabel}
        setFormError={setFormError}
        setSelectedCheckpointToAssign={setSelectedCheckpointToAssign}
        setReplacementNfcId={setReplacementNfcId}
        onRegister={handleRegisterTag}
        onEdit={handleSaveEditTag}
        onDelete={handleDeleteTag}
        onAssign={handleConfirmAssignTag}
        onUnassign={handleConfirmUnassignTag}
        onDamaged={handleConfirmDamagedTag}
        onLost={handleConfirmLostTag}
        onReplace={handleConfirmReplaceTag}
        onGenerateUid={generateRandomUid}
      />
    </div>
  );
};
