import React, { useState } from 'react';
import { NavTab } from './Sidebar';
import { DayShift, ShiftSwapRecord, ShiftOfficerAssignment } from '../utils/security-logic';
import { INITIAL_OFFICERS_POOL } from '../data/calendarMockData';

interface TukarShiftViewProps {
  onNavigate: (tab: NavTab) => void;
  calendarDays: (DayShift | null)[];
  swapRecords: ShiftSwapRecord[];
  onExecuteSwap: (swapRequest: {
    dateStr: string;
    officerAId: string;
    officerAName: string;
    shiftTypeA: 'Pagi' | 'Siang' | 'Malam';
    postA?: string;
    officerBId: string;
    officerBName: string;
    shiftTypeB: 'Pagi' | 'Siang' | 'Malam';
    postB?: string;
    reason: string;
  }) => void;
}

export const TukarShiftView: React.FC<TukarShiftViewProps> = ({
  onNavigate,
  calendarDays,
  swapRecords,
  onExecuteSwap,
}) => {
  const [selectedDate, setSelectedDate] = useState('2025-05-24');
  const [officerAId, setOfficerAId] = useState('USR-003'); // Rian Hidayat
  const [shiftTypeA, setShiftTypeA] = useState<'Pagi' | 'Siang' | 'Malam'>('Siang');
  const [officerBId, setOfficerBId] = useState('USR-005'); // Wahyu Hidayat
  const [shiftTypeB, setShiftTypeB] = useState<'Pagi' | 'Siang' | 'Malam'>('Malam');
  const [reason, setReason] = useState('Penyesuaian jam kuliah malam dan keperluan keluarga mendesak');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Officers scheduled on selected date
  const dayNumber = parseInt(selectedDate.split('-')[2], 10);
  const currentDayObj = calendarDays.find((d) => d && d.day === dayNumber);

  const officerAObj = INITIAL_OFFICERS_POOL.find((o) => o.officerId === officerAId);
  const officerBObj = INITIAL_OFFICERS_POOL.find((o) => o.officerId === officerBId);

  const handleSubmitSwap = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (officerAId === officerBId) {
      setFormError('Petugas 1 dan Petugas 2 tidak boleh orang yang sama.');
      return;
    }

    if (shiftTypeA === shiftTypeB) {
      setFormError('Shift asal kedua petugas tidak boleh sama (pilih shift yang berbeda untuk pertukaran).');
      return;
    }

    if (!reason.trim()) {
      setFormError('Alasan pertukaran jaga wajib dicantumkan.');
      return;
    }

    onExecuteSwap({
      dateStr: selectedDate,
      officerAId,
      officerAName: officerAObj?.officerName || 'Petugas 1',
      shiftTypeA,
      postA: officerAObj?.post || 'Pos Jaga',
      officerBId,
      officerBName: officerBObj?.officerName || 'Petugas 2',
      shiftTypeB,
      postB: officerBObj?.post || 'Pos Jaga',
      reason,
    });

    setSuccessMessage(
      `Pertukaran jaga pada tanggal ${selectedDate} berhasil disetujui! ${officerAObj?.officerName} bertukar posisi dengan ${officerBObj?.officerName}.`
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
            Buka Kalender Shift
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
            <span className="text-xs font-semibold text-[#64748b]">Tukar Shift (Swap Jaga)</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">
            Menu Pertukaran Shift (Swap Shift)
          </h1>
          <p className="text-xs text-[#64748b] mt-1">
            Fasilitas resmi pertukaran jam jaga antar personel pengamanan pada tanggal tertentu dengan persetujuan Danru &amp; sinkronisasi kalender real-time.
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
            onClick={() => onNavigate('cuti-izin')}
            className="px-3 py-1.5 rounded bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">person_off</span>
            <span>Cuti &amp; Izin Personel</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Tukar Shift */}
        <div className="lg:col-span-2 bg-white border border-[#e2e8f0] rounded-lg p-5 shadow-xs">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[#f1f5f9]">
            <span className="material-symbols-outlined text-cyan-600 text-xl">swap_horiz</span>
            <h2 className="text-sm font-bold text-[#0f172a]">Formulir Pengajuan Tukar Jaga Resmi</h2>
          </div>

          {formError && (
            <div className="mb-4 p-3 rounded bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-600 text-base">error</span>
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmitSwap} className="space-y-4">
            {/* Tanggal Pertukaran */}
            <div>
              <label className="block text-xs font-bold text-[#334155] mb-1">
                Pilih Tanggal Pertukaran Shift <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={selectedDate}
                  min="2025-05-01"
                  max="2025-05-31"
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-[#cbd5e1] rounded text-xs text-[#0f172a] focus:outline-hidden focus:border-[#2563eb] w-48 font-medium"
                />
                <span className="text-xs text-[#64748b]">
                  {currentDayObj ? (
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      ✓ Tanggal {dayNumber} Mei 2025 Terjadwal ({currentDayObj.shifts.length} Shift aktif)
                    </span>
                  ) : (
                    'Pilih tanggal dalam rentang operasional Mei 2025'
                  )}
                </span>
              </div>
            </div>

            {/* Dua Kolom Pertukaran */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-[#f8fafc] border border-[#e2e8f0]">
              {/* Petugas 1 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#cbd5e1]">
                  <span className="text-xs font-bold text-[#0f172a] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    Petugas Pemohon (Pihak 1)
                  </span>
                  <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-semibold">
                    Shift Asal: {shiftTypeA}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#64748b] mb-1">Nama Petugas</label>
                  <select
                    value={officerAId}
                    onChange={(e) => setOfficerAId(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-[#cbd5e1] rounded text-xs bg-white text-[#0f172a]"
                  >
                    {INITIAL_OFFICERS_POOL.map((off) => (
                      <option key={off.officerId} value={off.officerId}>
                        {off.officerName} ({off.role} - {off.callSign || off.npp})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#64748b] mb-1">Shift Yang Ditinggalkan</label>
                  <select
                    value={shiftTypeA}
                    onChange={(e) => setShiftTypeA(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 border border-[#cbd5e1] rounded text-xs bg-white text-[#0f172a]"
                  >
                    <option value="Pagi">Shift Pagi (07:00 - 15:00)</option>
                    <option value="Siang">Shift Siang (15:00 - 23:00)</option>
                    <option value="Malam">Shift Malam (23:00 - 07:00)</option>
                  </select>
                </div>

                <div className="text-[11px] text-[#64748b] bg-white p-2 rounded border border-[#e2e8f0]">
                  <span className="font-semibold text-[#334155]">Pos Saat Ini:</span> {officerAObj?.post || 'Pos Jaga Utama'}
                </div>
              </div>

              {/* Petugas 2 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#cbd5e1]">
                  <span className="text-xs font-bold text-[#0f172a] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                    Petugas Penukar (Pihak 2)
                  </span>
                  <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded font-semibold">
                    Shift Asal: {shiftTypeB}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#64748b] mb-1">Nama Petugas</label>
                  <select
                    value={officerBId}
                    onChange={(e) => setOfficerBId(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-[#cbd5e1] rounded text-xs bg-white text-[#0f172a]"
                  >
                    {INITIAL_OFFICERS_POOL.map((off) => (
                      <option key={off.officerId} value={off.officerId}>
                        {off.officerName} ({off.role} - {off.callSign || off.npp})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#64748b] mb-1">Shift Yang Ditinggalkan</label>
                  <select
                    value={shiftTypeB}
                    onChange={(e) => setShiftTypeB(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 border border-[#cbd5e1] rounded text-xs bg-white text-[#0f172a]"
                  >
                    <option value="Pagi">Shift Pagi (07:00 - 15:00)</option>
                    <option value="Siang">Shift Siang (15:00 - 23:00)</option>
                    <option value="Malam">Shift Malam (23:00 - 07:00)</option>
                  </select>
                </div>

                <div className="text-[11px] text-[#64748b] bg-white p-2 rounded border border-[#e2e8f0]">
                  <span className="font-semibold text-[#334155]">Pos Saat Ini:</span> {officerBObj?.post || 'Pos Jaga Cadangan'}
                </div>
              </div>
            </div>

            {/* Alasan */}
            <div>
              <label className="block text-xs font-bold text-[#334155] mb-1">
                Alasan Pertukaran Jaga / Keterangan <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Misal: Keperluan mendesak keluarga, jadwal kuliah malam, atau pergantian jadwal patroli..."
                className="w-full px-3 py-2 border border-[#cbd5e1] rounded text-xs text-[#0f172a] focus:outline-hidden focus:border-[#2563eb]"
              />
            </div>

            {/* Preview Dampak */}
            <div className="p-3 bg-cyan-50 border border-cyan-200 rounded text-xs text-cyan-900">
              <span className="font-bold flex items-center gap-1 mb-1">
                <span className="material-symbols-outlined text-sm text-cyan-700">sync_alt</span>
                Preview Dampak Pertukaran Kalender Shift:
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-cyan-800">
                <li>
                  <strong>{officerAObj?.officerName}</strong> akan berpindah dari <strong>Shift {shiftTypeA}</strong> ke <strong>Shift {shiftTypeB}</strong> pada tanggal {selectedDate}.
                </li>
                <li>
                  <strong>{officerBObj?.officerName}</strong> akan berpindah dari <strong>Shift {shiftTypeB}</strong> ke <strong>Shift {shiftTypeA}</strong> pada tanggal {selectedDate}.
                </li>
              </ul>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setReason('')}
                className="px-4 py-2 border border-[#cbd5e1] rounded text-xs font-semibold text-[#475569] hover:bg-[#f8fafc]"
              >
                Reset Form
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded bg-cyan-600 text-white text-xs font-bold hover:bg-cyan-700 shadow-xs flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">swap_horiz</span>
                <span>Setujui &amp; Terapkan Tukar Shift</span>
              </button>
            </div>
          </form>
        </div>

        {/* Panel Informasi SOP Pertukaran Jaga */}
        <div className="space-y-4">
          <div className="bg-white border border-[#e2e8f0] rounded-lg p-4 shadow-xs">
            <h3 className="text-xs font-bold text-[#0f172a] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base text-blue-600">policy</span>
              SOP Pertukaran Jaga (Swap)
            </h3>
            <ul className="text-xs text-[#64748b] space-y-2 list-disc list-inside">
              <li>Pertukaran shift harus diajukan minimal 6 jam sebelum shift dimulai.</li>
              <li>Kedua personel wajib memiliki kualifikasi/sertifikasi pengamanan yang setara.</li>
              <li>Pergantian posisi dicatat secara otomatis dalam audit log PAMAREA.</li>
              <li>Komandan Regu (Danru) akan menerima notifikasi otomatis di sistem.</li>
            </ul>
          </div>

          <div className="bg-[#101b35] text-white rounded-lg p-4 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-amber-400 text-lg">schedule</span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">Jadwal Shift Standar</span>
            </div>
            <div className="space-y-2 text-xs text-[#cbd5e1]">
              <div className="flex justify-between pb-1 border-b border-[#1e293b]">
                <span className="font-semibold text-white">Shift Pagi:</span>
                <span>07:00 - 15:00 WIB</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-[#1e293b]">
                <span className="font-semibold text-white">Shift Siang/Sore:</span>
                <span>15:00 - 23:00 WIB</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-white">Shift Malam:</span>
                <span>23:00 - 07:00 WIB</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Riwayat Tukar Shift */}
      <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-[#e2e8f0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-cyan-600 text-lg">history_toggle_off</span>
            <h3 className="text-sm font-bold text-[#0f172a]">Riwayat Pertukaran Shift (Audit Log)</h3>
          </div>
          <span className="text-xs text-[#64748b]">{swapRecords.length} Catatan Pertukaran Terverifikasi</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#f8fafc] text-[#475569] font-bold border-b border-[#e2e8f0]">
                <th className="py-2.5 px-4">ID Transaksi</th>
                <th className="py-2.5 px-4">Tanggal Shift</th>
                <th className="py-2.5 px-4">Petugas 1 (Shift Asal)</th>
                <th className="py-2.5 px-4 text-center">Swap</th>
                <th className="py-2.5 px-4">Petugas 2 (Shift Asal)</th>
                <th className="py-2.5 px-4">Alasan &amp; Keterangan</th>
                <th className="py-2.5 px-4">Status &amp; Verifikator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9] text-[#334155]">
              {swapRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-[#fafafa]">
                  <td className="py-3 px-4 font-mono font-semibold text-[#2563eb]">{rec.id}</td>
                  <td className="py-3 px-4 font-medium text-[#0f172a]">{rec.dateStr}</td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-[#0f172a]">{rec.officerA.officerName}</div>
                    <span className="text-[10px] text-blue-700 bg-blue-50 px-1 py-0.2 rounded font-semibold">
                      Shift {rec.officerA.shiftType}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="material-symbols-outlined text-cyan-600 text-base">swap_horiz</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-[#0f172a]">{rec.officerB.officerName}</div>
                    <span className="text-[10px] text-purple-700 bg-purple-50 px-1 py-0.2 rounded font-semibold">
                      Shift {rec.officerB.shiftType}
                    </span>
                  </td>
                  <td className="py-3 px-4 max-w-xs text-[#64748b] truncate">{rec.reason}</td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {rec.status}
                    </span>
                    <div className="text-[10px] text-[#94a3b8] mt-0.5">Disetujui: {rec.approvedBy}</div>
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
