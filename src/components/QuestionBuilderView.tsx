import React, { useState } from "react";
import { CHECKPOINTS, INITIAL_PATROL_QUESTIONS } from "../data/mockData";
import {
  PatrolQuestionItem,
  reorderPatrolQuestions,
  validatePatrolQuestion,
} from "../utils/security-logic";

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
  ArrowDown,
  ArrowUp,
  Camera,
  CheckCircle2,
  Copy,
  Info,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

const CATEGORIES = [
  "K3 & Proteksi Kebakaran",
  "Akses & Pintu Darurat",
  "Utilitas, Panel & Genset",
  "Perimeter & Pagar Pengaman",
  "Logistik & Area Dermaga",
  "Peralatan & Aset Vital",
];

const INPUT_TYPES = [
  { value: "boolean", label: "Ya / Tidak" },
  { value: "multiple_choice", label: "Pilihan Ganda" },
  { value: "numeric", label: "Angka / Nilai Meteran" },
  { value: "rating", label: "Rating 1–5" },
  { value: "text", label: "Catatan Teks" },
];

const SEVERITIES = [
  { value: "Kritis", label: "Kritis" },
  { value: "Tinggi", label: "Tinggi" },
  { value: "Sedang", label: "Sedang" },
  { value: "Rendah", label: "Rendah" },
];

const DEFAULT_OPTIONS = ["Kondisi Normal / Baik", "Ada Kerusakan / Kendala"];

const getInputTypeLabel = (type: string) => {
  return INPUT_TYPES.find((item) => item.value === type)?.label || type;
};

const getInputTypeVariant = (type: string) => {
  switch (type) {
    case "boolean":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "numeric":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "multiple_choice":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "rating":
      return "bg-cyan-50 text-cyan-700 border-cyan-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

interface QuestionFormProps {
  categories: string[];
  formCategory: string;
  setFormCategory: (value: string) => void;
  formText: string;
  setFormText: (value: string) => void;
  formDesc: string;
  setFormDesc: (value: string) => void;
  formInputType: PatrolQuestionItem["inputType"];
  setFormInputType: (value: PatrolQuestionItem["inputType"]) => void;
  formOptions: string[];
  setFormOptions: (value: string[]) => void;
  newOptionInput: string;
  setNewOptionInput: (value: string) => void;
  formUnit: string;
  setFormUnit: (value: string) => void;
  formMinVal: number;
  setFormMinVal: (value: number) => void;
  formMaxVal: number;
  setFormMaxVal: (value: number) => void;
  formRequired: boolean;
  setFormRequired: (value: boolean) => void;
  formRequirePhoto: boolean;
  setFormRequirePhoto: (value: boolean) => void;
  formAutoFinding: boolean;
  setFormAutoFinding: (value: boolean) => void;
  formSeverity: PatrolQuestionItem["findingSeverity"];
  setFormSeverity: (value: PatrolQuestionItem["findingSeverity"]) => void;
  formAssignedCp: string[];
  setFormAssignedCp: (value: string[]) => void;
  formError: string | null;
  setFormError: (value: string | null) => void;
}

const QuestionFormFields: React.FC<QuestionFormProps> = ({
  categories,
  formCategory,
  setFormCategory,
  formText,
  setFormText,
  formDesc,
  setFormDesc,
  formInputType,
  setFormInputType,
  formOptions,
  setFormOptions,
  newOptionInput,
  setNewOptionInput,
  formUnit,
  setFormUnit,
  formMinVal,
  setFormMinVal,
  formMaxVal,
  setFormMaxVal,
  formRequired,
  setFormRequired,
  formRequirePhoto,
  setFormRequirePhoto,
  formAutoFinding,
  setFormAutoFinding,
  formSeverity,
  setFormSeverity,
  formAssignedCp,
  setFormAssignedCp,
  formError,
  setFormError,
}) => {
  const handleAddOption = () => {
    if (!newOptionInput.trim()) return;

    setFormOptions([...formOptions, newOptionInput.trim()]);
    setNewOptionInput("");
  };

  const handleRemoveOption = (index: number) => {
    if (formOptions.length <= 2) {
      setFormError("Minimal harus ada 2 opsi pilihan.");
      return;
    }

    setFormOptions(formOptions.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-5">
      {formError && (
        <div className="flex items-start gap-2 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 rounded">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label>Kategori Pemeriksaan *</Label>
          <Select
            value={formCategory}
            onValueChange={(value) => setFormCategory(value as string)}
          >
            <SelectTrigger className="rounded">
              <SelectValue placeholder="Pilih kategori" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Teks Pertanyaan *</Label>
          <Input
            className="rounded"
            required
            placeholder="Contoh: Apakah jalur evakuasi bebas dari halangan?"
            value={formText}
            onChange={(e) => setFormText(e.target.value)}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Petunjuk Pemeriksaan / SOP</Label>
          <Textarea
            className="rounded"
            rows={3}
            placeholder="Instruksi detail untuk petugas saat melakukan pemeriksaan..."
            value={formDesc}
            onChange={(e) => setFormDesc(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Tipe Input Jawaban *</Label>
          <Select
            value={formInputType}
            onValueChange={(value) =>
              setFormInputType(value as PatrolQuestionItem["inputType"])
            }
          >
            <SelectTrigger className="rounded">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="boolean">Ya / Tidak</SelectItem>
              <SelectItem value="multiple_choice">Pilihan Ganda</SelectItem>
              <SelectItem value="numeric">Angka / Nilai Meteran</SelectItem>
              <SelectItem value="rating">Rating 1–5</SelectItem>
              <SelectItem value="text">Catatan Teks</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Tingkat Keparahan Temuan</Label>
          <Select
            value={formSeverity}
            onValueChange={(value) =>
              setFormSeverity(value as PatrolQuestionItem["findingSeverity"])
            }
          >
            <SelectTrigger className="rounded">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SEVERITIES.map((severity) => (
                <SelectItem key={severity.value} value={severity.value}>
                  {severity.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {formInputType === "multiple_choice" && (
        <div className="space-y-3 border border-slate-200 p-4 rounded">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Pilihan Jawaban
            </p>
            <p className="text-xs text-slate-500">
              Minimal harus tersedia dua pilihan.
            </p>
          </div>

          <div className="space-y-2">
            {formOptions.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="w-6 text-center text-xs text-slate-400">
                  {index + 1}.
                </span>
                <Input
                  className="rounded"
                  value={option}
                  onChange={(e) => {
                    const updated = [...formOptions];
                    updated[index] = e.target.value;
                    setFormOptions(updated);
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded text-rose-600"
                  onClick={() => handleRemoveOption(index)}
                >
                  <X className="size-4" />
                </Button>
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

      {formInputType === "numeric" && (
        <div className="space-y-3 border border-slate-200 p-4 rounded">
          <p className="text-sm font-semibold text-slate-900">
            Pengaturan Nilai
          </p>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Satuan</Label>
              <Input
                className="rounded"
                placeholder="°C"
                value={formUnit}
                onChange={(e) => setFormUnit(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Minimum</Label>
              <Input
                className="rounded"
                type="number"
                value={formMinVal}
                onChange={(e) => setFormMinVal(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label>Maksimum</Label>
              <Input
                className="rounded"
                type="number"
                value={formMaxVal}
                onChange={(e) => setFormMaxVal(Number(e.target.value))}
              />
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3 border border-slate-200 p-4 rounded">
        <p className="text-sm font-semibold text-slate-900">
          Pengaturan Pertanyaan
        </p>

        <div className="space-y-3">
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
              onCheckedChange={(checked) =>
                setFormRequirePhoto(checked === true)
              }
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

          <label className="flex cursor-pointer items-start gap-3">
            <Checkbox
              className="rounded"
              checked={formAutoFinding}
              onCheckedChange={(checked) =>
                setFormAutoFinding(checked === true)
              }
            />
            <span>
              <span className="block text-sm font-medium text-slate-800">
                Otomatis Membuat Temuan
              </span>
              <span className="block text-xs text-slate-500">
                Buat tiket temuan saat jawaban menunjukkan anomali.
              </span>
            </span>
          </label>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <Label>Alokasi Checkpoint</Label>
          <p className="mt-1 text-xs text-slate-500">
            Tentukan titik patroli yang menggunakan pertanyaan ini.
          </p>
        </div>

        <div className="max-h-48 space-y-3 overflow-y-auto border border-slate-200 p-3 rounded">
          <label className="flex cursor-pointer items-center gap-3 border-b border-slate-100 pb-3">
            <Checkbox
              className="rounded"
              checked={formAssignedCp.includes("all")}
              onCheckedChange={(checked) => {
                setFormAssignedCp(checked === true ? ["all"] : []);
              }}
            />
            <span className="text-sm font-semibold text-slate-900">
              Berlaku untuk semua checkpoint
            </span>
          </label>

          {CHECKPOINTS.map((checkpoint) => {
            const checked = formAssignedCp.includes(checkpoint.id);
            const allSelected = formAssignedCp.includes("all");

            return (
              <label
                key={checkpoint.id}
                className="flex cursor-pointer items-start gap-3"
              >
                <Checkbox
                  className="rounded"
                  checked={checked}
                  disabled={allSelected}
                  onCheckedChange={(value) => {
                    if (value === true) {
                      setFormAssignedCp([
                        ...formAssignedCp.filter((id) => id !== "all"),
                        checkpoint.id,
                      ]);
                    } else {
                      setFormAssignedCp(
                        formAssignedCp.filter((id) => id !== checkpoint.id),
                      );
                    }
                  }}
                />
                <span className="text-sm text-slate-700">
                  <span className="font-mono text-xs text-slate-500">
                    {checkpoint.id}
                  </span>
                  {" - "}
                  {checkpoint.name}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const QuestionBuilderView: React.FC = () => {
  const [questions, setQuestions] = useState<PatrolQuestionItem[]>(
    INITIAL_PATROL_QUESTIONS,
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedInputType, setSelectedInputType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] =
    useState<PatrolQuestionItem | null>(null);
  const [deletingQuestion, setDeletingQuestion] =
    useState<PatrolQuestionItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [formCategory, setFormCategory] = useState(CATEGORIES[0]);
  const [formText, setFormText] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formInputType, setFormInputType] =
    useState<PatrolQuestionItem["inputType"]>("boolean");
  const [formOptions, setFormOptions] = useState<string[]>(DEFAULT_OPTIONS);
  const [newOptionInput, setNewOptionInput] = useState("");
  const [formUnit, setFormUnit] = useState("°C");
  const [formMinVal, setFormMinVal] = useState(20);
  const [formMaxVal, setFormMaxVal] = useState(60);
  const [formRequired, setFormRequired] = useState(true);
  const [formRequirePhoto, setFormRequirePhoto] = useState(false);
  const [formAutoFinding, setFormAutoFinding] = useState(true);
  const [formSeverity, setFormSeverity] =
    useState<PatrolQuestionItem["findingSeverity"]>("Tinggi");
  const [formAssignedCp, setFormAssignedCp] = useState<string[]>(["all"]);
  const [formError, setFormError] = useState<string | null>(null);

  const filteredQuestions = questions.filter((question) => {
    if (selectedCategory !== "all" && question.category !== selectedCategory) {
      return false;
    }

    if (
      selectedInputType !== "all" &&
      question.inputType !== selectedInputType
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
        question.questionText,
        question.description,
        question.category,
      ].some((value) => value.toLowerCase().includes(query));

      if (!match) return false;
    }

    return true;
  });

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const resetForm = () => {
    setFormCategory(CATEGORIES[0]);
    setFormText("");
    setFormDesc("");
    setFormInputType("boolean");
    setFormOptions(DEFAULT_OPTIONS);
    setNewOptionInput("");
    setFormUnit("°C");
    setFormMinVal(20);
    setFormMaxVal(60);
    setFormRequired(true);
    setFormRequirePhoto(false);
    setFormAutoFinding(true);
    setFormSeverity("Tinggi");
    setFormAssignedCp(["all"]);
    setFormError(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (question: PatrolQuestionItem) => {
    setEditingQuestion(question);
    setFormCategory(question.category);
    setFormText(question.questionText);
    setFormDesc(question.description);
    setFormInputType(question.inputType);
    setFormOptions(
      question.options?.length ? [...question.options] : DEFAULT_OPTIONS,
    );
    setNewOptionInput("");
    setFormUnit(question.unit || "°C");
    setFormMinVal(question.minVal ?? 20);
    setFormMaxVal(question.maxVal ?? 60);
    setFormRequired(question.required);
    setFormRequirePhoto(question.requirePhoto);
    setFormAutoFinding(question.autoTriggerFinding);
    setFormSeverity(question.findingSeverity);
    setFormAssignedCp([...question.assignedCheckpoints]);
    setFormError(null);
  };

  const closeFormDialog = () => {
    setIsAddModalOpen(false);
    setEditingQuestion(null);
    setFormError(null);
  };

  const buildPayload = (): Partial<PatrolQuestionItem> => ({
    questionText: formText,
    category: formCategory,
    inputType: formInputType,
    options:
      formInputType === "multiple_choice" || formInputType === "checklist"
        ? formOptions
        : undefined,
    minVal: formInputType === "numeric" ? formMinVal : undefined,
    maxVal: formInputType === "numeric" ? formMaxVal : undefined,
  });

  const handleCreateQuestion = (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validatePatrolQuestion(buildPayload());

    if (!validation.valid) {
      setFormError(validation.error || "Data tidak valid.");
      return;
    }

    const newQuestion: PatrolQuestionItem = {
      id: `Q-${String(questions.length + 1).padStart(3, "0")}`,
      category: formCategory,
      questionText: formText.trim(),
      description: formDesc.trim(),
      inputType: formInputType,
      options:
        formInputType === "multiple_choice" || formInputType === "checklist"
          ? formOptions
          : undefined,
      unit: formInputType === "numeric" ? formUnit : undefined,
      minVal: formInputType === "numeric" ? formMinVal : undefined,
      maxVal: formInputType === "numeric" ? formMaxVal : undefined,
      required: formRequired,
      requirePhoto: formRequirePhoto,
      autoTriggerFinding: formAutoFinding,
      findingSeverity: formSeverity,
      assignedCheckpoints: formAssignedCp.length > 0 ? formAssignedCp : ["all"],
      status: "Aktif",
      order: questions.length + 1,
    };

    setQuestions([...questions, newQuestion]);
    closeFormDialog();
    resetForm();
    showToast(`Pertanyaan ${newQuestion.id} berhasil ditambahkan.`);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingQuestion) return;

    const validation = validatePatrolQuestion(buildPayload());

    if (!validation.valid) {
      setFormError(validation.error || "Data tidak valid.");
      return;
    }

    const updated: PatrolQuestionItem = {
      ...editingQuestion,
      category: formCategory,
      questionText: formText.trim(),
      description: formDesc.trim(),
      inputType: formInputType,
      options:
        formInputType === "multiple_choice" || formInputType === "checklist"
          ? formOptions
          : undefined,
      unit: formInputType === "numeric" ? formUnit : undefined,
      minVal: formInputType === "numeric" ? formMinVal : undefined,
      maxVal: formInputType === "numeric" ? formMaxVal : undefined,
      required: formRequired,
      requirePhoto: formRequirePhoto,
      autoTriggerFinding: formAutoFinding,
      findingSeverity: formSeverity,
      assignedCheckpoints: formAssignedCp.length > 0 ? formAssignedCp : ["all"],
    };

    setQuestions((previous) =>
      previous.map((question) =>
        question.id === updated.id ? updated : question,
      ),
    );

    setEditingQuestion(null);
    showToast(`Pertanyaan ${updated.id} berhasil diperbarui.`);
  };

  const handleDeleteQuestion = () => {
    if (!deletingQuestion) return;

    setQuestions((previous) =>
      previous.filter((question) => question.id !== deletingQuestion.id),
    );

    showToast(`Pertanyaan ${deletingQuestion.id} berhasil dihapus.`);
    setDeletingQuestion(null);
  };

  const handleDuplicateQuestion = (question: PatrolQuestionItem) => {
    const duplicated: PatrolQuestionItem = {
      ...question,
      id: `Q-${String(questions.length + 1).padStart(3, "0")}`,
      questionText: `${question.questionText} (Salinan)`,
      order: questions.length + 1,
    };

    setQuestions([...questions, duplicated]);
    showToast(`Pertanyaan diduplikasi sebagai ${duplicated.id}.`);
  };

  const handleToggleStatus = (id: string) => {
    setQuestions((previous) =>
      previous.map((question) =>
        question.id === id
          ? {
              ...question,
              status: question.status === "Aktif" ? "Nonaktif" : "Aktif",
            }
          : question,
      ),
    );
  };

  const handleMoveOrder = (id: string, direction: "up" | "down") => {
    setQuestions(reorderPatrolQuestions(questions, id, direction));
  };

  const totalQuestions = questions.length;
  const activeQuestions = questions.filter(
    (question) => question.status === "Aktif",
  ).length;
  const photoRequiredCount = questions.filter(
    (question) => question.requirePhoto,
  ).length;
  const autoFindingCount = questions.filter(
    (question) => question.autoTriggerFinding,
  ).length;

  const formProps: QuestionFormProps = {
    categories: CATEGORIES,
    formCategory,
    setFormCategory,
    formText,
    setFormText,
    formDesc,
    setFormDesc,
    formInputType,
    setFormInputType,
    formOptions,
    setFormOptions,
    newOptionInput,
    setNewOptionInput,
    formUnit,
    setFormUnit,
    formMinVal,
    setFormMinVal,
    formMaxVal,
    setFormMaxVal,
    formRequired,
    setFormRequired,
    formRequirePhoto,
    setFormRequirePhoto,
    formAutoFinding,
    setFormAutoFinding,
    formSeverity,
    setFormSeverity,
    formAssignedCp,
    setFormAssignedCp,
    formError,
    setFormError,
  };

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toastMessage && (
        <div className="flex items-center justify-between gap-3 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 rounded">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0" />
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

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              Question Builder
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Kelola pertanyaan checklist pemeriksaan patroli.
          </p>
        </div>

        <Button
          onClick={handleOpenAdd}
          className="rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          <Plus className="mr-2 size-4" />
          Tambah Pertanyaan
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3 border border-slate-200 bg-white p-4 rounded">
        <div className="grid gap-3 lg:grid-cols-4">
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
            value={selectedCategory}
            onValueChange={(value) => setSelectedCategory(value as string)}
          >
            <SelectTrigger className="rounded w-full">
              <SelectValue placeholder="Semua Kategori" />
            </SelectTrigger>
            <SelectContent className={`w-full`}>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedInputType}
            onValueChange={(value) => setSelectedInputType(value as string)}
          >
            <SelectTrigger className="rounded w-full">
              <SelectValue placeholder="Semua Tipe Input" />
            </SelectTrigger>
            <SelectContent className={`w-full`}>
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
            onValueChange={(value) => setSelectedStatus(value as string)}
          >
            <SelectTrigger className="rounded w-full">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent className={`w-full`}>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="Aktif">Aktif</SelectItem>
              <SelectItem value="Nonaktif">Nonaktif</SelectItem>
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

          {(searchQuery ||
            selectedCategory !== "all" ||
            selectedInputType !== "all" ||
            selectedStatus !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 rounded text-xs text-slate-500"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setSelectedInputType("all");
                setSelectedStatus("all");
              }}
            >
              Reset Filter
            </Button>
          )}
        </div>
      </div>

      {/* Question List */}
      <div className="space-y-3">
        {filteredQuestions.length === 0 ? (
          <div className="border border-slate-200 bg-white p-12 text-center rounded">
            <Search className="mx-auto size-8 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-900">
              Tidak ada pertanyaan ditemukan
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Ubah kata kunci atau filter pencarian.
            </p>
          </div>
        ) : (
          filteredQuestions.map((question, index) => (
            <div
              key={question.id}
              className={`border bg-white p-4 rounded ${
                question.status === "Aktif"
                  ? "border-slate-200"
                  : "border-slate-200 bg-slate-50 opacity-70"
              }`}
            >
              <div className="flex flex-col justify-between gap-4 lg:flex-row">
                <div className="flex min-w-0 flex-1 gap-3">
                  <div className="flex shrink-0 flex-col items-center gap-1">
                    <div className="flex size-8 items-center justify-center border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 rounded">
                      {question.order}
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">
                      {question.id}
                    </span>

                    <div className="mt-1 flex flex-col">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6 rounded text-slate-500"
                        title="Pindah ke atas"
                        disabled={index === 0}
                        onClick={() => handleMoveOrder(question.id, "up")}
                      >
                        <ArrowUp className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6 rounded text-slate-500"
                        title="Pindah ke bawah"
                        disabled={index === filteredQuestions.length - 1}
                        onClick={() => handleMoveOrder(question.id, "down")}
                      >
                        <ArrowDown className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className="rounded border-blue-200 bg-blue-50 text-blue-700"
                      >
                        {question.category}
                      </Badge>

                      <Badge
                        variant="outline"
                        className={`rounded ${getInputTypeVariant(question.inputType)}`}
                      >
                        {getInputTypeLabel(question.inputType)}
                      </Badge>

                      {question.required && (
                        <Badge
                          variant="outline"
                          className="rounded border-rose-200 bg-rose-50 text-rose-700"
                        >
                          Wajib Diisi
                        </Badge>
                      )}

                      {question.requirePhoto && (
                        <Badge
                          variant="outline"
                          className="rounded border-indigo-200 bg-indigo-50 text-indigo-700"
                        >
                          <Camera className="mr-1 size-3" />
                          Wajib Foto
                        </Badge>
                      )}

                      {question.autoTriggerFinding && (
                        <Badge
                          variant="outline"
                          className="rounded border-amber-200 bg-amber-50 text-amber-700"
                        >
                          <AlertTriangle className="mr-1 size-3" />
                          Auto Temuan · {question.findingSeverity}
                        </Badge>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        {question.questionText}
                      </h3>

                      {question.description && (
                        <p className="mt-1 flex items-start gap-1.5 text-xs leading-relaxed text-slate-500">
                          <Info className="mt-0.5 size-3.5 shrink-0" />
                          {question.description}
                        </p>
                      )}
                    </div>

                    {question.options && question.options.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs text-slate-400">Opsi:</span>
                        {question.options.map((option, optionIndex) => (
                          <span
                            key={optionIndex}
                            className="border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600 rounded"
                          >
                            {option}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                      <span className="font-medium">Berlaku untuk:</span>
                      {question.assignedCheckpoints.includes("all") ? (
                        <span className="font-medium text-emerald-700">
                          Semua Checkpoint
                        </span>
                      ) : (
                        <span className="text-blue-700">
                          {question.assignedCheckpoints.length} Checkpoint
                          {" · "}
                          {question.assignedCheckpoints.join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={`rounded ${
                      question.status === "Aktif"
                        ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        : "border-slate-300 text-slate-600"
                    }`}
                    onClick={() => handleToggleStatus(question.id)}
                  >
                    {question.status}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-8 rounded text-slate-600"
                    title="Duplikasi"
                    onClick={() => handleDuplicateQuestion(question)}
                  >
                    <Copy className="size-4" />
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-8 rounded text-blue-600"
                    title="Edit"
                    onClick={() => handleOpenEdit(question)}
                  >
                    <Pencil className="size-4" />
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-8 rounded text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    title="Hapus"
                    onClick={() => setDeletingQuestion(question)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Dialog */}
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
                ? `Edit Pertanyaan ${editingQuestion.id}`
                : "Tambah Pertanyaan Patroli"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Atur pertanyaan, tipe jawaban, dan checkpoint yang menggunakan
              checklist ini.
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
                onClick={closeFormDialog}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                {editingQuestion ? "Simpan Perubahan" : "Buat Pertanyaan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
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
              Hapus Pertanyaan?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Pertanyaan yang dihapus tidak dapat dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deletingQuestion && (
            <div className="border border-slate-200 bg-slate-50 p-3 rounded">
              <p className="font-mono text-xs font-semibold text-blue-700">
                {deletingQuestion.id}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {deletingQuestion.questionText}
              </p>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel className="rounded">Batal</AlertDialogCancel>
            <AlertDialogAction
              className="rounded bg-rose-600 text-white hover:bg-rose-700"
              onClick={handleDeleteQuestion}
            >
              Hapus Pertanyaan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
