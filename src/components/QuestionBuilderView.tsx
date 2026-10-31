import React, { useState } from 'react';
import { INITIAL_PATROL_QUESTIONS, CHECKPOINTS } from '../data/mockData';
import {
  PatrolQuestionItem,
  validatePatrolQuestion,
  reorderPatrolQuestions,
} from '../utils/security-logic';

export const QuestionBuilderView: React.FC = () => {
  const [questions, setQuestions] = useState<PatrolQuestionItem[]>(INITIAL_PATROL_QUESTIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedInputType, setSelectedInputType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<PatrolQuestionItem | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState<PatrolQuestionItem | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form state for creating new question
  const [formCategory, setFormCategory] = useState('K3 & Proteksi Kebakaran');
  const [formText, setFormText] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formInputType, setFormInputType] = useState<PatrolQuestionItem['inputType']>('boolean');
  const [formOptions, setFormOptions] = useState<string[]>(['Kondisi Normal / Baik', 'Ada Kerusakan / Kendala']);
  const [newOptionInput, setNewOptionInput] = useState('');
  const [formUnit, setFormUnit] = useState('°C');
  const [formMinVal, setFormMinVal] = useState<number>(20);
  const [formMaxVal, setFormMaxVal] = useState<number>(60);
  const [formRequired, setFormRequired] = useState(true);
  const [formRequirePhoto, setFormRequirePhoto] = useState(false);
  const [formAutoFinding, setFormAutoFinding] = useState(true);
  const [formSeverity, setFormSeverity] = useState<PatrolQuestionItem['findingSeverity']>('Tinggi');
  const [formAssignedCp, setFormAssignedCp] = useState<string[]>(['all']);
  const [formError, setFormError] = useState<string | null>(null);

  // Mobile preview simulated state
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, any>>({});
  const [previewSelectedCp, setPreviewSelectedCp] = useState<string>('CP-SDR-014');

  const categories = [
    'K3 & Proteksi Kebakaran',
    'Akses & Pintu Darurat',
    'Utilitas, Panel & Genset',
    'Perimeter & Pagar Pengaman',
    'Logistik & Area Dermaga',
    'Peralatan & Aset Vital',
  ];

  const filteredQuestions = questions.filter((q) => {
    if (selectedCategory !== 'all' && q.category !== selectedCategory) return false;
    if (selectedInputType !== 'all' && q.inputType !== selectedInputType) return false;
    if (selectedStatus !== 'all' && q.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const match =
        q.questionText.toLowerCase().includes(query) ||
        q.description.toLowerCase().includes(query) ||
        q.category.toLowerCase().includes(query) ||
        q.id.toLowerCase().includes(query);
      if (!match) return false;
    }
    return true;
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const resetForm = () => {
    setFormCategory('K3 & Proteksi Kebakaran');
    setFormText('');
    setFormDesc('');
    setFormInputType('boolean');
    setFormOptions(['Kondisi Normal / Baik', 'Ada Kerusakan / Kendala']);
    setNewOptionInput('');
    setFormUnit('°C');
    setFormMinVal(20);
    setFormMaxVal(60);
    setFormRequired(true);
    setFormRequirePhoto(false);
    setFormAutoFinding(true);
    setFormSeverity('Tinggi');
    setFormAssignedCp(['all']);
    setFormError(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (q: PatrolQuestionItem) => {
    setEditingQuestion(q);
    setFormCategory(q.category);
    setFormText(q.questionText);
    setFormDesc(q.description);
    setFormInputType(q.inputType);
    setFormOptions(q.options && q.options.length > 0 ? [...q.options] : ['Opsi 1', 'Opsi 2']);
    setNewOptionInput('');
    setFormUnit(q.unit || '°C');
    setFormMinVal(q.minVal !== undefined ? q.minVal : 20);
    setFormMaxVal(q.maxVal !== undefined ? q.maxVal : 60);
    setFormRequired(q.required);
    setFormRequirePhoto(q.requirePhoto);
    setFormAutoFinding(q.autoTriggerFinding);
    setFormSeverity(q.findingSeverity);
    setFormAssignedCp([...q.assignedCheckpoints]);
    setFormError(null);
  };

  const handleAddOption = () => {
    if (!newOptionInput.trim()) return;
    setFormOptions([...formOptions, newOptionInput.trim()]);
    setNewOptionInput('');
  };

  const handleRemoveOption = (indexToRemove: number) => {
    if (formOptions.length <= 2) {
      setFormError('Minimal harus ada 2 opsi pilihan');
      return;
    }
    setFormOptions(formOptions.filter((_, idx) => idx !== indexToRemove));
  };

  const handleCreateQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Partial<PatrolQuestionItem> = {
      questionText: formText,
      category: formCategory,
      inputType: formInputType,
      options: formInputType === 'multiple_choice' || formInputType === 'checklist' ? formOptions : undefined,
      minVal: formInputType === 'numeric' ? formMinVal : undefined,
      maxVal: formInputType === 'numeric' ? formMaxVal : undefined,
    };

    const validation = validatePatrolQuestion(payload);
    if (!validation.valid) {
      setFormError(validation.error || 'Data tidak valid');
      return;
    }

    const newQ: PatrolQuestionItem = {
      id: `Q-${String(questions.length + 1).padStart(3, '0')}`,
      category: formCategory,
      questionText: formText.trim(),
      description: formDesc.trim(),
      inputType: formInputType,
      options: formInputType === 'multiple_choice' || formInputType === 'checklist' ? formOptions : undefined,
      unit: formInputType === 'numeric' ? formUnit : undefined,
      minVal: formInputType === 'numeric' ? formMinVal : undefined,
      maxVal: formInputType === 'numeric' ? formMaxVal : undefined,
      required: formRequired,
      requirePhoto: formRequirePhoto,
      autoTriggerFinding: formAutoFinding,
      findingSeverity: formSeverity,
      assignedCheckpoints: formAssignedCp.length > 0 ? formAssignedCp : ['all'],
      status: 'Aktif',
      order: questions.length + 1,
    };

    setQuestions([...questions, newQ]);
    setIsAddModalOpen(false);
    resetForm();
    showToast(`Pertanyaan baru ${newQ.id} berhasil ditambahkan ke daftar checklist!`);
  };

  const handleSaveEditQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;

    const payload: Partial<PatrolQuestionItem> = {
      questionText: formText,
      category: formCategory,
      inputType: formInputType,
      options: formInputType === 'multiple_choice' || formInputType === 'checklist' ? formOptions : undefined,
      minVal: formInputType === 'numeric' ? formMinVal : undefined,
      maxVal: formInputType === 'numeric' ? formMaxVal : undefined,
    };

    const validation = validatePatrolQuestion(payload);
    if (!validation.valid) {
      setFormError(validation.error || 'Data tidak valid');
      return;
    }

    const updated: PatrolQuestionItem = {
      ...editingQuestion,
      category: formCategory,
      questionText: formText.trim(),
      description: formDesc.trim(),
      inputType: formInputType,
      options: formInputType === 'multiple_choice' || formInputType === 'checklist' ? formOptions : undefined,
      unit: formInputType === 'numeric' ? formUnit : undefined,
      minVal: formInputType === 'numeric' ? formMinVal : undefined,
      maxVal: formInputType === 'numeric' ? formMaxVal : undefined,
      required: formRequired,
      requirePhoto: formRequirePhoto,
      autoTriggerFinding: formAutoFinding,
      findingSeverity: formSeverity,
      assignedCheckpoints: formAssignedCp.length > 0 ? formAssignedCp : ['all'],
    };

    setQuestions(questions.map((q) => (q.id === updated.id ? updated : q)));
    setEditingQuestion(null);
    showToast(`Pertanyaan ${updated.id} berhasil diperbarui!`);
  };

  const handleDeleteQuestion = () => {
    if (!deletingQuestion) return;
    setQuestions(questions.filter((q) => q.id !== deletingQuestion.id));
    showToast(`Pertanyaan ${deletingQuestion.id} berhasil dihapus.`);
    setDeletingQuestion(null);
  };

  const handleDuplicateQuestion = (q: PatrolQuestionItem) => {
    const duplicated: PatrolQuestionItem = {
      ...q,
      id: `Q-${String(questions.length + 1).padStart(3, '0')}`,
      questionText: `${q.questionText} (Salinan)`,
      order: questions.length + 1,
    };
    setQuestions([...questions, duplicated]);
    showToast(`Pertanyaan diduplikasi sebagai ${duplicated.id}`);
  };

  const handleToggleStatus = (id: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === id) {
          const next = q.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
          return { ...q, status: next };
        }
        return q;
      })
    );
  };

  const handleMoveOrder = (id: string, direction: 'up' | 'down') => {
    const reordered = reorderPatrolQuestions(questions, id, direction);
    setQuestions(reordered);
  };

  // Stats
  const totalQuestions = questions.length;
  const activeQuestions = questions.filter((q) => q.status === 'Aktif').length;
  const photoRequiredCount = questions.filter((q) => q.requirePhoto).length;
  const autoFindingCount = questions.filter((q) => q.autoTriggerFinding).length;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded text-xs text-emerald-800 font-medium flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#e2e8f0]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded bg-blue-100 text-blue-700">
              <span className="material-symbols-outlined text-xl">fact_check</span>
            </span>
            <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">
              Question Builder: Pembuat Pertanyaan Patroli
            </h1>
          </div>
          <p className="text-xs text-[#64748b] mt-1 ml-9">
            Pusat konfigurasi lembar checklist pemeriksaan satpam saat scan tag NFC/RFID di titik checkpoint lapangan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPreviewModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#cbd5e1] hover:bg-[#f8fafc] text-[#0f172a] rounded text-xs font-semibold shadow-xs transition-colors"
          >
            <span className="material-symbols-outlined text-base text-[#2563eb]">smartphone</span>
            <span>Pratinjau Mobile Patroli</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded text-xs font-semibold shadow-sm transition-colors"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            <span>Tambah Pertanyaan Baru</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white border border-[#e2e8f0] rounded-lg shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">Total Pertanyaan</div>
            <div className="text-xl font-bold text-[#0f172a] mt-0.5">{totalQuestions} Butir</div>
            <div className="text-[10px] text-blue-600 font-medium">Tersebar di {categories.length} kategori</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-lg">quiz</span>
          </div>
        </div>

        <div className="p-3.5 bg-white border border-[#e2e8f0] rounded-lg shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">Status Aktif</div>
            <div className="text-xl font-bold text-emerald-700 mt-0.5">{activeQuestions} Butir</div>
            <div className="text-[10px] text-emerald-600 font-medium">Tampil di aplikasi mobile patroli</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-lg">verified</span>
          </div>
        </div>

        <div className="p-3.5 bg-white border border-[#e2e8f0] rounded-lg shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">Wajib Lampirkan Foto</div>
            <div className="text-xl font-bold text-indigo-700 mt-0.5">{photoRequiredCount} Butir</div>
            <div className="text-[10px] text-indigo-600 font-medium">Verifikasi visual bukti autentik</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-lg">photo_camera</span>
          </div>
        </div>

        <div className="p-3.5 bg-white border border-[#e2e8f0] rounded-lg shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">Auto-Trigger Temuan</div>
            <div className="text-xl font-bold text-amber-700 mt-0.5">{autoFindingCount} Butir</div>
            <div className="text-[10px] text-amber-600 font-medium">Otomatis lapor temuan saat anomali</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-lg">crisis_alert</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3 bg-white border border-[#e2e8f0] rounded-lg flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <span className="material-symbols-outlined absolute left-2.5 top-2 text-base text-[#94a3b8]">search</span>
            <input
              type="text"
              placeholder="Cari teks pertanyaan, kategori, petunjuk teknis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#f8fafc] border border-[#e2e8f0] rounded text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-[#f8fafc] border border-[#e2e8f0] rounded px-2.5 py-1.5 text-[#334155] focus:outline-none cursor-pointer font-medium"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Input Type Filter */}
          <select
            value={selectedInputType}
            onChange={(e) => setSelectedInputType(e.target.value)}
            className="text-xs bg-[#f8fafc] border border-[#e2e8f0] rounded px-2.5 py-1.5 text-[#334155] focus:outline-none cursor-pointer font-medium"
          >
            <option value="all">Semua Tipe Input</option>
            <option value="boolean">Ya / Tidak (Boolean)</option>
            <option value="multiple_choice">Pilihan Ganda</option>
            <option value="numeric">Angka / Nilai Meteran</option>
            <option value="rating">Rating 1-5 Bintang</option>
            <option value="text">Catatan Teks</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs bg-[#f8fafc] border border-[#e2e8f0] rounded px-2.5 py-1.5 text-[#334155] focus:outline-none cursor-pointer font-medium"
          >
            <option value="all">Semua Status</option>
            <option value="Aktif">Hanya Aktif</option>
            <option value="Nonaktif">Hanya Nonaktif</option>
          </select>
        </div>

        <div className="text-xs text-[#64748b] font-medium">
          Menampilkan <span className="font-bold text-[#0f172a]">{filteredQuestions.length}</span> dari {questions.length} butir
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {filteredQuestions.length === 0 ? (
          <div className="p-12 text-center bg-white border border-[#e2e8f0] rounded-lg">
            <span className="material-symbols-outlined text-4xl text-[#94a3b8]">search_off</span>
            <p className="text-sm font-semibold text-[#0f172a] mt-2">Tidak ada pertanyaan yang sesuai filter</p>
            <p className="text-xs text-[#64748b] mt-1">Coba sesuaikan kata kunci pencarian atau kategori pertanyaan.</p>
          </div>
        ) : (
          filteredQuestions.map((q, index) => {
            return (
              <div
                key={q.id}
                className={`p-4 bg-white border rounded-lg transition-all shadow-xs ${
                  q.status === 'Aktif' ? 'border-[#e2e8f0] hover:border-[#2563eb]/40' : 'border-[#e2e8f0] opacity-60 bg-[#fafafa]'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left info */}
                  <div className="flex items-start gap-3 flex-1">
                    {/* Order & ID */}
                    <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                      <span className="w-7 h-7 rounded bg-[#f1f5f9] text-[#334155] font-bold text-xs flex items-center justify-center border border-[#e2e8f0]">
                        {q.order}
                      </span>
                      <span className="text-[10px] font-mono text-[#64748b]">{q.id}</span>
                      {/* Reorder Buttons */}
                      <div className="flex flex-col gap-0.5 mt-1">
                        <button
                          onClick={() => handleMoveOrder(q.id, 'up')}
                          disabled={index === 0}
                          title="Pindah ke Atas"
                          className="w-5 h-5 rounded hover:bg-[#e2e8f0] disabled:opacity-30 text-[#64748b] flex items-center justify-center"
                        >
                          <span className="material-symbols-outlined text-xs">arrow_upward</span>
                        </button>
                        <button
                          onClick={() => handleMoveOrder(q.id, 'down')}
                          disabled={index === filteredQuestions.length - 1}
                          title="Pindah ke Bawah"
                          className="w-5 h-5 rounded hover:bg-[#e2e8f0] disabled:opacity-30 text-[#64748b] flex items-center justify-center"
                        >
                          <span className="material-symbols-outlined text-xs">arrow_downward</span>
                        </button>
                      </div>
                    </div>

                    {/* Question Content */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {q.category}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            q.inputType === 'boolean'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : q.inputType === 'numeric'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : q.inputType === 'multiple_choice'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : q.inputType === 'rating'
                              ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {q.inputType === 'boolean' && 'Ya / Tidak (Compliant)'}
                          {q.inputType === 'numeric' && `Nilai Meteran (${q.unit || 'Angka'})`}
                          {q.inputType === 'multiple_choice' && 'Pilihan Ganda'}
                          {q.inputType === 'rating' && 'Skala Rating (1-5)'}
                          {q.inputType === 'text' && 'Catatan Teks'}
                        </span>

                        {q.required && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Wajib Diisi
                          </span>
                        )}

                        {q.requirePhoto && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <span className="material-symbols-outlined text-xs">photo_camera</span>
                            <span>Wajib Foto</span>
                          </span>
                        )}

                        {q.autoTriggerFinding && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <span className="material-symbols-outlined text-xs">crisis_alert</span>
                            <span>Auto-Temuan ({q.findingSeverity})</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-[#0f172a] leading-snug">{q.questionText}</h3>
                      {q.description && (
                        <p className="text-xs text-[#64748b] leading-relaxed flex items-start gap-1">
                          <span className="material-symbols-outlined text-xs text-[#94a3b8] mt-0.5">info</span>
                          <span>{q.description}</span>
                        </p>
                      )}

                      {/* Display preview options if multiple choice */}
                      {q.options && q.options.length > 0 && (
                        <div className="pt-1 flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] text-[#94a3b8] font-medium">Opsi:</span>
                          {q.options.map((opt, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-[#f8fafc] border border-[#e2e8f0] rounded text-[11px] text-[#475569]"
                            >
                              {opt}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Checkpoint assignments */}
                      <div className="pt-1 text-[11px] text-[#64748b] flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-xs text-[#94a3b8]">pin_drop</span>
                        <span>Berlaku untuk:</span>
                        {q.assignedCheckpoints.includes('all') ? (
                          <span className="font-semibold text-emerald-700">Semua Titik Checkpoint Patroli</span>
                        ) : (
                          <span className="font-medium text-[#2563eb]">
                            {q.assignedCheckpoints.length} Checkpoint Khusus ({q.assignedCheckpoints.join(', ')})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-1.5 self-end lg:self-center shrink-0">
                    <button
                      onClick={() => handleToggleStatus(q.id)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${
                        q.status === 'Aktif'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {q.status}
                    </button>

                    <button
                      onClick={() => handleDuplicateQuestion(q)}
                      title="Duplikasi Pertanyaan"
                      className="p-1.5 rounded text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">content_copy</span>
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(q)}
                      title="Edit Pertanyaan"
                      className="p-1.5 rounded text-[#2563eb] hover:bg-blue-50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>

                    <button
                      onClick={() => setDeletingQuestion(q)}
                      title="Hapus Pertanyaan"
                      className="p-1.5 rounded text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Question Modal */}
      {(isAddModalOpen || editingQuestion) && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full border border-[#cbd5e1] overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95">
            <div className="px-5 py-3.5 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-[#2563eb]">
                  {editingQuestion ? 'edit_note' : 'add_task'}
                </span>
                <h3 className="text-sm font-bold text-[#0f172a]">
                  {editingQuestion ? `Edit Pertanyaan (${editingQuestion.id})` : 'Tambah Butir Pertanyaan Patroli'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingQuestion(null);
                }}
                className="text-[#64748b] hover:text-[#0f172a]"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <form
              onSubmit={editingQuestion ? handleSaveEditQuestion : handleCreateQuestion}
              className="p-5 space-y-4 overflow-y-auto flex-1 text-xs"
            >
              {formError && (
                <div className="p-2.5 bg-rose-50 border border-rose-300 text-rose-800 rounded font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">error</span>
                  <span>{formError}</span>
                </div>
              )}

              {/* Category */}
              <div>
                <label className="block font-semibold text-[#0f172a] mb-1">Kategori Pemeriksaan *</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-xs text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Question Text */}
              <div>
                <label className="block font-semibold text-[#0f172a] mb-1">Teks Pertanyaan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Apakah jalur evakuasi bebas dari halangan dan ganjalan?"
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-xs text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                />
              </div>

              {/* Description / Instructions */}
              <div>
                <label className="block font-semibold text-[#0f172a] mb-1">Petunjuk Pemeriksaan (SOP Satpam)</label>
                <textarea
                  rows={2}
                  placeholder="Instruksi detail untuk petugas, misal: Periksa pin pengunci APAR dan segel tahunan..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-xs text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                />
              </div>

              {/* Input Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#0f172a] mb-1">Tipe Input Jawaban *</label>
                  <select
                    value={formInputType}
                    onChange={(e) => setFormInputType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-xs text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                  >
                    <option value="boolean">Ya / Tidak (Sesuai SOP / Anomali)</option>
                    <option value="multiple_choice">Pilihan Ganda (Single Choice)</option>
                    <option value="numeric">Angka / Nilai Meteran (Suhu, Bar, Volt)</option>
                    <option value="rating">Skala Rating Bintang (1 - 5)</option>
                    <option value="text">Catatan Teks / Uraian Bebas</option>
                  </select>
                </div>

                {/* Severity if Auto Finding */}
                <div>
                  <label className="block font-semibold text-[#0f172a] mb-1">
                    Tingkat Keparahan Temuan (Bila Anomali)
                  </label>
                  <select
                    value={formSeverity}
                    onChange={(e) => setFormSeverity(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-xs text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                  >
                    <option value="Kritis">Kritis (Urgensi Tinggi - Segera)</option>
                    <option value="Tinggi">Tinggi</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Rendah">Rendah (Penyelesaian Rutin)</option>
                  </select>
                </div>
              </div>

              {/* Conditional Options for Multiple Choice */}
              {formInputType === 'multiple_choice' && (
                <div className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded space-y-2">
                  <label className="block font-semibold text-[#0f172a]">Daftar Pilihan Jawaban</label>
                  <div className="space-y-1.5">
                    {formOptions.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-5 text-center text-[#94a3b8] font-mono text-[11px]">{i + 1}.</span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const updated = [...formOptions];
                            updated[i] = e.target.value;
                            setFormOptions(updated);
                          }}
                          className="flex-1 px-2.5 py-1 bg-white border border-[#cbd5e1] rounded text-xs text-[#0f172a]"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(i)}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Tambah opsi pilihan baru..."
                      value={newOptionInput}
                      onChange={(e) => setNewOptionInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddOption();
                        }
                      }}
                      className="flex-1 px-2.5 py-1 bg-white border border-[#cbd5e1] rounded text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="px-3 py-1 bg-[#2563eb] text-white rounded text-xs font-semibold"
                    >
                      + Tambah
                    </button>
                  </div>
                </div>
              )}

              {/* Conditional Numeric Unit & Limits */}
              {formInputType === 'numeric' && (
                <div className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-medium text-[#334155] mb-1">Satuan Nilai</label>
                    <input
                      type="text"
                      placeholder="°C, Bar, Psi, Volt"
                      value={formUnit}
                      onChange={(e) => setFormUnit(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#cbd5e1] rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-[#334155] mb-1">Batas Minimum</label>
                    <input
                      type="number"
                      value={formMinVal}
                      onChange={(e) => setFormMinVal(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#cbd5e1] rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-[#334155] mb-1">Batas Maksimum</label>
                    <input
                      type="number"
                      value={formMaxVal}
                      onChange={(e) => setFormMaxVal(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#cbd5e1] rounded text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Checkboxes for flags */}
              <div className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formRequired}
                    onChange={(e) => setFormRequired(e.target.checked)}
                    className="w-4 h-4 text-[#2563eb] rounded border-gray-300"
                  />
                  <span className="font-semibold text-[#0f172a]">Wajib Diisi (Mandatory Question)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formRequirePhoto}
                    onChange={(e) => setFormRequirePhoto(e.target.checked)}
                    className="w-4 h-4 text-[#2563eb] rounded border-gray-300"
                  />
                  <span className="font-medium text-[#334155]">Wajib Lampirkan Foto Bukti Lapangan</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formAutoFinding}
                    onChange={(e) => setFormAutoFinding(e.target.checked)}
                    className="w-4 h-4 text-[#2563eb] rounded border-gray-300"
                  />
                  <span className="font-medium text-[#334155]">
                    Pemicu Otomatis Temuan: Jika jawaban &quot;Tidak&quot; / terjadi anomali, otomatis buat tiket temuan terbuka
                  </span>
                </label>
              </div>

              {/* Checkpoint assignments */}
              <div>
                <label className="block font-semibold text-[#0f172a] mb-1">
                  Alokasi Checkpoint Titik Patroli
                </label>
                <p className="text-[11px] text-[#64748b] mb-1.5">
                  Tentukan apakah pertanyaan ini muncul di seluruh titik atau titik tertentu saja.
                </p>
                <div className="space-y-1 max-h-32 overflow-y-auto p-2 bg-[#f8fafc] border border-[#e2e8f0] rounded">
                  <label className="flex items-center gap-2 cursor-pointer pb-1 border-b border-[#e2e8f0]">
                    <input
                      type="checkbox"
                      checked={formAssignedCp.includes('all')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormAssignedCp(['all']);
                        } else {
                          setFormAssignedCp([]);
                        }
                      }}
                      className="w-4 h-4 text-[#2563eb] rounded"
                    />
                    <span className="font-bold text-[#0f172a]">Berlaku untuk SEMUA Titik Checkpoint</span>
                  </label>

                  {CHECKPOINTS.map((cp) => {
                    const isChecked = formAssignedCp.includes(cp.id);
                    return (
                      <label key={cp.id} className="flex items-center gap-2 cursor-pointer text-xs py-0.5">
                        <input
                          type="checkbox"
                          disabled={formAssignedCp.includes('all')}
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormAssignedCp([...formAssignedCp.filter((id) => id !== 'all'), cp.id]);
                            } else {
                              setFormAssignedCp(formAssignedCp.filter((id) => id !== cp.id));
                            }
                          }}
                          className="w-3.5 h-3.5 text-[#2563eb] rounded disabled:opacity-40"
                        />
                        <span className={formAssignedCp.includes('all') ? 'text-gray-400' : 'text-[#0f172a]'}>
                          <span className="font-mono text-[10px] text-[#64748b]">{cp.id}</span> - {cp.name}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-[#e2e8f0] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingQuestion(null);
                  }}
                  className="px-4 py-2 border border-[#cbd5e1] hover:bg-[#f8fafc] text-[#334155] rounded font-semibold text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded font-semibold text-xs shadow-sm transition-colors"
                >
                  {editingQuestion ? 'Simpan Perubahan' : 'Buat Pertanyaan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingQuestion && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full border border-rose-300 p-5 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl">delete_forever</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0f172a]">Hapus Pertanyaan Patroli?</h3>
                <p className="text-xs text-[#64748b] mt-0.5">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            <div className="p-3 bg-[#f8fafc] rounded border border-[#e2e8f0] text-xs">
              <span className="font-mono font-bold text-[#2563eb]">{deletingQuestion.id}</span>
              <p className="text-[#0f172a] font-medium mt-1">{deletingQuestion.questionText}</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingQuestion(null)}
                className="px-3 py-1.5 border border-[#cbd5e1] text-[#334155] rounded text-xs font-semibold hover:bg-[#f8fafc]"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteQuestion}
                className="px-3 py-1.5 bg-rose-600 text-white rounded text-xs font-semibold hover:bg-rose-700 shadow-sm"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Smartphone Preview Modal */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border-4 border-[#1e293b] overflow-hidden flex flex-col h-[740px] animate-in zoom-in-95">
            {/* Simulated Phone Top Speaker & Camera Notch */}
            <div className="h-6 bg-[#101b35] flex items-center justify-center relative">
              <div className="w-16 h-3 bg-black/60 rounded-full"></div>
            </div>

            {/* Simulated App Header in rugged mobile patrol app */}
            <div className="bg-[#2563eb] text-white p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">shield</span>
                <div>
                  <div className="font-bold text-xs leading-none">PAMAREA Patrol Mobile</div>
                  <div className="text-[9px] text-blue-200">Scan Terverifikasi NFC</div>
                </div>
              </div>
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-xs">close</span>
              </button>
            </div>

            {/* Checkpoint selector for simulation */}
            <div className="p-2.5 bg-blue-50 border-b border-blue-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-blue-900 font-semibold text-[11px]">
                <span className="material-symbols-outlined text-sm">nfc</span>
                <span>Simulasi Checkpoint:</span>
              </div>
              <select
                value={previewSelectedCp}
                onChange={(e) => setPreviewSelectedCp(e.target.value)}
                className="text-[11px] bg-white border border-blue-300 rounded px-1.5 py-0.5 text-blue-900 font-medium cursor-pointer"
              >
                {CHECKPOINTS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} - {c.name.slice(0, 18)}...
                  </option>
                ))}
              </select>
            </div>

            {/* Simulated Questions Form */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-[#faf8ff] text-xs">
              <div className="p-2 bg-emerald-50 border border-emerald-300 rounded text-emerald-800 text-[11px] font-medium flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-emerald-600">verified</span>
                <span>Tag NFC Terdeteksi! Silakan isi checklist berikut:</span>
              </div>

              {questions
                .filter(
                  (q) =>
                    q.status === 'Aktif' &&
                    (q.assignedCheckpoints.includes('all') || q.assignedCheckpoints.includes(previewSelectedCp))
                )
                .map((q, idx) => (
                  <div key={q.id} className="p-3 bg-white rounded-lg border border-[#e2e8f0] shadow-xs space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-blue-100 text-[#2563eb] text-[10px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-[11px] text-[#0f172a]">{q.questionText}</span>
                      </div>
                      {q.required && <span className="text-rose-500 font-bold text-xs">*</span>}
                    </div>

                    {q.description && <p className="text-[10px] text-[#64748b] leading-tight">{q.description}</p>}

                    {/* Interactive Input Mockup */}
                    {q.inputType === 'boolean' && (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setPreviewAnswers({ ...previewAnswers, [q.id]: 'Ya' })}
                          className={`py-1.5 rounded font-semibold text-xs border text-center transition-all ${
                            previewAnswers[q.id] === 'Ya'
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                          }`}
                        >
                          ✓ Ya (Normal)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewAnswers({ ...previewAnswers, [q.id]: 'Tidak' })}
                          className={`py-1.5 rounded font-semibold text-xs border text-center transition-all ${
                            previewAnswers[q.id] === 'Tidak'
                              ? 'bg-rose-600 text-white border-rose-600'
                              : 'bg-white text-rose-700 border-rose-300 hover:bg-rose-50'
                          }`}
                        >
                          ✗ Tidak (Anomali)
                        </button>
                      </div>
                    )}

                    {q.inputType === 'multiple_choice' && q.options && (
                      <div className="space-y-1 pt-1">
                        {q.options.map((opt, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setPreviewAnswers({ ...previewAnswers, [q.id]: opt })}
                            className={`w-full text-left px-2.5 py-1.5 rounded text-[11px] border transition-all ${
                              previewAnswers[q.id] === opt
                                ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                                : 'bg-white text-[#334155] border-[#cbd5e1] hover:bg-[#f8fafc]'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}

                    {q.inputType === 'numeric' && (
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="number"
                          placeholder={`Nilai (${q.minVal ?? ''} - ${q.maxVal ?? ''})`}
                          value={previewAnswers[q.id] || ''}
                          onChange={(e) => setPreviewAnswers({ ...previewAnswers, [q.id]: e.target.value })}
                          className="flex-1 px-2 py-1 bg-white border border-[#cbd5e1] rounded text-xs font-mono"
                        />
                        <span className="font-semibold text-xs text-[#64748b]">{q.unit}</span>
                      </div>
                    )}

                    {q.inputType === 'rating' && (
                      <div className="flex items-center justify-center gap-2 py-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setPreviewAnswers({ ...previewAnswers, [q.id]: star })}
                            className={`material-symbols-outlined text-xl ${
                              (previewAnswers[q.id] || 0) >= star ? 'text-amber-500' : 'text-[#cbd5e1]'
                            }`}
                          >
                            star
                          </button>
                        ))}
                      </div>
                    )}

                    {q.inputType === 'text' && (
                      <input
                        type="text"
                        placeholder="Ketik catatan..."
                        value={previewAnswers[q.id] || ''}
                        onChange={(e) => setPreviewAnswers({ ...previewAnswers, [q.id]: e.target.value })}
                        className="w-full px-2 py-1 bg-white border border-[#cbd5e1] rounded text-xs"
                      />
                    )}

                    {q.requirePhoto && (
                      <button
                        type="button"
                        className="w-full mt-1.5 py-1.5 border border-dashed border-[#2563eb] text-[#2563eb] bg-blue-50/50 rounded flex items-center justify-center gap-1.5 text-[11px] font-semibold"
                      >
                        <span className="material-symbols-outlined text-sm">photo_camera</span>
                        <span>Ambil Foto Bukti Kamera</span>
                      </button>
                    )}

                    {/* Auto Finding Warning in preview */}
                    {previewAnswers[q.id] === 'Tidak' && q.autoTriggerFinding && (
                      <div className="p-1.5 rounded bg-amber-50 border border-amber-300 text-amber-800 text-[10px] font-medium flex items-center gap-1 animate-in fade-in">
                        <span className="material-symbols-outlined text-xs text-amber-600">crisis_alert</span>
                        <span>Peringatan: Jawaban ini akan otomatis mencatat temuan keparahan {q.findingSeverity}.</span>
                      </div>
                    )}
                  </div>
                ))}
            </div>

            {/* Simulated Phone Bottom Nav */}
            <div className="p-3 bg-white border-t border-[#e2e8f0] flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setPreviewAnswers({});
                  showToast('Simulasi reset form mobile');
                }}
                className="px-3 py-1.5 text-xs text-[#64748b] hover:text-[#0f172a] font-medium"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast('Simulasi Berhasil: Data checklist berhasil disubmit oleh satpam!');
                  setIsPreviewModalOpen(false);
                }}
                className="px-4 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded text-xs font-bold shadow-sm"
              >
                Kirim Hasil Patroli
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
