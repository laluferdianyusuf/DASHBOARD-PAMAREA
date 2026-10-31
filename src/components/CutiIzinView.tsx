import React, { useState } from 'react';
import { NavTab } from './Sidebar';
import { SecurityLeaveRecord, ShiftOfficerAssignment, DayShift } from '../utils/security-logic';
import { INITIAL_OFFICERS_POOL } from '../data/calendarMockData';

interface CutiIzinViewProps {
  onNavigate: (tab: NavTab) => void;
  calendarDays: (DayShift | null)[];
  leaveRecords: SecurityLeaveRecord[];
  onSubmitLeave: (leaveRecord: SecurityLeaveRecord, backupOfficer?: ShiftOfficerAssignment) => void;
}

export const CutiIzinView: React.FC<CutiIzinViewProps> = ({
  onNavigate,
  calendarDays: _calendarDays,
  leaveRecords,
  onSubmitLeave,
}) => {
  const [officerId, setOfficerId] = useState('USR-004'); // Budi Hartono
  const [leaveType, setLeaveType] = useState<SecurityLeaveRecord['leaveType']>('Cuti Tahunan');
  const [startDate, setStartDate] = useState('2025-05-24');
  const [endDate, setEndDate] = useState('2025-05-26');
  const [reason, setReason] = useState('Cuti tahunan keperluan keluarga di luar kota');
  const [backupOfficerId, setBackupOfficerId] = useState('USR-009'); // Surya Saputra
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const selectedOfficer = INITIAL_OFFICERS_POOL.find((o) => o.officerId === officerId);
  const selectedBackup = INITIAL_OFFICERS_POOL.find((o) => o.officerId === backupOfficerId);

  // Compute total days requested
  const diffDays = (() => {
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || s > e) return 1;
    return Math.round((e.getTime() - s.getTime()) / (1000 * 3600 * 24)) + 1;
  })();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (officerId === backupOfficerId) {
      setFormError('Petugas yang cuti/izin tidak bisa menjadi petugas pengganti dirinya sendiri.');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setFormError('Tanggal mulai tidak boleh lebih lambat dari tanggal selesai.');
      return;
    }

    if (!reason.trim()) {
      setFormError('Alasan cuti/izin wajib dicantumkan.');
      return;
    }

    const newRecord: SecurityLeaveRecord = {
      id: `LEV-${Date.now().toString().slice(-4)}`,
      officerId,
      officerName: selectedOfficer?.officerName || 'Petugas Security',
      leaveType,
      startDate,
      endDate,
      reason,
      backupOfficerId: selectedBackup ? selectedBackup.officerId : undefined,
      backupOfficerName: selectedBackup ? selectedBackup.officerName : undefined,
      status: 'Disetujui',
      createdAt: '2025-05-23',
    };

    onSubmitLeave(newRecord, selectedBackup);

    setSuccessMessage(
      `Pengajuan ${leaveType} untuk ${selectedOfficer?.officerName} berhasil disetujui! Petugas pengganti cadangan: ${selectedBackup?.officerName || 'Tidak ditentukan'}. Kalender Shift telah disinkronkan.`
    );
    setTimeout(() => setSuccessMessage(null), 6000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Success */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-emerald-600 text-lg">verified</span>
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => onNavigate('kalender')}
            className="px-2.5 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            Lihat di Kalender Shift
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#e2e8f0]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]">
              OPERASIONAL PATROLI
            </span>
            <span className="text-xs text-[#94a3b8]">/</span>
            <span className="text-xs font-semibold text-[#64748b]">Manajemen Absensi &amp; Izin</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">
            Pengajuan Cuti, Izin &amp; Sakit Personel
          </h1>
          <p className="text-xs text-[#64748b] mt-1">
            Pengelolaan izin ketidakhadiran security, penunjukan petugas pengganti cadangan (backup guard), dan penyesuaian kalender jaga.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('kalender')}
            className="px-3 py-1.5 rounded border border-[#cbd5e1] text-xs font-semibold text-[#334155] hover:bg-white flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">calendar_view_week</span>
            <span>Lihat Kalender Shift</span>
          </button>
          <button
            onClick={() => onNavigate('tukar-shift')}
            className="px-3 py-1.5 rounded bg-cyan-600 text-white text-xs font-bold hover:bg-cyan-700 flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">swap_horiz</span>
            <span>Tukar Shift (Swap)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Pengajuan Cuti / Izin */}
        <div className="lg:col-span-2 bg-white border border-[#e2e8f0] rounded-lg p-5 shadow-xs">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[#f1f5f9]">
            <span className="material-symbols-outlined text-amber-500 text-xl">person_off</span>
            <h2 className="text-sm font-bold text-[#0f172a]">Formulir Pengajuan Cuti / Izin / Sakit</h2>
          </div>

          {formError && (
            <div className="mb-4 p-3 rounded bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-600 text-base">error</span>
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Personel dan Jenis Cuti */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1">
                  Personel Security Pemohon <span className="text-rose-500">*</span>
                </label>
                <select
                  value={officerId}
                  onChange={(e) => setOfficerId(e.target.value)}
                  className="w-full px-3 py-2 border border-[#cbd5e1] rounded text-xs bg-white text-[#0f172a] focus:outline-hidden focus:border-[#2563eb]"
                >
                  {INITIAL_OFFICERS_POOL.map((off) => (
                    <option key={off.officerId} value={off.officerId}>
                      {off.officerName} - {off.role} ({off.callSign || off.npp})
                    </option>
                  ))}
                </select>
                <div className="text-[11px] text-[#64748b] mt-1">
                  Pos Penugasan: <strong>{selectedOfficer?.post || 'Pos Utama'}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1">
                  Jenis Ketidakhadiran <span className="text-rose-500">*</span>
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-[#cbd5e1] rounded text-xs bg-white text-[#0f172a] focus:outline-hidden focus:border-[#2563eb]"
                >
                  <option value="Cuti Tahunan">Cuti Tahunan (Hak Cuti Resmi)</option>
                  <option value="Izin Urusan Penting">Izin Urusan Penting / Keluarga</option>
                  <option value="Sakit (Surat Dokter)">Sakit (Dengan Keterangan Dokter)</option>
                  <option value="Dispensasi Dinas Luar">Dispensasi Pelatihan / Dinas Luar</option>
                </select>
              </div>
            </div>

            {/* Rentang Tanggal Cuti */}
            <div className="p-4 rounded-lg bg-[#f8fafc] border border-[#e2e8f0]">
              <label className="block text-xs font-bold text-[#334155] mb-2 flex items-center justify-between">
                <span>Rentang Tanggal Cuti / Izin <span className="text-rose-500">*</span></span>
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Total Durasi: {diffDays} Hari
                </span>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="block text-[11px] font-semibold text-[#64748b] mb-1">Tanggal Mulai Cuti:</span>
                  <input
                    type="date"
                    value={startDate}
                    min="2025-05-01"
                    max="2025-05-31"
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded text-xs bg-white text-[#0f172a] focus:outline-hidden focus:border-[#2563eb]"
                  />
                </div>
                <div>
                  <span className="block text-[11px] font-semibold text-[#64748b] mb-1">Tanggal Selesai Cuti:</span>
                  <input
                    type="date"
                    value={endDate}
                    min="2025-05-01"
                    max="2025-05-31"
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded text-xs bg-white text-[#0f172a] focus:outline-hidden focus:border-[#2563eb]"
                  />
                </div>
              </div>
            </div>

            {/* Personel Pengganti (Backup Guard) */}
            <div>
              <label className="block text-xs font-bold text-[#334155] mb-1">
                Tugaskan Petugas Cadangan / Pengganti (Backup Guard) <span className="text-rose-500">*</span>
              </label>
              <select
                value={backupOfficerId}
                onChange={(e) => setBackupOfficerId(e.target.value)}
                className="w-full px-3 py-2 border border-[#cbd5e1] rounded text-xs bg-white text-[#0f172a] focus:outline-hidden focus:border-[#2563eb]"
              >
                {INITIAL_OFFICERS_POOL.map((off) => (
                  <option key={off.officerId} value={off.officerId}>
                    {off.officerName} ({off.role} - Siaga / Cadangan Regu)
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-[#64748b] mt-1">
                Petugas pengganti ini akan otomatis menggantikan pos {selectedOfficer?.officerName} pada setiap tanggal cuti ({startDate} s/d {endDate}) di Kalender Shift.
              </p>
            </div>

            {/* Keterangan */}
            <div>
              <label className="block text-xs font-bold text-[#334155] mb-1">
                Alasan / Keterangan Tambahan <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Rincian alasan pengajuan cuti atau keterangan surat dokter..."
                className="w-full px-3 py-2 border border-[#cbd5e1] rounded text-xs text-[#0f172a] focus:outline-hidden focus:border-[#2563eb]"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setReason('')}
                className="px-4 py-2 border border-[#cbd5e1] rounded text-xs font-semibold text-[#475569] hover:bg-[#f8fafc]"
              >
                Reset
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 shadow-xs flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">assignment_turned_in</span>
                <span>Setujui &amp; Terapkan ke Kalender Shift</span>
              </button>
            </div>
          </form>
        </div>

        {/* Panel Ringkasan Kuota Cuti & Kuota Pos */}
        <div className="space-y-4">
          <div className="bg-white border border-[#e2e8f0] rounded-lg p-4 shadow-xs">
            <h3 className="text-xs font-bold text-[#0f172a] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base text-amber-600">health_and_safety</span>
              Kebijakan Absensi &amp; Cuti PAMAREA
            </h3>
            <ul className="text-xs text-[#64748b] space-y-2 list-disc list-inside">
              <li>Maksimal 1 personel per regu yang dapat mengambil cuti bersamaan agar kuota pos tetap aman.</li>
              <li>Wajib menyertakan personel pengganti resmi untuk menjaga kontinuitas penjagaan.</li>
              <li>Izin sakit lebih dari 1 hari wajib melampirkan surat keterangan dokter resmi.</li>
              <li>Status kalender shift otomatis berlabel <em>[Cadangan Cuti]</em> untuk memudahkan inspeksi supervisor.</li>
            </ul>
          </div>

          <div className="bg-emerald-900 text-white rounded-lg p-4 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-emerald-300 text-lg">shield_person</span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">Kesiapan Tim Cadangan</span>
            </div>
            <p className="text-xs text-emerald-100 mb-2">
              Tersedia 4 personel cadangan siaga (Standby Mobile Guards) yang siap dimobilisasi ke pos kosong kapan saja.
            </p>
            <div className="text-[11px] text-emerald-200/90 bg-emerald-800/60 p-2 rounded">
              Status Pos Hari Ini: <strong>100% Terisi &amp; Bebas Kekosongan Pos</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Daftar Pengajuan Cuti & Izin Aktif */}
      <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-[#e2e8f0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-600 text-lg">event_available</span>
            <h3 className="text-sm font-bold text-[#0f172a]">Daftar Cuti &amp; Izin Personel Aktif</h3>
          </div>
          <span className="text-xs text-[#64748b]">{leaveRecords.length} Permohonan Terdata</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#f8fafc] text-[#475569] font-bold border-b border-[#e2e8f0]">
                <th className="py-2.5 px-4">ID Cuti</th>
                <th className="py-2.5 px-4">Nama Personel</th>
                <th className="py-2.5 px-4">Jenis Izin</th>
                <th className="py-2.5 px-4">Rentang Tanggal</th>
                <th className="py-2.5 px-4">Petugas Pengganti (Backup)</th>
                <th className="py-2.5 px-4">Alasan</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9] text-[#334155]">
              {leaveRecords.map((l) => (
                <tr key={l.id} className="hover:bg-[#fafafa]">
                  <td className="py-3 px-4 font-mono font-semibold text-[#2563eb]">{l.id}</td>
                  <td className="py-3 px-4 font-bold text-[#0f172a]">{l.officerName}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      {l.leaveType}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-[#0f172a]">
                    {l.startDate} s/d {l.endDate}
                  </td>
                  <td className="py-3 px-4">
                    {l.backupOfficerName ? (
                      <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ✓ {l.backupOfficerName}
                      </span>
                    ) : (
                      <span className="text-[#94a3b8] italic">Belum ditentukan</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-[#64748b] max-w-xs truncate">{l.reason}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {l.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
