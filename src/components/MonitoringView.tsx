import React, { useState, useMemo } from 'react';
import { SECURITY_LEADERBOARD_DATA, SITES } from '../data/mockData';
import { SecurityLeaderboardItem, filterItemsByColumnCriteria } from '../utils/security-logic';

interface MonitoringViewProps {
  selectedSite: string;
}

export const MonitoringView: React.FC<MonitoringViewProps> = ({ selectedSite }) => {
  const [leaderboard] = useState<SecurityLeaderboardItem[]>(SECURITY_LEADERBOARD_DATA);
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'week' | 'day'>('month');
  const [selectedSquad, setSelectedSquad] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOfficer, setSelectedOfficer] = useState<SecurityLeaderboardItem | null>(null);

  // Per-column search state for leaderboard table
  const [columnSearch, setColumnSearch] = useState({
    rank: '',
    officer: '',
    squadSite: '',
    checkpoints: '',
    compliance: '',
    onTime: '',
    findings: '',
    score: '',
    badge: '',
    status: '',
  });

  const isAnyColumnFilterActive = Object.values(columnSearch).some((v) => v.trim().length > 0);
  const clearAllColumnFilters = () => {
    setColumnSearch({
      rank: '',
      officer: '',
      squadSite: '',
      checkpoints: '',
      compliance: '',
      onTime: '',
      findings: '',
      score: '',
      badge: '',
      status: '',
    });
  };

  // Base filter leaderboard
  const baseFilteredLeaderboard = useMemo(() => {
    return leaderboard.filter((officer) => {
      if (selectedSite !== 'all' && officer.siteId !== selectedSite) return false;
      if (selectedSquad !== 'all' && officer.squad !== selectedSquad) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          officer.name.toLowerCase().includes(q) ||
          officer.npp.toLowerCase().includes(q) ||
          officer.squad.toLowerCase().includes(q) ||
          officer.role.toLowerCase().includes(q) ||
          officer.siteName.toLowerCase().includes(q) ||
          officer.badgeTitle.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [leaderboard, selectedSite, selectedSquad, searchQuery]);

  // Apply per-column search filtering
  const filteredLeaderboard = useMemo(() => {
    return filterItemsByColumnCriteria(baseFilteredLeaderboard, columnSearch, {
      rank: (o) => `#${o.rank} ${o.rank}`,
      officer: (o) => `${o.name} ${o.npp} ${o.role}`,
      squadSite: (o) => `${o.squad} ${o.siteName}`,
      checkpoints: (o) => `${o.totalCheckpointsScanned}`,
      compliance: (o) => `${o.complianceRate}%`,
      onTime: (o) => `${o.onTimeRate}%`,
      findings: (o) => `${o.findingsReported}`,
      score: (o) => `${o.score}`,
      badge: (o) => `${o.badgeTitle}`,
      status: (o) => `${o.status}`,
    });
  }, [baseFilteredLeaderboard, columnSearch]);

  // Performance analytics summary
  const summary = useMemo(() => {
    if (filteredLeaderboard.length === 0) {
      return {
        avgScore: 0,
        avgCompliance: 0,
        avgOnTime: 0,
        totalScanned: 0,
        totalFindings: 0,
      };
    }
    const totalScore = filteredLeaderboard.reduce((acc, curr) => acc + curr.score, 0);
    const totalComp = filteredLeaderboard.reduce((acc, curr) => acc + curr.complianceRate, 0);
    const totalOnTime = filteredLeaderboard.reduce((acc, curr) => acc + curr.onTimeRate, 0);
    const totalScanned = filteredLeaderboard.reduce((acc, curr) => acc + curr.totalCheckpointsScanned, 0);
    const totalFindings = filteredLeaderboard.reduce((acc, curr) => acc + curr.findingsReported, 0);

    return {
      avgScore: Math.round((totalScore / filteredLeaderboard.length) * 10) / 10,
      avgCompliance: Math.round((totalComp / filteredLeaderboard.length) * 10) / 10,
      avgOnTime: Math.round((totalOnTime / filteredLeaderboard.length) * 10) / 10,
      totalScanned,
      totalFindings,
    };
  }, [filteredLeaderboard]);

  // Squad performance comparison
  const squadPerformance = [
    { name: 'Regu Alpha', danru: 'Ahmad Fauzi', score: 98.6, compliance: 99.4, onTime: 98.1, color: 'bg-blue-600' },
    { name: 'Regu Charlie', danru: 'Wahyu Hidayat', score: 97.0, compliance: 97.8, onTime: 95.8, color: 'bg-emerald-600' },
    { name: 'Regu Delta', danru: 'Joko Susilo', score: 96.4, compliance: 97.0, onTime: 95.2, color: 'bg-purple-600' },
    { name: 'Regu Bravo', danru: 'Bambang Sudrajat', score: 95.8, compliance: 96.0, onTime: 94.2, color: 'bg-amber-600' },
  ];

  // Top 3 Podium
  const top1 = filteredLeaderboard[0];
  const top2 = filteredLeaderboard[1];
  const top3 = filteredLeaderboard[2];

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#e2e8f0]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-100 text-[#2563eb]">
              <span className="material-symbols-outlined text-xl">leaderboard</span>
            </span>
            <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">
              Monitoring Kinerja &amp; Peringkat Security
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Evaluasi KPI Terintegrasi
            </span>
          </div>
          <p className="text-xs text-[#64748b] mt-1 ml-9">
            Papan analitik performa terpadu: grafik kepatuhan rute, ketepatan waktu patroli, waktu respons temuan, serta peringkat petugas terbaik.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-2">
          <div className="inline-flex p-1 bg-[#f1f5f9] border border-[#e2e8f0] rounded-lg text-xs font-semibold">
            <button
              onClick={() => setSelectedPeriod('day')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                selectedPeriod === 'day' ? 'bg-white text-[#2563eb] shadow-xs' : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setSelectedPeriod('week')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                selectedPeriod === 'week' ? 'bg-white text-[#2563eb] shadow-xs' : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              Minggu Ini
            </button>
            <button
              onClick={() => setSelectedPeriod('month')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                selectedPeriod === 'month' ? 'bg-white text-[#2563eb] shadow-xs' : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              Bulan Ini (Mei 2025)
            </button>
          </div>
        </div>
      </div>

      {/* KPI Overview Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-[#e2e8f0] rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
              Rata-rata Skor Kinerja
            </span>
            <span className="p-1 rounded bg-blue-50 text-[#2563eb]">
              <span className="material-symbols-outlined text-base">military_tech</span>
            </span>
          </div>
          <div className="text-2xl font-black text-[#0f172a] mt-2">
            {summary.avgScore} <span className="text-xs font-normal text-[#64748b]">/ 100</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">trending_up</span>
            <span>+2.4% di atas target institusi</span>
          </div>
        </div>

        <div className="p-4 bg-white border border-[#e2e8f0] rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
              Kepatuhan Patroli
            </span>
            <span className="p-1 rounded bg-emerald-50 text-emerald-600">
              <span className="material-symbols-outlined text-base">fact_check</span>
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            {summary.avgCompliance}%
          </div>
          <div className="text-[11px] text-[#64748b] mt-1">
            Persentase scan titik tepat urutan
          </div>
        </div>

        <div className="p-4 bg-white border border-[#e2e8f0] rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
              Ketepatan Waktu
            </span>
            <span className="p-1 rounded bg-teal-50 text-teal-600">
              <span className="material-symbols-outlined text-base">schedule</span>
            </span>
          </div>
          <div className="text-2xl font-black text-teal-700 mt-2">
            {summary.avgOnTime}%
          </div>
          <div className="text-[11px] text-[#64748b] mt-1">
            Sesuai jadwal tanpa keterlambatan
          </div>
        </div>

        <div className="p-4 bg-white border border-[#e2e8f0] rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
              Total Checkpoint Di-scan
            </span>
            <span className="p-1 rounded bg-purple-50 text-purple-600">
              <span className="material-symbols-outlined text-base">pin_drop</span>
            </span>
          </div>
          <div className="text-2xl font-black text-purple-700 mt-2">
            {summary.totalScanned} <span className="text-xs font-normal text-[#64748b]">titik</span>
          </div>
          <div className="text-[11px] text-[#64748b] mt-1">
            {summary.totalFindings} temuan berhasil dilaporkan
          </div>
        </div>
      </div>

      {/* GRAFIK KINERJA SECURITY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Grafik 1: Perbandingan Skor Kinerja per Regu (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#2563eb]">bar_chart</span>
              <h2 className="text-sm font-bold text-[#0f172a]">
                Grafik Performa Kinerja per Regu Pengamanan
              </h2>
            </div>
            <span className="text-[11px] text-[#64748b]">Tolok Ukur: KPI 95%</span>
          </div>

          {/* Bar Chart Visualization per Squad */}
          <div className="space-y-4 pt-1">
            {squadPerformance.map((squad) => (
              <div key={squad.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#0f172a]">{squad.name}</span>
                    <span className="text-[11px] text-[#64748b]">Danru: {squad.danru}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-[#64748b]">
                      Kepatuhan: <strong className="text-[#0f172a]">{squad.compliance}%</strong>
                    </span>
                    <span className="text-[11px] text-[#64748b]">
                      On-Time: <strong className="text-[#0f172a]">{squad.onTime}%</strong>
                    </span>
                    <span className="font-black text-xs text-[#2563eb] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      Skor {squad.score}
                    </span>
                  </div>
                </div>

                {/* Progress bar container */}
                <div className="w-full h-3.5 bg-[#f1f5f9] rounded-full overflow-hidden relative">
                  <div
                    className={`h-full ${squad.color} rounded-full transition-all duration-500`}
                    style={{ width: `${squad.score}%` }}
                  ></div>
                  {/* KPI Target Line at 95% */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10"
                    style={{ left: '95%' }}
                    title="Target KPI Minimum (95%)"
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Subchart: Tren Kepatuhan Mingguan */}
          <div className="pt-4 border-t border-[#f1f5f9]">
            <div className="flex items-center justify-between text-xs mb-3">
              <span className="font-bold text-[#0f172a]">Tren Kepatuhan Patroli 7 Hari Terakhir</span>
              <span className="text-[11px] text-emerald-600 font-semibold">Semua regu konsisten di atas 95%</span>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center">
              {[
                { day: 'Sen', rate: 97.4 },
                { day: 'Sel', rate: 98.1 },
                { day: 'Rab', rate: 96.9 },
                { day: 'Kam', rate: 98.5 },
                { day: 'Jum', rate: 99.0 },
                { day: 'Sab', rate: 98.2 },
                { day: 'Min', rate: 99.4 },
              ].map((item) => (
                <div key={item.day} className="p-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg">
                  <span className="text-[10px] text-[#64748b] font-medium block">{item.day}</span>
                  <span className="font-black text-xs text-[#0f172a] mt-0.5 block">{item.rate}%</span>
                  <div className="w-full h-1.5 bg-[#e2e8f0] rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${item.rate}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Grafik 2: Efisiensi & Ketepatan Respon (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2563eb]">speed</span>
                <h2 className="text-sm font-bold text-[#0f172a]">Efisiensi Respon SLA</h2>
              </div>
              <span className="text-[11px] text-[#64748b]">Metrik Jam Kerja</span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#64748b]">Rata-rata Waktu Tanggap Temuan</span>
                  <span className="font-black text-xs text-emerald-700">8.4 Menit</span>
                </div>
                <div className="w-full h-2 bg-[#e2e8f0] rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '85%' }}></div>
                </div>
                <span className="text-[10px] text-emerald-700 mt-1 block">
                  Target SLA: &lt; 15 menit (Efisien)
                </span>
              </div>

              <div className="p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#64748b]">Kinerja Shift Pagi</span>
                  <span className="font-bold text-xs text-[#0f172a]">98.6%</span>
                </div>
                <div className="w-full h-2 bg-[#e2e8f0] rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: '98.6%' }}></div>
                </div>
              </div>

              <div className="p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#64748b]">Kinerja Shift Siang</span>
                  <span className="font-bold text-xs text-[#0f172a]">97.8%</span>
                </div>
                <div className="w-full h-2 bg-[#e2e8f0] rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '97.8%' }}></div>
                </div>
              </div>

              <div className="p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#64748b]">Kinerja Shift Malam</span>
                  <span className="font-bold text-xs text-[#0f172a]">98.9%</span>
                </div>
                <div className="w-full h-2 bg-[#e2e8f0] rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: '98.9%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-[11px] text-emerald-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-emerald-600">emoji_events</span>
            <span>Regu Alpha dinobatkan sebagai Regu Terbaik minggu ini dengan skor rata-rata 98.6.</span>
          </div>
        </div>
      </div>

      {/* TOP 3 PODIUM PERINGKAT SECURITY */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500 text-xl">military_tech</span>
            <h2 className="text-base font-bold text-[#0f172a]">
              Peringkat Security &amp; Personel Teladan
            </h2>
          </div>
          <span className="text-xs text-[#64748b]">Berdasarkan akumulasi kepatuhan, ketepatan waktu, dan deteksi anomali</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Rank 2 */}
          {top2 && (
            <div className="p-4 bg-white border-2 border-slate-200 rounded-2xl shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-3 right-3 text-2xl font-black text-slate-300">#2</div>
              <div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300 inline-block mb-2">
                  🥈 Peringkat 2
                </span>
                <h3 className="font-bold text-sm text-[#0f172a]">{top2.name}</h3>
                <div className="text-xs text-[#64748b]">{top2.role} · {top2.squad}</div>
                <div className="text-[11px] text-blue-600 font-medium mt-0.5">{top2.siteName}</div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#f1f5f9] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#64748b] block">Skor Kinerja</span>
                  <span className="text-lg font-black text-[#0f172a]">{top2.score}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#64748b] block">Kepatuhan</span>
                  <span className="text-xs font-bold text-emerald-600">{top2.complianceRate}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Rank 1 (Juara Utama) */}
          {top1 && (
            <div className="p-5 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white border-2 border-amber-400 rounded-2xl shadow-md relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-3 right-3 text-3xl font-black text-amber-500">🥇</div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white shadow-xs inline-block mb-2">
                  🏆 TOP PERFORMER #1
                </span>
                <h3 className="font-extrabold text-base text-[#0f172a]">{top1.name}</h3>
                <div className="text-xs text-[#475569] font-medium">{top1.role} · {top1.squad}</div>
                <div className="text-[11px] text-blue-700 font-semibold mt-0.5">{top1.siteName}</div>
                <div className="mt-2 inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-200">
                  {top1.badgeTitle}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#64748b] block font-medium">Skor Tertinggi</span>
                  <span className="text-2xl font-black text-amber-800">{top1.score}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#64748b] block font-medium">Scan Checkpoint</span>
                  <span className="text-xs font-extrabold text-emerald-700">
                    {top1.totalCheckpointsScanned} Titik (100% Valid)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Rank 3 */}
          {top3 && (
            <div className="p-4 bg-white border-2 border-amber-700/20 rounded-2xl shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-3 right-3 text-2xl font-black text-amber-700/40">#3</div>
              <div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100/70 text-amber-800 border border-amber-200 inline-block mb-2">
                  🥉 Peringkat 3
                </span>
                <h3 className="font-bold text-sm text-[#0f172a]">{top3.name}</h3>
                <div className="text-xs text-[#64748b]">{top3.role} · {top3.squad}</div>
                <div className="text-[11px] text-blue-600 font-medium mt-0.5">{top3.siteName}</div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#f1f5f9] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#64748b] block">Skor Kinerja</span>
                  <span className="text-lg font-black text-[#0f172a]">{top3.score}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#64748b] block">Kepatuhan</span>
                  <span className="text-xs font-bold text-emerald-600">{top3.complianceRate}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TABEL LENGKAP PAPAN PERINGKAT SECURITY */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden shadow-xs space-y-3">
        {/* Table Filter Bar */}
        <div className="p-4 border-b border-[#e2e8f0] flex flex-wrap items-center justify-between gap-3 bg-[#f8fafc]">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <span className="material-symbols-outlined absolute left-2.5 top-2 text-sm text-[#94a3b8]">
                search
              </span>
              <input
                type="text"
                placeholder="Cari nama petugas, NPP, regu, predikat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#e2e8f0] rounded-lg text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
              />
            </div>

            {/* Squad Filter */}
            <select
              value={selectedSquad}
              onChange={(e) => setSelectedSquad(e.target.value)}
              className="text-xs bg-white border border-[#e2e8f0] rounded-lg px-2.5 py-1.5 text-[#334155] focus:outline-none cursor-pointer font-medium"
            >
              <option value="all">Semua Regu (Squad)</option>
              <option value="Regu Alpha">Regu Alpha</option>
              <option value="Regu Bravo">Regu Bravo</option>
              <option value="Regu Charlie">Regu Charlie</option>
              <option value="Regu Delta">Regu Delta</option>
            </select>
          </div>

          <div className="text-xs text-[#64748b]">
            Total <strong className="text-[#0f172a]">{filteredLeaderboard.length}</strong> Personel dalam Peringkat
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8fafc] text-[#64748b] border-b border-[#e2e8f0] font-semibold uppercase tracking-wider text-[11px]">
              {/* Row 1: Header Titles */}
              <tr>
                <th className="py-3 px-3 w-14 text-center">Rank</th>
                <th className="py-3 px-4 min-w-[170px]">Petugas Keamanan</th>
                <th className="py-3 px-4 min-w-[150px]">Regu &amp; Site</th>
                <th className="py-3 px-2 text-center w-24">Titik Di-scan</th>
                <th className="py-3 px-2 text-center w-20">Kepatuhan</th>
                <th className="py-3 px-2 text-center w-20">On-Time</th>
                <th className="py-3 px-2 text-center w-24">Lapor Temuan</th>
                <th className="py-3 px-2 text-center w-20">Skor Akhir</th>
                <th className="py-3 px-4 min-w-[140px]">Predikat / Badge</th>
                <th className="py-3 px-4 text-right w-24">Status</th>
              </tr>

              {/* Row 2: Per-Column Search Inputs */}
              <tr className="bg-[#f1f5f9]/70 border-b border-[#cbd5e1] text-xs font-normal normal-case">
                {/* Rank Search */}
                <th className="p-1.5">
                  <input
                    type="text"
                    placeholder="#"
                    value={columnSearch.rank}
                    onChange={(e) => setColumnSearch({ ...columnSearch, rank: e.target.value })}
                    className="w-full px-1.5 py-1 text-[11px] bg-white border border-[#cbd5e1] rounded text-center focus:outline-none focus:border-[#2563eb]"
                  />
                </th>

                {/* Officer Name/NPP */}
                <th className="p-1.5">
                  <input
                    type="text"
                    placeholder="Cari nama/NPP..."
                    value={columnSearch.officer}
                    onChange={(e) => setColumnSearch({ ...columnSearch, officer: e.target.value })}
                    className="w-full px-2 py-1 text-[11px] bg-white border border-[#cbd5e1] rounded focus:outline-none focus:border-[#2563eb]"
                  />
                </th>

                {/* Squad & Site */}
                <th className="p-1.5">
                  <input
                    type="text"
                    placeholder="Cari regu/site..."
                    value={columnSearch.squadSite}
                    onChange={(e) => setColumnSearch({ ...columnSearch, squadSite: e.target.value })}
                    className="w-full px-2 py-1 text-[11px] bg-white border border-[#cbd5e1] rounded focus:outline-none focus:border-[#2563eb]"
                  />
                </th>

                {/* Checkpoints */}
                <th className="p-1.5">
                  <input
                    type="text"
                    placeholder="Titik..."
                    value={columnSearch.checkpoints}
                    onChange={(e) => setColumnSearch({ ...columnSearch, checkpoints: e.target.value })}
                    className="w-full px-1 py-1 text-[11px] bg-white border border-[#cbd5e1] rounded text-center focus:outline-none focus:border-[#2563eb]"
                  />
                </th>

                {/* Compliance */}
                <th className="p-1.5">
                  <input
                    type="text"
                    placeholder="%"
                    value={columnSearch.compliance}
                    onChange={(e) => setColumnSearch({ ...columnSearch, compliance: e.target.value })}
                    className="w-full px-1 py-1 text-[11px] bg-white border border-[#cbd5e1] rounded text-center focus:outline-none focus:border-[#2563eb]"
                  />
                </th>

                {/* On-Time */}
                <th className="p-1.5">
                  <input
                    type="text"
                    placeholder="%"
                    value={columnSearch.onTime}
                    onChange={(e) => setColumnSearch({ ...columnSearch, onTime: e.target.value })}
                    className="w-full px-1 py-1 text-[11px] bg-white border border-[#cbd5e1] rounded text-center focus:outline-none focus:border-[#2563eb]"
                  />
                </th>

                {/* Findings */}
                <th className="p-1.5">
                  <input
                    type="text"
                    placeholder="Temuan..."
                    value={columnSearch.findings}
                    onChange={(e) => setColumnSearch({ ...columnSearch, findings: e.target.value })}
                    className="w-full px-1 py-1 text-[11px] bg-white border border-[#cbd5e1] rounded text-center focus:outline-none focus:border-[#2563eb]"
                  />
                </th>

                {/* Score */}
                <th className="p-1.5">
                  <input
                    type="text"
                    placeholder="Skor..."
                    value={columnSearch.score}
                    onChange={(e) => setColumnSearch({ ...columnSearch, score: e.target.value })}
                    className="w-full px-1 py-1 text-[11px] bg-white border border-[#cbd5e1] rounded text-center focus:outline-none focus:border-[#2563eb]"
                  />
                </th>

                {/* Badge */}
                <th className="p-1.5">
                  <input
                    type="text"
                    placeholder="Badge..."
                    value={columnSearch.badge}
                    onChange={(e) => setColumnSearch({ ...columnSearch, badge: e.target.value })}
                    className="w-full px-2 py-1 text-[11px] bg-white border border-[#cbd5e1] rounded focus:outline-none focus:border-[#2563eb]"
                  />
                </th>

                {/* Reset button */}
                <th className="p-1.5 text-right">
                  {isAnyColumnFilterActive ? (
                    <button
                      type="button"
                      onClick={clearAllColumnFilters}
                      className="text-[10px] text-rose-600 hover:text-rose-800 font-bold px-2 py-1 rounded bg-rose-50 border border-rose-200 cursor-pointer"
                      title="Reset filter kolom"
                    >
                      Reset
                    </button>
                  ) : (
                    <span className="text-[10px] text-[#94a3b8] italic">Filter Kolom</span>
                  )}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {filteredLeaderboard.map((officer) => (
                <tr
                  key={officer.id}
                  onClick={() => setSelectedOfficer(officer)}
                  className={`hover:bg-[#faf8ff] transition-colors cursor-pointer ${
                    officer.rank === 1
                      ? 'bg-amber-50/40'
                      : officer.rank === 2
                      ? 'bg-slate-50/50'
                      : officer.rank === 3
                      ? 'bg-amber-50/20'
                      : ''
                  }`}
                >
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    {officer.rank === 1 ? (
                      <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-black text-xs inline-flex items-center justify-center shadow-xs">
                        1
                      </span>
                    ) : officer.rank === 2 ? (
                      <span className="w-6 h-6 rounded-full bg-slate-400 text-white font-black text-xs inline-flex items-center justify-center shadow-xs">
                        2
                      </span>
                    ) : officer.rank === 3 ? (
                      <span className="w-6 h-6 rounded-full bg-amber-700 text-white font-black text-xs inline-flex items-center justify-center shadow-xs">
                        3
                      </span>
                    ) : (
                      <span className="font-bold text-[#64748b] text-xs">#{officer.rank}</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-bold text-[#0f172a] text-xs flex items-center gap-2">
                      <span>{officer.name}</span>
                      {officer.rank <= 3 && (
                        <span className="material-symbols-outlined text-amber-500 text-xs">
                          verified
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[#64748b] font-mono mt-0.5">
                      {officer.npp} · {officer.role}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-semibold text-[#0f172a]">{officer.squad}</div>
                    <div className="text-[10px] text-[#64748b] mt-0.5">{officer.siteName}</div>
                  </td>

                  <td className="py-3.5 px-4 text-center whitespace-nowrap font-bold text-[#0f172a]">
                    {officer.totalCheckpointsScanned} CP
                  </td>

                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="font-bold text-emerald-700 text-xs">{officer.complianceRate}%</div>
                    <div className="w-16 h-1.5 bg-[#e2e8f0] rounded-full mx-auto mt-1 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${officer.complianceRate}%` }}
                      ></div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="font-bold text-teal-700 text-xs">{officer.onTimeRate}%</div>
                  </td>

                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {officer.findingsReported} Temuan
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                        officer.score >= 98
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : officer.score >= 96
                          ? 'bg-blue-100 text-blue-900 border border-blue-300'
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      }`}
                    >
                      {officer.score}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#f1f5f9] text-[#334155] border border-[#e2e8f0]">
                      {officer.badgeTitle}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        officer.status === 'Bertugas Aktif'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : officer.status === 'Siaga di Pos'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          officer.status === 'Bertugas Aktif' ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'
                        }`}
                      ></span>
                      <span>{officer.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Profil Kinerja Petugas */}
      {selectedOfficer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-[#e2e8f0]">
            <div className="p-5 bg-gradient-to-r from-blue-900 to-[#1e3a8a] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-base border border-white/20">
                  {selectedOfficer.rank === 1 ? '🥇' : selectedOfficer.rank === 2 ? '🥈' : selectedOfficer.rank === 3 ? '🥉' : `#${selectedOfficer.rank}`}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">{selectedOfficer.name}</h3>
                  <span className="text-[11px] text-blue-200 font-mono">{selectedOfficer.npp} · {selectedOfficer.role}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedOfficer(null)}
                className="text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block">Predikat Kinerja</span>
                  <span className="text-xs font-black text-amber-900">{selectedOfficer.badgeTitle}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block">Skor KPI</span>
                  <span className="text-xl font-black text-amber-900">{selectedOfficer.score} / 100</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
                  <span className="text-[10px] text-[#64748b] block font-medium">Regu Penugasan</span>
                  <span className="font-bold text-[#0f172a] text-xs">{selectedOfficer.squad}</span>
                  <span className="text-[10px] text-[#64748b] block mt-0.5">{selectedOfficer.siteName}</span>
                </div>

                <div className="p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
                  <span className="text-[10px] text-[#64748b] block font-medium">Status Tugas Saat Ini</span>
                  <span className="font-bold text-emerald-700 text-xs">{selectedOfficer.status}</span>
                  <span className="text-[10px] text-[#64748b] block mt-0.5">Shift Aktif</span>
                </div>

                <div className="p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
                  <span className="text-[10px] text-[#64748b] block font-medium">Kepatuhan Rute Patroli</span>
                  <span className="font-black text-emerald-700 text-sm">{selectedOfficer.complianceRate}%</span>
                  <span className="text-[10px] text-[#64748b] block mt-0.5">Urutan checkpoint</span>
                </div>

                <div className="p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
                  <span className="text-[10px] text-[#64748b] block font-medium">Ketepatan Waktu Scan</span>
                  <span className="font-black text-teal-700 text-sm">{selectedOfficer.onTimeRate}%</span>
                  <span className="text-[10px] text-[#64748b] block mt-0.5">Tepat waktu</span>
                </div>
              </div>

              <div className="p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#64748b] block">Total Checkpoint NFC Selesai</span>
                  <span className="font-bold text-[#0f172a] text-xs">{selectedOfficer.totalCheckpointsScanned} Titik Inspeksi</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#64748b] block">Temuan Terdeteksi</span>
                  <span className="font-bold text-[#2563eb] text-xs">{selectedOfficer.findingsReported} Laporan Valid</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#f8fafc] border-t border-[#e2e8f0] flex justify-end">
              <button
                onClick={() => setSelectedOfficer(null)}
                className="px-4 py-2 bg-[#0f172a] hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
