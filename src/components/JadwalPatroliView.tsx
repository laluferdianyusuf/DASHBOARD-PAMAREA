import React, { useState } from "react";
import {
  CHECKPOINTS,
  PATROL_SCHEDULES,
  PatrolScheduleItem,
  SITES,
} from "../data/mockData";
import { NavTab } from "./Sidebar";

import {
  ShiftOfficerAssignment,
  formatShiftPayloadJson,
} from "../utils/security-logic";

interface JadwalPatroliViewProps {
  selectedSite: string;
  onNavigate: (tab: NavTab) => void;
  schedules?: PatrolScheduleItem[];
  onUpdateSchedules?: (schedules: PatrolScheduleItem[]) => void;
  onAddScheduleAndSyncCalendar?: (
    newSchedule: PatrolScheduleItem,
    dayShiftPayload: {
      day: number;
      dateStr: string;
      shiftType: "Pagi" | "Siang" | "Malam";
      squad: string;
      danru: string;
      sector: string;
      siteName: string;
      requiredCount: number;
      officers: ShiftOfficerAssignment[];
    },
  ) => void;
}

export const JadwalPatroliView: React.FC<JadwalPatroliViewProps> = ({
  selectedSite,
  onNavigate,
  schedules: propSchedules,
  onUpdateSchedules,
  onAddScheduleAndSyncCalendar,
}) => {
  const [internalSchedules, setInternalSchedules] =
    useState<PatrolScheduleItem[]>(PATROL_SCHEDULES);
  const schedules = propSchedules || internalSchedules;
  const setSchedules = (
    updater: React.SetStateAction<PatrolScheduleItem[]>,
  ) => {
    if (typeof updater === "function") {
      const next = updater(schedules);
      if (onUpdateSchedules) onUpdateSchedules(next);
      setInternalSchedules(next);
    } else {
      if (onUpdateSchedules) onUpdateSchedules(updater);
      setInternalSchedules(updater);
    }
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedShift, setSelectedShift] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [backupModalSchedule, setBackupModalSchedule] =
    useState<PatrolScheduleItem | null>(null);
  const [selectedBackupOfficer, setSelectedBackupOfficer] = useState(
    "Hendra Kurniawan (Cadangan 1)",
  );
  const [backupReason, setBackupReason] = useState("Izin Sakit Terverifikasi");
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // New Shift Form State adhering strictly to user schema:
  // "siteId": "{{siteId}}", "name": "Shift Pagi", "startTime": "07:00", "endTime": "15:00",
  // "intervalMinutes": 120, "gracePeriodMinutes": 30, "enforceSequence": false
  const [shiftSiteId, setShiftSiteId] = useState("site-a");
  const [shiftName, setShiftName] = useState("Shift Pagi");
  const [shiftStartTime, setShiftStartTime] = useState("07:00");
  const [shiftEndTime, setShiftEndTime] = useState("15:00");
  const [shiftIntervalMinutes, setShiftIntervalMinutes] = useState(120);
  const [shiftGracePeriodMinutes, setShiftGracePeriodMinutes] = useState(30);
  const [shiftEnforceSequence, setShiftEnforceSequence] = useState(false);
  const [shiftLocationIds, setShiftLocationIds] = useState<string[]>([
    "CP-SDR-001",
    "CP-SDR-002",
    "CP-SDR-003",
  ]);
  const [modalLocationSearch, setModalLocationSearch] = useState("");
  const [modalSquad, setModalSquad] = useState("Regu Alpha");
  const [modalDanru, setModalDanru] = useState("Ahmad Fauzi");
  const [copiedModalJson, setCopiedModalJson] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const filteredSchedules = schedules.filter((s) => {
    if (selectedSite !== "all" && s.siteId !== selectedSite) return false;
    if (selectedShift !== "all" && !s.shift.includes(selectedShift))
      return false;
    if (selectedStatus !== "all" && s.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        s.id.toLowerCase().includes(q) ||
        s.sector.toLowerCase().includes(q) ||
        s.squad.toLowerCase().includes(q) ||
        s.danru.toLowerCase().includes(q) ||
        s.siteName.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handlePlotBackup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!backupModalSchedule) return;

    setSchedules((prev) =>
      prev.map((s) => {
        if (s.id === backupModalSchedule.id) {
          return {
            ...s,
            assignedCount: s.requiredCount,
            guardRatio: `${s.requiredCount}/${s.requiredCount} Petugas Lengkap (Plot: ${selectedBackupOfficer})`,
            status: "Berjalan Aktif",
          };
        }
        return s;
      }),
    );

    setBackupModalSchedule(null);
    setSuccessToast(
      `Personel cadangan ${selectedBackupOfficer} berhasil diplot untuk jadwal ${backupModalSchedule.id}!`,
    );
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    if (!shiftName.trim()) {
      setModalError("Nama shift wajib diisi.");
      return;
    }
    if (shiftLocationIds.length === 0) {
      setModalError(
        "Pilih minimal 1 lokasi titik patroli yang ada pada daftar.",
      );
      return;
    }

    const siteObj = SITES.find((s) => s.id === shiftSiteId) || SITES[1];
    const newId = `SCH-2025-0524-${String(schedules.length + 1).padStart(2, "0")}`;
    const selectedPoints = CHECKPOINTS.filter((c) =>
      shiftLocationIds.includes(c.id),
    );
    const locationNames = selectedPoints.map((c) => c.name);

    const created: PatrolScheduleItem = {
      id: newId,
      siteId: shiftSiteId,
      siteName: siteObj.name.replace(/^Site [A-D] - /, ""),
      sector: `${selectedPoints.length} Titik (${locationNames.slice(0, 2).join(", ")}${locationNames.length > 2 ? "..." : ""})`,
      squad: modalSquad,
      danru: modalDanru,
      shift: `${shiftName} (${shiftStartTime} - ${shiftEndTime})` as any,
      routeName: `Rute ${shiftName} (${shiftEnforceSequence ? "Wajib Urut" : "Fleksibel"})`,
      checkpointCount: selectedPoints.length,
      frequency: `Setiap ${shiftIntervalMinutes} Menit (Toleransi ${shiftGracePeriodMinutes}m)`,
      guardRatio: "4/4 Petugas",
      assignedCount: 4,
      requiredCount: 4,
      status: "Terjadwal",
      date: "2025-05-24",
    };

    setSchedules([created, ...schedules]);
    setIsAddModalOpen(false);
    setSuccessToast(
      `Shift baru "${shiftName}" (${shiftLocationIds.length} Titik Lokasi) berhasil dibuat dan dijadwalkan!`,
    );
    setTimeout(() => setSuccessToast(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded text-xs text-emerald-800 font-medium flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 text-base">
              check_circle
            </span>
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Header and View Switcher */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#e2e8f0]">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">
            Jadwal Patroli Lapangan
          </h1>
          <p className="text-xs text-[#64748b] mt-1">
            Pengaturan dan pemantauan giliran jaga shift patroli, alokasi
            personel regu keamanan, dan rute checkpoint aktif.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tab View Switcher */}
          <div className="inline-flex items-center p-1 bg-[#f1f5f9] border border-[#e2e8f0] rounded text-xs">
            <button className="px-3 py-1.5 rounded font-medium bg-white text-[#0f172a] shadow-xs flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">
                table_chart
              </span>
              <span>Tabel</span>
            </button>
            <button
              onClick={() => onNavigate("kalender")}
              className="px-3 py-1.5 rounded font-medium text-[#64748b] hover:text-[#0f172a] transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">
                calendar_view_week
              </span>
              <span>Kalender Shift</span>
            </button>
          </div>

          <button
            onClick={() => {
              const csvContent =
                "data:text/csv;charset=utf-8,ID,Site,Sector,Squad,Danru,Shift,Status\n" +
                schedules
                  .map(
                    (s) =>
                      `${s.id},"${s.siteName}","${s.sector}",${s.squad},${s.danru},"${s.shift}",${s.status}`,
                  )
                  .join("\n");
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", "Jadwal_Patroli_PAMAREA.csv");
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#e2e8f0] text-[#0f172a] rounded text-xs font-medium hover:bg-[#f8fafc] transition-colors shadow-xs"
          >
            <span className="material-symbols-outlined text-sm text-[#64748b]">
              download
            </span>
            <span>Ekspor Roster (.csv)</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2563eb] text-white rounded text-xs font-semibold hover:bg-[#1d4ed8] transition-colors shadow-xs"
          >
            <span className="material-symbols-outlined text-sm">
              add_circle
            </span>
            <span>+ Tambah Shift</span>
          </button>

          <button
            onClick={() => onNavigate("tambah-jadwal")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white rounded text-xs font-semibold hover:bg-slate-900 transition-colors shadow-xs"
          >
            <span className="material-symbols-outlined text-sm">
              calendar_add_on
            </span>
            <span>Wizard 3-Step</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-[#e2e8f0] rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search */}
          <div className="relative min-w-[240px] flex-1 max-w-sm">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-base text-[#94a3b8]">
              search
            </span>
            <input
              type="text"
              placeholder="Cari ID, regu, sektor, Danru..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#f8fafc] border border-[#cbd5e1] rounded text-xs text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
            />
          </div>

          {/* Shift Filter */}
          <select
            value={selectedShift}
            onChange={(e) => setSelectedShift(e.target.value)}
            className="px-2.5 py-1.5 bg-[#f8fafc] border border-[#cbd5e1] rounded text-xs text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
          >
            <option value="all">Semua Shift</option>
            <option value="Pagi">Shift Pagi (07:00 - 15:00)</option>
            <option value="Siang">Shift Siang (15:00 - 23:00)</option>
            <option value="Malam">Shift Malam (23:00 - 07:00)</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-[#f8fafc] border border-[#cbd5e1] rounded text-xs text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
          >
            <option value="all">Semua Status</option>
            <option value="Berjalan Aktif">Berjalan Aktif</option>
            <option value="Perlu Pengganti">Perlu Pengganti</option>
            <option value="Selesai Tuntas">Selesai Tuntas</option>
            <option value="Terjadwal">Terjadwal</option>
          </select>
        </div>

        <div className="text-xs text-[#64748b]">
          Menampilkan{" "}
          <strong className="text-[#0f172a]">{filteredSchedules.length}</strong>{" "}
          jadwal terdaftar
        </div>
      </div>

      {/* Table Data Container */}
      <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[11px] font-semibold text-[#64748b] uppercase tracking-wider h-10">
                <th className="px-4 py-2">Kode Jadwal</th>
                <th className="px-4 py-2">Site / Wilayah</th>
                <th className="px-4 py-2">Regu &amp; Danru</th>
                <th className="px-4 py-2">Giliran Shift</th>
                <th className="px-4 py-2">Rute &amp; Frekuensi</th>
                <th className="px-4 py-2 text-center">Rasio Petugas</th>
                <th className="px-4 py-2 text-center">Status</th>
                <th className="px-4 py-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9] text-xs">
              {filteredSchedules.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#94a3b8]">
                    Tidak ada jadwal yang cocok dengan filter atau kata kunci.
                  </td>
                </tr>
              ) : (
                filteredSchedules.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-[#f8fafc] transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-[#2563eb]">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            s.status === "Berjalan Aktif"
                              ? "bg-emerald-500 animate-pulse"
                              : s.status === "Perlu Pengganti"
                                ? "bg-rose-500 animate-ping"
                                : "bg-slate-400"
                          }`}
                        ></span>
                        <span>{s.id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#0f172a]">
                        {s.siteName}
                      </div>
                      <div className="text-[11px] text-[#64748b] truncate max-w-xs">
                        {s.sector}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#0f172a]">
                        {s.squad}
                      </div>
                      <div className="text-[11px] text-[#64748b]">
                        Danru: {s.danru}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f1f5f9] text-[#334155] font-medium text-[11px]">
                        <span className="material-symbols-outlined text-xs text-[#2563eb]">
                          {s.shift.includes("Pagi")
                            ? "light_mode"
                            : s.shift.includes("Siang")
                              ? "wb_sunny"
                              : "dark_mode"}
                        </span>
                        <span>{s.shift}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#0f172a]">
                        {s.routeName}
                      </div>
                      <div className="text-[11px] text-[#64748b]">
                        Frekuensi: {s.frequency}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          s.status === "Perlu Pengganti"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-[#f1f5f9] text-[#334155]"
                        }`}
                      >
                        {s.guardRatio}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          s.status === "Berjalan Aktif"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : s.status === "Perlu Pengganti"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : s.status === "Selesai Tuntas"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {s.status === "Perlu Pengganti" ? (
                          <button
                            onClick={() => setBackupModalSchedule(s)}
                            className="px-2.5 py-1 rounded bg-[#2563eb] text-white hover:bg-[#1d4ed8] text-xs font-semibold shadow-xs"
                          >
                            Plot Cadangan
                          </button>
                        ) : (
                          <button
                            onClick={() => onNavigate("monitoring")}
                            className="px-2.5 py-1 rounded border border-[#e2e8f0] text-[#334155] hover:bg-[#f8fafc] text-xs font-medium"
                          >
                            Pantau Live
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info strip */}
        <div className="px-4 py-2.5 bg-[#f8fafc] border-t border-[#e2e8f0] flex items-center justify-between text-xs text-[#64748b]">
          <span>
            Data shift tersinkronisasi otomatis dengan server komando pusat
          </span>
          <span>
            Shift aktif saat ini:{" "}
            <strong>Shift Siang (15:00 - 23:00 WIB)</strong>
          </span>
        </div>
      </div>

      {/* Modal: Plot Cadangan */}
      {backupModalSchedule && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-[#cbd5e1] overflow-hidden animate-in fade-in">
            <div className="px-5 py-3.5 border-b border-[#e2e8f0] flex items-center justify-between bg-[#f8fafc]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-600 text-lg">
                  person_alert
                </span>
                <h3 className="text-sm font-bold text-[#0f172a]">
                  Plot Personel Cadangan
                </h3>
              </div>
              <button
                onClick={() => setBackupModalSchedule(null)}
                className="text-[#94a3b8] hover:text-[#0f172a]"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handlePlotBackup} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-800">
                <p className="font-semibold">
                  {backupModalSchedule.id} - {backupModalSchedule.siteName}
                </p>
                <p className="mt-0.5 text-[11px]">
                  {backupModalSchedule.shift} · Alokasi Kurang 1 Personel
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#334155] uppercase mb-1">
                  Pilih Personel Cadangan Siaga
                </label>
                <select
                  value={selectedBackupOfficer}
                  onChange={(e) => setSelectedBackupOfficer(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                >
                  <option>Hendra Kurniawan (Cadangan 1 - Gada Pratama)</option>
                  <option>Fajar Ramadhan (Cadangan 2 - Gada Pratama)</option>
                  <option>Teguh Santoso (Cadangan 3 - Gada Madya)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#334155] uppercase mb-1">
                  Alasan Penugasan Cadangan
                </label>
                <input
                  type="text"
                  value={backupReason}
                  onChange={(e) => setBackupReason(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setBackupModalSchedule(null)}
                  className="px-3 py-1.5 rounded border border-[#e2e8f0] text-[#334155] font-medium hover:bg-[#f8fafc]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-[#2563eb] text-white font-semibold hover:bg-[#1d4ed8] shadow-xs"
                >
                  Konfirmasi Penugasan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tambah Shift Baru Sesuai Schema */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-[#cbd5e1] overflow-hidden my-6 animate-in fade-in max-h-[90vh] flex flex-col">
            <div className="px-5 py-4 border-b border-[#e2e8f0] flex items-center justify-between bg-[#f8fafc] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-xl">
                    schedule
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0f172a]">
                    Tambah Shift Patroli
                  </h3>
                  <p className="text-[11px] text-[#64748b]">
                    Konfigurasi parameter shift dan pilih titik-titik lokasi
                    dari daftar lokasi aktif di sistem.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#94a3b8] hover:text-[#0f172a] p-1"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form
              onSubmit={handleCreateSchedule}
              className="p-5 space-y-4 text-xs overflow-y-auto flex-1"
            >
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-rose-600 text-base">
                    error
                  </span>
                  <span>{modalError}</span>
                </div>
              )}

              {/* SECTION 1: SHIFT SCHEMA FIELDS */}
              <div className="space-y-3 p-3.5 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
                <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">
                    tune
                  </span>
                  <span>Parameter Shift (Sesuai Spesifikasi JSON)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* siteId */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#334155] mb-1">
                      <span className="font-mono text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[10px]">
                        siteId
                      </span>{" "}
                      Lokasi Fasilitas
                    </label>
                    <select
                      value={shiftSiteId}
                      onChange={(e) => setShiftSiteId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                    >
                      {SITES.filter((s) => s.id !== "all").map((site) => (
                        <option key={site.id} value={site.id}>
                          {site.id} — {site.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* name */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#334155] mb-1">
                      <span className="font-mono text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[10px]">
                        name
                      </span>{" "}
                      Nama Shift
                    </label>
                    <input
                      type="text"
                      required
                      value={shiftName}
                      onChange={(e) => setShiftName(e.target.value)}
                      placeholder="Shift Pagi"
                      className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                    />
                  </div>

                  {/* startTime */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#334155] mb-1">
                      <span className="font-mono text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[10px]">
                        startTime
                      </span>{" "}
                      Jam Mulai
                    </label>
                    <input
                      type="time"
                      required
                      value={shiftStartTime}
                      onChange={(e) => setShiftStartTime(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                    />
                  </div>

                  {/* endTime */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#334155] mb-1">
                      <span className="font-mono text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[10px]">
                        endTime
                      </span>{" "}
                      Jam Selesai
                    </label>
                    <input
                      type="time"
                      required
                      value={shiftEndTime}
                      onChange={(e) => setShiftEndTime(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                    />
                  </div>

                  {/* intervalMinutes */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#334155] mb-1">
                      <span className="font-mono text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[10px]">
                        intervalMinutes
                      </span>{" "}
                      Interval Putaran (Menit)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={15}
                        max={480}
                        step={15}
                        required
                        value={shiftIntervalMinutes}
                        onChange={(e) =>
                          setShiftIntervalMinutes(Number(e.target.value))
                        }
                        className="w-24 px-3 py-2 bg-white border border-[#cbd5e1] rounded font-mono text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                      />
                      <div className="flex items-center gap-1">
                        {[60, 90, 120, 180].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setShiftIntervalMinutes(m)}
                            className={`px-2 py-1 rounded text-[10px] font-medium border ${
                              shiftIntervalMinutes === m
                                ? "bg-blue-600 text-white border-blue-600 font-bold"
                                : "bg-white text-slate-700 border-slate-300"
                            }`}
                          >
                            {m}m
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* gracePeriodMinutes */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#334155] mb-1">
                      <span className="font-mono text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[10px]">
                        gracePeriodMinutes
                      </span>{" "}
                      Batas Toleransi (Menit)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={120}
                        step={5}
                        required
                        value={shiftGracePeriodMinutes}
                        onChange={(e) =>
                          setShiftGracePeriodMinutes(Number(e.target.value))
                        }
                        className="w-24 px-3 py-2 bg-white border border-[#cbd5e1] rounded font-mono text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                      />
                      <div className="flex items-center gap-1">
                        {[15, 30, 45].map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setShiftGracePeriodMinutes(g)}
                            className={`px-2 py-1 rounded text-[10px] font-medium border ${
                              shiftGracePeriodMinutes === g
                                ? "bg-amber-600 text-white border-amber-600 font-bold"
                                : "bg-white text-slate-700 border-slate-300"
                            }`}
                          >
                            {g}m
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* enforceSequence */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[10px]">
                        enforceSequence
                      </span>
                      <span className="text-xs font-bold text-[#0f172a]">
                        Wajib Urut Sesuai Urutan Checkpoint
                      </span>
                    </div>
                    <p className="text-[10px] text-[#64748b]">
                      Petugas harus men-tap titik patroli berurutan sesuai alur
                      ({shiftEnforceSequence ? "Ketat (true)" : "Bebas (false)"}
                      ).
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={shiftEnforceSequence}
                      onChange={(e) =>
                        setShiftEnforceSequence(e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>

              {/* SECTION 2: LIST LOKASI-LOKASI YANG ADA (BUKAN PER SITE) */}
              <div className="space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold text-[#0f172a] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-blue-600">
                        pin_drop
                      </span>
                      <span>
                        Daftar Titik Lokasi Yang Berjalan (Bukan Per Site)
                      </span>
                    </label>
                    <p className="text-[11px] text-[#64748b]">
                      Pilih titik-titik patroli yang ada di sistem untuk
                      dimasukkan dalam shift ini ({shiftLocationIds.length}{" "}
                      titik dipilih).
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setShiftLocationIds(CHECKPOINTS.map((c) => c.id))
                      }
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-[10px] font-semibold text-slate-700"
                    >
                      Pilih Semua
                    </button>
                    <button
                      type="button"
                      onClick={() => setShiftLocationIds([])}
                      className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-[10px] font-semibold text-rose-700"
                    >
                      Kosongkan
                    </button>
                  </div>
                </div>

                {/* Location Search Bar */}
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-2.5 top-2 text-[#94a3b8] text-sm">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder="Cari nama lokasi, kode checkpoint (CP-...), lantai..."
                    value={modalLocationSearch}
                    onChange={(e) => setModalLocationSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 border border-[#cbd5e1] rounded text-xs bg-white text-[#0f172a]"
                  />
                </div>

                {/* Scrollable Checkpoint List */}
                <div className="max-h-48 overflow-y-auto space-y-1.5 border border-[#e2e8f0] rounded-lg p-2 bg-white [scrollbar-width:thin]">
                  {CHECKPOINTS.filter((cp) => {
                    if (!modalLocationSearch.trim()) return true;
                    const q = modalLocationSearch.toLowerCase();
                    return (
                      cp.name.toLowerCase().includes(q) ||
                      cp.id.toLowerCase().includes(q) ||
                      cp.zoneFloor.toLowerCase().includes(q) ||
                      cp.siteName.toLowerCase().includes(q)
                    );
                  }).map((cp) => {
                    const isSelected = shiftLocationIds.includes(cp.id);
                    const orderIdx = shiftLocationIds.indexOf(cp.id);

                    return (
                      <div
                        key={cp.id}
                        onClick={() => {
                          setShiftLocationIds((prev) =>
                            prev.includes(cp.id)
                              ? prev.filter((id) => id !== cp.id)
                              : [...prev, cp.id],
                          );
                        }}
                        className={`p-2 rounded border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                          isSelected
                            ? "bg-blue-50/70 border-blue-400 font-medium"
                            : "bg-white border-[#f1f5f9] hover:bg-[#f8fafc]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-3.5 h-3.5 text-blue-600 rounded border-[#cbd5e1]"
                          />
                          <div className="truncate">
                            <span className="text-[#0f172a]">{cp.name}</span>
                            <span className="text-[10px] text-[#64748b] ml-1.5">
                              ({cp.zoneFloor} • {cp.siteName})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isSelected && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-600 text-white font-mono">
                              #{orderIdx + 1}
                            </span>
                          )}
                          <span className="font-mono text-[10px] text-slate-500">
                            {cp.id}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* JSON Payload Pratinjau Card */}
              <div className="rounded-lg bg-slate-900 border border-slate-800 p-3 text-white">
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-emerald-400 text-sm">
                      data_object
                    </span>
                    <span className="text-[11px] font-bold text-slate-200">
                      Pratinjau JSON Payload Sesuai Permintaan
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const payloadStr = formatShiftPayloadJson({
                        siteId: shiftSiteId,
                        name: shiftName,
                        startTime: shiftStartTime,
                        endTime: shiftEndTime,
                        intervalMinutes: shiftIntervalMinutes,
                        gracePeriodMinutes: shiftGracePeriodMinutes,
                        enforceSequence: shiftEnforceSequence,
                        locationIds: shiftLocationIds,
                      });
                      navigator.clipboard.writeText(payloadStr);
                      setCopiedModalJson(true);
                      setTimeout(() => setCopiedModalJson(false), 2000);
                    }}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono flex items-center gap-1 border border-slate-700"
                  >
                    <span className="material-symbols-outlined text-xs">
                      {copiedModalJson ? "check" : "content_copy"}
                    </span>
                    <span>{copiedModalJson ? "Tersalin" : "Salin"}</span>
                  </button>
                </div>
                <pre className="text-[10px] font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                  {formatShiftPayloadJson({
                    siteId: shiftSiteId,
                    name: shiftName,
                    startTime: shiftStartTime,
                    endTime: shiftEndTime,
                    intervalMinutes: shiftIntervalMinutes,
                    gracePeriodMinutes: shiftGracePeriodMinutes,
                    enforceSequence: shiftEnforceSequence,
                    locationIds: shiftLocationIds,
                  })}
                </pre>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 flex items-center justify-between border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => onNavigate("tambah-jadwal")}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">
                    open_in_new
                  </span>
                  <span>Buka Alur Penuh 3-Step Wizard</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-3 py-1.5 rounded border border-[#e2e8f0] text-[#334155] font-medium hover:bg-[#f8fafc]"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded bg-[#2563eb] text-white font-semibold hover:bg-[#1d4ed8] shadow-xs flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">
                      save
                    </span>
                    <span>Simpan Shift</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
