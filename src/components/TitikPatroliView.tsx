import React, { useState } from "react";
import {
  CHECKPOINTS,
  CheckpointItem,
  NfcTagItem,
  SITES,
} from "../data/mockData";
import { isValidNfcUid } from "../utils/security-logic";

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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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

import {
  AlertTriangle,
  CheckCircle2,
  Contact,
  Edit,
  Link,
  Link2Off,
  MapPin,
  Plus,
  RefreshCw,
  ScanLine,
  Search,
  Trash2,
  X,
} from "lucide-react";

interface TitikPatroliViewProps {
  selectedSite: string;
  checkpoints?: CheckpointItem[];
  nfcTags?: NfcTagItem[];
  onUpdateCheckpoints?: (cps: CheckpointItem[]) => void;
  onUnassignNfc?: (checkpointId: string) => void;
  onAssignNfc?: (checkpointId: string, tagUid: string) => void;
}

const TAG_TYPES: CheckpointItem["tagType"][] = [
  "NFC NTAG213",
  "RFID UHF",
  "QR Code Dynamic",
];

const CHECKPOINT_STATUSES: CheckpointItem["status"][] = [
  "Aktif Normal",
  "Perlu Kalibrasi",
  "Belum Terhubung Tag",
  "Rusak / Gangguan",
];

const FREQUENCIES = [
  "Setiap 30 Menit",
  "Setiap 1 Jam",
  "Setiap 2 Jam",
  "Setiap 3 Jam",
];

const OFFICERS = [
  "Rian Hidayat (Alpha-02)",
  "Agus Santoso (Charlie-01)",
  "Budi Hartono (Alpha-03)",
  "Doni Pratama (Echo-01)",
];

const generateUid = () =>
  "04:" +
  Array.from({ length: 6 }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .toUpperCase()
      .padStart(2, "0"),
  ).join(":");

const getStatusVariant = (status: CheckpointItem["status"]) => {
  switch (status) {
    case "Aktif Normal":
      return "success";
    case "Perlu Kalibrasi":
      return "warning";
    case "Belum Terhubung Tag":
      return "warning";
    default:
      return "danger";
  }
};

const getStatusClass = (status: CheckpointItem["status"]) => {
  switch (status) {
    case "Aktif Normal":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Perlu Kalibrasi":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Belum Terhubung Tag":
      return "border-amber-300 bg-amber-50 text-amber-800";
    default:
      return "border-rose-200 bg-rose-50 text-rose-700";
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

const SelectField = ({
  label,
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
  disabled?: boolean;
}) => (
  <Field label={label}>
    <Select
      value={value}
      onValueChange={(value) => onValueChange(value as string)}
      disabled={disabled}
    >
      <SelectTrigger className="h-9 rounded text-xs">
        <SelectValue placeholder={placeholder || `Pilih ${label}`} />
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
  </Field>
);

const InfoPanel = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`rounded border border-slate-200 bg-slate-50 p-3 ${className}`}
  >
    {children}
  </div>
);

export const TitikPatroliView: React.FC<TitikPatroliViewProps> = ({
  selectedSite,
  checkpoints: propCheckpoints,
  nfcTags,
  onUpdateCheckpoints,
  onUnassignNfc,
  onAssignNfc,
}) => {
  const [localCheckpoints, setLocalCheckpoints] =
    useState<CheckpointItem[]>(CHECKPOINTS);

  const checkpoints = propCheckpoints ?? localCheckpoints;

  const setCheckpointsList = (
    updater: (prev: CheckpointItem[]) => CheckpointItem[],
  ) => {
    if (onUpdateCheckpoints) {
      onUpdateCheckpoints(updater(checkpoints));
    } else {
      setLocalCheckpoints(updater);
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTagType, setSelectedTagType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Dialog states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCheckpoint, setEditingCheckpoint] =
    useState<CheckpointItem | null>(null);
  const [deletingCheckpoint, setDeletingCheckpoint] =
    useState<CheckpointItem | null>(null);
  const [unassigningCheckpoint, setUnassigningCheckpoint] =
    useState<CheckpointItem | null>(null);
  const [assigningCheckpoint, setAssigningCheckpoint] =
    useState<CheckpointItem | null>(null);

  // Assign NFC
  const [assignMode, setAssignMode] = useState<"existing" | "custom">(
    "existing",
  );
  const [selectedTagUid, setSelectedTagUid] = useState("");
  const [customTagUid, setCustomTagUid] = useState("04:8A:2B:3C:4D:5E:6F");
  const [customTagType, setCustomTagType] =
    useState<CheckpointItem["tagType"]>("NFC NTAG213");

  // Scan simulation
  const [simulatingItem, setSimulatingItem] = useState<CheckpointItem | null>(
    null,
  );
  const [simulatedOfficer, setSimulatedOfficer] = useState(OFFICERS[0]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New checkpoint form
  const [newCheckpoint, setNewCheckpoint] = useState({
    name: "",
    siteId: "site-a",
    zoneFloor: "",
    tagType: "NFC NTAG213" as CheckpointItem["tagType"],
    tagUid: generateUid(),
    coordinates: "-6.22415, 106.80931",
    frequency: "Setiap 1 Jam",
  });

  const unassignedTags = (nfcTags || []).filter(
    (tag) =>
      !tag.linkedCheckpointId ||
      tag.linkedCheckpointId === "-" ||
      tag.status === "Belum Ditautkan",
  );

  const filteredCheckpoints = checkpoints.filter((cp) => {
    if (selectedSite !== "all" && cp.siteId !== selectedSite) {
      return false;
    }

    if (selectedTagType !== "all") {
      if (selectedTagType === "unassigned") {
        if (
          cp.tagUid &&
          cp.tagUid !== "-" &&
          cp.tagType !== "Tanpa Tag (Unassigned)"
        ) {
          return false;
        }
      } else if (cp.tagType !== selectedTagType) {
        return false;
      }
    }

    if (selectedStatus !== "all" && cp.status !== selectedStatus) {
      return false;
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();

      const matches =
        cp.id.toLowerCase().includes(query) ||
        cp.name.toLowerCase().includes(query) ||
        cp.zoneFloor.toLowerCase().includes(query) ||
        cp.tagUid.toLowerCase().includes(query) ||
        cp.siteName.toLowerCase().includes(query);

      if (!matches) return false;
    }

    return true;
  });

  const showToast = (message: string, duration = 3500) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), duration);
  };

  const handleSimulateScan = (e: React.FormEvent) => {
    e.preventDefault();

    if (!simulatingItem) return;

    if (
      !simulatingItem.tagUid ||
      simulatingItem.tagUid === "-" ||
      simulatingItem.tagType === "Tanpa Tag (Unassigned)"
    ) {
      alert(
        "Gagal: Checkpoint ini belum terhubung dengan Tag NFC fisik! Harap gunakan fitur Tautkan Tag terlebih dahulu.",
      );
      return;
    }

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")} WIB`;

    setCheckpointsList((prev) =>
      prev.map((checkpoint) =>
        checkpoint.id === simulatingItem.id
          ? {
              ...checkpoint,
              lastScanned: timeStr,
              lastGuard: simulatedOfficer,
              status: "Aktif Normal",
            }
          : checkpoint,
      ),
    );

    showToast(
      `Checkpoint ${simulatingItem.id} (${simulatingItem.name}) berhasil dipindai oleh ${simulatedOfficer} pada ${timeStr}!`,
    );

    setSimulatingItem(null);
  };

  const handleCreateCheckpoint = (e: React.FormEvent) => {
    e.preventDefault();

    const siteObj =
      SITES.find((site) => site.id === newCheckpoint.siteId) ?? SITES[0];

    if (!siteObj) return;

    const newId = `CP-${siteObj.code}-${String(checkpoints.length + 1).padStart(
      3,
      "0",
    )}`;

    const created: CheckpointItem = {
      id: newId,
      name: newCheckpoint.name,
      siteId: newCheckpoint.siteId,
      siteName: siteObj.name.replace(/^Site [A-D] - /, ""),
      zoneFloor: newCheckpoint.zoneFloor || "Lantai 1 - Koridor Utama",
      tagType: newCheckpoint.tagType,
      tagUid: newCheckpoint.tagUid,
      coordinates: newCheckpoint.coordinates,
      frequency: newCheckpoint.frequency,
      status: "Aktif Normal",
      lastScanned: "Belum pernah",
      lastGuard: "-",
      mapX: Math.floor(25 + Math.random() * 50),
      mapY: Math.floor(25 + Math.random() * 50),
    };

    setCheckpointsList((prev) => [created, ...prev]);
    setIsAddModalOpen(false);

    showToast(
      `Titik checkpoint baru ${newId} (${created.name}) berhasil didaftarkan!`,
    );
  };

  const handleSaveEditCheckpoint = (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingCheckpoint) return;

    setCheckpointsList((prev) =>
      prev.map((checkpoint) =>
        checkpoint.id === editingCheckpoint.id ? editingCheckpoint : checkpoint,
      ),
    );

    const updatedName = editingCheckpoint.name;

    setEditingCheckpoint(null);
    showToast(`Data checkpoint ${updatedName} berhasil diperbarui!`);
  };

  const handleDeleteCheckpoint = () => {
    if (!deletingCheckpoint) return;

    setCheckpointsList((prev) =>
      prev.filter((checkpoint) => checkpoint.id !== deletingCheckpoint.id),
    );

    showToast(
      `Titik checkpoint ${deletingCheckpoint.id} (${deletingCheckpoint.name}) berhasil dihapus.`,
    );

    setDeletingCheckpoint(null);
  };

  const handleConfirmUnassign = () => {
    if (!unassigningCheckpoint) return;

    const checkpoint = unassigningCheckpoint;
    const previousTagUid = checkpoint.tagUid;

    if (onUnassignNfc) {
      onUnassignNfc(checkpoint.id);
    } else {
      setCheckpointsList((prev) =>
        prev.map((item) =>
          item.id === checkpoint.id
            ? {
                ...item,
                tagUid: "",
                tagType: "Tanpa Tag (Unassigned)",
                status: "Belum Terhubung Tag",
              }
            : item,
        ),
      );
    }

    setUnassigningCheckpoint(null);

    showToast(
      `Koneksi Tag NFC (${previousTagUid}) berhasil dilepas dari Checkpoint ${checkpoint.name}!`,
      4000,
    );
  };

  const handleConfirmAssign = (e: React.FormEvent) => {
    e.preventDefault();

    if (!assigningCheckpoint) return;

    const checkpoint = assigningCheckpoint;
    let tagToBind = "";

    if (assignMode === "existing") {
      tagToBind = selectedTagUid || unassignedTags[0]?.uid || "";

      if (!tagToBind) {
        alert("Tidak ada tag unassigned yang dipilih!");
        return;
      }
    } else {
      if (!isValidNfcUid(customTagUid)) {
        alert(
          "Format UID tidak valid! Gunakan format hex seperti 04:A2:3B:5F:8C:1D:9E",
        );
        return;
      }

      tagToBind = customTagUid.toUpperCase();
    }

    if (onAssignNfc) {
      onAssignNfc(checkpoint.id, tagToBind);
    } else {
      setCheckpointsList((prev) =>
        prev.map((item) =>
          item.id === checkpoint.id
            ? {
                ...item,
                tagUid: tagToBind,
                tagType:
                  assignMode === "existing" ? "NFC NTAG213" : customTagType,
                status: "Aktif Normal",
              }
            : item,
        ),
      );
    }

    setAssigningCheckpoint(null);

    showToast(
      `Tag NFC ${tagToBind} berhasil ditautkan ke Checkpoint ${checkpoint.name}!`,
      4000,
    );
  };

  const openAssignDialog = (checkpoint: CheckpointItem) => {
    setAssigningCheckpoint(checkpoint);
    setAssignMode("existing");
    setSelectedTagUid(unassignedTags[0]?.uid || "");
  };

  const generateNewUid = () => {
    setNewCheckpoint((prev) => ({
      ...prev,
      tagUid: generateUid(),
    }));
  };

  const generateCustomUid = () => {
    setCustomTagUid(generateUid());
  };

  const connectedCount = checkpoints.filter(
    (checkpoint) =>
      checkpoint.tagUid &&
      checkpoint.tagUid !== "-" &&
      checkpoint.tagType !== "Tanpa Tag (Unassigned)",
  ).length;

  const unassignedCount = checkpoints.length - connectedCount;

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toastMessage && (
        <div className="flex items-center justify-between gap-3 rounded border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 rounded text-emerald-700 hover:bg-emerald-100"
            onClick={() => setToastMessage(null)}
          >
            <X className="size-4" />
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Manajemen Titik Patroli
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Kelola checkpoint, tag NFC/RFID, dan monitoring titik patroli.
          </p>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="h-9 rounded bg-blue-600 text-xs hover:bg-blue-700"
        >
          <Plus className="mr-1.5 size-4" />
          Tambah Checkpoint
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded border border-slate-200 bg-white p-3 md:flex-row md:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari ID, nama titik, zona, UID..."
            className="h-9 rounded pl-9 text-xs"
          />
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:w-auto">
          <Select
            value={selectedTagType}
            onValueChange={(value) => setSelectedTagType(value as string)}
          >
            <SelectTrigger className="h-9 w-full rounded text-xs md:w-48">
              <SelectValue placeholder="Semua Tipe Tag" />
            </SelectTrigger>
            <SelectContent className="rounded">
              <SelectItem value="all">Semua Tipe Tag</SelectItem>
              {TAG_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
              <SelectItem value="unassigned">Belum Terhubung</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={selectedStatus}
            onValueChange={(value) => setSelectedStatus(value as string)}
          >
            <SelectTrigger className="h-9 w-full rounded text-xs md:w-48">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent className="rounded">
              <SelectItem value="all">Semua Status</SelectItem>
              {CHECKPOINT_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="shrink-0 text-xs text-slate-500">
          Menampilkan{" "}
          <span className="font-semibold text-slate-900">
            {filteredCheckpoints.length}
          </span>{" "}
          dari {checkpoints.length} titik
        </p>
      </div>

      {/* Checkpoint Table */}
      <div className="overflow-hidden rounded border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="whitespace-nowrap text-xs">
                  ID Checkpoint
                </TableHead>
                <TableHead className="whitespace-nowrap text-xs">
                  Nama Titik
                </TableHead>
                <TableHead className="whitespace-nowrap text-xs">
                  Site / Zona
                </TableHead>
                <TableHead className="whitespace-nowrap text-xs">
                  Tag NFC / RFID
                </TableHead>
                <TableHead className="whitespace-nowrap text-xs">
                  Koordinat
                </TableHead>
                <TableHead className="whitespace-nowrap text-xs">
                  Frekuensi
                </TableHead>
                <TableHead className="whitespace-nowrap text-center text-xs">
                  Status
                </TableHead>
                <TableHead className="whitespace-nowrap text-right text-xs">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredCheckpoints.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-32 text-center text-xs text-slate-500"
                  >
                    Tidak ada checkpoint yang sesuai dengan pencarian.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCheckpoints.map((cp) => {
                  const hasTag = Boolean(
                    cp.tagUid &&
                    cp.tagUid !== "-" &&
                    cp.tagType !== "Tanpa Tag (Unassigned)",
                  );

                  return (
                    <TableRow key={cp.id} className="text-xs">
                      <TableCell className="whitespace-nowrap font-mono font-semibold text-blue-600">
                        {cp.id}
                      </TableCell>

                      <TableCell className="min-w-48">
                        <p className="font-medium text-slate-900">{cp.name}</p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          Scan terakhir: {cp.lastScanned}
                          {cp.lastGuard !== "-" && ` · ${cp.lastGuard}`}
                        </p>
                      </TableCell>

                      <TableCell className="min-w-36">
                        <p className="font-medium text-slate-800">
                          {cp.siteName}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {cp.zoneFloor}
                        </p>
                      </TableCell>

                      <TableCell className="min-w-40">
                        {hasTag ? (
                          <div>
                            <div className="flex items-center gap-1.5 font-mono font-medium text-blue-600">
                              <Contact className="size-3.5" />
                              {cp.tagUid}
                            </div>
                            <p className="mt-1 text-[11px] text-slate-500">
                              {cp.tagType}
                            </p>
                          </div>
                        ) : (
                          <Badge
                            variant="outline"
                            className="rounded border-amber-200 bg-amber-50 text-[10px] text-amber-700"
                          >
                            <Link2Off className="mr-1 size-3" />
                            Belum Ditautkan
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="whitespace-nowrap font-mono text-[11px] text-slate-500">
                        {cp.coordinates}
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-slate-600">
                        {cp.frequency}
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={`rounded text-[10px] font-medium ${getStatusClass(cp.status)}`}
                        >
                          {cp.status}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!hasTag}
                            onClick={() => setSimulatingItem(cp)}
                            className="h-7 rounded px-2 text-[11px]"
                            title={
                              hasTag ? "Simulasi scan" : "Tag belum ditautkan"
                            }
                          >
                            <ScanLine className="mr-1 size-3.5" />
                            Scan
                          </Button>

                          {hasTag ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setUnassigningCheckpoint(cp)}
                              className="h-7 rounded border-amber-200 px-2 text-[11px] text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                            >
                              <Link2Off className="mr-1 size-3.5" />
                              Lepas
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openAssignDialog(cp)}
                              className="h-7 rounded border-blue-200 px-2 text-[11px] text-blue-600 hover:bg-blue-50"
                            >
                              <Link className="mr-1 size-3.5" />
                              Tautkan
                            </Button>
                          )}

                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => setEditingCheckpoint({ ...cp })}
                            className="size-7 rounded"
                            title="Edit checkpoint"
                          >
                            <Edit className="size-3.5" />
                          </Button>

                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => setDeletingCheckpoint(cp)}
                            className="size-7 rounded border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            title="Hapus checkpoint"
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

      {/* Dialog: Add Checkpoint */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto rounded">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <MapPin className="size-5 text-blue-600" />
              Tambah Checkpoint
            </DialogTitle>
            <DialogDescription className="text-xs">
              Daftarkan titik inspeksi dan informasi tag perangkat.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCheckpoint} className="space-y-4">
            <Field label="Nama Titik Inspeksi">
              <Input
                required
                value={newCheckpoint.name}
                onChange={(e) =>
                  setNewCheckpoint((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="Contoh: Tangga Darurat Timur Lt. 12"
                className="h-9 rounded text-xs"
              />
            </Field>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <SelectField
                label="Site / Wilayah"
                value={newCheckpoint.siteId}
                onValueChange={(value) =>
                  setNewCheckpoint((prev) => ({
                    ...prev,
                    siteId: value,
                  }))
                }
                options={SITES.filter((site) => site.id !== "all").map(
                  (site) => ({
                    label: site.name,
                    value: site.id,
                  }),
                )}
              />

              <Field label="Zona / Lantai">
                <Input
                  required
                  value={newCheckpoint.zoneFloor}
                  onChange={(e) =>
                    setNewCheckpoint((prev) => ({
                      ...prev,
                      zoneFloor: e.target.value,
                    }))
                  }
                  placeholder="Contoh: Koridor Timur Lt. 12"
                  className="h-9 rounded text-xs"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <SelectField
                label="Tipe Tag Perangkat"
                value={newCheckpoint.tagType}
                onValueChange={(value) =>
                  setNewCheckpoint((prev) => ({
                    ...prev,
                    tagType: value as CheckpointItem["tagType"],
                  }))
                }
                options={TAG_TYPES.map((type) => ({
                  label: type,
                  value: type,
                }))}
              />

              <Field label="UID Tag">
                <div className="flex gap-2">
                  <Input
                    required
                    value={newCheckpoint.tagUid}
                    onChange={(e) =>
                      setNewCheckpoint((prev) => ({
                        ...prev,
                        tagUid: e.target.value,
                      }))
                    }
                    className="h-9 min-w-0 rounded font-mono text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={generateNewUid}
                    className="size-9 shrink-0 rounded"
                    title="Acak UID"
                  >
                    <RefreshCw className="size-3.5" />
                  </Button>
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Koordinat GPS">
                <Input
                  required
                  value={newCheckpoint.coordinates}
                  onChange={(e) =>
                    setNewCheckpoint((prev) => ({
                      ...prev,
                      coordinates: e.target.value,
                    }))
                  }
                  className="h-9 rounded font-mono text-xs"
                />
              </Field>

              <SelectField
                label="Frekuensi Kunjungan"
                value={newCheckpoint.frequency}
                onValueChange={(value) =>
                  setNewCheckpoint((prev) => ({
                    ...prev,
                    frequency: value,
                  }))
                }
                options={FREQUENCIES.map((frequency) => ({
                  label: frequency,
                  value: frequency,
                }))}
              />
            </div>

            <Separator />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded"
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="rounded bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="mr-1.5 size-4" />
                Daftarkan Checkpoint
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Edit Checkpoint */}
      <Dialog
        open={!!editingCheckpoint}
        onOpenChange={(open) => {
          if (!open) setEditingCheckpoint(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto rounded">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Edit className="size-5 text-blue-600" />
              Edit Checkpoint
            </DialogTitle>
            <DialogDescription className="text-xs">
              {editingCheckpoint?.id}
            </DialogDescription>
          </DialogHeader>

          {editingCheckpoint && (
            <form onSubmit={handleSaveEditCheckpoint} className="space-y-4">
              <Field label="Nama Titik Inspeksi">
                <Input
                  required
                  value={editingCheckpoint.name}
                  onChange={(e) =>
                    setEditingCheckpoint({
                      ...editingCheckpoint,
                      name: e.target.value,
                    })
                  }
                  className="h-9 rounded text-xs"
                />
              </Field>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Zona / Lantai">
                  <Input
                    required
                    value={editingCheckpoint.zoneFloor}
                    onChange={(e) =>
                      setEditingCheckpoint({
                        ...editingCheckpoint,
                        zoneFloor: e.target.value,
                      })
                    }
                    className="h-9 rounded text-xs"
                  />
                </Field>

                <SelectField
                  label="Status Operasional"
                  value={editingCheckpoint.status}
                  onValueChange={(value) =>
                    setEditingCheckpoint({
                      ...editingCheckpoint,
                      status: value as CheckpointItem["status"],
                    })
                  }
                  options={CHECKPOINT_STATUSES.map((status) => ({
                    label: status,
                    value: status,
                  }))}
                />
              </div>

              <InfoPanel className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-700">
                    Koneksi Tag NFC
                  </p>

                  {editingCheckpoint.tagUid &&
                    editingCheckpoint.tagUid !== "-" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setEditingCheckpoint({
                            ...editingCheckpoint,
                            tagUid: "",
                            tagType: "Tanpa Tag (Unassigned)",
                            status: "Belum Terhubung Tag",
                          })
                        }
                        className="h-7 rounded px-2 text-xs text-amber-700 hover:bg-amber-50"
                      >
                        <Link2Off className="mr-1 size-3.5" />
                        Lepas Tag
                      </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <SelectField
                    label="Tipe Tag"
                    value={editingCheckpoint.tagType}
                    onValueChange={(value) =>
                      setEditingCheckpoint({
                        ...editingCheckpoint,
                        tagType: value as CheckpointItem["tagType"],
                      })
                    }
                    options={[
                      ...TAG_TYPES.map((type) => ({
                        label: type,
                        value: type,
                      })),
                      {
                        label: "Tanpa Tag (Unassigned)",
                        value: "Tanpa Tag (Unassigned)",
                      },
                    ]}
                  />

                  <Field label="UID Tag Fisik">
                    <Input
                      value={editingCheckpoint.tagUid}
                      onChange={(e) =>
                        setEditingCheckpoint({
                          ...editingCheckpoint,
                          tagUid: e.target.value,
                        })
                      }
                      placeholder="04:XX:XX:XX:XX:XX:XX"
                      className="h-9 rounded font-mono text-xs"
                    />
                  </Field>
                </div>
              </InfoPanel>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Koordinat GPS">
                  <Input
                    required
                    value={editingCheckpoint.coordinates}
                    onChange={(e) =>
                      setEditingCheckpoint({
                        ...editingCheckpoint,
                        coordinates: e.target.value,
                      })
                    }
                    className="h-9 rounded font-mono text-xs"
                  />
                </Field>

                <SelectField
                  label="Frekuensi Inspeksi"
                  value={editingCheckpoint.frequency}
                  onValueChange={(value) =>
                    setEditingCheckpoint({
                      ...editingCheckpoint,
                      frequency: value,
                    })
                  }
                  options={FREQUENCIES.map((frequency) => ({
                    label: frequency,
                    value: frequency,
                  }))}
                />
              </div>

              <Separator />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingCheckpoint(null)}
                  className="rounded"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="rounded bg-blue-600 hover:bg-blue-700"
                >
                  Simpan Perubahan
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Assign NFC */}
      <Dialog
        open={!!assigningCheckpoint}
        onOpenChange={(open) => {
          if (!open) setAssigningCheckpoint(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Link className="size-5 text-blue-600" />
              Tautkan Tag NFC
            </DialogTitle>
            <DialogDescription className="text-xs">
              Hubungkan tag fisik dengan titik checkpoint.
            </DialogDescription>
          </DialogHeader>

          {assigningCheckpoint && (
            <form onSubmit={handleConfirmAssign} className="space-y-4">
              <InfoPanel>
                <p className="text-[11px] text-slate-500">Checkpoint Target</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {assigningCheckpoint.id} - {assigningCheckpoint.name}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {assigningCheckpoint.siteName} ·{" "}
                  {assigningCheckpoint.zoneFloor}
                </p>
              </InfoPanel>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-600">
                  Metode Penautan
                </Label>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAssignMode("existing")}
                    className={`h-auto flex-col items-start rounded p-3 ${
                      assignMode === "existing"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : ""
                    }`}
                  >
                    <span className="text-xs font-semibold">Tag Tersedia</span>
                    <span className="text-[10px] font-normal text-slate-500">
                      {unassignedTags.length} tag tersedia
                    </span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAssignMode("custom")}
                    className={`h-auto flex-col items-start rounded p-3 ${
                      assignMode === "custom"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : ""
                    }`}
                  >
                    <span className="text-xs font-semibold">UID Baru</span>
                    <span className="text-[10px] font-normal text-slate-500">
                      Input UID manual
                    </span>
                  </Button>
                </div>
              </div>

              {assignMode === "existing" ? (
                unassignedTags.length === 0 ? (
                  <InfoPanel className="border-amber-200 bg-amber-50 text-xs text-amber-800">
                    Semua tag sudah tertaut. Gunakan metode UID Baru untuk
                    mendaftarkan tag.
                  </InfoPanel>
                ) : (
                  <SelectField
                    label="Pilih Tag NFC"
                    value={selectedTagUid || unassignedTags[0].uid}
                    onValueChange={setSelectedTagUid}
                    options={unassignedTags.map((tag) => ({
                      value: tag.uid,
                      label: `${tag.uid} (${tag.type} - ${tag.siteName})`,
                    }))}
                  />
                )
              ) : (
                <div className="space-y-3">
                  <Field label="UID Tag Fisik">
                    <div className="flex gap-2">
                      <Input
                        required
                        value={customTagUid}
                        onChange={(e) => setCustomTagUid(e.target.value)}
                        className="h-9 rounded font-mono text-xs"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={generateCustomUid}
                        className="size-9 shrink-0 rounded"
                        title="Acak UID"
                      >
                        <RefreshCw className="size-4" />
                      </Button>
                    </div>
                  </Field>

                  <SelectField
                    label="Tipe Chip Hardware"
                    value={customTagType}
                    onValueChange={(value) =>
                      setCustomTagType(value as CheckpointItem["tagType"])
                    }
                    options={TAG_TYPES.map((type) => ({
                      value: type,
                      label: type,
                    }))}
                  />
                </div>
              )}

              <Separator />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAssigningCheckpoint(null)}
                  className="rounded"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={
                    assignMode === "existing" && unassignedTags.length === 0
                  }
                  className="rounded bg-blue-600 hover:bg-blue-700"
                >
                  <Link className="mr-1.5 size-4" />
                  Tautkan Tag
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Unassign NFC */}
      <Dialog
        open={!!unassigningCheckpoint}
        onOpenChange={(open) => {
          if (!open) setUnassigningCheckpoint(null);
        }}
      >
        <DialogContent className="max-w-md rounded">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Link2Off className="size-5 text-amber-600" />
              Lepas Koneksi Tag NFC
            </DialogTitle>
            <DialogDescription className="text-xs">
              Pastikan Anda ingin melepas tag dari checkpoint ini.
            </DialogDescription>
          </DialogHeader>

          {unassigningCheckpoint && (
            <div className="space-y-4">
              <InfoPanel className="space-y-3">
                <div>
                  <p className="text-[11px] text-slate-500">Titik Checkpoint</p>
                  <p className="mt-1 text-xs font-semibold text-slate-900">
                    {unassigningCheckpoint.id} - {unassigningCheckpoint.name}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-slate-500">Site dan Zona</p>
                  <p className="mt-1 text-xs text-slate-700">
                    {unassigningCheckpoint.siteName} ·{" "}
                    {unassigningCheckpoint.zoneFloor}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-slate-500">UID Tag Saat Ini</p>
                  <p className="mt-1 font-mono text-xs font-semibold text-blue-600">
                    {unassigningCheckpoint.tagUid}
                  </p>
                </div>
              </InfoPanel>

              <div className="rounded border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-800">
                  <AlertTriangle className="size-4" />
                  Dampak Operasional
                </div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-[11px] text-amber-800">
                  <li>Tag akan dilepas dan kembali menjadi belum ditautkan.</li>
                  <li>
                    Checkpoint tidak dapat dipindai sampai tag baru ditautkan.
                  </li>
                </ul>
              </div>

              <Separator />

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setUnassigningCheckpoint(null)}
                  className="rounded"
                >
                  Batal
                </Button>
                <Button
                  onClick={handleConfirmUnassign}
                  className="rounded bg-amber-600 hover:bg-amber-700"
                >
                  <Link2Off className="mr-1.5 size-4" />
                  Lepas Tag
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Scan Simulation */}
      <Dialog
        open={!!simulatingItem}
        onOpenChange={(open) => {
          if (!open) setSimulatingItem(null);
        }}
      >
        <DialogContent className="max-w-md rounded">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <ScanLine className="size-5 text-blue-600" />
              Simulasi Scan NFC
            </DialogTitle>
            <DialogDescription className="text-xs">
              Simulasikan pemindaian checkpoint oleh petugas lapangan.
            </DialogDescription>
          </DialogHeader>

          {simulatingItem && (
            <form onSubmit={handleSimulateScan} className="space-y-4">
              <InfoPanel className="space-y-3">
                <div className="flex justify-between gap-3">
                  <span className="text-xs text-slate-500">ID</span>
                  <span className="font-mono text-xs font-semibold text-blue-600">
                    {simulatingItem.id}
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-xs text-slate-500">Nama Titik</span>
                  <span className="text-right text-xs font-medium text-slate-900">
                    {simulatingItem.name}
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-xs text-slate-500">Tipe Tag</span>
                  <span className="text-xs text-slate-700">
                    {simulatingItem.tagType}
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-xs text-slate-500">UID</span>
                  <span className="font-mono text-xs text-slate-900">
                    {simulatingItem.tagUid}
                  </span>
                </div>
              </InfoPanel>

              <SelectField
                label="Petugas Pemindai"
                value={simulatedOfficer}
                onValueChange={setSimulatedOfficer}
                options={OFFICERS.map((officer) => ({
                  value: officer,
                  label: officer,
                }))}
              />

              <Separator />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSimulatingItem(null)}
                  className="rounded"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="rounded bg-blue-600 hover:bg-blue-700"
                >
                  <ScanLine className="mr-1.5 size-4" />
                  Simulasikan Scan
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Alert Dialog: Delete */}
      <AlertDialog
        open={!!deletingCheckpoint}
        onOpenChange={(open) => {
          if (!open) setDeletingCheckpoint(null);
        }}
      >
        <AlertDialogContent className="rounded">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-5 text-rose-600" />
              Hapus Checkpoint?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Apakah Anda yakin ingin menghapus titik checkpoint ini secara
              permanen?
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deletingCheckpoint && (
            <div className="space-y-3">
              <InfoPanel>
                <p className="font-mono text-xs font-semibold text-blue-600">
                  {deletingCheckpoint.id}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {deletingCheckpoint.name}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {deletingCheckpoint.siteName} · {deletingCheckpoint.zoneFloor}
                </p>
              </InfoPanel>

              <div className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                Menghapus checkpoint dapat memengaruhi rute patroli terjadwal
                yang menggunakan titik ini.
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel className="rounded">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCheckpoint}
              className="rounded bg-rose-600 hover:bg-rose-700"
            >
              <Trash2 className="mr-1.5 size-4" />
              Hapus Checkpoint
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
