import React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import type { PatrolPointStatus } from "../../types/enums/prisma-enums";

export interface PointForm {
  siteId: string;
  code: string;
  name: string;
  description: string;
  latitude: string;
  longitude: string;
  radiusMeters: string;
  status: PatrolPointStatus;
}

type PointFormField = Exclude<keyof PointForm, "status">;

interface PointFormDialogProps {
  open: boolean;
  mode: "create" | "edit";
  form: PointForm;
  formError: string;
  isSubmitting: boolean;
  isCreatePending: boolean;
  isUpdatePending: boolean;
  onFormChange: (key: PointFormField, value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}

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

export default function PointFormDialog({
  open,
  mode,
  form,
  formError,
  isSubmitting,
  isCreatePending,
  isUpdatePending,
  onFormChange,
  onSubmit,
  onClose,
}: PointFormDialogProps) {
  const isEdit = mode === "edit";

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value && !isSubmitting) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto rounded">
        <DialogHeader>
          <DialogTitle className="text-base">
            {isEdit ? "Edit Titik Patroli" : "Tambah Titik Patroli"}
          </DialogTitle>

          <DialogDescription className="text-xs">
            {isEdit
              ? "Perbarui informasi titik patroli."
              : "Isi data titik patroli baru."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-4">
            <Field label="Kode Titik">
              <Input
                required
                value={form.code}
                onChange={(event) => onFormChange("code", event.target.value)}
                placeholder="CP-001"
                className="h-9 rounded text-xs"
              />
            </Field>

            <Field label="Nama Titik">
              <Input
                required
                value={form.name}
                onChange={(event) => onFormChange("name", event.target.value)}
                placeholder="Nama titik patroli"
                className="h-9 rounded text-xs"
              />
            </Field>

            <Field label="Subarea">
              <Input
                value={form.description}
                onChange={(event) =>
                  onFormChange("description", event.target.value)
                }
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
                  onChange={(event) =>
                    onFormChange("latitude", event.target.value)
                  }
                  className="h-9 rounded text-xs"
                />
              </Field>

              <Field label="Longitude">
                <Input
                  required
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={(event) =>
                    onFormChange("longitude", event.target.value)
                  }
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
                onChange={(event) =>
                  onFormChange("radiusMeters", event.target.value)
                }
                className="h-9 rounded text-xs"
              />
            </Field>

            {formError && (
              <div className="rounded border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                {formError}
              </div>
            )}
          </div>

          <Separator />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded"
              disabled={isSubmitting}
              onClick={onClose}
            >
              Batal
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded bg-blue-600 hover:bg-blue-700"
            >
              {isEdit
                ? isUpdatePending
                  ? "Menyimpan..."
                  : "Simpan Perubahan"
                : isCreatePending
                  ? "Menyimpan..."
                  : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
