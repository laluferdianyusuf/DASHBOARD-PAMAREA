import React, { useMemo, useState } from "react";

import {
  useActivateQuestion,
  useCreateQuestion,
  useCreateQuestionOption,
  useDeactivateQuestion,
  useQuestions,
  useUpdateQuestion,
  useUpdateQuestionOption,
} from "../hooks/question/useQuestions";

import { usePatrolPoints } from "../hooks/patrol-point/usePatrolPoints";

import type {
  Question as BackendQuestion,
  CreateQuestionPayload,
  PointQuestion as PointQuestionItem,
} from "../types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

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
  AlertTriangle,
  Camera,
  CheckCircle2,
  Copy,
  Info,
  Link2,
  Link2Off,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  useAssignQuestion,
  usePointQuestions,
  useUnassignQuestion,
} from "../hooks/point-questions/usePointQuestions";

type BackendQuestionType = "YES_NO" | "SINGLE_CHOICE" | "TEXT";

interface PatrolPointItem {
  id: string;
  code: string;
  name: string;
  status: string;
}

interface OptionForm {
  id?: string;
  label: string;
  isSafe: boolean;
}

interface QuestionFormProps {
  formText: string;
  setFormText: (value: string) => void;

  formInputType: BackendQuestionType;
  setFormInputType: (value: BackendQuestionType) => void;

  formOptions: OptionForm[];
  setFormOptions: (value: OptionForm[]) => void;

  newOptionInput: string;
  setNewOptionInput: (value: string) => void;

  formRequired: boolean;
  setFormRequired: (value: boolean) => void;

  formRequirePhoto: boolean;
  setFormRequirePhoto: (value: boolean) => void;

  formError: string | null;
}

const INPUT_TYPES = [
  {
    value: "YES_NO",
    label: "Ya / Tidak",
  },
  {
    value: "SINGLE_CHOICE",
    label: "Pilihan Ganda",
  },
  {
    value: "TEXT",
    label: "Catatan Teks",
  },
] as const;

const DEFAULT_OPTIONS: OptionForm[] = [
  {
    label: "Kondisi Normal / Baik",
    isSafe: true,
  },
  {
    label: "Ada Kerusakan / Kendala",
    isSafe: false,
  },
];

const getInputTypeLabel = (type: string) => {
  return INPUT_TYPES.find((item) => item.value === type)?.label ?? type;
};

const getInputTypeVariant = (type: string) => {
  switch (type) {
    case "YES_NO":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "SINGLE_CHOICE":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "TEXT":
      return "bg-slate-100 text-slate-700 border-slate-200";

    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

const getStatusLabel = (status: string) => {
  return status === "ACTIVE" ? "Aktif" : "Nonaktif";
};

const getPhotoLabel = (photoRequirement: string) => {
  return photoRequirement === "REQUIRED" ? "Wajib Foto" : "Foto Opsional";
};

const getErrorMessage = (error: unknown): string => {
  const err = error as {
    response?: {
      data?: {
        message?: string | string[];
      };
    };
    message?: string;
  };

  const message = err?.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(", ");
  }

  return message || err?.message || "Terjadi kesalahan.";
};

const QuestionFormFields: React.FC<QuestionFormProps> = ({
  formText,
  setFormText,
  formInputType,
  setFormInputType,
  formOptions,
  setFormOptions,
  newOptionInput,
  setNewOptionInput,
  formRequired,
  setFormRequired,
  formRequirePhoto,
  setFormRequirePhoto,
  formError,
}) => {
  const handleAddOption = () => {
    const label = newOptionInput.trim();

    if (!label) return;

    const duplicate = formOptions.some(
      (option) => option.label.trim().toLowerCase() === label.toLowerCase(),
    );

    if (duplicate) return;

    setFormOptions([
      ...formOptions,
      {
        label,
        isSafe: false,
      },
    ]);

    setNewOptionInput("");
  };

  const handleRemoveOption = (index: number) => {
    if (formOptions.length <= 2) return;

    const option = formOptions[index];

    // Opsi yang sudah tersimpan tidak dihapus karena belum ada hook remove.
    if (option.id) return;

    setFormOptions(formOptions.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-5">
      {formError && (
        <div className="flex items-start gap-2 rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <div className="space-y-2">
        <Label>Teks Pertanyaan *</Label>

        <Textarea
          className="rounded"
          rows={3}
          placeholder="Contoh: Apakah seluruh pekerja menggunakan APD sesuai ketentuan?"
          value={formText}
          onChange={(e) => setFormText(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Tipe Input Jawaban *</Label>

        <Select
          value={formInputType}
          onValueChange={(value) =>
            setFormInputType(value as BackendQuestionType)
          }
        >
          <SelectTrigger className="rounded">
            <SelectValue placeholder="Pilih tipe pertanyaan" />
          </SelectTrigger>

          <SelectContent>
            {INPUT_TYPES.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* YES NO OPTIONS */}

      {formInputType === "YES_NO" && (
        <div className="rounded border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-800">
            Pilihan otomatis
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <Badge className="rounded bg-white text-emerald-700 hover:bg-white">
              Ya
            </Badge>

            <Badge className="rounded bg-white text-rose-700 hover:bg-white">
              Tidak
            </Badge>
          </div>

          <p className="mt-2 text-xs text-emerald-700">
            Opsi Ya dan Tidak dibuat otomatis oleh backend.
          </p>
        </div>
      )}

      {/* SINGLE CHOICE OPTIONS */}

      {formInputType === "SINGLE_CHOICE" && (
        <div className="space-y-3 rounded border border-slate-200 p-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Pilihan Jawaban
            </p>

            <p className="text-xs text-slate-500">
              Minimal harus tersedia dua pilihan.
            </p>
          </div>

          <div className="space-y-3">
            {formOptions.map((option, index) => (
              <div
                key={option.id ?? `new-${index}`}
                className="space-y-2 rounded border border-slate-100 p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 text-center text-xs text-slate-400">
                    {index + 1}.
                  </span>

                  <Input
                    className="rounded"
                    value={option.label}
                    onChange={(e) => {
                      const updated = [...formOptions];

                      updated[index] = {
                        ...updated[index],
                        label: e.target.value,
                      };

                      setFormOptions(updated);
                    }}
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="rounded text-rose-600"
                    disabled={Boolean(option.id) || formOptions.length <= 2}
                    title={
                      option.id
                        ? "Opsi tersimpan belum dapat dihapus"
                        : "Hapus opsi"
                    }
                    onClick={() => handleRemoveOption(index)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>

                <label className="flex cursor-pointer items-center gap-2 pl-8">
                  <Checkbox
                    className="rounded"
                    checked={option.isSafe}
                    onCheckedChange={(checked) => {
                      const updated = [...formOptions];

                      updated[index] = {
                        ...updated[index],
                        isSafe: checked === true,
                      };

                      setFormOptions(updated);
                    }}
                  />

                  <span className="text-xs text-slate-600">
                    Jawaban ini menunjukkan kondisi aman
                  </span>
                </label>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              className="rounded"
              placeholder="Masukkan pilihan baru..."
              value={newOptionInput}
              onChange={(e) => setNewOptionInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddOption();
                }
              }}
            />

            <Button
              type="button"
              variant="outline"
              className="rounded"
              onClick={handleAddOption}
            >
              <Plus className="mr-1 size-4" />
              Tambah
            </Button>
          </div>
        </div>
      )}

      {/* SETTINGS */}

      <div className="space-y-3 rounded border border-slate-200 p-4">
        <p className="text-sm font-semibold text-slate-900">
          Pengaturan Pertanyaan
        </p>

        <label className="flex cursor-pointer items-start gap-3">
          <Checkbox
            className="rounded"
            checked={formRequired}
            onCheckedChange={(checked) => setFormRequired(checked === true)}
          />

          <span>
            <span className="block text-sm font-medium text-slate-800">
              Wajib Diisi
            </span>

            <span className="block text-xs text-slate-500">
              Petugas harus mengisi pertanyaan ini.
            </span>
          </span>
        </label>

        <label className="flex cursor-pointer items-start gap-3">
          <Checkbox
            className="rounded"
            checked={formRequirePhoto}
            onCheckedChange={(checked) => setFormRequirePhoto(checked === true)}
          />

          <span>
            <span className="block text-sm font-medium text-slate-800">
              Wajib Lampirkan Foto
            </span>

            <span className="block text-xs text-slate-500">
              Petugas wajib melampirkan bukti foto lapangan.
            </span>
          </span>
        </label>
      </div>

      <div className="rounded border border-blue-100 bg-blue-50 p-3">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 size-4 shrink-0 text-blue-600" />

          <p className="text-xs leading-relaxed text-blue-700">
            Pertanyaan baru mengikuti konfigurasi alokasi Patrol Point pada
            backend. Pengaturan kategori, severity, dan auto finding belum
            tersedia pada model Question.
          </p>
        </div>
      </div>
    </div>
  );
};

export const QuestionBuilderView: React.FC = () => {
  const {
    data: questionsData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuestions();
  const patrolPointsQuery = usePatrolPoints();

  const patrolPoints = useMemo<PatrolPointItem[]>(() => {
    const response = patrolPointsQuery.data as
      | PatrolPointItem[]
      | { data?: PatrolPointItem[] }
      | undefined;

    if (Array.isArray(response)) return response;

    return response?.data ?? [];
  }, [patrolPointsQuery.data]);

  const activePatrolPoints = useMemo(
    () => patrolPoints.filter((point) => point.status === "ACTIVE"),
    [patrolPoints],
  );

  const createQuestionMutation = useCreateQuestion();
  const updateQuestionMutation = useUpdateQuestion();
  const deactivateQuestionMutation = useDeactivateQuestion();
  const activateQuestionMutation = useActivateQuestion();

  const createOptionMutation = useCreateQuestionOption();
  const updateOptionMutation = useUpdateQuestionOption();

  const assignQuestionMutation = useAssignQuestion();
  const unassignQuestionMutation = useUnassignQuestion();

  const [assignmentQuestion, setAssignmentQuestion] =
    useState<BackendQuestion | null>(null);

  const [selectedPatrolPointId, setSelectedPatrolPointId] = useState("");

  const [assignmentError, setAssignmentError] = useState<string | null>(null);

  const {
    data: pointAssignmentsData,
    isLoading: isAssignmentsLoading,
    isError: isAssignmentsError,
    error: pointAssignmentsError,
    refetch: refetchPointAssignments,
  } = usePointQuestions(selectedPatrolPointId);

  const pointAssignments = useMemo<PointQuestionItem[]>(() => {
    if (!Array.isArray(pointAssignmentsData)) return [];

    return pointAssignmentsData as PointQuestionItem[];
  }, [pointAssignmentsData]);

  const currentAssignment = useMemo(() => {
    if (!assignmentQuestion) return undefined;

    return pointAssignments.find(
      (item) => item.questionId === assignmentQuestion.id,
    );
  }, [pointAssignments, assignmentQuestion]);

  const isAssignmentSaving =
    assignQuestionMutation.isPending || unassignQuestionMutation.isPending;

  const isSaving =
    createQuestionMutation.isPending ||
    updateQuestionMutation.isPending ||
    createOptionMutation.isPending ||
    updateOptionMutation.isPending;

  const questions = useMemo<BackendQuestion[]>(() => {
    if (!Array.isArray(questionsData)) return [];

    return questionsData as BackendQuestion[];
  }, [questionsData]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInputType, setSelectedInputType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [editingQuestion, setEditingQuestion] =
    useState<BackendQuestion | null>(null);

  const [deletingQuestion, setDeletingQuestion] =
    useState<BackendQuestion | null>(null);

  const [formText, setFormText] = useState("");

  const [formInputType, setFormInputType] =
    useState<BackendQuestionType>("YES_NO");

  const [formOptions, setFormOptions] = useState<OptionForm[]>(DEFAULT_OPTIONS);

  const [newOptionInput, setNewOptionInput] = useState("");

  const [formRequired, setFormRequired] = useState(true);

  const [formRequirePhoto, setFormRequirePhoto] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);

  const filteredQuestions = useMemo(() => {
    return questions.filter((question) => {
      if (
        selectedInputType !== "all" &&
        question.questionType !== selectedInputType
      ) {
        return false;
      }

      if (selectedStatus !== "all" && question.status !== selectedStatus) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();

        const match = [
          question.id,
          question.code,
          question.questionText,
          question.questionType,
        ].some((value) => value.toLowerCase().includes(query));

        if (!match) return false;
      }

      return true;
    });
  }, [questions, searchQuery, selectedInputType, selectedStatus]);

  const resetForm = () => {
    setFormText("");
    setFormInputType("YES_NO");
    setFormOptions(DEFAULT_OPTIONS.map((option) => ({ ...option })));
    setNewOptionInput("");
    setFormRequired(true);
    setFormRequirePhoto(false);
    setFormError(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setEditingQuestion(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (question: BackendQuestion) => {
    setEditingQuestion(question);

    setFormText(question.questionText);
    setFormInputType(question.questionType);

    setFormOptions(
      question.options.map((option) => ({
        id: option.id,
        label: option.label,
        isSafe: option.isSafe,
      })),
    );

    setNewOptionInput("");
    setFormRequired(question.isRequired);
    setFormRequirePhoto(question.photoRequirement === "REQUIRED");

    setFormError(null);
  };

  const closeFormDialog = () => {
    setIsAddModalOpen(false);
    setEditingQuestion(null);
    resetForm();
  };

  const validateForm = () => {
    if (!formText.trim()) {
      setFormError("Teks pertanyaan wajib diisi.");
      return false;
    }

    if (formInputType === "SINGLE_CHOICE") {
      const validOptions = formOptions.filter((option) => option.label.trim());

      if (validOptions.length < 2) {
        setFormError("Minimal harus ada dua pilihan jawaban.");
        return false;
      }

      const labels = validOptions.map((option) =>
        option.label.trim().toLowerCase(),
      );

      if (new Set(labels).size !== labels.length) {
        setFormError("Pilihan jawaban tidak boleh duplikat.");
        return false;
      }
    }

    setFormError(null);
    return true;
  };

  const handleCreateQuestion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const payload = {
        questionText: formText.trim(),
        questionType: formInputType,
        isRequired: formRequired,
        photoRequirement: formRequirePhoto ? "REQUIRED" : "OPTIONAL",
        questionOptions:
          formInputType === "SINGLE_CHOICE"
            ? formOptions.map((option) => ({
                label: option.label.trim(),
                isSafe: option.isSafe,
              }))
            : undefined,
      } as CreateQuestionPayload;

      const result = await createQuestionMutation.mutateAsync(payload);

      toast.success(`Pertanyaan ${result?.code ?? ""} berhasil ditambahkan.`);
      closeFormDialog();
    } catch (error) {
      toast.error("Gagal menambahkan pertanyaan", {
        description: getErrorMessage(error),
      });
    }
  };

  const handleSaveEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!editingQuestion) return;

    if (!validateForm()) return;

    try {
      await updateQuestionMutation.mutateAsync({
        id: editingQuestion.id,
        payload: {
          questionText: formText.trim(),
          isRequired: formRequired,
          photoRequirement: formRequirePhoto ? "REQUIRED" : "NONE",
        },
      });

      if (formInputType === "SINGLE_CHOICE") {
        for (let index = 0; index < formOptions.length; index++) {
          const option = formOptions[index];

          if (!option.label.trim()) continue;

          const payload = {
            value: option.label.trim().toUpperCase(),
            label: option.label.trim(),
            sortOrder: index + 1,
            isSafe: option.isSafe,
          };

          if (option.id) {
            await updateOptionMutation.mutateAsync({
              optionId: option.id,
              payload,
            });
          } else {
            await createOptionMutation.mutateAsync({
              questionId: editingQuestion.id,
              payload,
            });
          }
        }
      }
      toast.success(`Pertanyaan ${editingQuestion.code} berhasil diperbarui.`);
      closeFormDialog();
    } catch (error) {
      toast.error("Gagal memperbarui pertanyaan", {
        description: getErrorMessage(error),
      });
    }
  };

  const handleDeleteQuestion = async () => {
    if (!deletingQuestion) return;

    try {
      await deactivateQuestionMutation.mutateAsync(deletingQuestion.id);

      toast.success(
        `Pertanyaan ${deletingQuestion.code} berhasil dinonaktifkan.`,
      );

      setDeletingQuestion(null);
    } catch (error) {
      toast.error("Gagal menonaktifkan pertanyaan", {
        description: getErrorMessage(error),
      });
    }
  };

  const handleToggleStatus = async (question: BackendQuestion) => {
    try {
      if (question.status === "ACTIVE") {
        await deactivateQuestionMutation.mutateAsync(question.id);

        toast.success(`Pertanyaan ${question.code} berhasil dinonaktifkan.`);
      } else {
        await activateQuestionMutation.mutateAsync(question.id);

        toast.success(`Pertanyaan ${question.code} berhasil diaktifkan.`);
      }
    } catch (error) {
      toast.error("Gagal mengubah status pertanyaan", {
        description: getErrorMessage(error),
      });
    }
  };

  const handleDuplicateQuestion = async (question: BackendQuestion) => {
    try {
      const payload = {
        questionText: `${question.questionText} (Salinan)`,
        questionType: question.questionType,
        isRequired: question.isRequired,
        photoRequirement: question.photoRequirement,
        questionOptions:
          question.questionType === "SINGLE_CHOICE"
            ? question.options.map((option) => ({
                label: option.label,
                isSafe: option.isSafe,
              }))
            : undefined,
      } as CreateQuestionPayload;

      const result = await createQuestionMutation.mutateAsync(payload);

      toast.success(`Pertanyaan berhasil diduplikasi ${result?.code ?? ""}.`);
    } catch (error) {
      toast.error("Gagal menduplikasi pertanyaan", {
        description: getErrorMessage(error),
      });
    }
  };

  const handleOpenAssignment = (question: BackendQuestion) => {
    setAssignmentQuestion(question);
    setSelectedPatrolPointId("");
    setAssignmentError(null);
  };

  const handleCloseAssignment = () => {
    if (isAssignmentSaving) return;

    setAssignmentQuestion(null);
    setSelectedPatrolPointId("");
    setAssignmentError(null);
  };

  const handleSelectPatrolPoint = (patrolPointId: string) => {
    setSelectedPatrolPointId(patrolPointId);
    setAssignmentError(null);
  };

  const handleAssignQuestion = async () => {
    if (!assignmentQuestion || !selectedPatrolPointId) {
      setAssignmentError("Pilih Patrol Point terlebih dahulu.");
      return;
    }

    if (currentAssignment) {
      setAssignmentError("Pertanyaan sudah terhubung ke Patrol Point ini.");
      return;
    }

    setAssignmentError(null);

    try {
      await assignQuestionMutation.mutateAsync({
        patrolPointId: selectedPatrolPointId,
        questionId: assignmentQuestion.id,
      });

      await refetchPointAssignments();

      toast.success("Pertanyaan berhasil dihubungkan ke Patrol Point.");
    } catch (error) {
      toast.error("Gagal menghubungkan pertanyaan", {
        description: getErrorMessage(error),
      });
    }
  };

  const handleUnassignQuestion = async () => {
    if (!currentAssignment) return;

    const confirmed = window.confirm(
      "Apakah kamu yakin ingin melepas pertanyaan dari Patrol Point ini?",
    );

    if (!confirmed) return;

    setAssignmentError(null);

    try {
      await unassignQuestionMutation.mutateAsync(currentAssignment.id);

      await refetchPointAssignments();

      toast.success("Pertanyaan berhasil dilepas dari Patrol Point.");
    } catch (error) {
      toast.error("Gagal melepas pertanyaan dari Patrol Point", {
        description: getErrorMessage(error),
      });
    }
  };

  const formProps: QuestionFormProps = {
    formText,
    setFormText,

    formInputType,
    setFormInputType,

    formOptions,
    setFormOptions,

    newOptionInput,
    setNewOptionInput,

    formRequired,
    setFormRequired,

    formRequirePhoto,
    setFormRequirePhoto,

    formError,
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Question Builder
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Kelola pertanyaan checklist pemeriksaan patroli.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="rounded"
            disabled={isFetching}
            onClick={() => refetch()}
          >
            <RefreshCw
              className={`mr-1.5 size-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            onClick={handleOpenAdd}
            className="rounded text-black bg-[#FED400] hover:bg-[#e9c300]"
          >
            <Plus className="mr-2 size-4" />
            Tambah Pertanyaan
          </Button>
        </div>
      </div>

      <div className="space-y-3 rounded border border-slate-200 bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-3">
          <InputGroup className="rounded">
            <InputGroupAddon>
              <Search className="size-4 text-slate-400" />
            </InputGroupAddon>

            <InputGroupInput
              placeholder="Cari pertanyaan, kategori, atau ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>

          <Select
            value={selectedInputType}
            onValueChange={(value) => setSelectedInputType(value ?? "all")}
          >
            <SelectTrigger className="w-full rounded">
              <span>
                {selectedInputType === "all"
                  ? "Semua Tipe Input"
                  : (INPUT_TYPES.find(
                      (type) => type.value === selectedInputType,
                    )?.label ?? "Semua Tipe Input")}
              </span>
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">Semua Tipe Input</SelectItem>

              {INPUT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedStatus}
            onValueChange={(value) => setSelectedStatus(value ?? "all")}
          >
            <SelectTrigger className="w-full rounded">
              <span>
                {selectedStatus === "all"
                  ? "Semua Status"
                  : selectedStatus === "ACTIVE"
                    ? "Aktif"
                    : selectedStatus === "INACTIVE"
                      ? "Nonaktif"
                      : "Semua Status"}
              </span>
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="ACTIVE">Aktif</SelectItem>
              <SelectItem value="INACTIVE">Nonaktif</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <p className="text-xs text-slate-500">
            Menampilkan{" "}
            <span className="font-semibold text-slate-900">
              {filteredQuestions.length}
            </span>{" "}
            dari {questions.length} pertanyaan
          </p>

          <div className="flex items-center gap-2">
            {(searchQuery ||
              selectedInputType !== "all" ||
              selectedStatus !== "all") && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 rounded text-xs text-slate-500"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedInputType("all");
                  setSelectedStatus("all");
                }}
              >
                Reset Filter
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* LOADING */}

      {isLoading && (
        <div className="flex items-center justify-center rounded border border-slate-200 bg-white p-12">
          <Loader2 className="mr-2 size-5 animate-spin text-blue-600" />
          <span className="text-sm text-slate-500">
            Memuat data pertanyaan...
          </span>
        </div>
      )}

      {/* ERROR */}

      {isError && !isLoading && (
        <div className="rounded border border-rose-200 bg-rose-50 p-8 text-center">
          <AlertTriangle className="mx-auto size-8 text-rose-500" />

          <p className="mt-3 text-sm font-semibold text-rose-800">
            Gagal memuat pertanyaan
          </p>

          <p className="mt-1 text-xs text-rose-600">
            {error instanceof Error
              ? error.message
              : "Terjadi kesalahan saat mengambil data."}
          </p>

          <Button
            type="button"
            variant="outline"
            className="mt-4 rounded"
            onClick={() => refetch()}
          >
            <RefreshCw className="mr-2 size-4" />
            Coba Lagi
          </Button>
        </div>
      )}

      {/* QUESTION LIST */}

      {!isLoading && !isError && (
        <div className="space-y-3">
          {filteredQuestions.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center">
              <Search className="mx-auto size-8 text-slate-300" />

              <p className="mt-3 text-sm font-semibold text-slate-800">
                Tidak ada pertanyaan ditemukan
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Coba ubah kata kunci atau filter pencarian.
              </p>
            </div>
          ) : (
            filteredQuestions.map((question, index) => (
              <div
                key={question.id}
                className={`group rounded-lg border bg-white p-4 transition-colors hover:border-blue-200 ${
                  question.status !== "ACTIVE"
                    ? "border-slate-200 bg-slate-50/70"
                    : "border-slate-200"
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  {/* NOMOR */}
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-600">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  {/* INFORMASI UTAMA */}
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-medium text-slate-400">
                        {question.code}
                      </span>

                      <Badge
                        variant="outline"
                        className={`rounded-md text-[10px] font-medium ${getInputTypeVariant(
                          question.questionType,
                        )}`}
                      >
                        {getInputTypeLabel(question.questionType)}
                      </Badge>

                      <Badge
                        variant="outline"
                        className={`rounded-md text-[10px] ${
                          question.status === "ACTIVE"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-100 text-slate-500"
                        }`}
                      >
                        {getStatusLabel(question.status)}
                      </Badge>
                    </div>

                    <h3 className="text-sm font-semibold leading-relaxed text-slate-800">
                      {question.questionText}
                    </h3>

                    {/* INFORMASI RINGKAS */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                      {question.isRequired && (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="size-3.5 text-emerald-600" />
                          Wajib diisi
                        </span>
                      )}

                      {question.photoRequirement === "REQUIRED" && (
                        <span className="flex items-center gap-1">
                          <Camera className="size-3.5 text-indigo-600" />
                          Wajib foto
                        </span>
                      )}

                      {question.photoRequirement === "CONDITIONAL" && (
                        <span className="flex items-center gap-1">
                          <Camera className="size-3.5 text-amber-600" />
                          Foto kondisional
                        </span>
                      )}

                      <span className="flex items-center gap-1">
                        <MapPin className="size-3.5 text-blue-500" />
                        {question._count?.pointQuestions ?? 0} Patrol Point
                      </span>

                      {question.questionType === "SINGLE_CHOICE" && (
                        <span className="text-slate-400">
                          {question.options?.length ?? 0} pilihan
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex shrink-0 items-center gap-1 border-t border-slate-100 pt-3 sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-md border-blue-200 px-2.5 text-xs text-blue-700 hover:bg-blue-50"
                      disabled={question.status !== "ACTIVE"}
                      onClick={() => handleOpenAssignment(question)}
                    >
                      <Settings2 className="mr-1.5 size-3.5" />
                      Patrol Point
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-md text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                      title="Edit pertanyaan"
                      onClick={() => handleOpenEdit(question)}
                    >
                      <Pencil className="size-4" />
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                      title="Duplikasi pertanyaan"
                      disabled={createQuestionMutation.isPending}
                      onClick={() => handleDuplicateQuestion(question)}
                    >
                      <Copy className="size-4" />
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={`size-8 rounded-md ${
                        question.status === "ACTIVE"
                          ? "text-rose-500 hover:bg-rose-50"
                          : "text-emerald-600 hover:bg-emerald-50"
                      }`}
                      title={
                        question.status === "ACTIVE"
                          ? "Nonaktifkan pertanyaan"
                          : "Aktifkan pertanyaan"
                      }
                      disabled={
                        deactivateQuestionMutation.isPending ||
                        activateQuestionMutation.isPending
                      }
                      onClick={() => handleToggleStatus(question)}
                    >
                      {question.status === "ACTIVE" ? (
                        <Trash2 className="size-4" />
                      ) : (
                        <CheckCircle2 className="size-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <Dialog
        open={isAddModalOpen || Boolean(editingQuestion)}
        onOpenChange={(open) => {
          if (!open) closeFormDialog();
        }}
      >
        <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col gap-0 overflow-hidden rounded p-0">
          <DialogHeader className="border-b border-slate-200 px-6 py-4 text-left">
            <DialogTitle className="text-base font-semibold text-slate-900">
              {editingQuestion
                ? `Edit Pertanyaan ${editingQuestion.code}`
                : "Tambah Pertanyaan Patroli"}
            </DialogTitle>

            <DialogDescription className="text-xs text-slate-500">
              Atur pertanyaan, tipe jawaban, dan konfigurasi checklist.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={editingQuestion ? handleSaveEdit : handleCreateQuestion}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <QuestionFormFields {...formProps} />
            </div>

            <DialogFooter className="border-t border-slate-200 px-6 py-4">
              <Button
                type="button"
                variant="outline"
                className="rounded"
                disabled={isSaving}
                onClick={closeFormDialog}
              >
                Batal
              </Button>

              <Button
                type="submit"
                disabled={isSaving}
                className="rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}

                {editingQuestion ? "Simpan Perubahan" : "Buat Pertanyaan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* =====================================================
          ASSIGN / UNASSIGN PATROL POINT DIALOG
      ===================================================== */}

      <Dialog
        open={Boolean(assignmentQuestion)}
        onOpenChange={(open) => {
          if (!open) handleCloseAssignment();
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto rounded">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="size-5 text-blue-600" />
              Atur Patrol Point
            </DialogTitle>

            <DialogDescription>
              Hubungkan atau lepaskan pertanyaan dari Patrol Point.
            </DialogDescription>
          </DialogHeader>

          {assignmentQuestion && (
            <div className="rounded border border-blue-100 bg-blue-50 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-blue-200 bg-white text-blue-700"
                >
                  {assignmentQuestion.code}
                </Badge>

                <Badge
                  variant="outline"
                  className="border-emerald-200 bg-white text-emerald-700"
                >
                  {getInputTypeLabel(assignmentQuestion.questionType)}
                </Badge>
              </div>

              <p className="mt-2 text-sm font-semibold text-slate-900">
                {assignmentQuestion.questionText}
              </p>
            </div>
          )}

          {/* ASSIGNMENT ERROR */}

          {assignmentError && (
            <div className="flex items-start gap-2 rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>{assignmentError}</span>
            </div>
          )}

          {/* PATROL POINT SELECT */}

          <div className="space-y-2">
            <Label>Pilih Patrol Point</Label>

            {patrolPointsQuery.isLoading ? (
              <div className="flex items-center gap-2 rounded border p-3 text-sm text-slate-500">
                <Loader2 className="size-4 animate-spin" />
                Memuat daftar Patrol Point...
              </div>
            ) : patrolPointsQuery.isError ? (
              <div className="rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                Gagal mengambil data Patrol Point.
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-1 text-rose-700"
                  onClick={() => patrolPointsQuery.refetch()}
                >
                  Coba lagi
                </Button>
              </div>
            ) : activePatrolPoints.length === 0 ? (
              <div className="rounded border border-dashed p-5 text-center text-sm text-slate-500">
                Tidak ada Patrol Point aktif.
              </div>
            ) : (
              <Select
                value={selectedPatrolPointId}
                onValueChange={(value) => handleSelectPatrolPoint(value ?? "")}
                disabled={isAssignmentSaving}
              >
                <SelectTrigger className="rounded">
                  <SelectValue placeholder="Pilih Patrol Point..." />
                </SelectTrigger>

                <SelectContent>
                  {activePatrolPoints.map((point) => (
                    <SelectItem key={point.id} value={point.id}>
                      {point.code} - {point.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <p className="text-xs text-slate-500">
              Hanya Patrol Point dengan status aktif yang dapat menerima
              pertanyaan.
            </p>
          </div>

          {/* ASSIGNMENT STATUS */}

          {selectedPatrolPointId && (
            <div className="space-y-3">
              <div className="border-t border-slate-200 pt-3">
                <p className="text-sm font-semibold text-slate-900">
                  Status Keterhubungan
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Status hubungan pertanyaan pada Patrol Point yang dipilih.
                </p>
              </div>

              {isAssignmentsLoading ? (
                <div className="flex items-center justify-center rounded border p-6 text-sm text-slate-500">
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Memeriksa keterhubungan...
                </div>
              ) : isAssignmentsError ? (
                <div className="rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  Gagal memeriksa hubungan pertanyaan:{" "}
                  {getErrorMessage(pointAssignmentsError)}
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-1 text-rose-700"
                    onClick={() => refetchPointAssignments()}
                  >
                    Coba lagi
                  </Button>
                </div>
              ) : currentAssignment ? (
                <div className="rounded border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <CheckCircle2 className="size-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-emerald-800">
                        Pertanyaan sudah terhubung
                      </p>

                      <p className="mt-1 text-xs text-emerald-700">
                        Pertanyaan ini sudah tersedia pada Patrol Point yang
                        dipilih.
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge className="rounded bg-white text-emerald-700 hover:bg-white">
                          {currentAssignment.patrolPoint?.code ??
                            activePatrolPoints.find(
                              (point) => point.id === selectedPatrolPointId,
                            )?.code}
                        </Badge>

                        <Badge
                          variant="outline"
                          className="border-emerald-300 text-emerald-700"
                        >
                          {currentAssignment.isRequired
                            ? "Wajib Diisi"
                            : "Opsional"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4 w-full rounded border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    disabled={isAssignmentSaving}
                    onClick={handleUnassignQuestion}
                  >
                    {unassignQuestionMutation.isPending ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <Link2Off className="mr-2 size-4" />
                    )}
                    Lepas dari Patrol Point
                  </Button>
                </div>
              ) : (
                <div className="rounded border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                      <Link2 className="size-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-amber-800">
                        Belum terhubung
                      </p>

                      <p className="mt-1 text-xs text-amber-700">
                        Pertanyaan ini belum tersedia pada Patrol Point yang
                        dipilih.
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    className="mt-4 w-full rounded bg-blue-600 text-white hover:bg-blue-700"
                    disabled={isAssignmentSaving}
                    onClick={handleAssignQuestion}
                  >
                    {assignQuestionMutation.isPending ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <Link2 className="mr-2 size-4" />
                    )}
                    Hubungkan ke Patrol Point
                  </Button>
                </div>
              )}
            </div>
          )}

          {!selectedPatrolPointId && (
            <div className="rounded border border-dashed border-slate-300 p-5 text-center">
              <MapPin className="mx-auto size-7 text-slate-300" />

              <p className="mt-2 text-sm font-medium text-slate-700">
                Pilih Patrol Point
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Pilih Patrol Point untuk melihat status hubungan pertanyaan.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded"
              disabled={isAssignmentSaving}
              onClick={handleCloseAssignment}
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =====================================================
          DEACTIVATE CONFIRMATION
      ===================================================== */}

      <AlertDialog
        open={Boolean(deletingQuestion)}
        onOpenChange={(open) => {
          if (!open) setDeletingQuestion(null);
        }}
      >
        <AlertDialogContent className="max-w-md rounded">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-base">
              <Trash2 className="size-5 text-rose-600" />
              Nonaktifkan Pertanyaan?
            </AlertDialogTitle>

            <AlertDialogDescription>
              Pertanyaan ini tidak akan digunakan pada checklist patroli aktif.
              Data pertanyaan dan riwayat jawabannya tetap tersimpan.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deletingQuestion && (
            <div className="rounded border border-slate-200 bg-slate-50 p-3">
              <p className="font-mono text-xs font-semibold text-blue-700">
                {deletingQuestion.code}
              </p>

              <p className="mt-1 text-sm font-medium text-slate-900">
                {deletingQuestion.questionText}
              </p>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel
              className="rounded"
              disabled={deactivateQuestionMutation.isPending}
            >
              Batal
            </AlertDialogCancel>

            <AlertDialogAction
              className="rounded bg-rose-600 text-white hover:bg-rose-700"
              disabled={deactivateQuestionMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                void handleDeleteQuestion();
              }}
            >
              {deactivateQuestionMutation.isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Nonaktifkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
