import React from "react";

import {
  AlertTriangle,
  Link2,
  Link2Off,
  Pencil,
  Plus,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Unlink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
} from "@/components/ui/select";
import { NfcTagResponse } from "@/src/types/nfc/nfc";

export interface CheckpointOption {
  id: string;
  code: string;
  name: string;
  siteId: string;
  siteName?: string;
  status?: string;
}

export interface NfcAssignment {
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

export type NfcTagItem = NfcTagResponse & {
  assignments?: NfcAssignment[];
  _count?: {
    assignments: number;
    patrols: number;
  };
};

export interface SelectOption {
  value: string;
  label: string;
}

export const getActiveAssignment = (
  tag: NfcTagItem,
): NfcAssignment | undefined => {
  return tag.assignments?.find((assignment) => {
    const activeStatus = !assignment.status || assignment.status === "ACTIVE";

    return activeStatus && !assignment.unassignedAt;
  });
};

export const isTagAssigned = (tag: NfcTagItem) => {
  return Boolean(getActiveAssignment(tag));
};

export const getAssignmentPatrolPointId = (tag: NfcTagItem) => {
  const assignment = getActiveAssignment(tag);

  return assignment?.patrolPointId ?? assignment?.patrolPoint?.id ?? "";
};

export const getAssignmentCheckpointName = (tag: NfcTagItem) => {
  const assignment = getActiveAssignment(tag);

  if (!assignment) return "";

  return assignment.patrolPoint?.name ?? "Patrol point";
};

export const getAssignmentCheckpointCode = (tag: NfcTagItem) => {
  const assignment = getActiveAssignment(tag);

  return assignment?.patrolPoint?.code ?? "";
};

export const getStatusLabel = (status: string) => {
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

export const formatDate = (date?: string) => {
  if (!date) return "-";

  return new Date(date).toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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

interface TagNfcDialogsProps {
  // Selected tags
  diagnosingTag: NfcTagItem | null;
  editingTag: NfcTagItem | null;
  deletingTag: NfcTagItem | null;
  unassigningTag: NfcTagItem | null;
  assigningTag: NfcTagItem | null;
  damagingTag: NfcTagItem | null;
  losingTag: NfcTagItem | null;
  replacingTag: NfcTagItem | null;

  // Register
  isRegisterModalOpen: boolean;
  newTagUid: string;
  newTagLabel: string;
  newTagCheckpointId: string;

  // Form
  editLabel: string;
  formError: string;

  // Select
  selectedCheckpointToAssign: string;
  replacementNfcId: string;
  checkpointOptions: SelectOption[];
  replacementOptions: SelectOption[];
  availableCheckpointsCount: number;

  // Loading
  createPending: boolean;
  assignPending: boolean;
  unassignPending: boolean;
  updatePending: boolean;
  deletePending: boolean;
  activatePending: boolean;
  damagedPending: boolean;
  lostPending: boolean;
  replacePending: boolean;

  // Open/close handlers
  setDiagnosingTag: (tag: NfcTagItem | null) => void;
  setEditingTag: (tag: NfcTagItem | null) => void;
  setDeletingTag: (tag: NfcTagItem | null) => void;
  setUnassigningTag: (tag: NfcTagItem | null) => void;
  setAssigningTag: (tag: NfcTagItem | null) => void;
  setDamagingTag: (tag: NfcTagItem | null) => void;
  setLosingTag: (tag: NfcTagItem | null) => void;
  setReplacingTag: (tag: NfcTagItem | null) => void;
  setIsRegisterModalOpen: (open: boolean) => void;

  // Form setters
  setNewTagUid: (value: string) => void;
  setNewTagLabel: (value: string) => void;
  setNewTagCheckpointId: (value: string) => void;
  setEditLabel: (value: string) => void;
  setFormError: (value: string) => void;
  setSelectedCheckpointToAssign: (value: string) => void;
  setReplacementNfcId: (value: string) => void;

  // Actions
  onRegister: (event: React.FormEvent<HTMLFormElement>) => void;
  onEdit: (event: React.FormEvent<HTMLFormElement>) => void;
  onDelete: () => void;
  onAssign: (event: React.FormEvent<HTMLFormElement>) => void;
  onUnassign: () => void;
  onDamaged: () => void;
  onLost: () => void;
  onReplace: () => void;
  onGenerateUid: () => void;
}

export const UnassignNfcDialog: React.FC<{
  tag: NfcTagItem | null;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}> = ({ tag, pending, onOpenChange, onConfirm }) => (
  <Dialog open={Boolean(tag)} onOpenChange={(open) => onOpenChange(open)}>
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

      {tag && (
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Apakah Anda yakin ingin melepas hubungan checkpoint dari Tag NFC
            berikut?
          </p>

          <InfoPanel>
            <InfoRow
              label="UID Tag Hardware"
              value={<span className="font-mono text-blue-600">{tag.uid}</span>}
            />

            <div className="border-t border-slate-200 pt-2">
              <InfoRow
                label="Checkpoint Terhubung"
                value={getAssignmentCheckpointName(tag)}
              />

              <div className="mt-1 text-right font-mono text-[11px] text-blue-600">
                {getAssignmentCheckpointCode(tag)}
              </div>
            </div>
          </InfoPanel>

          <div className="border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-800 rounded">
            <div className="mb-1 flex items-center gap-1.5 font-semibold">
              <AlertTriangle className="size-3.5" />
              Catatan Sistem
            </div>
            Setelah dilepas, NFC tidak lagi terhubung dengan checkpoint tersebut
            dan dapat ditautkan kembali.
          </div>
        </div>
      )}

      <DialogFooter>
        <Button
          variant="outline"
          className="rounded text-xs"
          onClick={() => onOpenChange(false)}
        >
          Batal
        </Button>

        <Button
          className="rounded bg-rose-600 text-xs hover:bg-rose-700"
          onClick={onConfirm}
          disabled={pending}
        >
          {pending ? (
            <RefreshCw className="mr-1.5 size-3.5 animate-spin" />
          ) : (
            <Unlink className="mr-1.5 size-3.5" />
          )}
          Lepas Checkpoint
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export const AssignNfcDialog: React.FC<{
  tag: NfcTagItem | null;
  selectedCheckpoint: string;
  options: SelectOption[];
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onCheckpointChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}> = ({
  tag,
  selectedCheckpoint,
  options,
  pending,
  onOpenChange,
  onCheckpointChange,
  onSubmit,
}) => (
  <Dialog open={Boolean(tag)} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md rounded">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-sm">
          <Link2 className="size-4 text-blue-600" />
          Tautkan Tag ke Checkpoint
        </DialogTitle>

        <DialogDescription className="text-xs">
          Pilih checkpoint tujuan untuk tag NFC ini.
        </DialogDescription>
      </DialogHeader>

      {tag && (
        <form onSubmit={onSubmit} className="space-y-4">
          <InfoPanel>
            <p className="text-[11px] text-slate-500">Tag NFC Terpilih</p>

            <p className="font-mono text-sm font-bold text-blue-600">
              {tag.uid}
            </p>

            {tag.label && (
              <p className="text-[11px] text-slate-600">{tag.label}</p>
            )}
          </InfoPanel>

          <SelectField
            label="Titik Checkpoint Patroli"
            value={selectedCheckpoint}
            onValueChange={onCheckpointChange}
            options={options}
            placeholder="Pilih checkpoint"
          />

          {options.length === 0 && (
            <p className="text-xs text-rose-600">
              Belum ada checkpoint yang tersedia.
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded text-xs"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>

            <Button
              type="submit"
              disabled={!selectedCheckpoint || options.length === 0 || pending}
              className="rounded bg-blue-600 text-xs hover:bg-blue-700"
            >
              {pending && (
                <RefreshCw className="mr-1.5 size-3.5 animate-spin" />
              )}
              <Link2 className="mr-1.5 size-3.5" />
              Tautkan Checkpoint
            </Button>
          </DialogFooter>
        </form>
      )}
    </DialogContent>
  </Dialog>
);

export const DamagedNfcDialog: React.FC<{
  tag: NfcTagItem | null;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}> = ({ tag, pending, onOpenChange, onConfirm }) => (
  <AlertDialog open={Boolean(tag)} onOpenChange={onOpenChange}>
    <AlertDialogContent className="max-w-md rounded">
      <AlertDialogHeader>
        <AlertDialogTitle className="flex items-center gap-2 text-sm">
          <AlertTriangle className="size-4 text-amber-600" />
          Tandai NFC Rusak
        </AlertDialogTitle>

        <AlertDialogDescription className="text-xs">
          Apakah Anda yakin ingin mengubah status NFC ini menjadi rusak?
        </AlertDialogDescription>
      </AlertDialogHeader>

      {tag && (
        <InfoPanel>
          <InfoRow
            label="UID Tag"
            value={<span className="font-mono text-blue-600">{tag.uid}</span>}
          />

          <InfoRow label="Label" value={tag.label || "-"} />

          <InfoRow label="Status Saat Ini" value={getStatusLabel(tag.status)} />
        </InfoPanel>
      )}

      <AlertDialogFooter>
        <AlertDialogCancel className="rounded text-xs">Batal</AlertDialogCancel>

        <AlertDialogAction
          onClick={onConfirm}
          disabled={pending}
          className="rounded bg-amber-600 text-xs hover:bg-amber-700"
        >
          {pending && <RefreshCw className="mr-1.5 size-3.5 animate-spin" />}
          Tandai Rusak
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export const LostNfcDialog: React.FC<{
  tag: NfcTagItem | null;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}> = ({ tag, pending, onOpenChange, onConfirm }) => (
  <AlertDialog open={Boolean(tag)} onOpenChange={onOpenChange}>
    <AlertDialogContent className="max-w-md rounded">
      <AlertDialogHeader>
        <AlertDialogTitle className="flex items-center gap-2 text-sm">
          <AlertTriangle className="size-4 text-rose-600" />
          Tandai NFC Hilang
        </AlertDialogTitle>

        <AlertDialogDescription className="text-xs">
          Apakah Anda yakin ingin mengubah status NFC ini menjadi hilang?
        </AlertDialogDescription>
      </AlertDialogHeader>

      {tag && (
        <InfoPanel>
          <InfoRow
            label="UID Tag"
            value={<span className="font-mono text-blue-600">{tag.uid}</span>}
          />

          <InfoRow label="Label" value={tag.label || "-"} />

          <InfoRow label="Status Saat Ini" value={getStatusLabel(tag.status)} />
        </InfoPanel>
      )}

      <AlertDialogFooter>
        <AlertDialogCancel className="rounded text-xs">Batal</AlertDialogCancel>

        <AlertDialogAction
          onClick={onConfirm}
          disabled={pending}
          className="rounded bg-rose-600 text-xs hover:bg-rose-700"
        >
          {pending && <RefreshCw className="mr-1.5 size-3.5 animate-spin" />}
          Tandai Hilang
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export const ReplaceNfcDialog: React.FC<{
  tag: NfcTagItem | null;
  replacementId: string;
  options: SelectOption[];
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onReplacementChange: (value: string) => void;
  onConfirm: () => void;
}> = ({
  tag,
  replacementId,
  options,
  pending,
  onOpenChange,
  onReplacementChange,
  onConfirm,
}) => (
  <Dialog open={Boolean(tag)} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md rounded">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-sm">
          <RefreshCw className="size-4 text-blue-600" />
          Ganti Tag NFC
        </DialogTitle>

        <DialogDescription className="text-xs">
          Pilih tag NFC pengganti yang sudah terdaftar dan belum ditautkan.
        </DialogDescription>
      </DialogHeader>

      {tag && (
        <div className="space-y-4">
          <InfoPanel>
            <p className="text-[11px] text-slate-500">NFC Lama</p>

            <p className="font-mono text-sm font-bold text-blue-600">
              {tag.uid}
            </p>

            <p className="text-[11px] text-slate-600">
              {tag.label || "Tanpa label"}
            </p>
          </InfoPanel>

          <SelectField
            label="NFC Pengganti"
            value={replacementId}
            onValueChange={onReplacementChange}
            options={options}
            placeholder="Pilih NFC pengganti"
            disabled={options.length === 0}
          />

          {options.length === 0 && (
            <p className="text-xs text-rose-600">
              Tidak ada NFC berstatus Belum Ditautkan yang tersedia sebagai
              pengganti. Daftarkan NFC baru terlebih dahulu.
            </p>
          )}

          <div className="border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-800 rounded">
            <div className="mb-1 flex items-center gap-1.5 font-semibold">
              <AlertTriangle className="size-3.5" />
              Catatan Sistem
            </div>
            NFC lama akan ditandai sebagai diganti oleh backend. NFC pengganti
            harus sudah terdaftar di inventaris.
          </div>
        </div>
      )}

      <DialogFooter>
        <Button
          variant="outline"
          className="rounded text-xs"
          onClick={() => onOpenChange(false)}
        >
          Batal
        </Button>

        <Button
          className="rounded bg-blue-600 text-xs hover:bg-blue-700"
          onClick={onConfirm}
          disabled={!replacementId || pending}
        >
          {pending ? (
            <RefreshCw className="mr-1.5 size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="mr-1.5 size-3.5" />
          )}
          Ganti NFC
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export const DiagnosticNfcDialog: React.FC<{
  tag: NfcTagItem | null;
  onOpenChange: (open: boolean) => void;
}> = ({ tag, onOpenChange }) => (
  <Dialog open={Boolean(tag)} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md rounded">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-sm">
          <Settings2 className="size-4 text-blue-600" />
          Detail Tag NFC / RFID
        </DialogTitle>

        <DialogDescription className="text-xs">
          Informasi tag berdasarkan data yang tersedia di backend.
        </DialogDescription>
      </DialogHeader>

      {tag && (
        <div className="space-y-4">
          <InfoPanel>
            <InfoRow
              label="UID Hardware"
              value={<span className="font-mono">{tag.uid}</span>}
            />

            <InfoRow label="Label" value={tag.label || "-"} />

            <InfoRow label="Status NFC" value={getStatusLabel(tag.status)} />

            <InfoRow
              label="Status Penautan"
              value={isTagAssigned(tag) ? "Sudah Ditautkan" : "Belum Ditautkan"}
            />

            <InfoRow
              label="Checkpoint"
              value={getAssignmentCheckpointName(tag) || "-"}
            />

            <InfoRow
              label="Jumlah Assignment"
              value={tag._count?.assignments ?? 0}
            />

            <InfoRow label="Jumlah Patroli" value={tag._count?.patrols ?? 0} />

            <InfoRow label="Dibuat" value={formatDate(tag.createdAt)} />

            <InfoRow label="Diperbarui" value={formatDate(tag.updatedAt)} />

            {tag.createdBy && (
              <InfoRow
                label="Dibuat Oleh"
                value={tag.createdBy.fullName || tag.createdBy.username}
              />
            )}
          </InfoPanel>

          <div className="flex items-start gap-2 border border-blue-200 bg-blue-50 p-3 text-[11px] text-blue-800 rounded">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" />
            Informasi diagnostik menampilkan data yang dikembalikan oleh
            backend. Data sinyal, baterai, dan enkripsi tidak ditampilkan karena
            belum tersedia pada response NFC.
          </div>
        </div>
      )}

      <DialogFooter>
        <Button
          className="rounded bg-blue-600 text-xs hover:bg-blue-700"
          onClick={() => onOpenChange(false)}
        >
          Tutup Diagnostik
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export const EditNfcDialog: React.FC<{
  tag: NfcTagItem | null;
  label: string;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onLabelChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}> = ({ tag, label, pending, onOpenChange, onLabelChange, onSubmit }) => (
  <Dialog open={Boolean(tag)} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-sm">
          <Pencil className="size-4 text-blue-600" />
          Edit Konfigurasi Tag NFC/RFID
        </DialogTitle>

        <DialogDescription className="text-xs">
          Perbarui label tag NFC yang tersimpan di backend.
        </DialogDescription>
      </DialogHeader>

      {tag && (
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="UID Tag Fisik (Read-Only)">
            <Input
              disabled
              value={tag.uid}
              className="rounded bg-slate-100 font-mono text-xs"
            />
          </Field>

          <Field label="Label Tag NFC">
            <Input
              value={label}
              onChange={(event) => onLabelChange(event.target.value)}
              placeholder="Masukkan label NFC"
              className="rounded text-xs"
            />
          </Field>

          <InfoPanel>
            <InfoRow label="Status NFC" value={getStatusLabel(tag.status)} />

            <InfoRow
              label="Status Penautan"
              value={isTagAssigned(tag) ? "Sudah Ditautkan" : "Belum Ditautkan"}
            />

            <InfoRow
              label="Checkpoint"
              value={getAssignmentCheckpointName(tag) || "-"}
            />
          </InfoPanel>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded text-xs"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>

            <Button
              type="submit"
              disabled={pending}
              className="rounded bg-blue-600 text-xs hover:bg-blue-700"
            >
              {pending && (
                <RefreshCw className="mr-1.5 size-3.5 animate-spin" />
              )}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </form>
      )}
    </DialogContent>
  </Dialog>
);

export const DeleteNfcDialog: React.FC<{
  tag: NfcTagItem | null;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}> = ({ tag, pending, onOpenChange, onConfirm }) => (
  <AlertDialog open={Boolean(tag)} onOpenChange={onOpenChange}>
    <AlertDialogContent className="max-w-md rounded">
      <AlertDialogHeader>
        <AlertDialogTitle className="flex items-center gap-2 text-sm">
          <AlertTriangle className="size-4 text-rose-600" />
          Nonaktifkan Tag NFC/RFID
        </AlertDialogTitle>

        <AlertDialogDescription className="text-xs">
          Apakah Anda yakin ingin menonaktifkan tag fisik berikut?
        </AlertDialogDescription>
      </AlertDialogHeader>

      {tag && (
        <div className="space-y-3">
          <InfoPanel>
            <p className="font-mono text-sm font-bold text-blue-600">
              {tag.uid}
            </p>

            <p className="text-xs font-semibold text-slate-900">
              {tag.label || "Tanpa label"}
            </p>

            <p className="text-[11px] text-slate-500">
              Status:{" "}
              <span className="font-semibold text-slate-800">
                {getStatusLabel(tag.status)}
              </span>
            </p>
          </InfoPanel>

          <div className="border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-800 rounded">
            <strong>Catatan:</strong> Operasi ini menonaktifkan tag NFC melalui
            backend. Data tidak dihapus permanen dari database.
          </div>
        </div>
      )}

      <AlertDialogFooter>
        <AlertDialogCancel className="rounded text-xs">Batal</AlertDialogCancel>

        <AlertDialogAction
          onClick={onConfirm}
          disabled={pending}
          className="rounded bg-rose-600 text-xs hover:bg-rose-700"
        >
          {pending && <RefreshCw className="mr-1.5 size-3.5 animate-spin" />}
          Nonaktifkan Tag
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export const RegisterNfcDialog: React.FC<{
  open: boolean;
  uid: string;
  label: string;
  checkpointId: string;
  checkpointOptions: SelectOption[];
  availableCheckpointsCount: number;
  createPending: boolean;
  assignPending: boolean;
  onOpenChange: (open: boolean) => void;
  onUidChange: (value: string) => void;
  onLabelChange: (value: string) => void;
  onCheckpointChange: (value: string) => void;
  onGenerateUid: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}> = ({
  open,
  uid,
  label,
  checkpointId,
  checkpointOptions,
  availableCheckpointsCount,
  createPending,
  assignPending,
  onOpenChange,
  onUidChange,
  onLabelChange,
  onCheckpointChange,
  onGenerateUid,
  onSubmit,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
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

      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="UID Tag Hardware">
          <div className="flex gap-2">
            <Input
              required
              value={uid}
              onChange={(event) =>
                onUidChange(event.target.value.toUpperCase())
              }
              placeholder="FE8A6D65"
              className="rounded font-mono text-xs"
            />

            <Button
              type="button"
              variant="outline"
              className="shrink-0 rounded text-xs"
              onClick={onGenerateUid}
            >
              <RefreshCw className="mr-1.5 size-3.5" />
              Generate
            </Button>
          </div>

          <p className="text-[11px] text-slate-500">
            Masukkan UID hexadecimal sesuai UID fisik NFC.
          </p>
        </Field>

        <Field label="Label Tag NFC">
          <Input
            value={label}
            onChange={(event) => onLabelChange(event.target.value)}
            placeholder="Contoh: NFC Ruang Admin"
            className="rounded text-xs"
          />
        </Field>

        <SelectField
          label="Hubungkan ke Checkpoint (Opsional)"
          value={checkpointId}
          onValueChange={onCheckpointChange}
          options={checkpointOptions}
          placeholder="Daftarkan tanpa checkpoint"
        />

        {availableCheckpointsCount === 0 && (
          <p className="text-xs text-amber-600">
            Tidak ada checkpoint aktif yang tersedia untuk site ini. NFC tetap
            dapat didaftarkan tanpa checkpoint.
          </p>
        )}

        <InfoPanel>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <ShieldCheck className="size-4 text-blue-600" />
            Informasi Pendaftaran
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Status awal</span>
            <span className="font-semibold text-emerald-700">UNASSIGNED</span>
          </div>
        </InfoPanel>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="rounded text-xs"
            onClick={() => onOpenChange(false)}
          >
            Batal
          </Button>

          <Button
            type="submit"
            disabled={createPending || assignPending}
            className="rounded bg-blue-600 text-xs hover:bg-blue-700"
          >
            {createPending || assignPending ? (
              <RefreshCw className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <Plus className="mr-1.5 size-3.5" />
            )}
            Daftarkan Tag NFC
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
);

export const TagNfcDialogs: React.FC<TagNfcDialogsProps> = (props) => {
  const {
    diagnosingTag,
    editingTag,
    deletingTag,
    unassigningTag,
    assigningTag,
    damagingTag,
    losingTag,
    replacingTag,

    isRegisterModalOpen,
    newTagUid,
    newTagLabel,
    newTagCheckpointId,

    editLabel,
    selectedCheckpointToAssign,
    replacementNfcId,

    checkpointOptions,
    replacementOptions,
    availableCheckpointsCount,

    createPending,
    assignPending,
    unassignPending,
    updatePending,
    deletePending,
    damagedPending,
    lostPending,
    replacePending,

    setDiagnosingTag,
    setEditingTag,
    setDeletingTag,
    setUnassigningTag,
    setAssigningTag,
    setDamagingTag,
    setLosingTag,
    setReplacingTag,
    setIsRegisterModalOpen,

    setNewTagUid,
    setNewTagLabel,
    setNewTagCheckpointId,
    setEditLabel,
    setSelectedCheckpointToAssign,
    setReplacementNfcId,

    onRegister,
    onEdit,
    onDelete,
    onAssign,
    onUnassign,
    onDamaged,
    onLost,
    onReplace,
    onGenerateUid,
  } = props;

  return (
    <>
      <UnassignNfcDialog
        tag={unassigningTag}
        pending={unassignPending}
        onOpenChange={(open) => {
          if (!open) {
            setUnassigningTag(null);
            props.setFormError("");
          }
        }}
        onConfirm={onUnassign}
      />

      <AssignNfcDialog
        tag={assigningTag}
        selectedCheckpoint={selectedCheckpointToAssign}
        options={checkpointOptions}
        pending={assignPending}
        onOpenChange={(open) => {
          if (!open) {
            setAssigningTag(null);
            props.setFormError("");
          }
        }}
        onCheckpointChange={setSelectedCheckpointToAssign}
        onSubmit={onAssign}
      />

      <DamagedNfcDialog
        tag={damagingTag}
        pending={damagedPending}
        onOpenChange={(open) => {
          if (!open) {
            setDamagingTag(null);
            props.setFormError("");
          }
        }}
        onConfirm={onDamaged}
      />

      <LostNfcDialog
        tag={losingTag}
        pending={lostPending}
        onOpenChange={(open) => {
          if (!open) {
            setLosingTag(null);
            props.setFormError("");
          }
        }}
        onConfirm={onLost}
      />

      <ReplaceNfcDialog
        tag={replacingTag}
        replacementId={replacementNfcId}
        options={replacementOptions}
        pending={replacePending}
        onOpenChange={(open) => {
          if (!open) {
            setReplacingTag(null);
            setReplacementNfcId("");
            props.setFormError("");
          }
        }}
        onReplacementChange={setReplacementNfcId}
        onConfirm={onReplace}
      />

      <DiagnosticNfcDialog
        tag={diagnosingTag}
        onOpenChange={(open) => {
          if (!open) setDiagnosingTag(null);
        }}
      />

      <EditNfcDialog
        tag={editingTag}
        label={editLabel}
        pending={updatePending}
        onOpenChange={(open) => {
          if (!open) {
            setEditingTag(null);
            props.setFormError("");
          }
        }}
        onLabelChange={setEditLabel}
        onSubmit={onEdit}
      />

      <DeleteNfcDialog
        tag={deletingTag}
        pending={deletePending}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingTag(null);
            props.setFormError("");
          }
        }}
        onConfirm={onDelete}
      />

      <RegisterNfcDialog
        open={isRegisterModalOpen}
        uid={newTagUid}
        label={newTagLabel}
        checkpointId={newTagCheckpointId}
        checkpointOptions={checkpointOptions}
        availableCheckpointsCount={availableCheckpointsCount}
        createPending={createPending}
        assignPending={assignPending}
        onOpenChange={(open) => {
          setIsRegisterModalOpen(open);

          if (!open) {
            props.setFormError("");
          }
        }}
        onUidChange={setNewTagUid}
        onLabelChange={setNewTagLabel}
        onCheckpointChange={setNewTagCheckpointId}
        onGenerateUid={onGenerateUid}
        onSubmit={onRegister}
      />
    </>
  );
};
