import React, { useState } from 'react';
import { NavTab } from './Sidebar';
import { SITES, CHECKPOINTS, PatrolScheduleItem, CheckpointItem } from '../data/mockData';
import { INITIAL_OFFICERS_POOL } from '../data/calendarMockData';
import {
  ShiftOfficerAssignment,
  DayShift,
  DateRangeShiftPayload,
  validateShiftConfig,
  formatShiftPayloadJson,
  reorderShiftLocations,
} from '../utils/security-logic';

interface TambahJadwalShiftViewProps {
  onNavigate: (tab: NavTab) => void;
  onAddDateRangeScheduleAndSyncCalendar: (
    newSchedules: PatrolScheduleItem[],
    dateRangePayload: DateRangeShiftPayload
  ) => void;
  calendarDays?: (DayShift | null)[];
}

const POST_OPTIONS = [
  'Pos Utama Gerbang Depan',
  'Pintu Masuk Lobi & Metal Detector',
  'Patroli Koridor & Lift VIP',
  'Pintu Evakuasi Barat & Loading Bay',
  'Pos Timbangan & Dermaga Kontainer',
  'Ruang Server & Genset B2',
  'Patroli Perimeter Selatan & Pagar',
  'Gerbang Timur & Pemeriksaan X-Ray',
  'Pos Pantau CCTV & Pusat Kendali',
  'Cadangan Siaga / Mobile Patrol',
];

export const TambahJadwalShiftView: React.FC<TambahJadwalShiftViewProps> = ({
  onNavigate,
  onAddDateRangeScheduleAndSyncCalendar,
}) => {
  // Stepper State (1: Konfigurasi Shift, 2: Tentukan Lokasi, 3: Assign Security & Rentang Tanggal)
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  // STEP 1 STATE: Exact schema requested by user:
  // "siteId": "{{siteId}}",
  // "name": "Shift Pagi",
  // "startTime": "07:00",
  // "endTime": "15:00",
  // "intervalMinutes": 120,
  // "gracePeriodMinutes": 30,
  // "enforceSequence": false
  const [siteId, setSiteId] = useState('site-a');
  const [customSiteIdMode, setCustomSiteIdMode] = useState(false);
  const [name, setName] = useState('Shift Pagi');
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('15:00');
  const [intervalMinutes, setIntervalMinutes] = useState(120);
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState(30);
  const [enforceSequence, setEnforceSequence] = useState(false);

  // Operational squad & notes
  const [squad, setSquad] = useState('Regu Alpha');
  const [danru, setDanru] = useState('Ahmad Fauzi');
  const [requiredCount, setRequiredCount] = useState(4);
  const [shiftNotes, setShiftNotes] = useState('Patroli ketat checkpoint, pemeriksaan akses & dokumentasi temuan');

  // STEP 2 STATE: List of individual locations (NOT per site)
  // Selected checkpoint IDs in their active sequence
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([
    'CP-SDR-001',
    'CP-SDR-002',
    'CP-SDR-003',
    'CP-SDR-014',
  ]);
  const [locationSearch, setLocationSearch] = useState('');
  const [locationSiteFilter, setLocationSiteFilter] = useState('all');

  // STEP 3 STATE: Date Range & Officer Assignment
  const [startDate, setStartDate] = useState('2025-05-24');
  const [endDate, setEndDate] = useState('2025-05-28');
  const [officerSearch, setOfficerSearch] = useState('');
  const [assignedOfficers, setAssignedOfficers] = useState<ShiftOfficerAssignment[]>([
    {
      officerId: 'USR-002',
      officerName: 'Ahmad Fauzi',
      role: 'Komandan Regu (Danru)',
      post: 'Pos Utama Gerbang Depan',
      npp: 'NPP-882144',
      callSign: 'Alpha-01',
      phone: '0813-8821-4455',
    },
    {
      officerId: 'USR-003',
      officerName: 'Rian Hidayat',
      role: 'Petugas Lapangan',
      post: 'Pintu Masuk Lobi & Metal Detector',
      npp: 'NPP-882189',
      callSign: 'Alpha-02',
      phone: '0815-7762-3390',
    },
    {
      officerId: 'USR-004',
      officerName: 'Budi Hartono',
      role: 'Petugas Lapangan',
      post: 'Ruang Trafo & Genset Darurat B2',
      npp: 'NPP-882190',
      callSign: 'Alpha-03',
      phone: '0816-5541-2299',
    },
    {
      officerId: 'USR-008',
      officerName: 'Agus Setiawan',
      role: 'Petugas Lapangan',
      post: 'Pintu Darurat Timur Lt. 14',
      npp: 'NPP-882195',
      callSign: 'Alpha-04',
      phone: '0812-4433-2211',
    },
  ]);

  const [availableOfficers] = useState<ShiftOfficerAssignment[]>(INITIAL_OFFICERS_POOL);
  const [formError, setFormError] = useState<string | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);
  const [successSaved, setSuccessSaved] = useState<{
    startDate: string;
    endDate: string;
    shiftName: string;
    totalDays: number;
    locationsCount: number;
    officersCount: number;
    jsonPayload: string;
  } | null>(null);

  // Quick Preset Helper
  const applyPreset = (presetName: 'Shift Pagi' | 'Shift Siang' | 'Shift Malam' | 'Shift Khusus') => {
    setName(presetName);
    if (presetName === 'Shift Pagi') {
      setStartTime('07:00');
      setEndTime('15:00');
      setIntervalMinutes(120);
      setGracePeriodMinutes(30);
    } else if (presetName === 'Shift Siang') {
      setStartTime('15:00');
      setEndTime('23:00');
      setIntervalMinutes(120);
      setGracePeriodMinutes(30);
    } else if (presetName === 'Shift Malam') {
      setStartTime('23:00');
      setEndTime('07:00');
      setIntervalMinutes(90);
      setGracePeriodMinutes(20);
    } else {
      setStartTime('08:00');
      setEndTime('17:00');
      setIntervalMinutes(60);
      setGracePeriodMinutes(15);
    }
  };

  // Toggle checkpoint selection
  const handleToggleLocation = (checkpointId: string) => {
    setSelectedLocationIds((prev) => {
      if (prev.includes(checkpointId)) {
        return prev.filter((id) => id !== checkpointId);
      } else {
        return [...prev, checkpointId];
      }
    });
  };

  // Select all filtered locations
  const handleSelectAllLocations = () => {
    const allFilteredIds = filteredLocations.map((l) => l.id);
    setSelectedLocationIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
  };

  // Clear all selected locations
  const handleClearAllLocations = () => {
    setSelectedLocationIds([]);
  };

  // Move location up/down in sequence
  const handleMoveLocation = (checkpointId: string, direction: 'up' | 'down') => {
    const currentIndex = selectedLocationIds.indexOf(checkpointId);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    setSelectedLocationIds(reorderShiftLocations(selectedLocationIds, currentIndex, targetIndex));
  };

  // Toggle security officer assignment
  const handleToggleOfficer = (officer: ShiftOfficerAssignment) => {
    const isAssigned = assignedOfficers.some((o) => o.officerId === officer.officerId);
    if (isAssigned) {
      setAssignedOfficers((prev) => prev.filter((o) => o.officerId !== officer.officerId));
    } else {
      setAssignedOfficers((prev) => [
        ...prev,
        {
          ...officer,
          post: officer.post || POST_OPTIONS[prev.length % POST_OPTIONS.length],
        },
      ]);
    }
  };

  const handleUpdateOfficerPost = (officerId: string, newPost: string) => {
    setAssignedOfficers((prev) =>
      prev.map((o) => (o.officerId === officerId ? { ...o, post: newPost } : o))
    );
  };

  const handleAutoFillSquad = () => {
    let matchedOfficers: ShiftOfficerAssignment[] = [];
    if (squad.includes('Alpha')) {
      matchedOfficers = availableOfficers.filter(
        (o) => o.callSign?.startsWith('Alpha') || o.officerId === 'USR-002'
      );
    } else if (squad.includes('Charlie')) {
      matchedOfficers = availableOfficers.filter(
        (o) => o.callSign?.startsWith('Charlie') || o.officerId === 'USR-005'
      );
    } else if (squad.includes('Delta')) {
      matchedOfficers = availableOfficers.filter(
        (o) => o.callSign?.startsWith('Delta') || o.officerId === 'USR-006'
      );
    } else {
      matchedOfficers = availableOfficers.slice(0, requiredCount);
    }

    if (matchedOfficers.length > 0) {
      setAssignedOfficers(matchedOfficers);
    }
  };

  // Calculate day range
  const daysDiff = (() => {
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || s > e) return 1;
    return Math.round((e.getTime() - s.getTime()) / (1000 * 3600 * 24)) + 1;
  })();

  // Filter locations list
  const filteredLocations = CHECKPOINTS.filter((cp) => {
    const matchesFilter = locationSiteFilter === 'all' || cp.siteId === locationSiteFilter;
    if (!matchesFilter) return false;
    if (!locationSearch.trim()) return true;
    const q = locationSearch.toLowerCase();
    return (
      cp.name.toLowerCase().includes(q) ||
      cp.id.toLowerCase().includes(q) ||
      cp.zoneFloor.toLowerCase().includes(q) ||
      cp.siteName.toLowerCase().includes(q) ||
      cp.tagUid.toLowerCase().includes(q)
    );
  });

  // Current JSON Payload
  const currentJsonPayload = formatShiftPayloadJson({
    siteId,
    name,
    startTime,
    endTime,
    intervalMinutes,
    gracePeriodMinutes,
    enforceSequence,
    locationIds: selectedLocationIds,
  });

  const handleCopyJson = () => {
    navigator.clipboard.writeText(currentJsonPayload);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  // Validation before proceeding
  const handleNextFromStep1 = () => {
    setFormError(null);
    const validation = validateShiftConfig({
      siteId,
      name,
      startTime,
      endTime,
      intervalMinutes,
      gracePeriodMinutes,
      enforceSequence,
    });
    if (!validation.valid) {
      setFormError(validation.error || 'Mohon lengkapi konfigurasi shift dengan benar.');
      return;
    }
    setActiveStep(2);
  };

  const handleNextFromStep2 = () => {
    setFormError(null);
    if (selectedLocationIds.length === 0) {
      setFormError('Pilih minimal satu lokasi titik patroli yang ada pada daftar.');
      return;
    }
    setActiveStep(3);
  };

  // Submit complete workflow
  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (new Date(startDate) > new Date(endDate)) {
      setFormError('Tanggal mulai tidak boleh lebih lambat dari tanggal selesai.');
      return;
    }

    if (assignedOfficers.length === 0) {
      setFormError('Assign minimal 1 personel security yang bertugas.');
      return;
    }

    if (selectedLocationIds.length === 0) {
      setFormError('Pilih minimal 1 lokasi titik patroli.');
      return;
    }

    const selectedCheckpoints = selectedLocationIds
      .map((id) => CHECKPOINTS.find((c) => c.id === id))
      .filter(Boolean) as CheckpointItem[];

    // Group selected checkpoints to build locations target for calendar
    const siteObj = SITES.find((s) => s.id === siteId) || SITES[1];
    const locationNames = selectedCheckpoints.map((c) => c.name);

    const locationsPayload = [
      {
        siteId,
        siteName: siteObj.name.replace(/^Site [A-D] - /, ''),
        sector: `${selectedCheckpoints.length} Titik (${locationNames.slice(0, 2).join(', ')}${locationNames.length > 2 ? '...' : ''})`,
        selectedPosts: locationNames,
      },
    ];

    // Determine shift type for calendar display
    const mappedShiftType: 'Pagi' | 'Siang' | 'Malam' =
      name.toLowerCase().includes('malam') || startTime >= '22:00'
        ? 'Malam'
        : name.toLowerCase().includes('siang') || startTime >= '14:00'
        ? 'Siang'
        : 'Pagi';

    const shiftPayload: DateRangeShiftPayload = {
      shiftName: name,
      shiftType: mappedShiftType,
      startTime,
      endTime,
      squad,
      danru,
      locations: locationsPayload,
      startDate,
      endDate,
      requiredCount: Number(requiredCount),
      officers: assignedOfficers,
    };

    // Create schedule entries for table
    const newScheduleList: PatrolScheduleItem[] = [
      {
        id: `SCH-${startDate.replace(/-/g, '')}-${siteId.toUpperCase()}-${String(Date.now()).slice(-3)}`,
        siteId,
        siteName: siteObj.name.replace(/^Site [A-D] - /, ''),
        sector: `${selectedCheckpoints.length} Titik (${locationNames.slice(0, 2).join(', ')})`,
        squad,
        danru,
        shift: `${name} (${startTime} - ${endTime})` as any,
        routeName: `Rute Patroli ${name} (${enforceSequence ? 'Wajib Urut' : 'Fleksibel'})`,
        checkpointCount: selectedCheckpoints.length,
        frequency: `Setiap ${intervalMinutes} Menit (Toleransi ${gracePeriodMinutes}m)`,
        guardRatio: `${assignedOfficers.length}/${requiredCount} Petugas`,
        assignedCount: assignedOfficers.length,
        requiredCount: Number(requiredCount),
        status: assignedOfficers.length >= requiredCount ? 'Berjalan Aktif' : 'Terjadwal',
        date: `${startDate} s/d ${endDate}`,
      },
    ];

    onAddDateRangeScheduleAndSyncCalendar(newScheduleList, shiftPayload);

    setSuccessSaved({
      startDate,
      endDate,
      shiftName: name,
      totalDays: daysDiff,
      locationsCount: selectedLocationIds.length,
      officersCount: assignedOfficers.length,
      jsonPayload: currentJsonPayload,
    });
  };

  const filteredOfficers = availableOfficers.filter((o) => {
    if (!officerSearch.trim()) return true;
    const q = officerSearch.toLowerCase();
    return (
      o.officerName.toLowerCase().includes(q) ||
      o.role.toLowerCase().includes(q) ||
      (o.callSign && o.callSign.toLowerCase().includes(q)) ||
      (o.npp && o.npp.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header and Switcher */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#e2e8f0]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]">
              PENJADWALAN PATROLI ENTERPRISE
            </span>
            <span className="text-xs text-[#94a3b8]">/</span>
            <span className="text-xs font-semibold text-[#64748b]">Tambah Shift &amp; Konfigurasi Lokasi</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">
            Tambah Shift &amp; Pemilihan Titik Lokasi Patroli
          </h1>
          <p className="text-xs text-[#64748b] mt-1">
            Konfigurasi parameter shift (interval, toleransi, urutan patroli) serta tentukan titik-titik lokasi dari daftar lokasi aktif di sistem.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('jadwal')}
            className="px-3 py-1.5 rounded border border-[#cbd5e1] text-xs font-semibold text-[#334155] hover:bg-white flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">table_chart</span>
            <span>Daftar Jadwal</span>
          </button>
          <button
            onClick={() => onNavigate('kalender')}
            className="px-3 py-1.5 rounded border border-[#cbd5e1] text-xs font-semibold text-[#334155] hover:bg-white flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">calendar_view_week</span>
            <span>Kalender Shift</span>
          </button>
          <button
            onClick={handleCopyJson}
            className="px-3 py-1.5 rounded bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 flex items-center gap-1.5 transition-colors shadow-xs"
            title="Salin JSON Payload Shift"
          >
            <span className="material-symbols-outlined text-sm">{copiedJson ? 'check' : 'data_object'}</span>
            <span>{copiedJson ? 'Tersalin!' : 'JSON Payload'}</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successSaved && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-lg shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-emerald-600 text-2xl mt-0.5">verified</span>
            <div>
              <h3 className="text-sm font-bold text-emerald-950">
                Shift Berhasil Ditambahkan &amp; Terintegrasi ke Roster!
              </h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                <strong>{successSaved.shiftName}</strong> telah dibuat untuk{' '}
                <span className="underline font-bold">
                  {successSaved.startDate} s/d {successSaved.endDate}
                </span>{' '}
                ({successSaved.totalDays} hari operasional) mencakup {successSaved.locationsCount} titik lokasi dan {successSaved.officersCount} personel security.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigate('kalender')}
              className="px-3.5 py-1.5 rounded bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <span className="material-symbols-outlined text-sm">calendar_month</span>
              <span>Buka Kalender</span>
            </button>
            <button
              onClick={() => setSuccessSaved(null)}
              className="px-3 py-1.5 rounded bg-white text-emerald-900 border border-emerald-300 text-xs font-semibold hover:bg-emerald-100"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* 3-Step Wizard Navigation Stepper Bar */}
      <div className="bg-white border border-[#e2e8f0] rounded-lg p-3 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {/* Step 1 Tab */}
          <button
            onClick={() => setActiveStep(1)}
            className={`p-3 rounded-md text-left transition-all border flex items-center gap-3 ${
              activeStep === 1
                ? 'bg-blue-50/80 border-blue-500 shadow-xs'
                : 'border-[#e2e8f0] hover:bg-[#f8fafc]'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                activeStep === 1
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#e2e8f0] text-[#64748b]'
              }`}
            >
              1
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Langkah 1</div>
              <div className="text-xs font-bold text-[#0f172a]">Formulir Shift</div>
              <div className="text-[11px] text-[#64748b] truncate">
                {name} • {startTime}-{endTime} • {intervalMinutes}m
              </div>
            </div>
          </button>

          {/* Step 2 Tab */}
          <button
            onClick={() => {
              if (activeStep === 1) handleNextFromStep1();
              else setActiveStep(2);
            }}
            className={`p-3 rounded-md text-left transition-all border flex items-center gap-3 ${
              activeStep === 2
                ? 'bg-blue-50/80 border-blue-500 shadow-xs'
                : 'border-[#e2e8f0] hover:bg-[#f8fafc]'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                activeStep === 2
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#e2e8f0] text-[#64748b]'
              }`}
            >
              2
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Langkah 2</div>
              <div className="text-xs font-bold text-[#0f172a]">Daftar Titik Lokasi</div>
              <div className="text-[11px] text-[#64748b] truncate">
                {selectedLocationIds.length} Lokasi Terpilih {enforceSequence ? '(Urut)' : ''}
              </div>
            </div>
          </button>

          {/* Step 3 Tab */}
          <button
            onClick={() => {
              if (activeStep === 1) handleNextFromStep1();
              else if (activeStep === 2) handleNextFromStep2();
              else setActiveStep(3);
            }}
            className={`p-3 rounded-md text-left transition-all border flex items-center gap-3 ${
              activeStep === 3
                ? 'bg-blue-50/80 border-blue-500 shadow-xs'
                : 'border-[#e2e8f0] hover:bg-[#f8fafc]'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                activeStep === 3
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#e2e8f0] text-[#64748b]'
              }`}
            >
              3
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Langkah 3</div>
              <div className="text-xs font-bold text-[#0f172a]">Assign Personel &amp; Tanggal</div>
              <div className="text-[11px] text-[#64748b] truncate">
                {startDate} s/d {endDate} ({daysDiff} Hari)
              </div>
            </div>
          </button>
        </div>
      </div>

      {formError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined text-rose-600 text-base">error</span>
          <span>{formError}</span>
        </div>
      )}

      {/* ======================= STEP 1: FORMULIR TAMBAH SHIFT ======================= */}
      {activeStep === 1 && (
        <div className="space-y-6">
          <div className="bg-white border border-[#e2e8f0] rounded-lg p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#f1f5f9] gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-xl">schedule</span>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#0f172a]">
                    Langkah 1: Konfigurasi Parameter Shift
                  </h2>
                  <p className="text-xs text-[#64748b]">
                    Sesuaikan parameter: siteId, name, startTime, endTime, intervalMinutes, gracePeriodMinutes, dan enforceSequence.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200 self-start sm:self-auto">
                Tahap 1 dari 3
              </span>
            </div>

            {/* Quick Presets */}
            <div>
              <label className="block text-xs font-bold text-[#334155] mb-2">Preset Cepat Shift:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => applyPreset('Shift Pagi')}
                  className={`p-2.5 rounded border text-left transition-colors flex items-center justify-between ${
                    name === 'Shift Pagi'
                      ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500'
                      : 'border-[#cbd5e1] hover:bg-[#f8fafc]'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-[#0f172a]">Shift Pagi</div>
                    <div className="text-[10px] text-[#64748b]">07:00 - 15:00 (120m)</div>
                  </div>
                  {name === 'Shift Pagi' && (
                    <span className="material-symbols-outlined text-emerald-600 text-sm">check_circle</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('Shift Siang')}
                  className={`p-2.5 rounded border text-left transition-colors flex items-center justify-between ${
                    name === 'Shift Siang'
                      ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                      : 'border-[#cbd5e1] hover:bg-[#f8fafc]'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-[#0f172a]">Shift Siang</div>
                    <div className="text-[10px] text-[#64748b]">15:00 - 23:00 (120m)</div>
                  </div>
                  {name === 'Shift Siang' && (
                    <span className="material-symbols-outlined text-blue-600 text-sm">check_circle</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('Shift Malam')}
                  className={`p-2.5 rounded border text-left transition-colors flex items-center justify-between ${
                    name === 'Shift Malam'
                      ? 'bg-purple-50 border-purple-500 ring-1 ring-purple-500'
                      : 'border-[#cbd5e1] hover:bg-[#f8fafc]'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-[#0f172a]">Shift Malam</div>
                    <div className="text-[10px] text-[#64748b]">23:00 - 07:00 (90m)</div>
                  </div>
                  {name === 'Shift Malam' && (
                    <span className="material-symbols-outlined text-purple-600 text-sm">check_circle</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('Shift Khusus')}
                  className={`p-2.5 rounded border text-left transition-colors flex items-center justify-between ${
                    name === 'Shift Khusus'
                      ? 'bg-amber-50 border-amber-500 ring-1 ring-amber-500'
                      : 'border-[#cbd5e1] hover:bg-[#f8fafc]'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-[#0f172a]">Shift Khusus</div>
                    <div className="text-[10px] text-[#64748b]">08:00 - 17:00 (60m)</div>
                  </div>
                  {name === 'Shift Khusus' && (
                    <span className="material-symbols-outlined text-amber-600 text-sm">check_circle</span>
                  )}
                </button>
              </div>
            </div>

            {/* FORM INPUTS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              {/* Field: siteId */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#334155] flex items-center gap-1.5">
                    <span className="font-mono text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[11px]">siteId</span>
                    <span>ID Fasilitas Operasional <span className="text-rose-500">*</span></span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setCustomSiteIdMode(!customSiteIdMode)}
                    className="text-[10px] text-blue-600 hover:underline"
                  >
                    {customSiteIdMode ? 'Gunakan Pilihan Dropdown' : 'Ketik Manual ID'}
                  </button>
                </div>
                {customSiteIdMode ? (
                  <input
                    type="text"
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                    placeholder="Contoh: site-a atau custom-site-101"
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded text-xs bg-white text-[#0f172a] font-mono focus:outline-hidden focus:border-[#2563eb]"
                  />
                ) : (
                  <select
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded text-xs bg-white text-[#0f172a] focus:outline-hidden focus:border-[#2563eb]"
                  >
                    {SITES.filter((s) => s.id !== 'all').map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.id} — {site.name} ({site.code})
                      </option>
                    ))}
                  </select>
                )}
                <span className="text-[10px] text-[#64748b] mt-0.5 block">
                  Identifier unik site tempat shift berlangsung.
                </span>
              </div>

              {/* Field: name */}
              <div>
                <label className="text-xs font-bold text-[#334155] mb-1 flex items-center gap-1.5">
                  <span className="font-mono text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[11px]">name</span>
                  <span>Nama Shift <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Shift Pagi, Shift Siang, Shift Malam"
                  className="w-full px-3 py-2 border border-[#cbd5e1] rounded text-xs bg-white text-[#0f172a] focus:outline-hidden focus:border-[#2563eb]"
                />
                <span className="text-[10px] text-[#64748b] mt-0.5 block">
                  Label nama shift operasional security.
                </span>
              </div>

              {/* Fields: startTime & endTime */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#334155] mb-1 flex items-center gap-1.5">
                    <span className="font-mono text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[11px]">startTime</span>
                    <span>Jam Mulai <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded text-xs bg-white text-[#0f172a] focus:outline-hidden focus:border-[#2563eb]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#334155] mb-1 flex items-center gap-1.5">
                    <span className="font-mono text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[11px]">endTime</span>
                    <span>Jam Selesai <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded text-xs bg-white text-[#0f172a] focus:outline-hidden focus:border-[#2563eb]"
                  />
                </div>
              </div>

              {/* Field: intervalMinutes */}
              <div>
                <label className="text-xs font-bold text-[#334155] mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="font-mono text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[11px]">intervalMinutes</span>
                    <span>Interval Putaran (Menit) <span className="text-rose-500">*</span></span>
                  </span>
                  <span className="text-[11px] font-bold text-blue-700">{intervalMinutes} Menit ({Math.round((intervalMinutes / 60) * 10) / 10} Jam)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={15}
                    max={480}
                    step={15}
                    value={intervalMinutes}
                    onChange={(e) => setIntervalMinutes(Math.max(1, Number(e.target.value)))}
                    className="w-28 px-3 py-2 border border-[#cbd5e1] rounded text-xs bg-white text-[#0f172a] font-mono focus:outline-hidden focus:border-[#2563eb]"
                  />
                  <div className="flex flex-wrap gap-1">
                    {[60, 90, 120, 180].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setIntervalMinutes(val)}
                        className={`px-2 py-1 rounded text-[10px] font-medium border transition-colors ${
                          intervalMinutes === val
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-[#475569] border-[#cbd5e1] hover:bg-[#f1f5f9]'
                        }`}
                      >
                        {val}m
                      </button>
                    ))}
                  </div>
                </div>
                <span className="text-[10px] text-[#64748b] mt-0.5 block">
                  Jeda waktu antara setiap putaran keliling patroli.
                </span>
              </div>

              {/* Field: gracePeriodMinutes */}
              <div>
                <label className="text-xs font-bold text-[#334155] mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="font-mono text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[11px]">gracePeriodMinutes</span>
                    <span>Batas Toleransi / Grace (Menit) <span className="text-rose-500">*</span></span>
                  </span>
                  <span className="text-[11px] font-bold text-amber-700">{gracePeriodMinutes} Menit Toleransi</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={120}
                    step={5}
                    value={gracePeriodMinutes}
                    onChange={(e) => setGracePeriodMinutes(Math.max(0, Number(e.target.value)))}
                    className="w-28 px-3 py-2 border border-[#cbd5e1] rounded text-xs bg-white text-[#0f172a] font-mono focus:outline-hidden focus:border-[#2563eb]"
                  />
                  <div className="flex flex-wrap gap-1">
                    {[15, 30, 45, 60].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setGracePeriodMinutes(val)}
                        className={`px-2 py-1 rounded text-[10px] font-medium border transition-colors ${
                          gracePeriodMinutes === val
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-white text-[#475569] border-[#cbd5e1] hover:bg-[#f1f5f9]'
                        }`}
                      >
                        {val}m
                      </button>
                    ))}
                  </div>
                </div>
                <span className="text-[10px] text-[#64748b] mt-0.5 block">
                  Waktu toleransi keterlambatan scan sebelum dicatat sebagai anomali / terlambat.
                </span>
              </div>

              {/* Field: enforceSequence (Boolean Switch) */}
              <div className="md:col-span-2 p-3.5 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[11px]">enforceSequence</span>
                    <span className="text-xs font-bold text-[#0f172a]">Wajib Urut Sesuai Urutan Checkpoint</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        enforceSequence
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {enforceSequence ? 'true (Ketat Berurutan)' : 'false (Bebas Fleksibel)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748b]">
                    Jika diaktifkan (<code className="font-mono text-purple-700">true</code>), petugas wajib melakukan tap NFC/RFID titik patroli berurutan (#1 ➔ #2 ➔ #3). Jika tidak, sistem mencatat scan loncat titik.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={enforceSequence}
                    onChange={(e) => setEnforceSequence(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {/* Operational Squad & Danru info */}
              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1">
                  Regu Pengamanan &amp; Komandan (Danru)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={squad}
                    onChange={(e) => {
                      setSquad(e.target.value);
                      if (e.target.value.includes('Alpha')) setDanru('Ahmad Fauzi');
                      else if (e.target.value.includes('Bravo')) setDanru('Bambang Sudrajat');
                      else if (e.target.value.includes('Charlie')) setDanru('Wahyu Hidayat');
                      else if (e.target.value.includes('Delta')) setDanru('Joko Susilo');
                    }}
                    className="w-full px-2.5 py-2 border border-[#cbd5e1] rounded text-xs bg-white text-[#0f172a]"
                  >
                    <option value="Regu Alpha">Regu Alpha</option>
                    <option value="Regu Bravo">Regu Bravo</option>
                    <option value="Regu Charlie">Regu Charlie</option>
                    <option value="Regu Delta">Regu Delta</option>
                  </select>
                  <input
                    type="text"
                    value={danru}
                    onChange={(e) => setDanru(e.target.value)}
                    placeholder="Nama Danru"
                    className="w-full px-2.5 py-2 border border-[#cbd5e1] rounded text-xs bg-white text-[#0f172a]"
                  />
                </div>
              </div>

              {/* Target Personnel */}
              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1">
                  Target Kuota Petugas &amp; Catatan SOP
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={requiredCount}
                    onChange={(e) => setRequiredCount(Math.max(1, Number(e.target.value)))}
                    className="w-full px-2.5 py-2 border border-[#cbd5e1] rounded text-xs bg-white text-[#0f172a]"
                    title="Jumlah personel"
                  />
                  <input
                    type="text"
                    value={shiftNotes}
                    onChange={(e) => setShiftNotes(e.target.value)}
                    className="col-span-2 w-full px-2.5 py-2 border border-[#cbd5e1] rounded text-xs bg-white text-[#0f172a]"
                    placeholder="Catatan instruksi patroli"
                  />
                </div>
              </div>
            </div>

            {/* Live JSON Payload Preview Box */}
            <div className="pt-2">
              <div className="rounded-lg bg-slate-900 border border-slate-800 p-4 text-white">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-400 text-sm">data_object</span>
                    <span className="text-xs font-bold text-slate-200">Pratinjau JSON Schema (Sesuai Spesifikasi)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyJson}
                    className="text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono flex items-center gap-1 border border-slate-700"
                  >
                    <span className="material-symbols-outlined text-xs">{copiedJson ? 'check' : 'content_copy'}</span>
                    <span>{copiedJson ? 'Tersalin' : 'Salin JSON'}</span>
                  </button>
                </div>
                <pre className="text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                  {currentJsonPayload}
                </pre>
              </div>
            </div>

            {/* Step 1 Actions */}
            <div className="pt-4 border-t border-[#f1f5f9] flex justify-end">
              <button
                type="button"
                onClick={handleNextFromStep1}
                className="px-5 py-2.5 rounded bg-[#2563eb] text-white text-xs font-bold hover:bg-[#1d4ed8] shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <span>Lanjut ke Langkah 2: Tentukan Titik Lokasi</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= STEP 2: LIST LOKASI-LOKASI YANG ADA (BUKAN PER SITE) ======================= */}
      {activeStep === 2 && (
        <div className="bg-white border border-[#e2e8f0] rounded-lg p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#f1f5f9] gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-xl">pin_drop</span>
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#0f172a]">
                  Langkah 2: Tentukan Lokasi Patroli (Daftar Titik Checkpoint)
                </h2>
                <p className="text-xs text-[#64748b]">
                  Pilih titik-titik lokasi yang ada di sistem (bukan per-site). Tentukan titik mana saja yang termasuk dalam putaran shift ini.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200">
                Tahap 2 dari 3
              </span>
              <span
                className={`px-2 py-1 rounded text-xs font-bold ${
                  enforceSequence
                    ? 'bg-purple-100 text-purple-800 border border-purple-300'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {enforceSequence ? 'Urutan Patroli Ketat' : 'Urutan Bebas'}
              </span>
            </div>
          </div>

          {/* Search, Filter & Quick Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#f8fafc] p-3 rounded-lg border border-[#e2e8f0]">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <span className="material-symbols-outlined absolute left-2.5 top-2 text-[#94a3b8] text-sm">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Cari nama lokasi, ID (CP-...), lantai, atau tag NFC..."
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-[#cbd5e1] rounded text-xs bg-white text-[#0f172a] focus:outline-hidden focus:border-[#2563eb]"
                />
              </div>
            </div>

            {/* Site tag filter tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-[#64748b] mr-1">Filter Wilayah:</span>
              <button
                type="button"
                onClick={() => setLocationSiteFilter('all')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                  locationSiteFilter === 'all'
                    ? 'bg-blue-600 text-white border-blue-600 font-bold'
                    : 'bg-white text-[#475569] border-[#cbd5e1] hover:bg-[#f1f5f9]'
                }`}
              >
                Semua Lokasi ({CHECKPOINTS.length})
              </button>
              {SITES.filter((s) => s.id !== 'all').map((site) => (
                <button
                  key={site.id}
                  type="button"
                  onClick={() => setLocationSiteFilter(site.id)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                    locationSiteFilter === site.id
                      ? 'bg-blue-600 text-white border-blue-600 font-bold'
                      : 'bg-white text-[#475569] border-[#cbd5e1] hover:bg-[#f1f5f9]'
                  }`}
                >
                  {site.code}
                </button>
              ))}
            </div>

            {/* Quick Bulk Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleSelectAllLocations}
                className="px-2.5 py-1 rounded bg-white border border-[#cbd5e1] text-[11px] font-semibold text-[#334155] hover:bg-[#f1f5f9]"
              >
                Pilih Semua
              </button>
              <button
                type="button"
                onClick={handleClearAllLocations}
                className="px-2.5 py-1 rounded bg-white border border-[#cbd5e1] text-[11px] font-semibold text-rose-600 hover:bg-rose-50"
              >
                Kosongkan
              </button>
            </div>
          </div>

          {/* Location Selection Counter & Sequence Indicator */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-950">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 text-base">check_box</span>
              <span>
                <strong>{selectedLocationIds.length}</strong> titik lokasi dipilih untuk <strong>{name}</strong>
              </span>
            </div>
            {enforceSequence && (
              <div className="flex items-center gap-1.5 text-purple-900 font-semibold text-[11px]">
                <span className="material-symbols-outlined text-purple-700 text-sm">format_list_numbered</span>
                <span>Gunakan tombol panah (↑ / ↓) pada kartu lokasi untuk mengatur urutan patroli.</span>
              </div>
            )}
          </div>

          {/* LIST LOKASI (Individual Checkpoints) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[560px] overflow-y-auto pr-1 [scrollbar-width:thin]">
            {filteredLocations.map((cp) => {
              const isSelected = selectedLocationIds.includes(cp.id);
              const sequenceIndex = selectedLocationIds.indexOf(cp.id);

              return (
                <div
                  key={cp.id}
                  onClick={() => handleToggleLocation(cp.id)}
                  className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'bg-blue-50/40 border-blue-500 shadow-xs ring-1 ring-blue-500/30'
                      : 'bg-white border-[#e2e8f0] hover:bg-[#f8fafc]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleLocation(cp.id)}
                          className="w-4 h-4 text-blue-600 rounded border-[#cbd5e1] focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-[#0f172a]">{cp.name}</h4>
                          {isSelected && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-600 text-white font-mono">
                              #{sequenceIndex + 1}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#64748b] mt-0.5">
                          {cp.zoneFloor} • <span className="font-semibold text-slate-700">{cp.siteName}</span>
                        </div>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 shrink-0">
                      {cp.id}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#64748b] pt-2 border-t border-[#f1f5f9]">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-xs text-blue-600">nfc</span>
                      <span>{cp.tagType}</span>
                      <span className="text-slate-400">•</span>
                      <span className="font-mono">{cp.tagUid}</span>
                    </div>

                    {/* Sequence controls if selected and enforceSequence */}
                    {isSelected && (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          disabled={sequenceIndex === 0}
                          onClick={() => handleMoveLocation(cp.id, 'up')}
                          className="p-1 rounded hover:bg-blue-100 disabled:opacity-30 disabled:hover:bg-transparent text-blue-700"
                          title="Pindahkan urutan lebih awal"
                        >
                          <span className="material-symbols-outlined text-sm">arrow_upward</span>
                        </button>
                        <button
                          type="button"
                          disabled={sequenceIndex === selectedLocationIds.length - 1}
                          onClick={() => handleMoveLocation(cp.id, 'down')}
                          className="p-1 rounded hover:bg-blue-100 disabled:opacity-30 disabled:hover:bg-transparent text-blue-700"
                          title="Pindahkan urutan lebih akhir"
                        >
                          <span className="material-symbols-outlined text-sm">arrow_downward</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sequence Flow summary if checkpoints selected */}
          {selectedLocationIds.length > 0 && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-blue-600">alt_route</span>
                  <span>Alur Urutan Checkpoint Terpilih ({selectedLocationIds.length} Titik)</span>
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {enforceSequence ? 'Wajib Urut (Enforced)' : 'Bebas Urut'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {selectedLocationIds.map((id, idx) => {
                  const cp = CHECKPOINTS.find((c) => c.id === id);
                  return (
                    <div
                      key={id}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white border border-slate-300 text-[10px] text-slate-800 shadow-2xs"
                    >
                      <span className="w-4 h-4 rounded-full bg-blue-600 text-white font-bold text-[9px] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-semibold truncate max-w-[140px]">{cp?.name || id}</span>
                      {idx < selectedLocationIds.length - 1 && (
                        <span className="text-slate-400 font-bold ml-1">➔</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2 Actions */}
          <div className="pt-4 border-t border-[#f1f5f9] flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActiveStep(1)}
              className="px-4 py-2 border border-[#cbd5e1] rounded text-xs font-semibold text-[#475569] hover:bg-[#f8fafc] flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Kembali ke Langkah 1: Form Shift</span>
            </button>
            <button
              type="button"
              onClick={handleNextFromStep2}
              className="px-5 py-2.5 rounded bg-[#2563eb] text-white text-xs font-bold hover:bg-[#1d4ed8] shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <span>Lanjut ke Langkah 3: Assign Personel &amp; Tanggal</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================= STEP 3: ASSIGN SECURITY & RENTANG TANGGAL ======================= */}
      {activeStep === 3 && (
        <form onSubmit={handleFinalSubmit} className="space-y-6">
          <div className="bg-white border border-[#e2e8f0] rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#f1f5f9] gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-xl">date_range</span>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#0f172a]">
                    Langkah 3: Tentukan Rentang Tanggal &amp; Assign Personel Security
                  </h2>
                  <p className="text-xs text-[#64748b]">
                    Tentukan tanggal mulai dan selesai. Shift ini akan otomatis didistribusikan ke setiap hari di rentang tersebut pada Kalender Shift.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200 self-start sm:self-auto">
                Tahap 3 dari 3
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg bg-[#f8fafc] border border-[#e2e8f0]">
              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1">
                  Tanggal Mulai Penugasan <span className="text-rose-500">*</span>
                </label>
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
                <label className="block text-xs font-bold text-[#334155] mb-1">
                  Tanggal Selesai Penugasan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  min="2025-05-01"
                  max="2025-05-31"
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-[#cbd5e1] rounded text-xs bg-white text-[#0f172a] focus:outline-hidden focus:border-[#2563eb]"
                />
              </div>

              <div className="flex flex-col justify-center">
                <span className="text-xs font-bold text-[#334155] mb-1">Total Hari Terjadwal:</span>
                <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900 font-bold flex items-center justify-between">
                  <span>{daysDiff} Hari Berturut-turut</span>
                  <span className="text-[10px] text-blue-700 font-normal">Sinkron ke Kalender</span>
                </div>
              </div>
            </div>
          </div>

          {/* Roster Assignment Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pool Petugas Tersedia */}
            <div className="lg:col-span-1 bg-white border border-[#e2e8f0] rounded-lg p-4 shadow-xs flex flex-col h-[520px]">
              <div className="flex items-center justify-between pb-2 border-b border-[#f1f5f9] mb-3">
                <div>
                  <h3 className="text-xs font-bold text-[#0f172a]">Daftar Security Tersedia</h3>
                  <span className="text-[10px] text-[#64748b]">Pilih personel untuk shift ini</span>
                </div>
                <button
                  type="button"
                  onClick={handleAutoFillSquad}
                  className="text-[10px] text-[#2563eb] font-bold hover:underline bg-blue-50 px-2 py-1 rounded border border-blue-200"
                >
                  ⚡ Auto-Assign {squad}
                </button>
              </div>

              <div className="relative mb-3">
                <span className="material-symbols-outlined absolute left-2.5 top-2 text-[#94a3b8] text-sm">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Cari nama, NPP, atau callsign..."
                  value={officerSearch}
                  onChange={(e) => setOfficerSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-[#cbd5e1] rounded text-xs text-[#0f172a]"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 [scrollbar-width:thin]">
                {filteredOfficers.map((officer) => {
                  const isAssigned = assignedOfficers.some((o) => o.officerId === officer.officerId);
                  return (
                    <div
                      key={officer.officerId}
                      onClick={() => handleToggleOfficer(officer)}
                      className={`p-2.5 rounded border text-xs cursor-pointer transition-colors flex items-center justify-between ${
                        isAssigned
                          ? 'bg-blue-50/70 border-blue-400'
                          : 'bg-white border-[#e2e8f0] hover:bg-[#f8fafc]'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-[#0f172a] truncate">{officer.officerName}</div>
                        <div className="text-[10px] text-[#64748b] truncate">
                          {officer.role} • {officer.callSign || officer.npp}
                        </div>
                      </div>
                      <span
                        className={`material-symbols-outlined text-base shrink-0 ${
                          isAssigned ? 'text-[#2563eb]' : 'text-[#cbd5e1]'
                        }`}
                      >
                        {isAssigned ? 'check_circle' : 'add_circle'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Personel Yang Di-assign & Plotting Pos */}
            <div className="lg:col-span-2 bg-white border border-[#e2e8f0] rounded-lg p-4 shadow-xs flex flex-col h-[520px]">
              <div className="flex items-center justify-between pb-2 border-b border-[#f1f5f9] mb-3">
                <div>
                  <h3 className="text-xs font-bold text-[#0f172a]">
                    Personel Bertugas &amp; Plotting Pos Jaga ({assignedOfficers.length} Personel)
                  </h3>
                  <span className="text-[10px] text-[#64748b]">
                    Target Kuota: {requiredCount} Petugas ({assignedOfficers.length >= requiredCount ? 'Terpenuhi' : 'Kurang'})
                  </span>
                </div>
                {assignedOfficers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setAssignedOfficers([])}
                    className="text-[10px] text-rose-600 hover:underline"
                  >
                    Kosongkan Semua
                  </button>
                )}
              </div>

              {assignedOfficers.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-[#94a3b8]">
                  <span className="material-symbols-outlined text-4xl mb-2 text-[#cbd5e1]">shield_person</span>
                  <p className="text-xs font-medium">Belum ada security yang di-assign.</p>
                  <p className="text-[11px] mt-1">Pilih dari daftar di sebelah kiri atau klik tombol Auto-Assign.</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 [scrollbar-width:thin]">
                  {assignedOfficers.map((officer, index) => (
                    <div
                      key={officer.officerId}
                      className="p-3 rounded-lg border border-[#e2e8f0] bg-[#fafafa] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#101b35] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-bold text-[#0f172a]">{officer.officerName}</div>
                          <div className="text-[10px] text-[#64748b]">
                            {officer.role} | {officer.callSign || officer.npp}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-1 md:max-w-xs">
                        <select
                          value={officer.post}
                          onChange={(e) => handleUpdateOfficerPost(officer.officerId, e.target.value)}
                          className="w-full px-2 py-1.5 border border-[#cbd5e1] rounded text-[11px] bg-white text-[#0f172a]"
                        >
                          {POST_OPTIONS.map((post) => (
                            <option key={post} value={post}>
                              {post}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleToggleOfficer(officer)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                          title="Hapus Petugas"
                        >
                          <span className="material-symbols-outlined text-base">close</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Ringkasan Keseluruhan Sebelum Simpan */}
              <div className="pt-3 border-t border-[#f1f5f9] mt-3 bg-blue-50/50 p-3 rounded text-[11px] text-blue-900 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <strong>Ringkasan Eksekusi:</strong> Shift <strong>{name}</strong> ({startTime}-{endTime}) •{' '}
                  <strong>{selectedLocationIds.length} Titik Lokasi</strong> • Interval <strong>{intervalMinutes}m</strong> (Grace {gracePeriodMinutes}m) •{' '}
                  Urutan <strong>{enforceSequence ? 'Ketat (Wajib Urut)' : 'Bebas Fleksibel'}</strong> •{' '}
                  Rentang <strong>{startDate} s/d {endDate}</strong> ({daysDiff} Hari) •{' '}
                  <strong>{assignedOfficers.length} Personel</strong>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveStep(2)}
                    className="px-3 py-1.5 border border-[#cbd5e1] rounded text-xs font-semibold text-[#475569] hover:bg-white"
                  >
                    Kembali ke Lokasi
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs flex items-center gap-1.5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">save</span>
                    <span>Simpan &amp; Sinkronkan ke Kalender</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
