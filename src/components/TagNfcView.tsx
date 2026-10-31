import React, { useState } from "react";
import {
  CHECKPOINTS,
  CheckpointItem,
  NFC_TAGS,
  NfcTagItem,
  SITES,
} from "../data/mockData";
import { isValidNfcUid } from "../utils/security-logic";

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Contact2,
  Link2,
  Link2Off,
  Pencil,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

interface TagNfcViewProps {
  selectedSite: string;
  tags?: NfcTagItem[];
  checkpoints?: CheckpointItem[];
  onUpdateTags?: (tags: NfcTagItem[]) => void;
  onUnassignTag?: (tagUid: string) => void;
  onAssignTag?: (tagUid: string, checkpointId: string) => void;
}

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
}

const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  onValueChange,
  options,
  placeholder = "Pilih opsi",
  disabled = false,
}) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <Label className="text-xs font-semibold text-slate-700">{label}</Label>
      )}

      <Select
        value={value}
        onValueChange={(value) => onValueChange(value as string)}
        disabled={disabled}
      >
        <SelectTrigger className="w-full rounded text-xs">
          <SelectValue placeholder={placeholder} />
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

const Field: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-semibold text-slate-700">{label}</Label>
    {children}
  </div>
);

const InfoPanel: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div
    className={`space-y-2 border border-slate-200 bg-slate-50 p-3 rounded ${className}`}
  >
    {children}
  </div>
);

const InfoRow: React.FC<{
  label: string;
  value: React.ReactNode;
}> = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 text-xs">
    <span className="text-slate-500">{label}</span>
    <span className="text-right font-medium text-slate-900">{value}</span>
  </div>
);

const tagTypeOptions: SelectOption[] = [
  { value: "NFC NTAG213", label: "NFC NTAG213 (13.56 MHz Standard)" },
  { value: "NTAG215", label: "NTAG215 (504 Bytes)" },
  { value: "RFID UHF 860MHz", label: "RFID UHF 860MHz (Long Range)" },
  { value: "Mifare Classic 1K", label: "Mifare Classic 1K" },
];

const tagStatusOptions: SelectOption[] = [
  { value: "Terkoneksi Normal", label: "Terkoneksi Normal" },
  { value: "Belum Ditautkan", label: "Belum Ditautkan" },
  { value: "Siaga Kalibrasi", label: "Siaga Kalibrasi" },
  { value: "Sinyal Lemah", label: "Sinyal Lemah" },
  { value: "Tag Rusak", label: "Tag Rusak" },
];

const encryptionOptions: SelectOption[] = [
  {
    value: "AES-128 Enkripsi Aktif",
    label: "AES-128 Enkripsi Aktif (Anti Kloning)",
  },
  {
    value: "Standard Read-Only",
    label: "Standard Read-Only",
  },
];

const getStatusVariant = (status: string) => {
  switch (status) {
    case "Terkoneksi Normal":
      return "success";
    case "Belum Ditautkan":
    case "Siaga Kalibrasi":
      return "warning";
    default:
      return "danger";
  }
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const variant = getStatusVariant(status);

  const styles = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    danger: "border-rose-200 bg-rose-50 text-rose-700",
  };

  return (
    <Badge
      variant="outline"
      className={`rounded text-[11px] font-semibold ${styles[variant]}`}
    >
      {status}
    </Badge>
  );
};

export const TagNfcView: React.FC<TagNfcViewProps> = ({
  selectedSite,
  tags: propTags,
  checkpoints: propCheckpoints,
  onUpdateTags,
  onUnassignTag,
  onAssignTag,
}) => {
  const [localTags, setLocalTags] = useState<NfcTagItem[]>(NFC_TAGS);

  const tags = propTags || localTags;
  const checkpoints = propCheckpoints || CHECKPOINTS;

  const setTagsList = (updater: (prev: NfcTagItem[]) => NfcTagItem[]) => {
    if (onUpdateTags) {
      onUpdateTags(updater(tags));
    } else {
      setLocalTags(updater);
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTagType, setSelectedTagType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Dialog states
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [diagnosingTag, setDiagnosingTag] = useState<NfcTagItem | null>(null);
  const [editingTag, setEditingTag] = useState<NfcTagItem | null>(null);
  const [deletingTag, setDeletingTag] = useState<NfcTagItem | null>(null);
  const [unassigningTag, setUnassigningTag] = useState<NfcTagItem | null>(null);
  const [assigningTag, setAssigningTag] = useState<NfcTagItem | null>(null);

  const [selectedCheckpointToAssign, setSelectedCheckpointToAssign] =
    useState("");

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Tag form
  const [newTagUid, setNewTagUid] = useState(
    "04:" +
      Array.from({ length: 6 }, () =>
        Math.floor(Math.random() * 256)
          .toString(16)
          .toUpperCase()
          .padStart(2, "0"),
      ).join(":"),
  );

  const [newTagType, setNewTagType] =
    useState<NfcTagItem["type"]>("NFC NTAG213");

  const [newTagSiteId, setNewTagSiteId] = useState("site-a");
  const [newTagCheckpointId, setNewTagCheckpointId] = useState("CP-SDR-001");

  // Edit Tag form
  const [editType, setEditType] = useState<NfcTagItem["type"]>("NFC NTAG213");

  const [editCheckpointId, setEditCheckpointId] = useState("");

  const [editStatus, setEditStatus] =
    useState<NfcTagItem["status"]>("Terkoneksi Normal");

  const [editEncryption, setEditEncryption] = useState<
    NfcTagItem["encryption"]
  >("AES-128 Enkripsi Aktif");

  const [editSignalDbm, setEditSignalDbm] = useState(-60);

  // --------------------------------------------------
  // FILTER
  // --------------------------------------------------

  const filteredTags = tags.filter((tag) => {
    if (selectedSite !== "all" && tag.siteId !== selectedSite) {
      return false;
    }

    if (selectedTagType !== "all" && tag.type !== selectedTagType) {
      return false;
    }

    if (selectedStatus !== "all") {
      if (selectedStatus === "unassigned") {
        if (
          tag.linkedCheckpointId &&
          tag.linkedCheckpointId !== "-" &&
          tag.status !== "Belum Ditautkan"
        ) {
          return false;
        }
      } else if (tag.status !== selectedStatus) {
        return false;
      }
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();

      const match =
        tag.uid.toLowerCase().includes(query) ||
        tag.linkedCheckpointName.toLowerCase().includes(query) ||
        tag.linkedCheckpointId.toLowerCase().includes(query) ||
        tag.siteName.toLowerCase().includes(query);

      if (!match) return false;
    }

    return true;
  });

  const isTagAssigned = (tag: NfcTagItem) =>
    Boolean(
      tag.linkedCheckpointId &&
      tag.linkedCheckpointId !== "-" &&
      !tag.linkedCheckpointName.includes("Belum") &&
      tag.status !== "Belum Ditautkan",
    );

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // --------------------------------------------------
  // REGISTER TAG
  // --------------------------------------------------

  const handleRegisterTag = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidNfcUid(newTagUid)) {
      alert(
        "Format UID tidak valid! Gunakan format hex seperti 04:A2:3B:5F:8C:1D:9E",
      );
      return;
    }

    const siteObj = SITES.find((site) => site.id === newTagSiteId) || SITES[1];
    const cpObj = checkpoints.find(
      (checkpoint) => checkpoint.id === newTagCheckpointId,
    );

    if (!cpObj) {
      alert("Pilih titik checkpoint yang valid.");
      return;
    }

    const created: NfcTagItem = {
      uid: newTagUid.toUpperCase(),
      type: newTagType,
      siteId: cpObj.siteId || newTagSiteId,
      siteName: siteObj.name.replace(/^Site [A-D] - /, ""),
      linkedCheckpointId: cpObj.id,
      linkedCheckpointName: cpObj.name,
      signalDbm: -60,
      batteryPercent: newTagType.includes("RFID") ? 95 : "Pasif",
      encryption: "AES-128 Enkripsi Aktif",
      installedDate: "24 Mei 2025",
      status: "Terkoneksi Normal",
    };

    setTagsList((prev) => [created, ...prev]);

    setIsRegisterModalOpen(false);

    showToast(
      `Tag ${created.uid} (${created.type}) berhasil didaftarkan dan dihubungkan ke ${cpObj.id}!`,
    );
  };

  const generateRandomUid = () => {
    setNewTagUid(
      "04:" +
        Array.from({ length: 6 }, () =>
          Math.floor(Math.random() * 256)
            .toString(16)
            .toUpperCase()
            .padStart(2, "0"),
        ).join(":"),
    );
  };

  // --------------------------------------------------
  // EDIT TAG
  // --------------------------------------------------

  const handleOpenEdit = (tag: NfcTagItem) => {
    setEditingTag(tag);
    setEditType(tag.type);
    setEditCheckpointId(tag.linkedCheckpointId);
    setEditStatus(tag.status);
    setEditEncryption(tag.encryption);
    setEditSignalDbm(tag.signalDbm);
  };

  const handleSaveEditTag = (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingTag) return;

    const cpObj = checkpoints.find(
      (checkpoint) => checkpoint.id === editCheckpointId,
    );

    const siteObj = cpObj
      ? SITES.find((site) => site.id === cpObj.siteId)
      : SITES[1];

    setTagsList((prev) =>
      prev.map((tag) => {
        if (tag.uid !== editingTag.uid) return tag;

        return {
          ...tag,
          type: editType,
          linkedCheckpointId: cpObj ? cpObj.id : "",
          linkedCheckpointName: cpObj
            ? cpObj.name
            : "Belum Ditautkan (Unassigned)",
          siteId: cpObj ? cpObj.siteId : tag.siteId,
          siteName: siteObj
            ? siteObj.name.replace(/^Site [A-D] - /, "")
            : tag.siteName,
          status: editStatus,
          encryption: editEncryption,
          signalDbm: editSignalDbm,
          batteryPercent: editType.includes("RFID")
            ? typeof tag.batteryPercent === "number"
              ? tag.batteryPercent
              : 90
            : "Pasif",
        };
      }),
    );

    const uid = editingTag.uid;

    setEditingTag(null);

    showToast(`Konfigurasi Tag NFC/RFID ${uid} berhasil diperbarui!`);
  };

  // --------------------------------------------------
  // DELETE TAG
  // --------------------------------------------------

  const handleDeleteTag = () => {
    if (!deletingTag) return;

    const uid = deletingTag.uid;

    setTagsList((prev) => prev.filter((tag) => tag.uid !== uid));

    setDeletingTag(null);

    showToast(`Tag ${uid} berhasil dihapus dari inventaris sistem.`);
  };

  // --------------------------------------------------
  // UNASSIGN TAG
  // --------------------------------------------------

  const handleConfirmUnassignTag = () => {
    if (!unassigningTag) return;

    const tag = unassigningTag;
    const previousCpName = tag.linkedCheckpointName;

    if (onUnassignTag) {
      onUnassignTag(tag.uid);
    } else {
      setTagsList((prev) =>
        prev.map((item) => {
          if (item.uid !== tag.uid) return item;

          return {
            ...item,
            linkedCheckpointId: "",
            linkedCheckpointName: "Belum Ditautkan (Unassigned)",
            status: "Belum Ditautkan",
          };
        }),
      );
    }

    setUnassigningTag(null);

    showToast(
      `Tag NFC ${tag.uid} berhasil dilepas (unassign) dari ${previousCpName}!`,
    );
  };

  // --------------------------------------------------
  // ASSIGN TAG
  // --------------------------------------------------

  const handleConfirmAssignTag = (e: React.FormEvent) => {
    e.preventDefault();

    if (!assigningTag) return;

    const targetCpId = selectedCheckpointToAssign || checkpoints[0]?.id || "";

    const targetCp = checkpoints.find(
      (checkpoint) => checkpoint.id === targetCpId,
    );

    if (!targetCp) {
      alert("Pilih titik checkpoint target yang valid.");
      return;
    }

    if (onAssignTag) {
      onAssignTag(assigningTag.uid, targetCp.id);
    } else {
      setTagsList((prev) =>
        prev.map((tag) => {
          if (tag.uid !== assigningTag.uid) return tag;

          return {
            ...tag,
            linkedCheckpointId: targetCp.id,
            linkedCheckpointName: targetCp.name,
            siteId: targetCp.siteId,
            siteName: targetCp.siteName,
            status: "Terkoneksi Normal",
          };
        }),
      );
    }

    setAssigningTag(null);

    showToast(
      `Tag NFC ${assigningTag.uid} berhasil ditautkan ke ${targetCp.name}!`,
    );
  };

  // --------------------------------------------------
  // METRICS
  // --------------------------------------------------

  const linkedCount = tags.filter(isTagAssigned).length;

  const unassignedCount = tags.filter(
    (tag) =>
      !tag.linkedCheckpointId ||
      tag.linkedCheckpointId === "-" ||
      tag.status === "Belum Ditautkan",
  ).length;

  const siteOptions = SITES.filter((site) => site.id !== "all").map((site) => ({
    value: site.id,
    label: site.name,
  }));

  const checkpointOptions = checkpoints.map((checkpoint) => ({
    value: checkpoint.id,
    label: `${checkpoint.id} - ${checkpoint.name} (${checkpoint.siteName})`,
  }));

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

      {/* HEADER */}
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
          onClick={() => setIsRegisterModalOpen(true)}
          className="rounded bg-blue-600 text-xs font-semibold hover:bg-blue-700"
        >
          <Plus className="mr-1.5 size-4" />
          Daftarkan Tag Baru
        </Button>
      </div>

      {/* FILTER */}
      <div className="flex flex-col gap-3 border border-slate-200 bg-white p-3 rounded lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari UID tag, checkpoint, site..."
            className="h-9 rounded pl-9 text-xs"
          />
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex">
          <SelectField
            value={selectedTagType}
            onValueChange={setSelectedTagType}
            options={[
              { value: "all", label: "Semua Tipe Chip" },
              ...tagTypeOptions,
            ]}
          />

          <SelectField
            value={selectedStatus}
            onValueChange={setSelectedStatus}
            options={[
              { value: "all", label: "Semua Status Koneksi" },
              { value: "unassigned", label: "Belum Ditautkan" },
              ...tagStatusOptions.filter(
                (option) => option.value !== "Belum Ditautkan",
              ),
            ]}
          />
        </div>

        <div className="shrink-0 text-xs text-slate-500">
          Menampilkan{" "}
          <span className="font-semibold text-slate-900">
            {filteredTags.length}
          </span>{" "}
          dari {tags.length} tag
        </div>
      </div>

      {/* TABLE */}
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

                <TableHead className="whitespace-nowrap text-right text-[11px] font-semibold uppercase">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredTags.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-32 text-center text-xs text-slate-500"
                  >
                    Tidak ada tag yang sesuai dengan filter pencarian.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTags.map((tag) => {
                  const assigned = isTagAssigned(tag);

                  return (
                    <TableRow key={tag.uid} className="text-xs">
                      <TableCell>
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <Contact2 className="size-4 text-slate-400" />

                          <span className="font-mono font-semibold text-blue-600">
                            {tag.uid}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        {assigned ? (
                          <div className="min-w-40">
                            <div className="flex items-center gap-1 font-semibold text-slate-900">
                              <Radio className="size-3.5 text-blue-600" />
                              {tag.linkedCheckpointName}
                            </div>

                            <div className="mt-1 font-mono text-[11px] text-blue-600">
                              {tag.linkedCheckpointId} · {tag.siteName}
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
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 rounded px-2 text-[11px]"
                            title="Uji Diagnostik Tag"
                            onClick={() => setDiagnosingTag(tag)}
                          >
                            <Activity className="size-3.5 text-blue-600 sm:mr-1" />
                            <span className="hidden sm:inline">Tes</span>
                          </Button>

                          {assigned ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 rounded border-amber-200 bg-amber-50 px-2 text-[11px] text-amber-700 hover:bg-amber-100 hover:text-amber-800"
                              title="Lepas Hubungan Checkpoint"
                              onClick={() => setUnassigningTag(tag)}
                            >
                              <Link2Off className="size-3.5 sm:mr-1" />
                              <span className="hidden md:inline">Lepas</span>
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 rounded border-blue-200 bg-blue-50 px-2 text-[11px] text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                              title="Tautkan ke Checkpoint"
                              onClick={() => {
                                setAssigningTag(tag);
                                setSelectedCheckpointToAssign(
                                  checkpoints[0]?.id || "",
                                );
                              }}
                            >
                              <Link2 className="size-3.5 sm:mr-1" />
                              <span className="hidden md:inline">Tautkan</span>
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 rounded text-slate-500 hover:text-blue-600"
                            title="Edit Konfigurasi Tag"
                            onClick={() => handleOpenEdit(tag)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 rounded text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                            title="Hapus Tag"
                            onClick={() => setDeletingTag(tag)}
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

      {/* -------------------------------------------------- */}
      {/* DIALOG: UNASSIGN TAG */}
      {/* -------------------------------------------------- */}

      <Dialog
        open={Boolean(unassigningTag)}
        onOpenChange={(open) => {
          if (!open) setUnassigningTag(null);
        }}
      >
        <DialogContent className="max-w-md rounded">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Link2Off className="size-4 text-amber-600" />
              Lepas Hubungan Checkpoint
            </DialogTitle>

            <DialogDescription className="text-xs">
              Konfirmasi pelepasan hubungan tag NFC dari checkpoint.
            </DialogDescription>
          </DialogHeader>

          {unassigningTag && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Apakah Anda yakin ingin melepas hubungan checkpoint dari Tag NFC
                berikut?
              </p>

              <InfoPanel>
                <InfoRow
                  label="UID Tag Hardware"
                  value={
                    <span className="font-mono text-blue-600">
                      {unassigningTag.uid}
                    </span>
                  }
                />

                <InfoRow label="Tipe Chip" value={unassigningTag.type} />

                <div className="border-t border-slate-200 pt-2">
                  <InfoRow
                    label="Checkpoint Terhubung"
                    value={unassigningTag.linkedCheckpointName}
                  />

                  <div className="mt-1 text-right font-mono text-[11px] text-blue-600">
                    {unassigningTag.linkedCheckpointId}
                  </div>
                </div>
              </InfoPanel>

              <div className="border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-800 rounded">
                <div className="mb-1 flex items-center gap-1.5 font-semibold">
                  <AlertTriangle className="size-3.5" />
                  Catatan Sistem
                </div>
                Setelah dilepas, status tag menjadi Belum Ditautkan dan
                checkpoint tidak memiliki tag aktif hingga ditautkan kembali.
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              className="rounded text-xs"
              onClick={() => setUnassigningTag(null)}
            >
              Batal
            </Button>

            <Button
              className="rounded bg-amber-600 text-xs hover:bg-amber-700"
              onClick={handleConfirmUnassignTag}
            >
              <Link2Off className="mr-1.5 size-3.5" />
              Lepas Checkpoint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* -------------------------------------------------- */}
      {/* DIALOG: ASSIGN TAG */}
      {/* -------------------------------------------------- */}

      <Dialog
        open={Boolean(assigningTag)}
        onOpenChange={(open) => {
          if (!open) setAssigningTag(null);
        }}
      >
        <DialogContent className="max-w-md rounded">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Link2 className="size-4 text-blue-600" />
              Tautkan Tag ke Checkpoint
            </DialogTitle>

            <DialogDescription className="text-xs">
              Pilih checkpoint tujuan untuk tag NFC/RFID ini.
            </DialogDescription>
          </DialogHeader>

          {assigningTag && (
            <form onSubmit={handleConfirmAssignTag} className="space-y-4">
              <InfoPanel>
                <p className="text-[11px] text-slate-500">Tag NFC Terpilih</p>

                <p className="font-mono text-sm font-bold text-blue-600">
                  {assigningTag.uid}
                </p>

                <p className="text-[11px] text-slate-600">
                  {assigningTag.type} · {assigningTag.encryption}
                </p>
              </InfoPanel>

              <SelectField
                label="Titik Checkpoint Patroli"
                value={selectedCheckpointToAssign}
                onValueChange={setSelectedCheckpointToAssign}
                options={checkpointOptions}
                placeholder="Pilih checkpoint"
              />

              {checkpoints.length === 0 && (
                <p className="text-xs text-rose-600">
                  Belum ada checkpoint yang tersedia.
                </p>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded text-xs"
                  onClick={() => setAssigningTag(null)}
                >
                  Batal
                </Button>

                <Button
                  type="submit"
                  disabled={
                    !selectedCheckpointToAssign || checkpoints.length === 0
                  }
                  className="rounded bg-blue-600 text-xs hover:bg-blue-700"
                >
                  <Link2 className="mr-1.5 size-3.5" />
                  Tautkan Checkpoint
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* -------------------------------------------------- */}
      {/* DIALOG: DIAGNOSTIC */}
      {/* -------------------------------------------------- */}

      <Dialog
        open={Boolean(diagnosingTag)}
        onOpenChange={(open) => {
          if (!open) setDiagnosingTag(null);
        }}
      >
        <DialogContent className="max-w-md rounded">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Settings2 className="size-4 text-blue-600" />
              Diagnostik Tag NFC / RFID
            </DialogTitle>

            <DialogDescription className="text-xs">
              Informasi hasil pemeriksaan kondisi tag.
            </DialogDescription>
          </DialogHeader>

          {diagnosingTag && (
            <div className="space-y-4">
              <InfoPanel>
                <InfoRow
                  label="UID Hardware"
                  value={<span className="font-mono">{diagnosingTag.uid}</span>}
                />

                <InfoRow label="Tipe Chip" value={diagnosingTag.type} />

                <InfoRow
                  label="Checkpoint Terkait"
                  value={diagnosingTag.linkedCheckpointName}
                />

                <InfoRow
                  label="Sinyal Terukur"
                  value={
                    <span className="font-mono font-semibold text-emerald-600">
                      {diagnosingTag.signalDbm} dBm (Stabil)
                    </span>
                  }
                />

                <InfoRow
                  label="Integritas Kriptografi"
                  value={
                    <span className="font-semibold text-emerald-700">
                      PASS (Checksum Cocok)
                    </span>
                  }
                />
              </InfoPanel>

              <div className="flex items-start gap-2 border border-emerald-200 bg-emerald-50 p-3 text-[11px] text-emerald-800 rounded">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                Chip beroperasi normal tanpa tanda kerusakan fisik atau kloning
                ilegal.
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              className="rounded bg-blue-600 text-xs hover:bg-blue-700"
              onClick={() => setDiagnosingTag(null)}
            >
              Tutup Diagnostik
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* -------------------------------------------------- */}
      {/* DIALOG: EDIT TAG */}
      {/* -------------------------------------------------- */}

      <Dialog
        open={Boolean(editingTag)}
        onOpenChange={(open) => {
          if (!open) setEditingTag(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Pencil className="size-4 text-blue-600" />
              Edit Konfigurasi Tag NFC/RFID
            </DialogTitle>

            <DialogDescription className="text-xs">
              Perbarui konfigurasi perangkat dan hubungan checkpoint.
            </DialogDescription>
          </DialogHeader>

          {editingTag && (
            <form onSubmit={handleSaveEditTag} className="space-y-4">
              <Field label="UID Tag Fisik (Read-Only)">
                <Input
                  disabled
                  value={editingTag.uid}
                  className="rounded bg-slate-100 font-mono text-xs"
                />
              </Field>

              <SelectField
                label="Tipe Chip Hardware"
                value={editType}
                onValueChange={(value) =>
                  setEditType(value as NfcTagItem["type"])
                }
                options={tagTypeOptions}
              />

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-xs font-semibold text-slate-700">
                    Titik Checkpoint Terhubung
                  </Label>

                  {editCheckpointId && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 rounded px-2 text-[11px] text-amber-700 hover:text-amber-800"
                      onClick={() => setEditCheckpointId("")}
                    >
                      <Link2Off className="mr-1 size-3" />
                      Unassign
                    </Button>
                  )}
                </div>

                <Select
                  value={editCheckpointId || "__none__"}
                  onValueChange={(value) => setEditCheckpointId(value ?? "")}
                >
                  <SelectTrigger className="w-full rounded text-xs">
                    <SelectValue placeholder="Pilih checkpoint" />
                  </SelectTrigger>

                  <SelectContent className="rounded">
                    <SelectItem value="__none__" className="text-xs">
                      Belum Ditautkan (Unassigned)
                    </SelectItem>

                    {checkpointOptions.map((option) => (
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

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <SelectField
                  label="Status Koneksi"
                  value={editStatus}
                  onValueChange={(value) =>
                    setEditStatus(value as NfcTagItem["status"])
                  }
                  options={tagStatusOptions}
                />

                <Field label="Sinyal (dBm)">
                  <Input
                    type="number"
                    value={editSignalDbm}
                    onChange={(e) =>
                      setEditSignalDbm(parseInt(e.target.value, 10) || -60)
                    }
                    className="rounded font-mono text-xs"
                  />
                </Field>
              </div>

              <SelectField
                label="Protokol Keamanan Enkripsi"
                value={editEncryption}
                onValueChange={(value) =>
                  setEditEncryption(value as NfcTagItem["encryption"])
                }
                options={encryptionOptions}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded text-xs"
                  onClick={() => setEditingTag(null)}
                >
                  Batal
                </Button>

                <Button
                  type="submit"
                  className="rounded bg-blue-600 text-xs hover:bg-blue-700"
                >
                  Simpan Perubahan
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* -------------------------------------------------- */}
      {/* ALERT DIALOG: DELETE */}
      {/* -------------------------------------------------- */}

      <AlertDialog
        open={Boolean(deletingTag)}
        onOpenChange={(open) => {
          if (!open) setDeletingTag(null);
        }}
      >
        <AlertDialogContent className="max-w-md rounded">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle className="size-4 text-rose-600" />
              Hapus Tag NFC/RFID
            </AlertDialogTitle>

            <AlertDialogDescription className="text-xs">
              Apakah Anda yakin ingin menghapus tag fisik berikut dari
              inventaris sistem?
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deletingTag && (
            <div className="space-y-3">
              <InfoPanel>
                <p className="font-mono text-sm font-bold text-blue-600">
                  {deletingTag.uid}
                </p>

                <p className="text-xs font-semibold text-slate-900">
                  {deletingTag.type}
                </p>

                <p className="text-[11px] text-slate-500">
                  Terpasang di:{" "}
                  <span className="font-semibold text-slate-800">
                    {deletingTag.linkedCheckpointName}
                  </span>{" "}
                  ({deletingTag.siteName})
                </p>
              </InfoPanel>

              <div className="border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-800 rounded">
                <strong>Peringatan:</strong> Menghapus tag akan memutus
                verifikasi patroli otomatis di checkpoint terkait sampai tag
                pengganti didaftarkan.
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel className="rounded text-xs">
              Batal
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={handleDeleteTag}
              className="rounded bg-rose-600 text-xs hover:bg-rose-700"
            >
              <Trash2 className="mr-1.5 size-3.5" />
              Hapus Tag Permanen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* -------------------------------------------------- */}
      {/* DIALOG: REGISTER TAG */}
      {/* -------------------------------------------------- */}

      <Dialog open={isRegisterModalOpen} onOpenChange={setIsRegisterModalOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Plus className="size-4 text-blue-600" />
              Daftarkan Tag NFC / RFID Baru
            </DialogTitle>

            <DialogDescription className="text-xs">
              Masukkan UID perangkat dan tentukan checkpoint tujuan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRegisterTag} className="space-y-4">
            <Field label="UID Tag Hardware">
              <div className="flex gap-2">
                <Input
                  required
                  value={newTagUid}
                  onChange={(e) => setNewTagUid(e.target.value)}
                  placeholder="04:A2:3B:5F:8C:1D:9E"
                  className="rounded font-mono text-xs"
                />

                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0 rounded text-xs"
                  onClick={generateRandomUid}
                >
                  <RefreshCw className="mr-1.5 size-3.5" />
                  Generate
                </Button>
              </div>

              <p className="text-[11px] text-slate-500">
                Gunakan UID hexadecimal dengan format 7-byte.
              </p>
            </Field>

            <SelectField
              label="Tipe Chip / Frekuensi"
              value={newTagType}
              onValueChange={(value) =>
                setNewTagType(value as NfcTagItem["type"])
              }
              options={[
                {
                  value: "NFC NTAG213",
                  label: "NFC NTAG213 (13.56 MHz - Standard)",
                },
                {
                  value: "NTAG215",
                  label: "NTAG215 (High Memory 504 Bytes)",
                },
                {
                  value: "RFID UHF 860MHz",
                  label: "RFID UHF 860MHz (Long Range 5-10m)",
                },
                {
                  value: "Mifare Classic 1K",
                  label: "Mifare Classic 1K (S50 Compatible)",
                },
              ]}
            />

            <SelectField
              label="Site / Wilayah"
              value={newTagSiteId}
              onValueChange={setNewTagSiteId}
              options={siteOptions}
            />

            <SelectField
              label="Hubungkan ke Checkpoint"
              value={newTagCheckpointId}
              onValueChange={setNewTagCheckpointId}
              options={checkpointOptions}
              placeholder="Pilih checkpoint"
            />

            {checkpoints.length === 0 && (
              <p className="text-xs text-rose-600">
                Belum ada checkpoint. Tambahkan checkpoint terlebih dahulu.
              </p>
            )}

            <InfoPanel>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <ShieldCheck className="size-4 text-blue-600" />
                Keamanan Perangkat
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Protokol enkripsi</span>
                <span className="font-semibold text-emerald-700">
                  AES-128 Aktif
                </span>
              </div>
            </InfoPanel>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="rounded text-xs"
                onClick={() => setIsRegisterModalOpen(false)}
              >
                Batal
              </Button>

              <Button
                type="submit"
                disabled={checkpoints.length === 0}
                className="rounded bg-blue-600 text-xs hover:bg-blue-700"
              >
                <Plus className="mr-1.5 size-3.5" />
                Daftarkan & Kunci AES
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
