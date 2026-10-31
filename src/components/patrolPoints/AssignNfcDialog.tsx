import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

import { Link2 } from "lucide-react";

import type { NfcTagResponse } from "../../types/nfc/nfc";
import type { PatrolPointResponse } from "../../types/patrol-point/patrolPoint";

interface AssignNfcDialogProps {
  open: boolean;
  checkpoint: PatrolPointResponse | null;
  availableNfcTags: NfcTagResponse[];
  selectedNfcId: string;
  actionError: string;
  isProcessing: boolean;
  isAssigning: boolean;
  onSelectedNfcChange: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export default function AssignNfcDialog({
  open,
  checkpoint,
  availableNfcTags,
  selectedNfcId,
  actionError,
  isProcessing,
  isAssigning,
  onSelectedNfcChange,
  onConfirm,
  onClose,
}: AssignNfcDialogProps) {
  const selectedTag = availableNfcTags.find((tag) => tag.id === selectedNfcId);

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value && !isProcessing) onClose();
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

        {checkpoint && (
          <div className="rounded border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Titik patroli</p>

            <p className="mt-1 text-sm font-semibold">{checkpoint.name}</p>

            <p className="mt-1 font-mono text-xs text-blue-600">
              {checkpoint.code}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-xs">Pilih NFC</Label>

          <Select
            value={selectedNfcId}
            onValueChange={(value) => onSelectedNfcChange(value ?? "")}
            disabled={isProcessing || availableNfcTags.length === 0}
          >
            <SelectTrigger className="h-10 w-full rounded text-xs">
              <span className="truncate">
                {selectedNfcId
                  ? selectedTag
                    ? `${selectedTag.label ?? "Tanpa Label"} - ${selectedTag.uid ?? "No UID"}`
                    : "NFC tidak ditemukan"
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
            disabled={isProcessing}
            onClick={onClose}
          >
            Batal
          </Button>

          <Button
            type="button"
            disabled={
              isProcessing ||
              !selectedNfcId ||
              selectedNfcId === "none" ||
              availableNfcTags.length === 0
            }
            onClick={onConfirm}
            className="rounded bg-blue-600 hover:bg-blue-700"
          >
            {isAssigning ? "Memproses..." : "Tautkan NFC"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
