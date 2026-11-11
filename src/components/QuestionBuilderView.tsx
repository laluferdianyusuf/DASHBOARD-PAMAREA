import React, { useMemo, useState } from "react";

import {
  useActivateQuestion,
  useCreateQuestion,
  useDeactivateQuestion,
  useQuestions,
  useUpdateQuestion,
} from "../hooks/question/useQuestions";

import { usePatrolPoints } from "../hooks/patrol-point/usePatrolPoints";

import type {
  Question as BackendQuestion,
  CreateQuestionPayload,
  PointQuestion as PointQuestionItem,
  UpdateQuestionPayload,
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
  { value: "YES_NO", label: "Ya / Tidak" },
  { value: "SINGLE_CHOICE", label: "Pilihan Ganda" },
  { value: "TEXT", label: "Catatan Teks" },
] as const;

const DEFAULT_OPTIONS: OptionForm[] = [
  { label: "Kondisi Normal / Baik", isSafe: true },
  { label: "Ada Kerusakan / Kendala", isSafe: false },
];

const getInputTypeLabel = (type: string) =>
  INPUT_TYPES.find((item) => item.value === type)?.label ?? type;

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

  if (Array.isArray(message)) return message.join(", ");

  return message || err?.message || "Terjadi kesalahan.";
};

const getTypeStyle = (type: string) => {
  switch (type) {
    case "YES_NO":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "SINGLE_CHOICE":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "TEXT":
      return "bg-slate-100 text-slate-600 border-slate-200";

    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
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

    if (duplicate) {
      toast.error("Pilihan jawaban sudah tersedia.");
      return;
    }

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
    if (formOptions.length <= 2) {
      toast.error("Minimal harus tersedia dua pilihan.");
      return;
    }

    setFormOptions(formOptions.filter((_, i) => i !== index));
  };

  const handleTypeChange = (value: BackendQuestionType) => {
    setFormInputType(value);

    if (value === "SINGLE_CHOICE" && formOptions.length === 0) {
      setFormOptions(DEFAULT_OPTIONS.map((option) => ({ ...option })));
    }
  };

  return (
    <div className="space-y-5">
      {formError && (
        <div className="flex items-start gap-2 rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          {formError}
        </div>
      )}

      <div className="space-y-2">
        <Label>Teks Pertanyaan *</Label>

        <Textarea
          rows={3}
          className="resize-none rounded"
          placeholder="Masukkan teks pertanyaan..."
          value={formText}
          onChange={(e) => setFormText(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Tipe Jawaban *</Label>

        <Select
          value={formInputType}
          onValueChange={(value) =>
            handleTypeChange(value as BackendQuestionType)
          }
        >
          <SelectTrigger className="w-full rounded">
            <SelectValue placeholder="Pilih tipe jawaban" />
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

      {formInputType === "YES_NO" && (
        <div className="space-y-2">
          <Label>Pilihan Jawaban</Label>

          <div className="flex gap-2">
            <Badge className="rounded bg-emerald-50 px-3 py-1.5 text-emerald-700 hover:bg-emerald-50">
              Ya
            </Badge>

            <Badge className="rounded bg-rose-50 px-3 py-1.5 text-rose-700 hover:bg-rose-50">
              Tidak
            </Badge>
          </div>

          <p className="text-xs text-slate-500">
            Pilihan Ya dan Tidak dibuat otomatis oleh sistem.
          </p>
        </div>
      )}

      {formInputType === "SINGLE_CHOICE" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label>Pilihan Jawaban *</Label>
              <p className="mt-1 text-xs text-slate-500">
                Minimal dua pilihan jawaban.
              </p>
            </div>

            <Badge variant="outline" className="rounded">
              {formOptions.length} pilihan
            </Badge>
          </div>

          <div className="divide-y divide-slate-100 border-y border-slate-200">
            {formOptions.map((option, index) => (
              <div key={option.id ?? `new-${index}`} className="py-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 shrink-0 text-xs text-slate-400">
                    {index + 1}.
                  </span>

                  <Input
                    className="h-9 rounded"
                    value={option.label}
                    placeholder="Nama pilihan jawaban"
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
                    size="sm"
                    className="h-9 shrink-0 rounded px-2 text-rose-600 hover:bg-rose-50"
                    disabled={formOptions.length <= 2}
                    onClick={() => handleRemoveOption(index)}
                  >
                    <Trash2 className="mr-1.5 size-3.5" />
                    Hapus
                  </Button>
                </div>

                <label className="mt-2 flex cursor-pointer items-center gap-2 pl-8">
                  <Checkbox
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
                    Jawaban menunjukkan kondisi aman
                  </span>

                  {option.isSafe && (
                    <Badge className="rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                      Aman
                    </Badge>
                  )}
                </label>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              className="h-9 rounded"
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
              className="h-9 shrink-0 rounded"
              onClick={handleAddOption}
            >
              <Plus className="mr-1.5 size-4" />
              Tambah
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3 border-t border-slate-200 pt-4">
        <Label>Pengaturan Pertanyaan</Label>

        <label className="flex cursor-pointer items-start gap-3">
          <Checkbox
            checked={formRequired}
            onCheckedChange={(checked) => setFormRequired(checked === true)}
          />

          <span>
            <span className="block text-sm font-medium text-slate-800">
              Wajib diisi
            </span>
            <span className="text-xs text-slate-500">
              Petugas harus mengisi pertanyaan ini.
            </span>
          </span>
        </label>

        <label className="flex cursor-pointer items-start gap-3">
          <Checkbox
            checked={formRequirePhoto}
            onCheckedChange={(checked) => setFormRequirePhoto(checked === true)}
          />

          <span>
            <span className="block text-sm font-medium text-slate-800">
              Wajib lampirkan foto
            </span>
            <span className="text-xs text-slate-500">
              Petugas harus melampirkan foto sebagai bukti pemeriksaan.
            </span>
          </span>
        </label>
      </div>

      <div className="flex items-start gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
        <Info className="mt-0.5 size-4 shrink-0" />
        <p>
          Perubahan pertanyaan akan menggunakan kode dan ID yang sama. Jawaban
          patrol lama tidak otomatis dikonversi.
        </p>
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

  const createQuestionMutation = useCreateQuestion();
  const updateQuestionMutation = useUpdateQuestion();
  const deactivateQuestionMutation = useDeactivateQuestion();
  const activateQuestionMutation = useActivateQuestion();

  const assignQuestionMutation = useAssignQuestion();
  const unassignQuestionMutation = useUnassignQuestion();

  const questions = useMemo<BackendQuestion[]>(() => {
    return Array.isArray(questionsData) ? questionsData : [];
  }, [questionsData]);

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

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInputType, setSelectedInputType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [editingQuestion, setEditingQuestion] =
    useState<BackendQuestion | null>(null);

  const [deletingQuestion, setDeletingQuestion] =
    useState<BackendQuestion | null>(null);

  const [assignmentQuestion, setAssignmentQuestion] =
    useState<BackendQuestion | null>(null);

  const [selectedPatrolPointId, setSelectedPatrolPointId] = useState("");
  const [assignmentError, setAssignmentError] = useState<string | null>(null);

  const [formText, setFormText] = useState("");
  const [formInputType, setFormInputType] =
    useState<BackendQuestionType>("YES_NO");

  const [formOptions, setFormOptions] = useState<OptionForm[]>(DEFAULT_OPTIONS);

  const [newOptionInput, setNewOptionInput] = useState("");

  const [formRequired, setFormRequired] = useState(true);
  const [formRequirePhoto, setFormRequirePhoto] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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

  const currentAssignment = useMemo(() => {
    if (!assignmentQuestion) return undefined;

    return pointAssignments.find(
      (item) => item.questionId === assignmentQuestion.id,
    );
  }, [pointAssignments, assignmentQuestion]);

  const isSaving =
    createQuestionMutation.isPending || updateQuestionMutation.isPending;

  const isAssignmentSaving =
    assignQuestionMutation.isPending || unassignQuestionMutation.isPending;

  const resetForm = () => {
    setFormText("");
    setFormInputType("YES_NO");
    setFormOptions(DEFAULT_OPTIONS.map((option) => ({ ...option })));
    setNewOptionInput("");
    setFormRequired(true);
    setFormRequirePhoto(false);
    setFormError(null);
  };

  const closeFormDialog = () => {
    if (isSaving) return;

    setIsAddModalOpen(false);
    setEditingQuestion(null);
    resetForm();
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

  const validateForm = () => {
    if (!formText.trim()) {
      setFormError("Teks pertanyaan wajib diisi.");
      return false;
    }

    if (formInputType === "SINGLE_CHOICE") {
      const validOptions = formOptions.filter((option) => option.label.trim());

      if (validOptions.length < 2) {
        setFormError("Minimal harus tersedia dua pilihan jawaban.");
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

  const getQuestionPayload = () => ({
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
  });

  const handleCreateQuestion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const payload = getQuestionPayload() as CreateQuestionPayload;

      const result = await createQuestionMutation.mutateAsync(payload);

      toast.success(`Pertanyaan ${result?.code ?? ""} berhasil ditambahkan.`);

      setIsAddModalOpen(false);
      resetForm();

      await refetch();
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
      const payload = getQuestionPayload() as UpdateQuestionPayload;

      await updateQuestionMutation.mutateAsync({
        id: editingQuestion.id,
        payload,
      });

      toast.success(`Pertanyaan ${editingQuestion.code} berhasil diperbarui.`);

      setEditingQuestion(null);
      resetForm();

      await refetch();
    } catch (error) {
      toast.error("Gagal memperbarui pertanyaan", {
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

      await refetch();
    } catch (error) {
      toast.error("Gagal menduplikasi pertanyaan", {
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
      await refetch();
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

      await refetch();
    } catch (error) {
      toast.error("Gagal mengubah status pertanyaan", {
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

      toast.success("Pertanyaan berhasil dihubungkan.");
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

    try {
      await unassignQuestionMutation.mutateAsync(currentAssignment.id);

      await refetchPointAssignments();

      toast.success("Pertanyaan berhasil dilepas dari Patrol Point.");
    } catch (error) {
      toast.error("Gagal melepas pertanyaan", {
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
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-3 border-b pb-5 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Question Builder
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Kelola pertanyaan checklist pemeriksaan patroli.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded"
            disabled={isFetching}
            onClick={() => refetch()}
          >
            <RefreshCw
              className={`mr-2 size-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          <Button
            type="button"
            className="h-9 rounded bg-[#FED400] text-black hover:bg-[#e9c300]"
            onClick={handleOpenAdd}
          >
            <Plus className="mr-2 size-4" />
            Tambah Pertanyaan
          </Button>
        </div>
      </div>

      {/* FILTER */}
      <div className="grid gap-3 md:grid-cols-3">
        <InputGroup className="rounded">
          <InputGroupAddon>
            <Search className="size-4 text-slate-400" />
          </InputGroupAddon>

          <InputGroupInput
            placeholder="Cari pertanyaan atau kode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </InputGroup>

        <Select
          value={selectedInputType}
          onValueChange={(value) => setSelectedInputType(value ?? "all")}
        >
          <SelectTrigger className="w-full rounded">
            <SelectValue placeholder="Semua tipe jawaban">
              {selectedInputType === "all"
                ? "Semua tipe jawaban"
                : getInputTypeLabel(selectedInputType)}
            </SelectValue>
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">Semua tipe jawaban</SelectItem>

            {INPUT_TYPES.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedStatus}
          onValueChange={(value) => setSelectedStatus(value ?? "all")}
        >
          <SelectTrigger className="w-full rounded">
            <SelectValue placeholder="Semua status">
              {selectedStatus === "all"
                ? "Semua status"
                : selectedStatus === "ACTIVE"
                  ? "Aktif"
                  : "Nonaktif"}
            </SelectValue>
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">Semua status</SelectItem>
            <SelectItem value="ACTIVE">Aktif</SelectItem>
            <SelectItem value="INACTIVE">Nonaktif</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* LIST SUMMARY */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <p className="text-sm text-slate-600">
          Menampilkan{" "}
          <span className="font-semibold text-slate-900">
            {filteredQuestions.length}
          </span>{" "}
          dari {questions.length} pertanyaan
        </p>

        {(searchQuery ||
          selectedInputType !== "all" ||
          selectedStatus !== "all") && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 rounded text-xs text-slate-500"
            onClick={() => {
              setSearchQuery("");
              setSelectedInputType("all");
              setSelectedStatus("all");
            }}
          >
            <X className="mr-1.5 size-3.5" />
            Reset Filter
          </Button>
        )}
      </div>

      {/* LOADING */}
      {isLoading && (
        <div className="flex items-center justify-center py-16 text-sm text-slate-500">
          <Loader2 className="mr-2 size-5 animate-spin" />
          Memuat pertanyaan...
        </div>
      )}

      {/* ERROR */}
      {isError && !isLoading && (
        <div className="py-12 text-center">
          <AlertTriangle className="mx-auto size-8 text-rose-500" />

          <p className="mt-3 text-sm font-semibold text-slate-800">
            Gagal memuat pertanyaan
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {getErrorMessage(error)}
          </p>

          <Button
            type="button"
            variant="outline"
            size="sm"
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
        <div className="divide-y divide-slate-200 border-y border-slate-200">
          {filteredQuestions.length === 0 ? (
            <div className="py-16 text-center">
              <Search className="mx-auto size-8 text-slate-300" />

              <p className="mt-3 text-sm font-medium text-slate-700">
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
                className={`flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between ${
                  question.status !== "ACTIVE" ? "opacity-60" : ""
                }`}
              >
                <div className="flex min-w-0 flex-1 gap-3">
                  <span className="pt-0.5 text-sm font-medium tabular-nums text-slate-400">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-slate-400">
                        {question.code}
                      </span>

                      <Badge
                        variant="outline"
                        className={`rounded px-2 py-0 text-[10px] ${getTypeStyle(
                          question.questionType,
                        )}`}
                      >
                        {getInputTypeLabel(question.questionType)}
                      </Badge>

                      <Badge
                        variant="outline"
                        className={`rounded px-2 py-0 text-[10px] ${
                          question.status === "ACTIVE"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-100 text-slate-500"
                        }`}
                      >
                        {question.status === "ACTIVE" ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </div>

                    <p className="text-sm font-medium leading-relaxed text-slate-800">
                      {question.questionText}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>
                        {question.isRequired ? "Wajib diisi" : "Opsional"}
                      </span>

                      <span className="flex items-center gap-1">
                        <Camera className="size-3.5" />
                        {question.photoRequirement === "REQUIRED"
                          ? "Wajib foto"
                          : question.photoRequirement === "CONDITIONAL"
                            ? "Foto kondisional"
                            : "Foto opsional"}
                      </span>

                      <span className="flex items-center gap-1">
                        <MapPin className="size-3.5" />
                        {question._count?.pointQuestions ?? 0} Patrol Point
                      </span>

                      {question.questionType === "SINGLE_CHOICE" && (
                        <span>{question.options?.length ?? 0} pilihan</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1 border-t border-slate-100 pt-2 sm:border-0 sm:pt-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded px-2.5 text-xs text-blue-700 hover:bg-blue-50"
                    disabled={question.status !== "ACTIVE"}
                    onClick={() => handleOpenAssignment(question)}
                  >
                    <Settings2 className="mr-1.5 size-3.5" />
                    Tautkan Area
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded px-2.5 text-xs text-slate-600 hover:bg-slate-100"
                    onClick={() => handleOpenEdit(question)}
                  >
                    <Pencil className="mr-1.5 size-3.5" />
                    Edit
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded px-2.5 text-xs text-slate-600 hover:bg-slate-100"
                    disabled={createQuestionMutation.isPending}
                    onClick={() => handleDuplicateQuestion(question)}
                  >
                    <Copy className="mr-1.5 size-3.5" />
                    Duplikasi
                  </Button>

                  {question.status === "ACTIVE" ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded px-2.5 text-xs text-rose-600 hover:bg-rose-50"
                      onClick={() => setDeletingQuestion(question)}
                    >
                      <Trash2 className="mr-1.5 size-3.5" />
                      Nonaktifkan
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded px-2.5 text-xs text-emerald-700 hover:bg-emerald-50"
                      disabled={activateQuestionMutation.isPending}
                      onClick={() => handleToggleStatus(question)}
                    >
                      <CheckCircle2 className="mr-1.5 size-3.5" />
                      Aktifkan
                    </Button>
                  )}
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
        <DialogContent className="flex max-h-[90vh] max-w-xl flex-col gap-0 overflow-hidden rounded-lg p-0">
          <DialogHeader className="border-b px-5 py-4 text-left">
            <DialogTitle className="text-base font-semibold">
              {editingQuestion
                ? `Edit Pertanyaan ${editingQuestion.code}`
                : "Tambah Pertanyaan"}
            </DialogTitle>

            <DialogDescription className="text-xs">
              Atur teks pertanyaan, tipe jawaban, dan pengaturannya.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={editingQuestion ? handleSaveEdit : handleCreateQuestion}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
              {editingQuestion && (
                <div className="flex items-start gap-2 border-b border-amber-100 pb-3 text-xs text-amber-700">
                  <Info className="mt-0.5 size-4 shrink-0" />
                  <p>
                    Perubahan akan diterapkan pada pertanyaan dengan kode{" "}
                    <strong>{editingQuestion.code}</strong>. Jawaban lama tidak
                    otomatis dikonversi ke format baru.
                  </p>
                </div>
              )}

              <QuestionFormFields {...formProps} />
            </div>

            <DialogFooter className="border-t px-5 py-3">
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
                className="rounded bg-blue-600 text-white hover:bg-blue-700"
                disabled={isSaving}
              >
                {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}

                {editingQuestion ? "Simpan Perubahan" : "Buat Pertanyaan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(assignmentQuestion)}
        onOpenChange={(open) => {
          if (!open) handleCloseAssignment();
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Settings2 className="size-5 text-blue-600" />
              Pengaturan Patrol Point
            </DialogTitle>

            <DialogDescription>
              Atur hubungan pertanyaan dengan Patrol Point.
            </DialogDescription>
          </DialogHeader>

          {assignmentQuestion && (
            <div className="border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-slate-400">
                  {assignmentQuestion.code}
                </span>

                <Badge
                  variant="outline"
                  className={`rounded ${getTypeStyle(
                    assignmentQuestion.questionType,
                  )}`}
                >
                  {getInputTypeLabel(assignmentQuestion.questionType)}
                </Badge>
              </div>

              <p className="mt-2 text-sm font-medium text-slate-800">
                {assignmentQuestion.questionText}
              </p>
            </div>
          )}

          {assignmentError && (
            <div className="flex items-start gap-2 text-sm text-rose-600">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              {assignmentError}
            </div>
          )}

          <div className="space-y-2">
            <Label>Pilih Patrol Point</Label>

            {patrolPointsQuery.isLoading ? (
              <div className="flex items-center gap-2 py-3 text-sm text-slate-500">
                <Loader2 className="size-4 animate-spin" />
                Memuat Patrol Point...
              </div>
            ) : patrolPointsQuery.isError ? (
              <div className="text-sm text-rose-600">
                Gagal mengambil data Patrol Point.
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-1"
                  onClick={() => patrolPointsQuery.refetch()}
                >
                  Coba lagi
                </Button>
              </div>
            ) : activePatrolPoints.length === 0 ? (
              <p className="py-3 text-sm text-slate-500">
                Tidak ada Patrol Point aktif.
              </p>
            ) : (
              <Select
                value={selectedPatrolPointId}
                onValueChange={(value) => {
                  setSelectedPatrolPointId(value ?? "");
                  setAssignmentError(null);
                }}
                disabled={isAssignmentSaving}
              >
                <SelectTrigger className="w-full rounded">
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
          </div>

          {selectedPatrolPointId && (
            <div className="border-t border-slate-200 pt-4">
              {isAssignmentsLoading ? (
                <div className="flex items-center gap-2 py-4 text-sm text-slate-500">
                  <Loader2 className="size-4 animate-spin" />
                  Memeriksa hubungan pertanyaan...
                </div>
              ) : isAssignmentsError ? (
                <div className="text-sm text-rose-600">
                  {getErrorMessage(pointAssignmentsError)}

                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-1"
                    onClick={() => refetchPointAssignments()}
                  >
                    Coba lagi
                  </Button>
                </div>
              ) : currentAssignment ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-5 text-emerald-600" />

                    <div>
                      <p className="text-sm font-medium text-emerald-700">
                        Pertanyaan sudah terhubung
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Pertanyaan tersedia pada Patrol Point ini.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <MapPin className="size-3.5" />

                    {currentAssignment.patrolPoint?.code ??
                      activePatrolPoints.find(
                        (point) => point.id === selectedPatrolPointId,
                      )?.code}

                    <span>•</span>

                    {currentAssignment.isRequired ? "Wajib diisi" : "Opsional"}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded text-rose-600 hover:bg-rose-50"
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
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Info className="mt-0.5 size-5 text-amber-600" />

                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        Belum terhubung
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Pertanyaan belum tersedia pada Patrol Point ini.
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    className="w-full rounded bg-blue-600 text-white hover:bg-blue-700"
                    disabled={isAssignmentSaving}
                    onClick={handleAssignQuestion}
                  >
                    {assignQuestionMutation.isPending ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <Link2 className="mr-2 size-4" />
                    )}
                    Hubungkan Pertanyaan
                  </Button>
                </div>
              )}
            </div>
          )}

          {!selectedPatrolPointId && (
            <p className="border-t border-slate-100 pt-3 text-xs text-slate-500">
              Pilih Patrol Point untuk melihat status hubungan pertanyaan.
            </p>
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

      <AlertDialog
        open={Boolean(deletingQuestion)}
        onOpenChange={(open) => {
          if (!open) setDeletingQuestion(null);
        }}
      >
        <AlertDialogContent className="max-w-md rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-base">
              <Trash2 className="size-5 text-rose-600" />
              Nonaktifkan Pertanyaan?
            </AlertDialogTitle>

            <AlertDialogDescription>
              Pertanyaan tidak akan digunakan pada checklist patroli berikutnya.
              Data pertanyaan dan riwayat jawaban tetap tersimpan.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deletingQuestion && (
            <div className="border-y border-slate-200 py-3">
              <p className="font-mono text-xs text-slate-400">
                {deletingQuestion.code}
              </p>

              <p className="mt-1 text-sm font-medium text-slate-800">
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
              Ya, Nonaktifkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
