import React, { useState, useMemo } from "react";
import { SYSTEM_AUDIT_LOGS, SITES } from "../data/mockData";
import {
  SystemAuditLog,
  filterSystemAuditLogs,
  filterItemsByColumnCriteria,
} from "../utils/security-logic";

interface AnalyticAuditViewProps {
  selectedSite: string;
}

export const AnalyticAuditView: React.FC<AnalyticAuditViewProps> = ({
  selectedSite,
}) => {
  const [logs] = useState<SystemAuditLog[]>(SYSTEM_AUDIT_LOGS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedLogDetail, setSelectedLogDetail] =
    useState<SystemAuditLog | null>(null);
  const [activeTab, setActiveTab] = useState<
    "all" | "admin" | "patrol" | "findings" | "schedule"
  >("all");

  // Per-column search state
  const [columnSearch, setColumnSearch] = useState({
    idTimestamp: "",
    category: "",
    action: "",
    actor: "",
    targetLocation: "",
    status: "",
  });

  const isAnyColumnFilterActive = Object.values(columnSearch).some(
    (v) => v.trim().length > 0,
  );
  const clearAllColumnFilters = () => {
    setColumnSearch({
      idTimestamp: "",
      category: "",
      action: "",
      actor: "",
      targetLocation: "",
      status: "",
    });
  };

  // Filter logs using pure helper
  const baseFilteredLogs = useMemo(() => {
    let catFilter = selectedCategory;
    if (activeTab === "admin") catFilter = "Admin & Pengguna";
    else if (activeTab === "patrol") catFilter = "Operasional Patroli";
    else if (activeTab === "findings") catFilter = "Temuan & Insiden";
    else if (activeTab === "schedule") catFilter = "Jadwal & Shift";

    return filterSystemAuditLogs(logs, {
      siteId: selectedSite,
      category: catFilter,
      actorRole: selectedRole,
      status: selectedStatus,
      searchQuery,
    });
  }, [
    logs,
    selectedSite,
    selectedCategory,
    activeTab,
    selectedRole,
    selectedStatus,
    searchQuery,
  ]);

  // Apply per-column search filters
  const filteredLogs = useMemo(() => {
    return filterItemsByColumnCriteria(baseFilteredLogs, columnSearch, {
      idTimestamp: (l) => `${l.id} ${l.timestamp}`,
      category: (l) => l.category,
      action: (l) => `${l.action} ${l.details}`,
      actor: (l) => `${l.actorName} ${l.actorRole}`,
      targetLocation: (l) => `${l.targetEntity} ${l.siteName}`,
      status: (l) => l.status,
    });
  }, [baseFilteredLogs, columnSearch]);

  // Metric aggregates for analytics
  const metrics = useMemo(() => {
    const total = filteredLogs.length;
    const adminCount = filteredLogs.filter(
      (l) => l.category === "Admin & Pengguna",
    ).length;
    const patrolCount = filteredLogs.filter(
      (l) => l.category === "Operasional Patroli",
    ).length;
    const findingCount = filteredLogs.filter(
      (l) => l.category === "Temuan & Insiden",
    ).length;
    const scheduleCount = filteredLogs.filter(
      (l) => l.category === "Jadwal & Shift",
    ).length;
    const tagCount = filteredLogs.filter(
      (l) => l.category === "Tag & Checkpoint",
    ).length;
    const successCount = filteredLogs.filter(
      (l) => l.status === "Berhasil",
    ).length;

    return {
      total,
      adminCount,
      patrolCount,
      findingCount,
      scheduleCount,
      tagCount,
      successRate: total > 0 ? Math.round((successCount / total) * 100) : 100,
    };
  }, [filteredLogs]);

  // Export CSV
  const handleExportCsv = () => {
    const header =
      "ID,Waktu,Kategori,Aksi,Aktor,Role,Entitas Target,Site,Status,Detail,IP Address,Device\n";
    const rows = filteredLogs
      .map(
        (l) =>
          `"${l.id}","${l.timestamp}","${l.category}","${l.action}","${l.actorName}","${l.actorRole}","${l.targetEntity}","${l.siteName}","${l.status}","${l.details}","${l.ipAddress || ""}","${l.device || ""}"`,
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Audit_Trail_Sistem_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#e2e8f0]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-100 text-[#2563eb]">
              <span className="material-symbols-outlined text-xl">
                query_stats
              </span>
            </span>
            <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">
              Analytic &amp; Audit Log Sistem
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Audit Trail Aktif
            </span>
          </div>
          <p className="text-xs text-[#64748b] mt-1 ml-9">
            Rekaman jejak audit sistem terpadu: tindakan admin menambah
            pengguna/regu, satpam memindai titik patroli, pelaporan temuan,
            hingga penugasan shift.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#e2e8f0] text-[#0f172a] rounded-lg text-xs font-semibold hover:bg-[#f8fafc] transition-colors shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm text-[#2563eb]">
              download
            </span>
            <span>Ekspor Audit (.CSV)</span>
          </button>
        </div>
      </div>

      {/* Analytics KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-[#e2e8f0] rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
              Total Log Aktivitas
            </span>
            <span className="p-1 rounded bg-blue-50 text-[#2563eb]">
              <span className="material-symbols-outlined text-base">
                receipt_long
              </span>
            </span>
          </div>
          <div className="text-2xl font-black text-[#0f172a] mt-2">
            {metrics.total} Log
          </div>
          <div className="text-[11px] text-[#64748b] mt-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>Terekam secara kronologis</span>
          </div>
        </div>

        <div className="p-4 bg-white border border-[#e2e8f0] rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
              Aksi Admin &amp; Pengguna
            </span>
            <span className="p-1 rounded bg-purple-50 text-purple-600">
              <span className="material-symbols-outlined text-base">
                admin_panel_settings
              </span>
            </span>
          </div>
          <div className="text-2xl font-black text-purple-700 mt-2">
            {metrics.adminCount} Aksi
          </div>
          <div className="text-[11px] text-[#64748b] mt-1">
            Penambahan user &amp; manajemen regu
          </div>
        </div>

        <div className="p-4 bg-white border border-[#e2e8f0] rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
              Patroli Satpam (NFC/RFID)
            </span>
            <span className="p-1 rounded bg-emerald-50 text-emerald-600">
              <span className="material-symbols-outlined text-base">
                security
              </span>
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            {metrics.patrolCount} Scan
          </div>
          <div className="text-[11px] text-[#64748b] mt-1">
            Verifikasi fisik checkpoint lapangan
          </div>
        </div>

        <div className="p-4 bg-white border border-[#e2e8f0] rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
              Integritas &amp; Validasi
            </span>
            <span className="p-1 rounded bg-teal-50 text-teal-600">
              <span className="material-symbols-outlined text-base">
                verified_user
              </span>
            </span>
          </div>
          <div className="text-2xl font-black text-teal-700 mt-2">
            {metrics.successRate}% Berhasil
          </div>
          <div className="text-[11px] text-teal-800 mt-1 font-medium">
            0 Pelanggaran otoritas terdeteksi
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Distribusi Aktivitas Sistem Berdasarkan Kategori */}
        <div className="lg:col-span-2 bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#f1f5f9]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#2563eb]">
                bar_chart
              </span>
              <h2 className="text-sm font-bold text-[#0f172a]">
                Grafik Distribusi Aktivitas Sistem per Kategori
              </h2>
            </div>
            <span className="text-[11px] text-[#64748b]">
              Total {metrics.total} aktivitas
            </span>
          </div>

          {/* Bar Chart Visualization */}
          <div className="space-y-3 pt-2">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-[#0f172a] flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-purple-600"></span>
                  <span>Admin &amp; Manajemen Pengguna</span>
                </span>
                <span className="font-bold text-[#0f172a]">
                  {metrics.adminCount} log (
                  {metrics.total > 0
                    ? Math.round((metrics.adminCount / metrics.total) * 100)
                    : 0}
                  %)
                </span>
              </div>
              <div className="w-full h-3 bg-[#f1f5f9] rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 rounded-full transition-all duration-500"
                  style={{
                    width: `${metrics.total > 0 ? (metrics.adminCount / metrics.total) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-[#0f172a] flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600"></span>
                  <span>Operasional Patroli Satpam (Scan NFC/RFID)</span>
                </span>
                <span className="font-bold text-[#0f172a]">
                  {metrics.patrolCount} log (
                  {metrics.total > 0
                    ? Math.round((metrics.patrolCount / metrics.total) * 100)
                    : 0}
                  %)
                </span>
              </div>
              <div className="w-full h-3 bg-[#f1f5f9] rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                  style={{
                    width: `${metrics.total > 0 ? (metrics.patrolCount / metrics.total) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-[#0f172a] flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-600"></span>
                  <span>Pelaporan &amp; Resolusi Temuan Lapangan</span>
                </span>
                <span className="font-bold text-[#0f172a]">
                  {metrics.findingCount} log (
                  {metrics.total > 0
                    ? Math.round((metrics.findingCount / metrics.total) * 100)
                    : 0}
                  %)
                </span>
              </div>
              <div className="w-full h-3 bg-[#f1f5f9] rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-600 rounded-full transition-all duration-500"
                  style={{
                    width: `${metrics.total > 0 ? (metrics.findingCount / metrics.total) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-[#0f172a] flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-cyan-600"></span>
                  <span>Jadwal, Tukar Shift &amp; Cuti Izin</span>
                </span>
                <span className="font-bold text-[#0f172a]">
                  {metrics.scheduleCount} log (
                  {metrics.total > 0
                    ? Math.round((metrics.scheduleCount / metrics.total) * 100)
                    : 0}
                  %)
                </span>
              </div>
              <div className="w-full h-3 bg-[#f1f5f9] rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-600 rounded-full transition-all duration-500"
                  style={{
                    width: `${metrics.total > 0 ? (metrics.scheduleCount / metrics.total) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-[#0f172a] flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-600"></span>
                  <span>Manajemen Tag NFC &amp; Checkpoint</span>
                </span>
                <span className="font-bold text-[#0f172a]">
                  {metrics.tagCount} log (
                  {metrics.total > 0
                    ? Math.round((metrics.tagCount / metrics.total) * 100)
                    : 0}
                  %)
                </span>
              </div>
              <div className="w-full h-3 bg-[#f1f5f9] rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-600 rounded-full transition-all duration-500"
                  style={{
                    width: `${metrics.total > 0 ? (metrics.tagCount / metrics.total) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart 2: Komposisi Peran Aktor (Role Distribution) */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#f1f5f9]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2563eb]">
                  pie_chart
                </span>
                <h2 className="text-sm font-bold text-[#0f172a]">
                  Aktor Pelaksana
                </h2>
              </div>
              <span className="text-[11px] text-[#64748b]">Peran Pengguna</span>
            </div>

            {/* Circular / Segmented breakdown */}
            <div className="mt-4 space-y-3">
              <div className="p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                    ADM
                  </span>
                  <div>
                    <div className="text-xs font-bold text-[#0f172a]">
                      Administrator (Superintendent)
                    </div>
                    <div className="text-[10px] text-[#64748b]">
                      Pengelolaan User, Regu &amp; Akses
                    </div>
                  </div>
                </div>
                <span className="text-xs font-black text-purple-700">30%</span>
              </div>

              <div className="p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-full bg-blue-100 text-[#2563eb] flex items-center justify-center font-bold text-xs">
                    DNR
                  </span>
                  <div>
                    <div className="text-xs font-bold text-[#0f172a]">
                      Komandan Regu (Danru)
                    </div>
                    <div className="text-[10px] text-[#64748b]">
                      Approval Shift, Cuti &amp; Verifikasi
                    </div>
                  </div>
                </div>
                <span className="text-xs font-black text-[#2563eb]">30%</span>
              </div>

              <div className="p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    STP
                  </span>
                  <div>
                    <div className="text-xs font-bold text-[#0f172a]">
                      Petugas Lapangan (Satpam)
                    </div>
                    <div className="text-[10px] text-[#64748b]">
                      Scan Checkpoint &amp; Lapor Temuan
                    </div>
                  </div>
                </div>
                <span className="text-xs font-black text-emerald-700">40%</span>
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-blue-50/60 rounded-lg border border-blue-100 text-[11px] text-[#1e40af] flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-[#2563eb]">
              verified
            </span>
            <span>
              Semua aksi dienkripsi &amp; terverifikasi tanda tangan digital
              SHA-256.
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Tab Bar */}
      <div className="p-4 bg-white border border-[#e2e8f0] rounded-xl shadow-xs space-y-3">
        {/* Quick Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-[#f1f5f9]">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeTab === "all"
                ? "bg-[#2563eb] text-white shadow-xs"
                : "bg-[#f8fafc] text-[#64748b] hover:text-[#0f172a]"
            }`}
          >
            Semua Log Kegiatan ({logs.length})
          </button>
          <button
            onClick={() => setActiveTab("admin")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeTab === "admin"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-[#f8fafc] text-[#64748b] hover:text-[#0f172a]"
            }`}
          >
            Kegiatan Admin
          </button>
          <button
            onClick={() => setActiveTab("patrol")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeTab === "patrol"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-[#f8fafc] text-[#64748b] hover:text-[#0f172a]"
            }`}
          >
            Patroli Satpam (NFC)
          </button>
          <button
            onClick={() => setActiveTab("findings")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeTab === "findings"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-[#f8fafc] text-[#64748b] hover:text-[#0f172a]"
            }`}
          >
            Temuan &amp; Insiden
          </button>
          <button
            onClick={() => setActiveTab("schedule")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeTab === "schedule"
                ? "bg-cyan-600 text-white shadow-xs"
                : "bg-[#f8fafc] text-[#64748b] hover:text-[#0f172a]"
            }`}
          >
            Jadwal &amp; Shift
          </button>
        </div>

        {/* Detailed Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <span className="material-symbols-outlined absolute left-2.5 top-2 text-sm text-[#94a3b8]">
                search
              </span>
              <input
                type="text"
                placeholder="Cari ID audit, nama aktor, aksi, detail transaksi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
              />
            </div>

            {/* Role Filter */}
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="text-xs bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-2.5 py-1.5 text-[#334155] focus:outline-none cursor-pointer font-medium"
            >
              <option value="all">Semua Peran Aktor</option>
              <option value="Admin">Administrator</option>
              <option value="Danru">Komandan Regu (Danru)</option>
              <option value="Satpam">Petugas Lapangan (Satpam)</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-2.5 py-1.5 text-[#334155] focus:outline-none cursor-pointer font-medium"
            >
              <option value="all">Semua Status Audit</option>
              <option value="Berhasil">Berhasil (Success)</option>
              <option value="Peringatan">Peringatan (Warning)</option>
              <option value="Gagal">Gagal (Failed)</option>
            </select>
          </div>

          <div className="text-xs text-[#64748b]">
            Menampilkan{" "}
            <strong className="text-[#0f172a]">{filteredLogs.length}</strong>{" "}
            dari {logs.length} catatan audit
          </div>
        </div>
      </div>

      {/* Main Audit Trail Log Table */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8fafc] text-[#64748b] border-b border-[#e2e8f0] font-semibold uppercase tracking-wider text-[11px]">
              {/* Header Title Row */}
              <tr>
                <th className="py-3 px-4 w-40">Waktu &amp; ID Audit</th>
                <th className="py-3 px-4 w-44">Kategori Sistem</th>
                <th className="py-3 px-4 min-w-[200px]">Aksi / Kegiatan</th>
                <th className="py-3 px-4 w-48">Aktor Pelaksana</th>
                <th className="py-3 px-4 min-w-[170px]">
                  Entitas Target &amp; Lokasi
                </th>
                <th className="py-3 px-4 w-28 text-center">Status</th>
                <th className="py-3 px-4 text-right w-24">Detail</th>
              </tr>

              {/* Per-Column Search Row */}
              <tr className="bg-[#f1f5f9]/70 border-b border-[#cbd5e1] text-xs font-normal normal-case">
                {/* ID / Waktu */}
                <th className="p-2">
                  <input
                    type="text"
                    placeholder="Cari ID / waktu..."
                    value={columnSearch.idTimestamp}
                    onChange={(e) =>
                      setColumnSearch({
                        ...columnSearch,
                        idTimestamp: e.target.value,
                      })
                    }
                    className="w-full px-2 py-1 text-[11px] bg-white border border-[#cbd5e1] rounded focus:outline-none focus:border-[#2563eb]"
                  />
                </th>

                {/* Kategori Sistem */}
                <th className="p-2">
                  <select
                    value={columnSearch.category}
                    onChange={(e) =>
                      setColumnSearch({
                        ...columnSearch,
                        category: e.target.value,
                      })
                    }
                    className="w-full px-1.5 py-1 text-[11px] bg-white border border-[#cbd5e1] rounded focus:outline-none focus:border-[#2563eb] cursor-pointer"
                  >
                    <option value="">Semua</option>
                    <option value="Admin & Pengguna">
                      Admin &amp; Pengguna
                    </option>
                    <option value="Operasional Patroli">Patroli Satpam</option>
                    <option value="Temuan & Insiden">
                      Temuan &amp; Insiden
                    </option>
                    <option value="Jadwal & Shift">Jadwal &amp; Shift</option>
                    <option value="Tag & Checkpoint">Tag NFC / RFID</option>
                  </select>
                </th>

                {/* Aksi / Kegiatan */}
                <th className="p-2">
                  <input
                    type="text"
                    placeholder="Cari aksi kegiatan..."
                    value={columnSearch.action}
                    onChange={(e) =>
                      setColumnSearch({
                        ...columnSearch,
                        action: e.target.value,
                      })
                    }
                    className="w-full px-2 py-1 text-[11px] bg-white border border-[#cbd5e1] rounded focus:outline-none focus:border-[#2563eb]"
                  />
                </th>

                {/* Aktor Pelaksana */}
                <th className="p-2">
                  <input
                    type="text"
                    placeholder="Cari aktor / peran..."
                    value={columnSearch.actor}
                    onChange={(e) =>
                      setColumnSearch({
                        ...columnSearch,
                        actor: e.target.value,
                      })
                    }
                    className="w-full px-2 py-1 text-[11px] bg-white border border-[#cbd5e1] rounded focus:outline-none focus:border-[#2563eb]"
                  />
                </th>

                {/* Entitas Target & Lokasi */}
                <th className="p-2">
                  <input
                    type="text"
                    placeholder="Cari target / lokasi..."
                    value={columnSearch.targetLocation}
                    onChange={(e) =>
                      setColumnSearch({
                        ...columnSearch,
                        targetLocation: e.target.value,
                      })
                    }
                    className="w-full px-2 py-1 text-[11px] bg-white border border-[#cbd5e1] rounded focus:outline-none focus:border-[#2563eb]"
                  />
                </th>

                {/* Status */}
                <th className="p-2">
                  <select
                    value={columnSearch.status}
                    onChange={(e) =>
                      setColumnSearch({
                        ...columnSearch,
                        status: e.target.value,
                      })
                    }
                    className="w-full px-1.5 py-1 text-[11px] bg-white border border-[#cbd5e1] rounded focus:outline-none focus:border-[#2563eb] cursor-pointer"
                  >
                    <option value="">Semua</option>
                    <option value="Berhasil">Berhasil</option>
                    <option value="Peringatan">Peringatan</option>
                    <option value="Gagal">Gagal</option>
                  </select>
                </th>

                {/* Reset Action */}
                <th className="p-2 text-right">
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
                    <span className="text-[10px] text-[#94a3b8] italic">
                      Filter Kolom
                    </span>
                  )}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#64748b]">
                    <span className="material-symbols-outlined text-3xl text-[#94a3b8] block mb-1">
                      receipt_long
                    </span>
                    <span>
                      Tidak ada catatan kegiatan sistem yang cocok dengan
                      kriteria filter.
                    </span>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-[#faf8ff] transition-colors cursor-pointer"
                    onClick={() => setSelectedLogDetail(log)}
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-[#2563eb] text-[11px]">
                        {log.id}
                      </div>
                      <div className="text-[10px] text-[#64748b] mt-0.5">
                        {log.timestamp}
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.category === "Admin & Pengguna"
                            ? "bg-purple-100 text-purple-800 border border-purple-200"
                            : log.category === "Operasional Patroli"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : log.category === "Temuan & Insiden"
                                ? "bg-rose-100 text-rose-800 border border-rose-200"
                                : log.category === "Jadwal & Shift"
                                  ? "bg-cyan-100 text-cyan-800 border border-cyan-200"
                                  : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}
                      >
                        <span className="material-symbols-outlined text-xs">
                          {log.category === "Admin & Pengguna"
                            ? "admin_panel_settings"
                            : log.category === "Operasional Patroli"
                              ? "security"
                              : log.category === "Temuan & Insiden"
                                ? "report_problem"
                                : log.category === "Jadwal & Shift"
                                  ? "event"
                                  : "nfc"}
                        </span>
                        <span>{log.category}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-[#0f172a] text-xs">
                        {log.action}
                      </div>
                      <div className="text-[11px] text-[#64748b] truncate max-w-xs mt-0.5">
                        {log.details}
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-[#0f172a]">
                        {log.actorName}
                      </div>
                      <div className="text-[10px] text-[#64748b] flex items-center gap-1 mt-0.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            log.actorRole === "Admin"
                              ? "bg-purple-500"
                              : log.actorRole === "Danru"
                                ? "bg-blue-500"
                                : "bg-emerald-500"
                          }`}
                        ></span>
                        <span>Peran: {log.actorRole}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-[#0f172a] text-xs">
                        {log.targetEntity}
                      </div>
                      <div className="text-[10px] text-[#64748b] mt-0.5">
                        {log.siteName}
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status === "Berhasil"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : log.status === "Peringatan"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        <span className="material-symbols-outlined text-xs">
                          {log.status === "Berhasil"
                            ? "check_circle"
                            : log.status === "Peringatan"
                              ? "warning"
                              : "cancel"}
                        </span>
                        <span>{log.status}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLogDetail(log);
                        }}
                        className="px-2.5 py-1 text-xs text-[#2563eb] hover:bg-blue-50 font-semibold rounded transition-colors"
                      >
                        Lihat Payload
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Payload Audit */}
      {selectedLogDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#e2e8f0]">
            <div className="p-4 bg-gradient-to-r from-slate-900 to-[#1e293b] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-400">
                  verified
                </span>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    Rincian Transaksi Audit Trail
                  </h3>
                  <span className="text-[10px] font-mono text-blue-300">
                    {selectedLogDetail.id}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedLogDetail(null)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <span className="material-symbols-outlined text-base">
                  close
                </span>
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                <div>
                  <span className="text-[10px] text-[#64748b] block font-medium">
                    Kategori Sistem
                  </span>
                  <span className="font-bold text-[#0f172a] text-xs">
                    {selectedLogDetail.category}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748b] block font-medium">
                    Status Eksekusi
                  </span>
                  <span className="font-bold text-emerald-700 text-xs">
                    {selectedLogDetail.status}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748b] block font-medium">
                    Waktu Transaksi
                  </span>
                  <span className="font-medium text-[#0f172a]">
                    {selectedLogDetail.timestamp}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748b] block font-medium">
                    Lokasi Operasional
                  </span>
                  <span className="font-medium text-[#0f172a]">
                    {selectedLogDetail.siteName}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-[#0f172a] block mb-1">
                  Aksi &amp; Aktor
                </span>
                <div className="p-3 bg-white rounded-lg border border-[#e2e8f0] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748b]">Aksi:</span>
                    <strong className="text-[#0f172a]">
                      {selectedLogDetail.action}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748b]">Aktor:</span>
                    <span className="text-[#0f172a] font-medium">
                      {selectedLogDetail.actorName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748b]">Peran:</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-[#2563eb]">
                      {selectedLogDetail.actorRole}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748b]">Entitas Sasaran:</span>
                    <span className="font-mono text-[#0f172a]">
                      {selectedLogDetail.targetEntity}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-[#0f172a] block mb-1">
                  Keterangan Aktivitas
                </span>
                <p className="p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0] text-[#334155] leading-relaxed">
                  {selectedLogDetail.details}
                </p>
              </div>

              <div className="p-3 bg-slate-900 text-slate-300 rounded-lg font-mono text-[10px] space-y-1">
                <div className="text-slate-400 font-bold border-b border-slate-700 pb-1">
                  // METADATA AUDIT &amp; TELEMETRI
                </div>
                <div className="flex justify-between">
                  <span>IP_ORIGIN:</span>
                  <span className="text-emerald-400">
                    {selectedLogDetail.ipAddress || "192.168.10.45"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>CLIENT_DEVICE:</span>
                  <span className="text-cyan-300">
                    {selectedLogDetail.device || "Enterprise Security Terminal"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>INTEGRITY_HASH:</span>
                  <span className="text-amber-300">SHA256:7a9f8c...3b1d</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#f8fafc] border-t border-[#e2e8f0] flex justify-end">
              <button
                onClick={() => setSelectedLogDetail(null)}
                className="px-4 py-2 bg-[#0f172a] hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
