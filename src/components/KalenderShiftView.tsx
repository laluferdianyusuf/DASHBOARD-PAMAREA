import React, { useState } from 'react';
import { NavTab } from './Sidebar';
import { DayShift, CalendarShiftItem, ShiftOfficerAssignment } from '../utils/security-logic';
import { INITIAL_OFFICERS_POOL } from '../data/calendarMockData';

interface KalenderShiftViewProps {
  onNavigate: (tab: NavTab) => void;
  calendarDays: (DayShift | null)[];
  selectedDay: number;
  onSelectDay: (day: number) => void;
  onAssignOfficerToShift: (day: number, shiftType: 'Pagi' | 'Siang' | 'Malam', officer: ShiftOfficerAssignment) => void;
  onUnassignOfficerFromShift: (day: number, shiftType: 'Pagi' | 'Siang' | 'Malam', officerId: string) => void;
}

const POST_OPTIONS = [
  'Pos Utama Gerbang Depan',
  'Pintu Masuk Lobi & Metal Detector',
  'Patroli Koridor & Lift VIP',
  'Pintu Evakuasi Barat & Loading Bay',
  'Pos Timbangan & Dermaga Kontainer',
  'Ruang Server & Genset B2',
  'Patroli Perimeter Selatan & Pagar',
  'Gerbang Timur & Pos X-Ray',
  'Pos Pantau CCTV & Pusat Kendali',
  'Cadangan Siaga / Mobile Patrol',
];

export const KalenderShiftView: React.FC<KalenderShiftViewProps> = ({
  onNavigate,
  calendarDays,
  selectedDay,
  onSelectDay,
  onAssignOfficerToShift,
  onUnassignOfficerFromShift,
}) => {
  const [currentMonth] = useState('Mei 2025');

  // Modal for adding security officer to a specific shift
  const [assignModalShift, setAssignModalShift] = useState<{
    day: number;
    shift: CalendarShiftItem;
  } | null>(null);

  const [selectedOfficerId, setSelectedOfficerId] = useState(INITIAL_OFFICERS_POOL[1].officerId);
  const [selectedPost, setSelectedPost] = useState(POST_OPTIONS[0]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeDayObj = calendarDays.find((d) => d && d.day === selectedDay);

  const handleOpenAssignModal = (day: number, shift: CalendarShiftItem) => {
    setAssignModalShift({ day, shift });
    // Pick an officer not yet assigned
    const assignedIds = (shift.officers || []).map((o) => o.officerId);
    const available = INITIAL_OFFICERS_POOL.find((o) => !assignedIds.includes(o.officerId));
    if (available) {
      setSelectedOfficerId(available.officerId);
    }
  };

  const handleSaveAssignModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalShift) return;

    const officerObj = INITIAL_OFFICERS_POOL.find((o) => o.officerId === selectedOfficerId);
    if (!officerObj) return;

    onAssignOfficerToShift(assignModalShift.day, assignModalShift.shift.type, {
      ...officerObj,
      post: selectedPost,
    });

    setToastMessage(
      `Petugas ${officerObj.officerName} berhasil di-plot ke Shift ${assignModalShift.shift.type} pada tanggal ${assignModalShift.day} Mei 2025!`
    );
    setTimeout(() => setToastMessage(null), 3500);
    setAssignModalShift(null);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded text-xs text-emerald-800 font-medium flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Header and Switcher */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#e2e8f0]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]">
              ROSTER BULANAN
            </span>
            <span className="text-xs text-[#94a3b8]">/</span>
            <span className="text-xs font-semibold text-[#64748b]">Kalender Operasional</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">
            Kalender Shift &amp; Giliran Jaga
          </h1>
          <p className="text-xs text-[#64748b] mt-1">
            Matriks penugasan shift bulanan, rotasi regu pengamanan, dan alokasi personel per hari operasional.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* New Schedule CTA */}
          <button
            onClick={() => onNavigate('tambah-jadwal')}
            className="px-3.5 py-1.5 rounded bg-[#2563eb] text-white text-xs font-bold hover:bg-[#1d4ed8] shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">calendar_add_on</span>
            <span>+ Tambah Shift (3-Step)</span>
          </button>

          {/* Swap Shift CTA */}
          <button
            onClick={() => onNavigate('tukar-shift')}
            className="px-3 py-1.5 rounded bg-cyan-600 text-white text-xs font-bold hover:bg-cyan-700 shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">swap_horiz</span>
            <span>Tukar Shift</span>
          </button>

          {/* Cuti & Izin CTA */}
          <button
            onClick={() => onNavigate('cuti-izin')}
            className="px-3 py-1.5 rounded bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">person_off</span>
            <span>Cuti &amp; Izin</span>
          </button>

          {/* Tab View Switcher */}
          <div className="inline-flex items-center p-1 bg-[#f1f5f9] border border-[#e2e8f0] rounded text-xs">
            <button
              onClick={() => onNavigate('jadwal')}
              className="px-3 py-1.5 rounded font-medium text-[#64748b] hover:text-[#0f172a] transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">table_chart</span>
              <span>Tabel</span>
            </button>
            <button className="px-3 py-1.5 rounded font-medium bg-white text-[#0f172a] shadow-xs flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">calendar_view_week</span>
              <span>Kalender Shift</span>
            </button>
          </div>

          <div className="flex items-center gap-1 bg-white border border-[#e2e8f0] rounded px-3 py-1.5 text-xs font-semibold text-[#0f172a]">
            <span className="material-symbols-outlined text-sm text-[#2563eb]">calendar_month</span>
            <span>{currentMonth}</span>
          </div>
        </div>
      </div>

      {/* Shift Legend Strip */}
      <div className="bg-white border border-[#e2e8f0] rounded-lg p-3 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-[#0f172a]">Legenda Shift:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500"></span>
            <span className="text-[#334155]">Shift Pagi (07:00 - 15:00)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-500"></span>
            <span className="text-[#334155]">Shift Siang/Sore (15:00 - 23:00)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-purple-600"></span>
            <span className="text-[#334155]">Shift Malam (23:00 - 07:00)</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('tambah-jadwal')}
            className="text-xs text-[#2563eb] font-semibold hover:underline flex items-center gap-1"
          >
            <span>+ Plotting Shift Baru</span>
            <span className="material-symbols-outlined text-xs">arrow_forward</span>
          </button>
          <div className="flex items-center gap-1.5 text-rose-600 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            <span>Titik Merah: Kekurangan Personel</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Calendar Grid & Selected Day Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Grid (3 Cols) */}
        <div className="lg:col-span-3 bg-white border border-[#e2e8f0] rounded-lg overflow-hidden shadow-xs">
          <div className="grid grid-cols-7 border-b border-[#e2e8f0] bg-[#f8fafc] text-center text-xs font-bold text-[#64748b] uppercase py-2.5">
            <div>Sen</div>
            <div>Sel</div>
            <div>Rab</div>
            <div>Kam</div>
            <div>Jum</div>
            <div className="text-rose-600">Sab</div>
            <div className="text-rose-600">Min</div>
          </div>

          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-[#f1f5f9] text-xs">
            {calendarDays.map((item, idx) => {
              if (!item) {
                return <div key={`empty-${idx}`} className="h-28 bg-[#faf8ff]/50"></div>;
              }

              const isSelected = selectedDay === item.day;
              const hasShortage = item.shifts.some((s) => s.count < s.required);

              return (
                <div
                  key={item.day}
                  onClick={() => onSelectDay(item.day)}
                  className={`min-h-28 p-1.5 cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#eff6ff] ring-2 ring-inset ring-[#2563eb]'
                      : item.isToday
                      ? 'bg-blue-50/40 hover:bg-[#eff6ff]'
                      : 'hover:bg-[#f8fafc]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        item.isToday
                          ? 'bg-[#2563eb] text-white shadow-xs'
                          : isSelected
                          ? 'bg-[#101b35] text-white'
                          : 'text-[#0f172a]'
                      }`}
                    >
                      {item.day}
                    </span>
                    {hasShortage && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" title="Kurang personel"></span>
                    )}
                  </div>

                  {/* Compact Shift Badges */}
                  <div className="space-y-1 my-1">
                    {item.shifts.map((shift, sIdx) => {
                      const isShort = shift.count < shift.required;
                      const badgeColor =
                        shift.type === 'Pagi'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : shift.type === 'Siang'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-purple-50 text-purple-800 border-purple-200';

                      return (
                        <div
                          key={sIdx}
                          className={`text-[9px] font-medium px-1 py-0.5 rounded border truncate flex items-center justify-between ${badgeColor}`}
                          title={`${shift.type} - ${shift.squad} (${shift.count}/${shift.required} Personel)`}
                        >
                          <span className="truncate">
                            {shift.type}: {shift.squad.replace('Regu ', '')}
                          </span>
                          <span className={isShort ? 'font-bold text-rose-600' : 'text-[#64748b]'}>
                            {shift.count}/{shift.required}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Inspector (1 Col) */}
        <div className="space-y-4">
          {activeDayObj ? (
            <div className="bg-white border border-[#e2e8f0] rounded-lg p-4 shadow-xs space-y-4">
              <div className="border-b border-[#e2e8f0] pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
                    Detail Roster Harian
                  </span>
                  <h3 className="text-base font-bold text-[#0f172a] mt-0.5">
                    {selectedDay} {currentMonth}{' '}
                    {activeDayObj.isToday && (
                      <span className="text-xs text-[#2563eb] font-semibold">(Hari Ini)</span>
                    )}
                  </h3>
                </div>
                <button
                  onClick={() => onNavigate('tambah-jadwal')}
                  className="px-2 py-1 rounded bg-[#eff6ff] text-[#2563eb] text-xs font-bold hover:bg-[#dbeafe]"
                  title="Tambah Shift Baru di Tanggal Ini"
                >
                  + Shift
                </button>
              </div>

              {/* Shifts for the Day */}
              <div className="space-y-4">
                {activeDayObj.shifts.map((shift, idx) => {
                  const isShortage = shift.count < shift.required;
                  const shiftBadge =
                    shift.type === 'Pagi'
                      ? 'border-emerald-300 bg-emerald-50/50'
                      : shift.type === 'Siang'
                      ? 'border-blue-300 bg-blue-50/50'
                      : 'border-purple-300 bg-purple-50/50';

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border text-xs space-y-2.5 ${shiftBadge}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-[#0f172a] text-sm">
                            Shift {shift.type === 'Siang' ? 'Siang / Sore' : shift.type}
                          </span>
                          <span className="text-[11px] text-[#64748b] ml-1.5 font-mono">
                            {shift.type === 'Pagi'
                              ? '07:00-15:00'
                              : shift.type === 'Siang'
                              ? '15:00-23:00'
                              : '23:00-07:00'}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isShortage
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isShortage ? 'Kurang Personel' : 'Lengkap'}
                        </span>
                      </div>

                      <div className="text-xs text-[#334155] font-semibold">
                        {shift.squad} · Danru: {shift.danru}
                      </div>

                      {shift.sector && (
                        <div className="text-[11px] text-[#64748b] flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs text-[#94a3b8]">location_on</span>
                          <span className="truncate">{shift.sector}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] font-medium border-t border-[#e2e8f0]/80 pt-2">
                        <span>Alokasi: {shift.count}/{shift.required} Personel</span>
                        <button
                          onClick={() => handleOpenAssignModal(selectedDay, shift)}
                          className="px-2 py-0.5 bg-white border border-[#2563eb] text-[#2563eb] rounded text-[11px] font-bold hover:bg-[#eff6ff] flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-xs">person_add</span>
                          <span>Plot Personel</span>
                        </button>
                      </div>

                      {/* Render Assigned Security Officers List */}
                      {shift.officers && shift.officers.length > 0 ? (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#475569]">
                            Daftar Personel Bertugas:
                          </span>
                          <div className="space-y-1">
                            {shift.officers.map((officer) => (
                              <div
                                key={officer.officerId}
                                className="p-1.5 bg-white border border-[#e2e8f0] rounded text-[11px] flex items-center justify-between"
                              >
                                <div>
                                  <div className="font-bold text-[#0f172a] flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    <span>{officer.officerName}</span>
                                    {officer.callSign && (
                                      <span className="text-[9px] px-1 bg-[#f1f5f9] text-[#64748b] rounded font-mono">
                                        {officer.callSign}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-[#64748b] truncate max-w-[190px]">
                                    {officer.post || officer.role}
                                  </div>
                                </div>
                                <button
                                  onClick={() =>
                                    onUnassignOfficerFromShift(selectedDay, shift.type, officer.officerId)
                                  }
                                  className="text-[#94a3b8] hover:text-rose-600 p-0.5"
                                  title="Lepas Personel dari Shift Ini"
                                >
                                  <span className="material-symbols-outlined text-xs">close</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="p-2 bg-white/70 border border-dashed border-[#cbd5e1] rounded text-[10px] text-[#64748b] text-center">
                          Belum ada rincian personel yang di-plot.
                          <button
                            onClick={() => handleOpenAssignModal(selectedDay, shift)}
                            className="block mx-auto mt-1 text-[#2563eb] font-semibold hover:underline"
                          >
                            + Assign Personel Sekarang
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Quick Actions for Selected Day */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onNavigate('tukar-shift')}
                  className="p-2 rounded bg-cyan-50 border border-cyan-200 text-cyan-800 text-[11px] font-bold hover:bg-cyan-100 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">swap_horiz</span>
                  <span>Tukar Shift Hari Ini</span>
                </button>
                <button
                  onClick={() => onNavigate('cuti-izin')}
                  className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold hover:bg-amber-100 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">person_off</span>
                  <span>Ajukan Cuti/Izin</span>
                </button>
              </div>

              {/* Operational Dispatch Notice */}
              <div className="p-3 bg-[#eff6ff] border border-[#bfdbfe] rounded-lg text-xs text-[#1e40af]">
                <p className="font-semibold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">shield</span>
                  <span>Prosedur Serah Terima Shift</span>
                </p>
                <p className="text-[11px] text-[#3b82f6] mt-1 leading-relaxed">
                  Apel serah terima giliran jaga wajib dilakukan 15 menit sebelum jam shift dimulai di posko utama masing-masing site.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#e2e8f0] rounded-lg p-5 text-center text-xs text-[#64748b]">
              Pilih tanggal pada kalender untuk melihat dan mengelola plotting shift personel sekuriti.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Assign Security Officer to Shift */}
      {assignModalShift && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-[#cbd5e1] overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-[#101b35] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xl text-[#60a5fa]">assignment_ind</span>
                <div>
                  <h3 className="text-sm font-bold leading-tight">
                    Plot Personel Sekuriti ke Shift {assignModalShift.shift.type}
                  </h3>
                  <span className="text-[11px] text-[#94a3b8]">
                    {assignModalShift.day} Mei 2025 · {assignModalShift.shift.squad}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setAssignModalShift(null)}
                className="text-white/70 hover:text-white"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveAssignModal} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-[#334155] uppercase mb-1.5">
                  Pilih Personel Sekuriti <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedOfficerId}
                  onChange={(e) => setSelectedOfficerId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-xs text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                  required
                >
                  {INITIAL_OFFICERS_POOL.map((officer) => (
                    <option key={officer.officerId} value={officer.officerId}>
                      {officer.officerName} ({officer.npp} · {officer.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] uppercase mb-1.5">
                  Pos Penugasan / Plotting <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedPost}
                  onChange={(e) => setSelectedPost(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded text-xs text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                  required
                >
                  {POST_OPTIONS.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded text-[11px] text-[#64748b]">
                Personel yang ditambahkan akan langsung terdaftar di roster harian dan menambah jumlah alokasi pada kalender shift.
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setAssignModalShift(null)}
                  className="px-3.5 py-1.5 rounded border border-[#cbd5e1] text-[#334155] font-semibold text-xs hover:bg-[#f8fafc]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#2563eb] text-white font-bold text-xs hover:bg-[#1d4ed8] shadow-xs flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">check</span>
                  <span>Plot Personel Sekarang</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
