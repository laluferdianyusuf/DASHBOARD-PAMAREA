import React, { useState, useMemo } from 'react';
import { FINDINGS, FindingItem, SITES } from '../data/mockData';
import {
  calculateFindingsAnalytics,
  generateFindingsTimelineTrend,
  FindingsTimelinePoint,
  filterItemsByColumnCriteria,
} from '../utils/security-logic';

interface TemuanPatroliViewProps {
  selectedSite: string;
}

export const TemuanPatroliView: React.FC<TemuanPatroliViewProps> = ({ selectedSite }) => {
  const [findings, setFindings] = useState<FindingItem[]>(FINDINGS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showCharts, setShowCharts] = useState(true);

  // Line Chart metric selection (not based on severity, but on volume/progress timeline, SLA, or category)
  const [chartMetric, setChartMetric] = useState<'volume' | 'sla' | 'category'>('volume');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Per-column search state
  const [columnSearch, setColumnSearch] = useState({
    id: '',
    hasPhoto: '',
    title: '',
    severity: '',
    location: '',
    reportedBy: '',
    assignedTo: '',
    status: '',
  });

  const timelineData = useMemo(() => generateFindingsTimelineTrend(), []);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingFinding, setEditingFinding] = useState<FindingItem | null>(null);
  const [deletingFinding, setDeletingFinding] = useState<FindingItem | null>(null);
  const [viewingPhotoFinding, setViewingPhotoFinding] = useState<FindingItem | null>(null);
  const [actionSuccessToast, setActionSuccessToast] = useState<string | null>(null);

  // New Finding form
  const [newFinding, setNewFinding] = useState({
    title: '',
    description: '',
    siteId: 'site-a',
    location: '',
    severity: 'Tinggi' as FindingItem['severity'],
    assignedTo: 'Tim K3 & Fasilitas',
    photoUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=800&auto=format&fit=crop&q=80',
  });

  const baseFiltered = useMemo(() => {
    return findings.filter((f) => {
      if (selectedSite !== 'all' && f.siteId !== selectedSite) return false;
      if (selectedSeverity !== 'all' && f.severity !== selectedSeverity) return false;
      if (selectedStatus !== 'all' && f.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          f.id.toLowerCase().includes(q) ||
          f.title.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          f.location.toLowerCase().includes(q) ||
          f.reportedBy.toLowerCase().includes(q) ||
          f.siteName.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [findings, selectedSite, selectedSeverity, selectedStatus, searchQuery]);

  const filteredFindings = useMemo(() => {
    return filterItemsByColumnCriteria(baseFiltered, columnSearch, {
      id: (f) => f.id,
      hasPhoto: (f) => (f.photoUrl ? 'ada' : 'tanpa'),
      title: (f) => `${f.title} ${f.description} ${f.notes || ''}`,
      severity: (f) => f.severity,
      location: (f) => `${f.location} ${f.siteName}`,
      reportedBy: (f) => `${f.reportedBy} ${f.reportedAt}`,
      assignedTo: (f) => f.assignedTo || '',
      status: (f) => f.status,
    });
  }, [baseFiltered, columnSearch]);

  const isAnyColumnFilterActive = Object.values(columnSearch).some((v) => v.trim().length > 0);
  const clearAllColumnFilters = () => {
    setColumnSearch({
      id: '',
      hasPhoto: '',
      title: '',
      severity: '',
      location: '',
      reportedBy: '',
      assignedTo: '',
      status: '',
    });
  };

  const handleCreateFinding = (e: React.FormEvent) => {
    e.preventDefault();
    const siteObj = SITES.find((s) => s.id === newFinding.siteId) || SITES[1];
    const newId = `FND-2025-${String(findings.length + 80).padStart(3, '0')}`;

    const created: FindingItem = {
      id: newId,
      title: newFinding.title,
      description: newFinding.description,
      siteId: newFinding.siteId,
      siteName: siteObj.name.replace(/^Site [A-D] - /, ''),
      location: newFinding.location || 'Area Umum Lapangan',
      severity: newFinding.severity,
      reportedBy: 'Bambang Prasetyo (Superintendent)',
      reportedAt: '24 Mei 2025, ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      status: 'Baru',
      assignedTo: newFinding.assignedTo,
      photoUrl: newFinding.photoUrl,
    };

    setFindings([created, ...findings]);
    setIsAddModalOpen(false);
    setActionSuccessToast(`Temuan baru ${newId} (${created.title}) berhasil dicatat dalam tabel!`);
    setTimeout(() => setActionSuccessToast(null), 3500);
  };

  const handleEditFinding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFinding) return;

    setFindings((prev) =>
      prev.map((f) => (f.id === editingFinding.id ? editingFinding : f))
    );
    setEditingFinding(null);
    setActionSuccessToast(`Perubahan data temuan ${editingFinding.id} berhasil disimpan!`);
    setTimeout(() => setActionSuccessToast(null), 3500);
  };

  const handleDeleteFinding = () => {
    if (!deletingFinding) return;
    setFindings((prev) => prev.filter((f) => f.id !== deletingFinding.id));
    setActionSuccessToast(`Temuan ${deletingFinding.id} berhasil dihapus dari sistem.`);
    setDeletingFinding(null);
    setTimeout(() => setActionSuccessToast(null), 3500);
  };

  const handleUpdateStatus = (findingId: string, nextStatus: FindingItem['status']) => {
    setFindings((prev) =>
      prev.map((f) => {
        if (f.id === findingId) {
          return { ...f, status: nextStatus };
        }
        return f;
      })
    );
    setActionSuccessToast(`Status temuan ${findingId} diperbarui menjadi: ${nextStatus}!`);
    setTimeout(() => setActionSuccessToast(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {actionSuccessToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded text-xs text-emerald-800 font-medium flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
            <span>{actionSuccessToast}</span>
          </div>
          <button onClick={() => setActionSuccessToast(null)} className="text-emerald-700 hover:text-emerald-900">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#e2e8f0]">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">
            Daftar Temuan Patroli (Inspeksi &amp; Anomali Lapangan)
          </h1>
          <p className="text-xs text-[#64748b] mt-1">
            Tabel pemantauan dan tindak lanjut anomali keamanan, kerusakan fasilitas, dan potensi bahaya yang dilaporkan petugas saat patroli.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              const csvContent =
                'data:text/csv;charset=utf-8,ID,Judul,Tingkat Bahaya,Site,Lokasi,Pelapor,Waktu,Status,Tugaskan Ke\n' +
                findings
                  .map(
                    (f) =>
                      `"${f.id}","${f.title.replace(/"/g, '""')}","${f.severity}","${f.siteName}","${f.location}","${f.reportedBy}","${f.reportedAt}","${f.status}","${f.assignedTo || '-'}"`
                  )
                  .join('\n');
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement('a');
              link.setAttribute('href', encodedUri);
              link.setAttribute('download', 'Tabel_Temuan_Patroli_PAMAREA.csv');
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#e2e8f0] text-[#0f172a] rounded text-xs font-medium hover:bg-[#f8fafc] transition-colors shadow-xs"
          >
            <span className="material-symbols-outlined text-sm text-[#64748b]">download</span>
            <span>Ekspor Tabel (.csv)</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2563eb] text-white rounded text-xs font-semibold hover:bg-[#1d4ed8] transition-colors shadow-xs"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span>+ Buat Temuan Manual</span>
          </button>
        </div>
      </div>

      {/* Metrics Strip & Chart Toggle */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white border border-[#e2e8f0] rounded-xl p-3 shadow-xs">
          <div className="p-3 border-r border-[#f1f5f9] last:border-none">
            <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider block">Total Temuan</span>
            <span className="text-xl font-bold text-[#0f172a] mt-1 block">{filteredFindings.length} Kasus</span>
            <span className="text-[11px] text-[#64748b]">Tercatat dalam filter aktif</span>
          </div>
          <div className="p-3 border-r border-[#f1f5f9] last:border-none">
            <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider block">Prioritas Tinggi / Kritis</span>
            <span className="text-xl font-bold text-rose-600 mt-1 block">
              {filteredFindings.filter((f) => f.severity === 'Kritis' || f.severity === 'Tinggi').length} Kasus
            </span>
            <span className="text-[11px] text-rose-700 font-medium">Memerlukan mitigasi cepat</span>
          </div>
          <div className="p-3 border-r border-[#f1f5f9] last:border-none">
            <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider block">Dalam Penanganan</span>
            <span className="text-xl font-bold text-amber-600 mt-1 block">
              {filteredFindings.filter((f) => f.status === 'Dalam Penanganan').length} Kasus
            </span>
            <span className="text-[11px] text-amber-700 font-medium">Dalam progres perbaikan</span>
          </div>
          <div className="p-3">
            <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider block">Selesai Terverifikasi</span>
            <span className="text-xl font-bold text-emerald-600 mt-1 block">
              {filteredFindings.filter((f) => f.status === 'Selesai Terverifikasi').length} Kasus
            </span>
            <span className="text-[11px] text-emerald-700 font-medium">Telah ditutup</span>
          </div>
        </div>

        {/* GRAFIK GARIS ANALISIS TEMUAN LAPANGAN (LINE CHART BERDASARKAN TREN VOLUME, RESOLUSI SLA & KATEGORI) */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f1f5f9]">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-50 text-[#2563eb]">
                <span className="material-symbols-outlined text-lg">show_chart</span>
              </span>
              <div>
                <h2 className="text-sm font-bold text-[#0f172a]">
                  Grafik Garis Analitik Temuan &amp; Tren Mitigasi Lapangan
                </h2>
                <p className="text-[11px] text-[#64748b]">
                  Visualisasi grafik garis kronologis tren temuan baru, efisiensi penanganan SLA, dan pergerakan backlog harian.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              {/* Metric View Switcher */}
              <div className="inline-flex p-1 bg-[#f1f5f9] rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setChartMetric('volume')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    chartMetric === 'volume'
                      ? 'bg-white text-[#2563eb] shadow-xs font-bold'
                      : 'text-[#64748b] hover:text-[#0f172a]'
                  }`}
                >
                  Tren Masuk vs Selesai
                </button>
                <button
                  type="button"
                  onClick={() => setChartMetric('sla')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    chartMetric === 'sla'
                      ? 'bg-white text-[#2563eb] shadow-xs font-bold'
                      : 'text-[#64748b] hover:text-[#0f172a]'
                  }`}
                >
                  Durasi SLA (Menit)
                </button>
                <button
                  type="button"
                  onClick={() => setChartMetric('category')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    chartMetric === 'category'
                      ? 'bg-white text-[#2563eb] shadow-xs font-bold'
                      : 'text-[#64748b] hover:text-[#0f172a]'
                  }`}
                >
                  Tren Kategori Fasilitas
                </button>
              </div>

              <button
                onClick={() => setShowCharts(!showCharts)}
                className="inline-flex items-center gap-1 text-xs text-[#2563eb] hover:text-[#1d4ed8] font-semibold cursor-pointer px-2 py-1 bg-blue-50/50 rounded-lg"
              >
                <span>{showCharts ? 'Tutup' : 'Buka'}</span>
                <span className="material-symbols-outlined text-sm">
                  {showCharts ? 'expand_less' : 'expand_more'}
                </span>
              </button>
            </div>
          </div>

          {showCharts && (
            <div className="space-y-4 pt-1 animate-in fade-in duration-200">
              {/* Main SVG Line Chart Container */}
              <div className="p-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                {/* Chart Header & Legend */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#0f172a]">
                      {chartMetric === 'volume' && 'Tren Kasus Masuk vs Selesai vs Kasus Terbuka (7 Hari Terakhir)'}
                      {chartMetric === 'sla' && 'Tren Rata-rata Durasi Resolusi SLA (Menit) per Hari'}
                      {chartMetric === 'category' && 'Tren Frekuensi Temuan Berdasarkan Kategori Objek Rawan'}
                    </span>
                    <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-[#e2e8f0] text-[#64748b] font-medium">
                      Periode 18 Mei - 24 Mei 2025
                    </span>
                  </div>

                  {/* Dynamic Legend */}
                  <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
                    {chartMetric === 'volume' && (
                      <>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-1 bg-[#2563eb] rounded-full"></span>
                          <span className="w-2 h-2 rounded-full bg-[#2563eb]"></span>
                          <span className="text-[#0f172a] font-semibold">Temuan Dilaporkan (Baru)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-1 bg-emerald-600 rounded-full"></span>
                          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                          <span className="text-[#0f172a] font-semibold">Selesai Terverifikasi</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-1 bg-amber-500 rounded-full"></span>
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          <span className="text-[#0f172a] font-semibold">Backlog Terbuka</span>
                        </div>
                      </>
                    )}

                    {chartMetric === 'sla' && (
                      <>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-1 bg-teal-600 rounded-full"></span>
                          <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                          <span className="text-[#0f172a] font-semibold">Realisasi SLA (Menit)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-4 h-0.5 border-t-2 border-dashed border-rose-500"></span>
                          <span className="text-rose-700 font-semibold">Target Ambang Batas SLA (60 Menit)</span>
                        </div>
                      </>
                    )}

                    {chartMetric === 'category' && (
                      <>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-1 bg-indigo-600 rounded-full"></span>
                          <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                          <span className="text-[#0f172a]">Pintu &amp; Akses Darurat</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-1 bg-amber-500 rounded-full"></span>
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          <span className="text-[#0f172a]">Panel Trafo / Genset B2</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-1 bg-rose-500 rounded-full"></span>
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                          <span className="text-[#0f172a]">APAR &amp; Proteksi Api</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* SVG Render Canvas */}
                <div className="w-full overflow-x-auto">
                  <div className="min-w-[620px]">
                    <svg viewBox="0 0 680 210" className="w-full h-52 select-none">
                      <defs>
                        <linearGradient id="blueGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#059669" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="amberGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="tealGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#0d9488" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#0d9488" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Grid Lines */}
                      <line x1="45" y1="25" x2="655" y2="25" stroke="#e2e8f0" strokeDasharray="3 3" />
                      <line x1="45" y1="65" x2="655" y2="65" stroke="#e2e8f0" strokeDasharray="3 3" />
                      <line x1="45" y1="105" x2="655" y2="105" stroke="#e2e8f0" strokeDasharray="3 3" />
                      <line x1="45" y1="145" x2="655" y2="145" stroke="#e2e8f0" strokeDasharray="3 3" />
                      <line x1="45" y1="175" x2="655" y2="175" stroke="#cbd5e1" strokeWidth="1.5" />

                      {/* Y-Axis Labels */}
                      {chartMetric === 'volume' && (
                        <>
                          <text x="35" y="29" textAnchor="end" className="text-[10px] fill-[#94a3b8] font-mono">7 ks</text>
                          <text x="35" y="69" textAnchor="end" className="text-[10px] fill-[#94a3b8] font-mono">5 ks</text>
                          <text x="35" y="109" textAnchor="end" className="text-[10px] fill-[#94a3b8] font-mono">3 ks</text>
                          <text x="35" y="149" textAnchor="end" className="text-[10px] fill-[#94a3b8] font-mono">1 ks</text>
                          <text x="35" y="178" textAnchor="end" className="text-[10px] fill-[#94a3b8] font-mono">0</text>
                        </>
                      )}

                      {chartMetric === 'sla' && (
                        <>
                          <text x="35" y="29" textAnchor="end" className="text-[10px] fill-[#94a3b8] font-mono">70m</text>
                          <text x="35" y="69" textAnchor="end" className="text-[10px] fill-rose-600 font-mono font-bold">60m</text>
                          <text x="35" y="109" textAnchor="end" className="text-[10px] fill-[#94a3b8] font-mono">50m</text>
                          <text x="35" y="149" textAnchor="end" className="text-[10px] fill-[#94a3b8] font-mono">40m</text>
                          <text x="35" y="178" textAnchor="end" className="text-[10px] fill-[#94a3b8] font-mono">30m</text>

                          {/* 60m SLA Threshold Line */}
                          <line x1="45" y1="65" x2="655" y2="65" stroke="#e11d48" strokeWidth="1.5" strokeDasharray="5 4" />
                          <text x="650" y="60" textAnchor="end" className="text-[9px] fill-rose-600 font-bold">Ambang SLA Max (60m)</text>
                        </>
                      )}

                      {chartMetric === 'category' && (
                        <>
                          <text x="35" y="29" textAnchor="end" className="text-[10px] fill-[#94a3b8] font-mono">4 ks</text>
                          <text x="35" y="75" textAnchor="end" className="text-[10px] fill-[#94a3b8] font-mono">3 ks</text>
                          <text x="35" y="125" textAnchor="end" className="text-[10px] fill-[#94a3b8] font-mono">2 ks</text>
                          <text x="35" y="178" textAnchor="end" className="text-[10px] fill-[#94a3b8] font-mono">0</text>
                        </>
                      )}

                      {/* Line Renderings depending on active metric */}
                      {chartMetric === 'volume' && (() => {
                        const points = timelineData.map((pt, i) => {
                          const x = 55 + i * 98;
                          const yRep = 175 - (pt.reportedCount / 7) * 150;
                          const yRes = 175 - (pt.resolvedCount / 7) * 150;
                          const yBack = 175 - (pt.openBacklog / 7) * 150;
                          return { x, yRep, yRes, yBack, pt };
                        });

                        const dRep = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yRep}`).join(' ');
                        const dRepArea = `${dRep} L ${points[points.length - 1].x} 175 L ${points[0].x} 175 Z`;

                        const dRes = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yRes}`).join(' ');
                        const dBack = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yBack}`).join(' ');

                        return (
                          <g>
                            {/* Area fill */}
                            <path d={dRepArea} fill="url(#blueGrad)" />

                            {/* Lines */}
                            <path d={dBack} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d={dRes} fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d={dRep} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                            {/* Node Points */}
                            {points.map((p, idx) => (
                              <g
                                key={idx}
                                className="cursor-pointer group"
                                onMouseEnter={() => setHoveredPointIndex(idx)}
                                onMouseLeave={() => setHoveredPointIndex(null)}
                              >
                                {/* Vertical highlight on hover */}
                                {hoveredPointIndex === idx && (
                                  <line x1={p.x} y1="25" x2={p.x} y2="175" stroke="#94a3b8" strokeDasharray="2 2" strokeWidth="1" />
                                )}

                                <circle cx={p.x} cy={p.yRep} r="4.5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                                <circle cx={p.x} cy={p.yRes} r="4" fill="#059669" stroke="#ffffff" strokeWidth="2" />
                                <circle cx={p.x} cy={p.yBack} r="3.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                              </g>
                            ))}
                          </g>
                        );
                      })()}

                      {chartMetric === 'sla' && (() => {
                        const points = timelineData.map((pt, i) => {
                          const x = 55 + i * 98;
                          // Mapping 30m to 70m across Y 175 to 25
                          const y = 175 - ((pt.avgResolutionMinutes - 30) / 40) * 150;
                          return { x, y, pt };
                        });

                        const dSla = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                        const dSlaArea = `${dSla} L ${points[points.length - 1].x} 175 L ${points[0].x} 175 Z`;

                        return (
                          <g>
                            <path d={dSlaArea} fill="url(#tealGrad)" />
                            <path d={dSla} fill="none" stroke="#0d9488" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            {points.map((p, idx) => (
                              <g
                                key={idx}
                                className="cursor-pointer"
                                onMouseEnter={() => setHoveredPointIndex(idx)}
                                onMouseLeave={() => setHoveredPointIndex(null)}
                              >
                                {hoveredPointIndex === idx && (
                                  <line x1={p.x} y1="25" x2={p.x} y2="175" stroke="#94a3b8" strokeDasharray="2 2" strokeWidth="1" />
                                )}
                                <circle cx={p.x} cy={p.y} r="5" fill="#0d9488" stroke="#ffffff" strokeWidth="2" />
                                <text x={p.x} y={p.y - 10} textAnchor="middle" className="text-[10px] font-bold fill-teal-800">
                                  {p.pt.avgResolutionMinutes}m
                                </text>
                              </g>
                            ))}
                          </g>
                        );
                      })()}

                      {chartMetric === 'category' && (() => {
                        const points = timelineData.map((pt, i) => {
                          const x = 55 + i * 98;
                          const yDoor = 175 - (pt.doorAccessCount / 4) * 150;
                          const yElec = 175 - (pt.electricalCount / 4) * 150;
                          const yFire = 175 - (pt.fireSafetyCount / 4) * 150;
                          return { x, yDoor, yElec, yFire, pt };
                        });

                        const dDoor = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yDoor}`).join(' ');
                        const dElec = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yElec}`).join(' ');
                        const dFire = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yFire}`).join(' ');

                        return (
                          <g>
                            <path d={dDoor} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d={dElec} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d={dFire} fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            {points.map((p, idx) => (
                              <g
                                key={idx}
                                className="cursor-pointer"
                                onMouseEnter={() => setHoveredPointIndex(idx)}
                                onMouseLeave={() => setHoveredPointIndex(null)}
                              >
                                {hoveredPointIndex === idx && (
                                  <line x1={p.x} y1="25" x2={p.x} y2="175" stroke="#94a3b8" strokeDasharray="2 2" strokeWidth="1" />
                                )}
                                <circle cx={p.x} cy={p.yDoor} r="4" fill="#4f46e5" stroke="#ffffff" strokeWidth="2" />
                                <circle cx={p.x} cy={p.yElec} r="4" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                                <circle cx={p.x} cy={p.yFire} r="4" fill="#f43f5e" stroke="#ffffff" strokeWidth="2" />
                              </g>
                            ))}
                          </g>
                        );
                      })()}

                      {/* X-Axis Date Labels */}
                      {timelineData.map((pt, i) => {
                        const x = 55 + i * 98;
                        const isHovered = hoveredPointIndex === i;
                        return (
                          <g key={pt.label}>
                            <text
                              x={x}
                              y="196"
                              textAnchor="middle"
                              className={`text-[11px] ${
                                isHovered ? 'fill-[#2563eb] font-bold' : 'fill-[#475569] font-medium'
                              }`}
                            >
                              {pt.label}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>

                {/* Interactive Tooltip Callout */}
                {hoveredPointIndex !== null && (
                  <div className="mt-3 p-3 bg-white border border-[#cbd5e1] rounded-lg shadow-sm text-xs flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#2563eb] text-sm">calendar_month</span>
                      <strong className="text-[#0f172a] font-bold">
                        Detail Tanggal {timelineData[hoveredPointIndex].label} 2025:
                      </strong>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-[#2563eb] font-bold">
                        Dilaporkan: {timelineData[hoveredPointIndex].reportedCount} kasus
                      </span>
                      <span className="text-[#059669] font-bold">
                        Selesai: {timelineData[hoveredPointIndex].resolvedCount} kasus
                      </span>
                      <span className="text-[#f59e0b] font-bold">
                        Backlog Terbuka: {timelineData[hoveredPointIndex].openBacklog} kasus
                      </span>
                      <span className="text-[#0d9488] font-bold">
                        Rata-rata SLA: {timelineData[hoveredPointIndex].avgResolutionMinutes} Menit
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* KPI Strip & Metrik Efisiensi Mitigasi */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                  <span className="text-[10px] text-[#64748b] block font-semibold uppercase">Rata-rata Temuan</span>
                  <span className="text-lg font-black text-[#0f172a] mt-0.5 block">3.8 Kasus / Hari</span>
                  <span className="text-[10px] text-blue-700 font-medium">Berdasarkan data 7 hari terakhir</span>
                </div>
                <div className="p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                  <span className="text-[10px] text-[#64748b] block font-semibold uppercase">Tingkat Penyelesaian</span>
                  <span className="text-lg font-black text-emerald-600 mt-0.5 block">88.9% Tuntas</span>
                  <span className="text-[10px] text-emerald-700 font-medium">24 dari 27 temuan ditutup</span>
                </div>
                <div className="p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                  <span className="text-[10px] text-[#64748b] block font-semibold uppercase">Rata-rata Waktu SLA</span>
                  <span className="text-lg font-black text-teal-600 mt-0.5 block">48 Menit</span>
                  <span className="text-[10px] text-teal-700 font-medium">12 menit lebih cepat dari target 60m</span>
                </div>
                <div className="p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                  <span className="text-[10px] text-[#64748b] block font-semibold uppercase">Hari Puncak Temuan</span>
                  <span className="text-lg font-black text-rose-600 mt-0.5 block">23 Mei (Jumat)</span>
                  <span className="text-[10px] text-rose-700 font-medium">6 laporan anomali teridentifikasi</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global Filter Bar */}
      <div className="bg-white border border-[#e2e8f0] rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[240px] flex-1 max-w-sm">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-base text-[#94a3b8]">
              search
            </span>
            <input
              type="text"
              placeholder="Cari umum (ID, judul, deskripsi, pelapor, lokasi)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#f8fafc] border border-[#cbd5e1] rounded text-xs text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
            />
          </div>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="px-2.5 py-1.5 bg-[#f8fafc] border border-[#cbd5e1] rounded text-xs text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
          >
            <option value="all">Semua Tingkat Bahaya</option>
            <option value="Kritis">Kritis</option>
            <option value="Tinggi">Tinggi</option>
            <option value="Sedang">Sedang</option>
            <option value="Rendah">Rendah</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-[#f8fafc] border border-[#cbd5e1] rounded text-xs text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
          >
            <option value="all">Semua Status Penanganan</option>
            <option value="Baru">Baru</option>
            <option value="Dalam Penanganan">Dalam Penanganan</option>
            <option value="Selesai Terverifikasi">Selesai Terverifikasi</option>
          </select>

          {isAnyColumnFilterActive && (
            <button
              onClick={clearAllColumnFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded text-xs font-semibold transition-colors cursor-pointer"
              title="Reset semua filter kolom"
            >
              <span className="material-symbols-outlined text-xs">filter_alt_off</span>
              <span>Reset Filter Kolom</span>
            </button>
          )}
        </div>

        <div className="text-xs text-[#64748b]">
          Menampilkan <strong className="text-[#0f172a]">{filteredFindings.length}</strong> dari {findings.length} temuan
        </div>
      </div>

      {/* Findings Data Table with PER-COLUMN SEARCHING */}
      <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {/* Row 1: Column Titles */}
              <tr className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[11px] font-bold text-[#475569] uppercase tracking-wider h-10">
                <th className="px-3 py-2 w-28">ID Temuan</th>
                <th className="px-2 py-2 text-center w-24">Foto Bukti</th>
                <th className="px-3 py-2 min-w-[220px]">Judul &amp; Deskripsi Anomali</th>
                <th className="px-2 py-2 text-center w-32">Tingkat Bahaya</th>
                <th className="px-3 py-2 min-w-[150px]">Lokasi &amp; Site</th>
                <th className="px-3 py-2 min-w-[150px]">Pelapor &amp; Waktu</th>
                <th className="px-3 py-2 min-w-[140px]">Ditugaskan Ke</th>
                <th className="px-2 py-2 text-center w-36">Status</th>
                <th className="px-3 py-2 text-right w-24">Aksi</th>
              </tr>

              {/* Row 2: Individual Search Input per Column */}
              <tr className="bg-[#f1f5f9]/70 border-b border-[#cbd5e1] text-xs">
                {/* Search ID */}
                <th className="p-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Cari ID..."
                      value={columnSearch.id}
                      onChange={(e) => setColumnSearch({ ...columnSearch, id: e.target.value })}
                      className="w-full px-2 py-1 text-[11px] bg-white border border-[#cbd5e1] rounded focus:outline-none focus:border-[#2563eb]"
                    />
                  </div>
                </th>

                {/* Filter Foto */}
                <th className="p-2">
                  <select
                    value={columnSearch.hasPhoto}
                    onChange={(e) => setColumnSearch({ ...columnSearch, hasPhoto: e.target.value })}
                    className="w-full px-1.5 py-1 text-[11px] bg-white border border-[#cbd5e1] rounded focus:outline-none focus:border-[#2563eb] cursor-pointer"
                  >
                    <option value="">Semua</option>
                    <option value="ada">Ada Foto</option>
                    <option value="tanpa">Tanpa Foto</option>
                  </select>
                </th>

                {/* Search Judul & Deskripsi */}
                <th className="p-2">
                  <input
                    type="text"
                    placeholder="Cari anomali..."
                    value={columnSearch.title}
                    onChange={(e) => setColumnSearch({ ...columnSearch, title: e.target.value })}
                    className="w-full px-2 py-1 text-[11px] bg-white border border-[#cbd5e1] rounded focus:outline-none focus:border-[#2563eb]"
                  />
                </th>

                {/* Filter Tingkat Bahaya */}
                <th className="p-2">
                  <select
                    value={columnSearch.severity}
                    onChange={(e) => setColumnSearch({ ...columnSearch, severity: e.target.value })}
                    className="w-full px-1.5 py-1 text-[11px] bg-white border border-[#cbd5e1] rounded focus:outline-none focus:border-[#2563eb] cursor-pointer"
                  >
                    <option value="">Semua</option>
                    <option value="Kritis">Kritis</option>
                    <option value="Tinggi">Tinggi</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Rendah">Rendah</option>
                  </select>
                </th>

                {/* Search Lokasi & Site */}
                <th className="p-2">
                  <input
                    type="text"
                    placeholder="Cari lokasi..."
                    value={columnSearch.location}
                    onChange={(e) => setColumnSearch({ ...columnSearch, location: e.target.value })}
                    className="w-full px-2 py-1 text-[11px] bg-white border border-[#cbd5e1] rounded focus:outline-none focus:border-[#2563eb]"
                  />
                </th>

                {/* Search Pelapor & Waktu */}
                <th className="p-2">
                  <input
                    type="text"
                    placeholder="Cari pelapor..."
                    value={columnSearch.reportedBy}
                    onChange={(e) => setColumnSearch({ ...columnSearch, reportedBy: e.target.value })}
                    className="w-full px-2 py-1 text-[11px] bg-white border border-[#cbd5e1] rounded focus:outline-none focus:border-[#2563eb]"
                  />
                </th>

                {/* Search Ditugaskan Ke */}
                <th className="p-2">
                  <input
                    type="text"
                    placeholder="Cari penugasan..."
                    value={columnSearch.assignedTo}
                    onChange={(e) => setColumnSearch({ ...columnSearch, assignedTo: e.target.value })}
                    className="w-full px-2 py-1 text-[11px] bg-white border border-[#cbd5e1] rounded focus:outline-none focus:border-[#2563eb]"
                  />
                </th>

                {/* Filter Status */}
                <th className="p-2">
                  <select
                    value={columnSearch.status}
                    onChange={(e) => setColumnSearch({ ...columnSearch, status: e.target.value })}
                    className="w-full px-1.5 py-1 text-[11px] bg-white border border-[#cbd5e1] rounded focus:outline-none focus:border-[#2563eb] cursor-pointer"
                  >
                    <option value="">Semua</option>
                    <option value="Baru">Baru</option>
                    <option value="Dalam Penanganan">Penanganan</option>
                    <option value="Selesai Terverifikasi">Selesai</option>
                  </select>
                </th>

                {/* Reset Action */}
                <th className="p-2 text-right">
                  {isAnyColumnFilterActive ? (
                    <button
                      type="button"
                      onClick={clearAllColumnFilters}
                      className="text-[10px] text-rose-600 hover:text-rose-800 font-bold px-2 py-1 rounded bg-rose-50 border border-rose-200 cursor-pointer"
                      title="Reset semua filter pencarian kolom"
                    >
                      Reset
                    </button>
                  ) : (
                    <span className="text-[10px] text-[#94a3b8] italic">Filter Kolom</span>
                  )}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9] text-xs">
              {filteredFindings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#94a3b8]">
                    Tidak ada temuan lapangan yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredFindings.map((f) => (
                  <tr key={f.id} className="hover:bg-[#f8fafc] transition-colors">
                    {/* ID */}
                    <td className="px-4 py-3 font-mono font-semibold text-[#2563eb] whitespace-nowrap">
                      {f.id}
                    </td>

                    {/* Foto Bukti */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {f.photoUrl ? (
                        <button
                          onClick={() => setViewingPhotoFinding(f)}
                          className="relative inline-block w-12 h-10 rounded overflow-hidden border border-[#cbd5e1] hover:ring-2 hover:ring-[#2563eb] transition-all group cursor-pointer"
                          title="Klik untuk perbesar foto"
                        >
                          <img
                            src={f.photoUrl}
                            alt={f.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <span className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                            <span className="material-symbols-outlined text-xs">zoom_in</span>
                          </span>
                        </button>
                      ) : (
                        <span className="text-[#94a3b8] text-[11px] italic">Tanpa Foto</span>
                      )}
                    </td>

                    {/* Judul & Deskripsi */}
                    <td className="px-4 py-3 min-w-[240px] max-w-sm">
                      <div className="font-semibold text-[#0f172a] leading-tight">{f.title}</div>
                      <div className="text-[11px] text-[#475569] mt-0.5 line-clamp-2 leading-relaxed">
                        {f.description}
                      </div>
                      {f.notes && (
                        <div className="text-[10px] text-blue-700 font-medium mt-1 bg-blue-50/70 px-1.5 py-0.5 rounded inline-block">
                          Catatan: {f.notes}
                        </div>
                      )}
                    </td>

                    {/* Tingkat Bahaya */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          f.severity === 'Kritis'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : f.severity === 'Tinggi'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : f.severity === 'Sedang'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-slate-100 text-slate-800 border border-slate-200'
                        }`}
                      >
                        {f.severity}
                      </span>
                    </td>

                    {/* Lokasi & Site */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-[#0f172a]">{f.siteName}</div>
                      <div className="text-[11px] text-[#64748b]">{f.location}</div>
                    </td>

                    {/* Pelapor & Waktu */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium text-[#0f172a]">{f.reportedBy}</div>
                      <div className="text-[11px] text-[#64748b]">{f.reportedAt}</div>
                    </td>

                    {/* Ditugaskan Ke */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-[11px] font-medium text-[#2563eb] bg-[#eff6ff] px-2 py-0.5 rounded border border-[#bfdbfe]">
                        {f.assignedTo || 'Belum Ditugaskan'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          f.status === 'Baru'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : f.status === 'Dalam Penanganan'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {f.status}
                      </span>
                    </td>

                    {/* Aksi */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {f.status === 'Baru' && (
                          <button
                            onClick={() => handleUpdateStatus(f.id, 'Dalam Penanganan')}
                            className="px-2 py-1 rounded bg-[#2563eb] text-white hover:bg-[#1d4ed8] text-[11px] font-semibold"
                            title="Mulai penanganan"
                          >
                            Proses
                          </button>
                        )}
                        {f.status === 'Dalam Penanganan' && (
                          <button
                            onClick={() => handleUpdateStatus(f.id, 'Selesai Terverifikasi')}
                            className="px-2 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 text-[11px] font-semibold"
                            title="Selesaikan temuan"
                          >
                            Selesai
                          </button>
                        )}
                        <button
                          onClick={() => setEditingFinding(f)}
                          className="px-2 py-1 rounded border border-[#e2e8f0] text-[#334155] hover:bg-[#f8fafc] text-[11px] font-medium"
                          title="Edit data temuan"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeletingFinding(f)}
                          className="px-2 py-1 rounded border border-rose-200 text-rose-600 hover:bg-rose-50 text-[11px] font-medium"
                          title="Hapus temuan"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        <div className="px-4 py-2.5 bg-[#f8fafc] border-t border-[#e2e8f0] flex items-center justify-between text-xs text-[#64748b]">
          <span>Data temuan tercatat real-time dan terintegrasi dengan audit log K3</span>
          <span>Prioritas Kritis &amp; Tinggi wajib dimitigasi dalam $\le$ 2 jam</span>
        </div>
      </div>

      {/* Modal: Lihat Bukti Foto */}
      {viewingPhotoFinding && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full border border-[#cbd5e1] overflow-hidden animate-in fade-in">
            <div className="px-5 py-3.5 border-b border-[#e2e8f0] flex items-center justify-between bg-[#f8fafc]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2563eb] text-lg">image</span>
                <h3 className="text-sm font-bold text-[#0f172a]">{viewingPhotoFinding.id}: {viewingPhotoFinding.title}</h3>
              </div>
              <button onClick={() => setViewingPhotoFinding(null)} className="text-[#94a3b8] hover:text-[#0f172a]">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {viewingPhotoFinding.photoUrl ? (
                <div className="w-full h-64 rounded bg-slate-900 overflow-hidden border border-[#e2e8f0]">
                  <img
                    src={viewingPhotoFinding.photoUrl}
                    alt={viewingPhotoFinding.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-32 rounded bg-[#f8fafc] border border-[#e2e8f0] flex flex-col items-center justify-center text-[#94a3b8]">
                  <span className="material-symbols-outlined text-3xl mb-1">image_not_supported</span>
                  <span>Tidak ada foto bukti</span>
                </div>
              )}

              <div className="p-3 bg-[#faf8ff] rounded border border-[#eaedff]">
                <span className="font-semibold text-[#0f172a] block mb-1">Deskripsi Lapangan:</span>
                <p className="text-[#334155] leading-relaxed">{viewingPhotoFinding.description}</p>
                <div className="mt-2 pt-2 border-t border-[#eaedff] text-[11px] text-[#64748b] flex justify-between">
                  <span>Lokasi: <strong>{viewingPhotoFinding.siteName} ({viewingPhotoFinding.location})</strong></span>
                  <span>Pelapor: <strong>{viewingPhotoFinding.reportedBy}</strong></span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewingPhotoFinding(null)}
                  className="px-3 py-1.5 rounded bg-[#2563eb] text-white font-semibold hover:bg-[#1d4ed8]"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Temuan */}
      {editingFinding && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full border border-[#cbd5e1] overflow-hidden animate-in fade-in">
            <div className="px-5 py-3.5 border-b border-[#e2e8f0] flex items-center justify-between bg-[#f8fafc]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2563eb] text-lg">edit</span>
                <h3 className="text-sm font-bold text-[#0f172a]">Edit Data Temuan: {editingFinding.id}</h3>
              </div>
              <button onClick={() => setEditingFinding(null)} className="text-[#94a3b8] hover:text-[#0f172a]">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleEditFinding} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#334155] uppercase mb-1">
                  Judul Temuan
                </label>
                <input
                  type="text"
                  required
                  value={editingFinding.title}
                  onChange={(e) => setEditingFinding({ ...editingFinding, title: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#334155] uppercase mb-1">
                  Deskripsi Temuan
                </label>
                <textarea
                  rows={3}
                  required
                  value={editingFinding.description}
                  onChange={(e) => setEditingFinding({ ...editingFinding, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#334155] uppercase mb-1">
                    Detail Lokasi
                  </label>
                  <input
                    type="text"
                    required
                    value={editingFinding.location}
                    onChange={(e) => setEditingFinding({ ...editingFinding, location: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#334155] uppercase mb-1">
                    Tingkat Bahaya
                  </label>
                  <select
                    value={editingFinding.severity}
                    onChange={(e) => setEditingFinding({ ...editingFinding, severity: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                  >
                    <option value="Rendah">Rendah</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Tinggi">Tinggi</option>
                    <option value="Kritis">Kritis</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#334155] uppercase mb-1">
                    Ditugaskan Ke
                  </label>
                  <input
                    type="text"
                    value={editingFinding.assignedTo || ''}
                    onChange={(e) => setEditingFinding({ ...editingFinding, assignedTo: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#334155] uppercase mb-1">
                    Status Penanganan
                  </label>
                  <select
                    value={editingFinding.status}
                    onChange={(e) => setEditingFinding({ ...editingFinding, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                  >
                    <option value="Baru">Baru</option>
                    <option value="Dalam Penanganan">Dalam Penanganan</option>
                    <option value="Selesai Terverifikasi">Selesai Terverifikasi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#334155] uppercase mb-1">
                  Catatan Tindak Lanjut / Mitigasi
                </label>
                <input
                  type="text"
                  placeholder="Tambahkan catatan perbaikan dari teknisi..."
                  value={editingFinding.notes || ''}
                  onChange={(e) => setEditingFinding({ ...editingFinding, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setEditingFinding(null)}
                  className="px-3 py-1.5 rounded border border-[#e2e8f0] text-[#334155] font-medium hover:bg-[#f8fafc]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-[#2563eb] text-white font-semibold hover:bg-[#1d4ed8] shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Hapus Temuan (Konfirmasi) */}
      {deletingFinding && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full border border-rose-200 overflow-hidden animate-in fade-in">
            <div className="p-5 text-center text-xs space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-2xl">delete_forever</span>
              </div>
              <h3 className="text-sm font-bold text-[#0f172a]">Hapus Temuan Patroli?</h3>
              <p className="text-[#64748b]">
                Apakah Anda yakin ingin menghapus data temuan <strong>{deletingFinding.id}</strong> ({deletingFinding.title})? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex justify-center gap-2 pt-2 border-t border-[#f1f5f9]">
                <button
                  onClick={() => setDeletingFinding(null)}
                  className="px-3 py-1.5 rounded border border-[#e2e8f0] text-[#334155] font-medium hover:bg-[#f8fafc]"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteFinding}
                  className="px-3 py-1.5 rounded bg-rose-600 text-white font-semibold hover:bg-rose-700 shadow-xs"
                >
                  Ya, Hapus Temuan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Buat Temuan Manual */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full border border-[#cbd5e1] overflow-hidden animate-in fade-in">
            <div className="px-5 py-3.5 border-b border-[#e2e8f0] flex items-center justify-between bg-[#f8fafc]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2563eb] text-lg">add_alert</span>
                <h3 className="text-sm font-bold text-[#0f172a]">Input Laporan Temuan Patroli</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[#94a3b8] hover:text-[#0f172a]">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateFinding} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#334155] uppercase mb-1">
                  Judul Anomali / Temuan
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kaca Jendela Ruang Rapat Retak"
                  value={newFinding.title}
                  onChange={(e) => setNewFinding({ ...newFinding, title: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#334155] uppercase mb-1">
                  Deskripsi Lengkap Temuan
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Jelaskan detail lokasi, kondisi fisik barang, dan dampak risiko..."
                  value={newFinding.description}
                  onChange={(e) => setNewFinding({ ...newFinding, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#334155] uppercase mb-1">
                    Lokasi Site
                  </label>
                  <select
                    value={newFinding.siteId}
                    onChange={(e) => setNewFinding({ ...newFinding, siteId: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                  >
                    {SITES.filter((s) => s.id !== 'all').map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#334155] uppercase mb-1">
                    Detail Lokasi / Ruangan
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Lantai 8 Sayap Selatan"
                    value={newFinding.location}
                    onChange={(e) => setNewFinding({ ...newFinding, location: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#334155] uppercase mb-1">
                    Tingkat Bahaya (Severity)
                  </label>
                  <select
                    value={newFinding.severity}
                    onChange={(e) => setNewFinding({ ...newFinding, severity: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                  >
                    <option value="Rendah">Rendah (Low Risk)</option>
                    <option value="Sedang">Sedang (Medium Risk)</option>
                    <option value="Tinggi">Tinggi (High Priority)</option>
                    <option value="Kritis">Kritis (Emergency)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#334155] uppercase mb-1">
                    Tugaskan Tindak Lanjut Ke
                  </label>
                  <input
                    type="text"
                    value={newFinding.assignedTo}
                    onChange={(e) => setNewFinding({ ...newFinding, assignedTo: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-[#e2e8f0] text-[#334155] font-medium hover:bg-[#f8fafc]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-[#2563eb] text-white font-semibold hover:bg-[#1d4ed8] shadow-xs"
                >
                  Kirim Laporan Temuan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
