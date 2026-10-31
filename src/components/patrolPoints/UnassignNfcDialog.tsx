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

import { Separator } from "@/components/ui/separator";

import { Unlink } from "lucide-react";

import type { NfcAssignment } from "../../types";
import type { PatrolPointResponse } from "../../types/patrol-point/patrolPoint";

interface UnassignNfcDialogProps {
  open: boolean;
  checkpoint: PatrolPointResponse | null;
  actionError: string;
  isProcessing: boolean;
  isUnassigning: boolean;
  getActiveAssignment: (
    point: PatrolPointResponse,
  ) => NfcAssignment | undefined;
  onConfirm: () => void;
  onClose: () => void;
}

export default function UnassignNfcDialog({
  open,
  checkpoint,
  actionError,
  isProcessing,
  isUnassigning,
  getActiveAssignment,
  onConfirm,
  onClose,
}: UnassignNfcDialogProps) {
  const assignment = checkpoint ? getActiveAssignment(checkpoint) : undefined;

  return (
    <AlertDialog
      open={open}
      onOpenChange={(value) => {
        if (!value && !isProcessing) onClose();
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

        {checkpoint && (
          <div className="rounded border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Titik patroli</p>

            <p className="mt-1 text-sm font-semibold">{checkpoint.name}</p>

            <p className="mt-1 font-mono text-xs text-blue-600">
              {checkpoint.code}
            </p>

            <Separator className="my-2" />

            <p className="text-xs text-slate-500">NFC UID</p>

            <p className="mt-1 font-mono text-xs font-semibold">
              {assignment?.nfcTag?.uid ?? "-"}
            </p>
          </div>
        )}

        {actionError && (
          <p className="rounded border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {actionError}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel
            className="rounded"
            disabled={isProcessing}
            onClick={onClose}
          >
            Batal
          </AlertDialogCancel>

          <AlertDialogAction
            disabled={isProcessing}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
            className="rounded bg-rose-600 hover:bg-rose-700"
          >
            {isUnassigning ? "Memproses..." : "Lepas NFC"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
