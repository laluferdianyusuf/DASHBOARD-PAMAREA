import React from "react";

import type { PatrolPointStatus } from "../../types/enums/prisma-enums";
import type { PatrolPointResponse } from "../../types/patrol-point/patrolPoint";

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

import { Separator } from "@/components/ui/separator";

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

interface Props {
  isAddModalOpen: boolean;
  editingCheckpoint: PatrolPointResponse | null;
  form: PointForm;
  formError: string;
  isSubmitting: boolean;
  onFormChange: <K extends keyof PointForm>(
    key: K,
    value: PointForm[K],
  ) => void;
  onCreate: (event: React.FormEvent<HTMLFormElement>) => void;
  onUpdate: (event: React.FormEvent<HTMLFormElement>) => void;
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

export const TitikPatroliFormDialog = ({
  isAddModalOpen,
  editingCheckpoint,
  form,
  formError,
  isSubmitting,
  onFormChange,
  onCreate,
  onUpdate,
  onClose,
}: Props) => {
  const isEdit = Boolean(editingCheckpoint);
  const isOpen = isAddModalOpen || isEdit;

  const renderFormFields = () => (
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
          onChange={(event) => onFormChange("description", event.target.value)}
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
            onChange={(event) => onFormChange("latitude", event.target.value)}
            className="h-9 rounded text-xs"
          />
        </Field>

        <Field label="Longitude">
          <Input
            required
            type="number"
            step="any"
            value={form.longitude}
            onChange={(event) => onFormChange("longitude", event.target.value)}
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
          onChange={(event) => onFormChange("radiusMeters", event.target.value)}
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
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
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

        <form onSubmit={isEdit ? onUpdate : onCreate} className="space-y-4">
          {renderFormFields()}

          <Separator />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded"
              onClick={onClose}
            >
              Batal
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting
                ? "Menyimpan..."
                : isEdit
                  ? "Simpan Perubahan"
                  : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TitikPatroliFormDialog;
