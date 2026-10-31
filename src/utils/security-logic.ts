export interface PatrolSchedule {
  id: string;
  siteId: string;
  squad: string;
  shift: 'Pagi' | 'Siang' | 'Malam';
  startTime: string;
  endTime: string;
  requiredGuards: number;
  assignedGuards: number;
}

export interface CheckpointScan {
  checkpointId: string;
  scannedAt: string;
  expectedOrder: number;
  status: 'valid' | 'skipped' | 'delayed';
}

export interface SecurityIncident {
  id: string;
  severity: 'Kritis' | 'Tinggi' | 'Sedang' | 'Rendah';
  reportedAt: string;
  resolvedAt?: string;
  requiresRapidResponse: boolean;
}

export interface SecuritySquad {
  id: string;
  name: string;
  danru: string;
  siteId: string;
  siteName: string;
  shiftDefault: 'Pagi' | 'Siang' | 'Malam';
  memberCount: number;
  status: 'Siaga' | 'Bertugas' | 'Off / Libur';
  contactRadio: string;
}

/**
 * Calculates patrol compliance percentage based on completed vs scheduled checkpoints
 */
export function calculateCompliance(completed: number, scheduled: number): number {
  if (scheduled <= 0) return 100;
  if (completed <= 0) return 0;
  const rate = (completed / scheduled) * 100;
  return Math.min(100, Math.round(rate * 10) / 10);
}

/**
 * Determines whether a schedule has a staffing shortage
 */
export function evaluateStaffingStatus(schedule: PatrolSchedule): {
  status: 'lengkap' | 'kurang' | 'kritis';
  missingGuards: number;
} {
  const diff = schedule.requiredGuards - schedule.assignedGuards;
  if (diff <= 0) return { status: 'lengkap', missingGuards: 0 };
  if (diff === 1) return { status: 'kurang', missingGuards: 1 };
  return { status: 'kritis', missingGuards: diff };
}

/**
 * Validates NFC UID format (standard 4-byte or 7-byte hex string: XX:XX:XX:XX or with hyphens)
 */
export function isValidNfcUid(uid: string): boolean {
  if (!uid) return false;
  const cleanUid = uid.trim().toUpperCase();
  const hexPattern = /^([0-9A-F]{2}[:\-]){3,6}[0-9A-F]{2}$/;
  return hexPattern.test(cleanUid);
}

/**
 * Validates Squad/Regu registration data
 */
export function validateSquadData(squad: {
  name: string;
  danru: string;
  memberCount: number;
}): { valid: boolean; error?: string } {
  if (!squad.name || squad.name.trim().length < 3) {
    return { valid: false, error: 'Nama regu minimal 3 karakter' };
  }
  if (!squad.danru || squad.danru.trim().length < 3) {
    return { valid: false, error: 'Nama Komandan Regu (Danru) wajib diisi' };
  }
  if (!squad.memberCount || squad.memberCount < 1) {
    return { valid: false, error: 'Jumlah personel minimal 1 orang' };
  }
  return { valid: true };
}

/**
 * Calculates incident response urgency and required dispatch units
 */
export function evaluateIncidentDispatch(incident: SecurityIncident): {
  urgencyLevel: 'IMMEDIATE' | 'HIGH' | 'ROUTINE';
  dispatchRecommendation: string;
} {
  if (incident.severity === 'Kritis' || incident.requiresRapidResponse) {
    return {
      urgencyLevel: 'IMMEDIATE',
      dispatchRecommendation: 'Kerahkan TRC (Tim Reaksi Cepat) Posko Utama dan hubungi Otoritas Eksternal',
    };
  }
  if (incident.severity === 'Tinggi') {
    return {
      urgencyLevel: 'HIGH',
      dispatchRecommendation: 'Kerahkan Danru Sektor & 2 Petugas Pengawal Pos Terdekat',
    };
  }
  return {
    urgencyLevel: 'ROUTINE',
    dispatchRecommendation: 'Catat pada Log Patroli dan jadwalkan tindak lanjut teknisi shift berikut',
  };
}

/**
 * Filter items by Indonesian site query
 */
export function filterBySite<T extends { siteId?: string; site?: string }>(
  items: T[],
  selectedSite: string
): T[] {
  if (!selectedSite || selectedSite === 'all' || selectedSite === 'Semua Area (Site)') {
    return items;
  }
  return items.filter(
    (item) =>
      item.siteId === selectedSite ||
      (item.site && item.site.toLowerCase().includes(selectedSite.toLowerCase()))
  );
}

/**
 * Detaches (unassigns) the connection between a Checkpoint and an NFC Tag
 */
export function unassignNfcCheckpointConnection(
  checkpoint: { id: string; name: string; tagUid: string; tagType: string; status: string },
  tag?: { uid: string; linkedCheckpointId: string; linkedCheckpointName: string; status: string }
): {
  updatedCheckpoint: { id: string; name: string; tagUid: string; tagType: string; status: string };
  updatedTag?: { uid: string; linkedCheckpointId: string; linkedCheckpointName: string; status: string };
} {
  const updatedCheckpoint = {
    ...checkpoint,
    tagUid: '',
    tagType: 'Tanpa Tag (Unassigned)',
    status: 'Belum Terhubung Tag',
  };

  const updatedTag = tag
    ? {
        ...tag,
        linkedCheckpointId: '',
        linkedCheckpointName: 'Belum Ditautkan (Unassigned)',
        status: 'Belum Ditautkan',
      }
    : undefined;

  return { updatedCheckpoint, updatedTag };
}

/**
 * Connects (assigns) a Checkpoint to an NFC Tag
 */
export function assignNfcCheckpointConnection(
  checkpoint: { id: string; name: string; tagUid: string; tagType: string; status: string },
  tag: { uid: string; type: string; linkedCheckpointId: string; linkedCheckpointName: string; status: string }
): {
  updatedCheckpoint: { id: string; name: string; tagUid: string; tagType: string; status: string };
  updatedTag: { uid: string; type: string; linkedCheckpointId: string; linkedCheckpointName: string; status: string };
} {
  const updatedCheckpoint = {
    ...checkpoint,
    tagUid: tag.uid,
    tagType: tag.type.includes('RFID') ? 'RFID UHF' : 'NFC NTAG213',
    status: 'Aktif Normal',
  };

  const updatedTag = {
    ...tag,
    linkedCheckpointId: checkpoint.id,
    linkedCheckpointName: checkpoint.name,
    status: 'Terkoneksi Normal',
  };

  return { updatedCheckpoint, updatedTag };
}

export interface ShiftOfficerAssignment {
  officerId: string;
  officerName: string;
  role: string;
  post: string;
  npp?: string;
  callSign?: string;
  phone?: string;
}

export interface CalendarShiftItem {
  id?: string;
  type: 'Pagi' | 'Siang' | 'Malam';
  squad: string;
  danru: string;
  count: number;
  required: number;
  sector?: string;
  siteName?: string;
  officers?: ShiftOfficerAssignment[];
}

export interface DayShift {
  day: number;
  dateStr: string;
  isToday?: boolean;
  shifts: CalendarShiftItem[];
}

/**
 * Validates a shift schedule submission
 */
export function validateShiftSchedule(input: {
  shiftType: string;
  squad: string;
  danru: string;
  requiredCount: number;
}): { valid: boolean; error?: string } {
  if (!['Pagi', 'Siang', 'Malam'].includes(input.shiftType)) {
    return { valid: false, error: 'Jenis shift tidak valid (Pilih: Pagi, Siang/Sore, atau Malam)' };
  }
  if (!input.squad || input.squad.trim().length < 2) {
    return { valid: false, error: 'Pilih atau masukkan regu pengamanan' };
  }
  if (!input.danru || input.danru.trim().length < 2) {
    return { valid: false, error: 'Komandan Regu (Danru) wajib diisi' };
  }
  if (!input.requiredCount || input.requiredCount < 1) {
    return { valid: false, error: 'Kebutuhan personel minimal 1 orang' };
  }
  return { valid: true };
}

/**
 * Synchronizes a newly scheduled shift with assigned security officers into the calendar days array
 */
export function syncShiftToCalendarDays(
  calendarDays: (DayShift | null)[],
  payload: {
    day: number;
    dateStr?: string;
    shift: CalendarShiftItem;
  }
): (DayShift | null)[] {
  return calendarDays.map((item) => {
    if (!item || item.day !== payload.day) return item;

    const existingShiftIndex = item.shifts.findIndex((s) => s.type === payload.shift.type);
    let updatedShifts: CalendarShiftItem[];

    if (existingShiftIndex >= 0) {
      // Merge / update existing shift for that time slot
      updatedShifts = item.shifts.map((s, idx) => {
        if (idx === existingShiftIndex) {
          const mergedOfficers = payload.shift.officers || s.officers || [];
          return {
            ...s,
            squad: payload.shift.squad || s.squad,
            danru: payload.shift.danru || s.danru,
            required: payload.shift.required || s.required,
            sector: payload.shift.sector || s.sector,
            siteName: payload.shift.siteName || s.siteName,
            officers: mergedOfficers,
            count: mergedOfficers.length,
          };
        }
        return s;
      });
    } else {
      // Append as new shift for this day
      updatedShifts = [...item.shifts, payload.shift];
    }

    return {
      ...item,
      shifts: updatedShifts,
    };
  });
}

/**
 * Assigns an individual security officer to a day's shift
 */
export function assignOfficerToDayShift(
  calendarDays: (DayShift | null)[],
  day: number,
  shiftType: 'Pagi' | 'Siang' | 'Malam',
  officer: ShiftOfficerAssignment
): (DayShift | null)[] {
  return calendarDays.map((item) => {
    if (!item || item.day !== day) return item;

    const updatedShifts = item.shifts.map((s) => {
      if (s.type === shiftType) {
        const currentOfficers = s.officers || [];
        const exists = currentOfficers.some((o) => o.officerId === officer.officerId);
        const newOfficers = exists
          ? currentOfficers.map((o) => (o.officerId === officer.officerId ? officer : o))
          : [...currentOfficers, officer];
        return {
          ...s,
          officers: newOfficers,
          count: newOfficers.length,
        };
      }
      return s;
    });

    return {
      ...item,
      shifts: updatedShifts,
    };
  });
}

/**
 * Unassigns an individual security officer from a day's shift
 */
export function unassignOfficerFromDayShift(
  calendarDays: (DayShift | null)[],
  day: number,
  shiftType: 'Pagi' | 'Siang' | 'Malam',
  officerId: string
): (DayShift | null)[] {
  return calendarDays.map((item) => {
    if (!item || item.day !== day) return item;

    const updatedShifts = item.shifts.map((s) => {
      if (s.type === shiftType) {
        const currentOfficers = s.officers || [];
        const newOfficers = currentOfficers.filter((o) => o.officerId !== officerId);
        return {
          ...s,
          officers: newOfficers,
          count: newOfficers.length,
        };
      }
      return s;
    });

    return {
      ...item,
      shifts: updatedShifts,
    };
  });
}

/**
 * Generates an array of ISO date strings (YYYY-MM-DD) inclusive between startDate and endDate
 */
export function getDatesInRange(startDate: string, endDate: string): string[] {
  if (!startDate || !endDate) return [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return [startDate];
  }

  const dates: string[] = [];
  const current = new Date(start);
  while (current <= end) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export interface ShiftLocationTarget {
  siteId: string;
  siteName: string;
  sector: string;
  selectedPosts: string[];
}

export interface DateRangeShiftPayload {
  shiftName: string;
  shiftType: 'Pagi' | 'Siang' | 'Malam';
  startTime: string;
  endTime: string;
  squad: string;
  danru: string;
  locations: ShiftLocationTarget[];
  startDate: string;
  endDate: string;
  requiredCount: number;
  officers: ShiftOfficerAssignment[];
}

/**
 * Applies a shift configuration across a date range to the calendar days array
 */
export function applyDateRangeShiftToCalendar(
  calendarDays: (DayShift | null)[],
  payload: DateRangeShiftPayload
): (DayShift | null)[] {
  const dateList = getDatesInRange(payload.startDate, payload.endDate);
  const locationsLabel = payload.locations.map((l) => l.siteName).join(', ');
  const sectorLabel = payload.locations.map((l) => l.sector).join(' & ');

  let currentDays = [...calendarDays];

  for (const dateStr of dateList) {
    const dayNumber = parseInt(dateStr.split('-')[2], 10);
    if (!dayNumber) continue;

    const shiftItem: CalendarShiftItem = {
      type: payload.shiftType,
      squad: payload.squad,
      danru: payload.danru,
      count: payload.officers.length,
      required: payload.requiredCount,
      sector: sectorLabel || 'Multi-Lokasi Patroli',
      siteName: locationsLabel || 'Area Penugasan',
      officers: payload.officers,
    };

    currentDays = syncShiftToCalendarDays(currentDays, {
      day: dayNumber,
      dateStr,
      shift: shiftItem,
    });
  }

  return currentDays;
}

export interface ShiftSwapRecord {
  id: string;
  dateStr: string;
  officerA: {
    officerId: string;
    officerName: string;
    shiftType: 'Pagi' | 'Siang' | 'Malam';
    post: string;
  };
  officerB: {
    officerId: string;
    officerName: string;
    shiftType: 'Pagi' | 'Siang' | 'Malam';
    post: string;
  };
  reason: string;
  status: 'Disetujui & Aktif' | 'Menunggu Verifikasi Danru';
  createdAt: string;
  approvedBy: string;
}

/**
 * Swaps two officers on a specific date in the calendar
 */
export function swapOfficersOnDate(
  calendarDays: (DayShift | null)[],
  swapRequest: {
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
  }
): {
  updatedCalendarDays: (DayShift | null)[];
  success: boolean;
  message: string;
} {
  const dayNumber = parseInt(swapRequest.dateStr.split('-')[2], 10);
  const dayIndex = calendarDays.findIndex((d) => d && d.day === dayNumber);

  if (dayIndex < 0 || !calendarDays[dayIndex]) {
    return {
      updatedCalendarDays: calendarDays,
      success: false,
      message: `Tanggal ${swapRequest.dateStr} tidak ditemukan dalam kalender operasional.`,
    };
  }

  const targetDay = calendarDays[dayIndex]!;
  const shiftA = targetDay.shifts.find((s) => s.type === swapRequest.shiftTypeA);
  const shiftB = targetDay.shifts.find((s) => s.type === swapRequest.shiftTypeB);

  if (!shiftA || !shiftB) {
    return {
      updatedCalendarDays: calendarDays,
      success: false,
      message: `Shift ${swapRequest.shiftTypeA} atau ${swapRequest.shiftTypeB} tidak ditemukan pada tanggal tersebut.`,
    };
  }

  // Find existing assignments
  const existingA = (shiftA.officers || []).find((o) => o.officerId === swapRequest.officerAId);
  const existingB = (shiftB.officers || []).find((o) => o.officerId === swapRequest.officerBId);

  const postForB = existingA?.post || swapRequest.postA || 'Pos Jaga';
  const postForA = existingB?.post || swapRequest.postB || 'Pos Jaga';

  // Officer A moves to Shift B
  const newOfficerAInShiftB: ShiftOfficerAssignment = {
    officerId: swapRequest.officerAId,
    officerName: swapRequest.officerAName,
    role: existingA?.role || 'Petugas Lapangan',
    post: `${postForA} (Tukar Jaga)`,
    npp: existingA?.npp,
    callSign: existingA?.callSign,
    phone: existingA?.phone,
  };

  // Officer B moves to Shift A
  const newOfficerBInShiftA: ShiftOfficerAssignment = {
    officerId: swapRequest.officerBId,
    officerName: swapRequest.officerBName,
    role: existingB?.role || 'Petugas Lapangan',
    post: `${postForB} (Tukar Jaga)`,
    npp: existingB?.npp,
    callSign: existingB?.callSign,
    phone: existingB?.phone,
  };

  const updatedCalendarDays = calendarDays.map((item, idx) => {
    if (idx !== dayIndex || !item) return item;

    const updatedShifts = item.shifts.map((s) => {
      if (s.type === swapRequest.shiftTypeA) {
        // Remove officer A, Add officer B
        const filtered = (s.officers || []).filter((o) => o.officerId !== swapRequest.officerAId);
        const withoutB = filtered.filter((o) => o.officerId !== swapRequest.officerBId);
        const merged = [...withoutB, newOfficerBInShiftA];
        return {
          ...s,
          officers: merged,
          count: merged.length,
        };
      }
      if (s.type === swapRequest.shiftTypeB) {
        // Remove officer B, Add officer A
        const filtered = (s.officers || []).filter((o) => o.officerId !== swapRequest.officerBId);
        const withoutA = filtered.filter((o) => o.officerId !== swapRequest.officerAId);
        const merged = [...withoutA, newOfficerAInShiftB];
        return {
          ...s,
          officers: merged,
          count: merged.length,
        };
      }
      return s;
    });

    return {
      ...item,
      shifts: updatedShifts,
    };
  });

  return {
    updatedCalendarDays,
    success: true,
    message: `Pertukaran jaga antara ${swapRequest.officerAName} (${swapRequest.shiftTypeA}) dan ${swapRequest.officerBName} (${swapRequest.shiftTypeB}) berhasil disetujui & diterapkan.`,
  };
}

export interface SecurityLeaveRecord {
  id: string;
  officerId: string;
  officerName: string;
  leaveType: 'Cuti Tahunan' | 'Izin Urusan Penting' | 'Sakit (Surat Dokter)' | 'Dispensasi Dinas Luar';
  startDate: string;
  endDate: string;
  reason: string;
  backupOfficerId?: string;
  backupOfficerName?: string;
  status: 'Disetujui' | 'Diajukan' | 'Selesai';
  createdAt: string;
}

/**
 * Applies a leave/cuti/izin request to the calendar, replacing the officer with a backup if provided
 */
export function applyLeaveToCalendar(
  calendarDays: (DayShift | null)[],
  leaveRecord: SecurityLeaveRecord,
  backupOfficer?: ShiftOfficerAssignment
): (DayShift | null)[] {
  const dates = getDatesInRange(leaveRecord.startDate, leaveRecord.endDate);

  return calendarDays.map((item) => {
    if (!item) return item;
    const dayStr = `2025-05-${String(item.day).padStart(2, '0')}`;
    if (!dates.includes(dayStr) && !dates.includes(item.dateStr)) {
      return item;
    }

    const updatedShifts = item.shifts.map((s) => {
      const hasOfficer = (s.officers || []).some((o) => o.officerId === leaveRecord.officerId);
      if (!hasOfficer) return s;

      let newOfficers = (s.officers || []).filter((o) => o.officerId !== leaveRecord.officerId);

      if (backupOfficer) {
        newOfficers = [
          ...newOfficers,
          {
            ...backupOfficer,
            post: `${backupOfficer.post || 'Pos Utama'} (Cadangan Cuti: ${leaveRecord.officerName})`,
          },
        ];
      }

      return {
        ...s,
        officers: newOfficers,
        count: newOfficers.length,
      };
    });

    return {
      ...item,
      shifts: updatedShifts,
    };
  });
}

export interface PatrolQuestionItem {
  id: string;
  category: string;
  questionText: string;
  description: string;
  inputType: 'boolean' | 'multiple_choice' | 'checklist' | 'numeric' | 'text' | 'rating';
  options?: string[];
  unit?: string;
  minVal?: number;
  maxVal?: number;
  required: boolean;
  requirePhoto: boolean;
  autoTriggerFinding: boolean;
  findingSeverity: 'Kritis' | 'Tinggi' | 'Sedang' | 'Rendah';
  assignedCheckpoints: string[]; // ['all'] or array of checkpoint IDs
  status: 'Aktif' | 'Nonaktif';
  order: number;
}

export interface MinimalCheckpoint {
  id: string;
  name: string;
  siteId?: string;
  zoneFloor?: string;
}

export interface MinimalFinding {
  id: string;
  title: string;
  checkpointId?: string;
  location?: string;
  status: string;
  severity?: string;
  siteId?: string;
}

/**
 * Returns all findings that are still open ('Baru' or 'Dalam Penanganan') for a given checkpoint
 */
export function getOpenFindingsForCheckpoint(
  checkpoint: MinimalCheckpoint,
  findings: MinimalFinding[]
): MinimalFinding[] {
  if (!checkpoint || !findings) return [];
  const cpId = checkpoint.id.toLowerCase().trim();
  const cpName = checkpoint.name.toLowerCase().trim();
  const zone = (checkpoint.zoneFloor || '').toLowerCase().trim();

  return findings.filter((f) => {
    // Only open findings (not resolved/completed)
    if (f.status === 'Selesai Terverifikasi' || f.status === 'Terkendali & Teratasi' || f.status === 'Closed') {
      return false;
    }

    // Direct match by checkpointId
    if (f.checkpointId && f.checkpointId.toLowerCase().trim() === cpId) {
      return true;
    }

    // Heuristic match by location or title
    const loc = (f.location || '').toLowerCase();
    const title = (f.title || '').toLowerCase();

    return (
      loc.includes(cpId) ||
      loc.includes(cpName) ||
      cpName.includes(loc) ||
      (zone && loc.includes(zone)) ||
      title.includes(cpId)
    );
  });
}

/**
 * Validates question builder payload
 */
export function validatePatrolQuestion(q: Partial<PatrolQuestionItem>): {
  valid: boolean;
  error?: string;
} {
  if (!q.questionText || q.questionText.trim().length < 5) {
    return { valid: false, error: 'Teks pertanyaan minimal 5 karakter' };
  }
  if (!q.category || q.category.trim().length < 2) {
    return { valid: false, error: 'Kategori pertanyaan wajib dipilih' };
  }
  if (!q.inputType) {
    return { valid: false, error: 'Tipe input pertanyaan wajib ditentukan' };
  }
  if ((q.inputType === 'multiple_choice' || q.inputType === 'checklist') && (!q.options || q.options.length < 2)) {
    return { valid: false, error: 'Pilihan ganda / checklist minimal memiliki 2 opsi jawaban' };
  }
  if (q.inputType === 'numeric') {
    if (q.minVal !== undefined && q.maxVal !== undefined && q.minVal > q.maxVal) {
      return { valid: false, error: 'Nilai batas minimum tidak boleh lebih besar dari nilai maksimum' };
    }
  }
  return { valid: true };
}

/**
 * Reorders patrol questions by swapping with adjacent items
 */
export function reorderPatrolQuestions(
  questions: PatrolQuestionItem[],
  id: string,
  direction: 'up' | 'down'
): PatrolQuestionItem[] {
  const index = questions.findIndex((q) => q.id === id);
  if (index === -1) return questions;

  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= questions.length) return questions;

  const clone = [...questions];
  const [removed] = clone.splice(index, 1);
  clone.splice(targetIndex, 0, removed);

  return clone.map((q, idx) => ({ ...q, order: idx + 1 }));
}

export interface SystemAuditLog {
  id: string;
  timestamp: string;
  category: 'Admin & Pengguna' | 'Operasional Patroli' | 'Temuan & Insiden' | 'Jadwal & Shift' | 'Tag & Checkpoint';
  action: string;
  actorName: string;
  actorRole: 'Admin' | 'Danru' | 'Satpam' | 'Operator';
  targetEntity: string;
  siteId: string;
  siteName: string;
  status: 'Berhasil' | 'Peringatan' | 'Gagal';
  details: string;
  ipAddress?: string;
  device?: string;
}

export interface SecurityLeaderboardItem {
  rank: number;
  id: string;
  npp: string;
  name: string;
  role: string;
  squad: string;
  siteId: string;
  siteName: string;
  totalCheckpointsScanned: number;
  complianceRate: number;
  onTimeRate: number;
  findingsReported: number;
  incidentsResolved: number;
  score: number;
  status: 'Bertugas Aktif' | 'Siaga di Pos' | 'Off / Libur';
  badgeTitle: string;
}

export interface FindingsAnalyticsSummary {
  total: number;
  statusCounts: {
    baru: number;
    dalamPenanganan: number;
    selesai: number;
  };
  severityCounts: {
    kritis: number;
    tinggi: number;
    sedang: number;
    rendah: number;
  };
  severityPercentages: {
    kritis: number;
    tinggi: number;
    sedang: number;
    rendah: number;
  };
  resolvedRate: number;
  averageResolutionMinutes: number;
}

/**
 * Filter System Audit Logs based on category, site, actor role, status, and search query
 */
export function filterSystemAuditLogs(
  logs: SystemAuditLog[],
  filters: {
    category?: string;
    siteId?: string;
    searchQuery?: string;
    actorRole?: string;
    status?: string;
  }
): SystemAuditLog[] {
  return logs.filter((log) => {
    if (filters.siteId && filters.siteId !== 'all' && log.siteId !== filters.siteId) {
      return false;
    }
    if (filters.category && filters.category !== 'all' && log.category !== filters.category) {
      return false;
    }
    if (filters.actorRole && filters.actorRole !== 'all' && log.actorRole !== filters.actorRole) {
      return false;
    }
    if (filters.status && filters.status !== 'all' && log.status !== filters.status) {
      return false;
    }
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      const match =
        log.id.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.actorName.toLowerCase().includes(q) ||
        log.targetEntity.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.siteName.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });
}

/**
 * Compute composite security performance score from compliance, punctuality, and volume
 */
export function computeLeaderboardScore(params: {
  complianceRate: number;
  onTimeRate: number;
  checkpointsScanned: number;
  findingsReported: number;
  incidentsResolved: number;
}): number {
  // Weighted: 50% compliance rate, 40% on-time punctuality, 8% volume bonus, 2% safety vigilance
  const volumeBonus = Math.min(100, (params.checkpointsScanned / 25) * 100);
  const vigilanceBonus = Math.min(100, (params.findingsReported + params.incidentsResolved) * 50);

  const rawScore =
    params.complianceRate * 0.50 +
    params.onTimeRate * 0.40 +
    volumeBonus * 0.08 +
    vigilanceBonus * 0.02;

  return Math.min(100, Math.round(rawScore * 10) / 10);
}

/**
 * Calculate statistical breakdown of findings for analytics charts
 */
export function calculateFindingsAnalytics(
  findings: { status: string; severity: string }[]
): FindingsAnalyticsSummary {
  const total = findings.length;
  const statusCounts = {
    baru: 0,
    dalamPenanganan: 0,
    selesai: 0,
  };
  const severityCounts = {
    kritis: 0,
    tinggi: 0,
    sedang: 0,
    rendah: 0,
  };

  for (const f of findings) {
    if (f.status === 'Baru') statusCounts.baru++;
    else if (f.status === 'Dalam Penanganan') statusCounts.dalamPenanganan++;
    else if (f.status === 'Selesai Terverifikasi' || f.status === 'Terkendali & Teratasi') statusCounts.selesai++;

    if (f.severity === 'Kritis') severityCounts.kritis++;
    else if (f.severity === 'Tinggi') severityCounts.tinggi++;
    else if (f.severity === 'Sedang') severityCounts.sedang++;
    else if (f.severity === 'Rendah') severityCounts.rendah++;
  }

  const severityPercentages = {
    kritis: total > 0 ? Math.round((severityCounts.kritis / total) * 100) : 0,
    tinggi: total > 0 ? Math.round((severityCounts.tinggi / total) * 100) : 0,
    sedang: total > 0 ? Math.round((severityCounts.sedang / total) * 100) : 0,
    rendah: total > 0 ? Math.round((severityCounts.rendah / total) * 100) : 0,
  };

  const resolvedRate = total > 0 ? Math.round((statusCounts.selesai / total) * 1000) / 10 : 100;

  return {
    total,
    statusCounts,
    severityCounts,
    severityPercentages,
    resolvedRate,
    averageResolutionMinutes: 48,
  };
}

export interface FindingsTimelinePoint {
  label: string;
  reportedCount: number;
  resolvedCount: number;
  openBacklog: number;
  avgResolutionMinutes: number;
  doorAccessCount: number;
  electricalCount: number;
  fireSafetyCount: number;
}

/**
 * Returns timeline data points for chronological line chart analysis
 */
export function generateFindingsTimelineTrend(): FindingsTimelinePoint[] {
  return [
    { label: '18 Mei', reportedCount: 3, resolvedCount: 3, openBacklog: 2, avgResolutionMinutes: 55, doorAccessCount: 1, electricalCount: 1, fireSafetyCount: 1 },
    { label: '19 Mei', reportedCount: 4, resolvedCount: 3, openBacklog: 3, avgResolutionMinutes: 52, doorAccessCount: 2, electricalCount: 1, fireSafetyCount: 1 },
    { label: '20 Mei', reportedCount: 2, resolvedCount: 4, openBacklog: 1, avgResolutionMinutes: 44, doorAccessCount: 1, electricalCount: 0, fireSafetyCount: 1 },
    { label: '21 Mei', reportedCount: 5, resolvedCount: 4, openBacklog: 2, avgResolutionMinutes: 49, doorAccessCount: 2, electricalCount: 2, fireSafetyCount: 1 },
    { label: '22 Mei', reportedCount: 3, resolvedCount: 3, openBacklog: 2, avgResolutionMinutes: 46, doorAccessCount: 1, electricalCount: 1, fireSafetyCount: 1 },
    { label: '23 Mei', reportedCount: 6, resolvedCount: 5, openBacklog: 3, avgResolutionMinutes: 42, doorAccessCount: 3, electricalCount: 2, fireSafetyCount: 1 },
    { label: '24 Mei', reportedCount: 4, resolvedCount: 2, openBacklog: 5, avgResolutionMinutes: 48, doorAccessCount: 2, electricalCount: 1, fireSafetyCount: 1 },
  ];
}

/**
 * Generic multi-column filter utility for table column search
 */
export function filterItemsByColumnCriteria<T>(
  items: T[],
  columnFilters: Record<string, string>,
  extractors: Record<string, (item: T) => string | undefined | null>
): T[] {
  const activeEntries = Object.entries(columnFilters).filter(
    ([, val]) => val !== undefined && val !== null && val.trim().length > 0
  );

  if (activeEntries.length === 0) return items;

  return items.filter((item) => {
    for (const [colKey, rawQuery] of activeEntries) {
      const extractor = extractors[colKey];
      if (!extractor) continue;

      const itemVal = extractor(item);
      const strVal = (itemVal ?? '').toLowerCase();
      const query = rawQuery.trim().toLowerCase();

      if (!strVal.includes(query)) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Standard shift configuration payload conforming to requested schema:
 * {
 *   "siteId": "{{siteId}}",
 *   "name": "Shift Pagi",
 *   "startTime": "07:00",
 *   "endTime": "15:00",
 *   "intervalMinutes": 120,
 *   "gracePeriodMinutes": 30,
 *   "enforceSequence": false,
 *   "locationIds": ["CP-SDR-001", ...]
 * }
 */
export interface ShiftFormPayload {
  siteId: string;
  name: string;
  startTime: string;
  endTime: string;
  intervalMinutes: number;
  gracePeriodMinutes: number;
  enforceSequence: boolean;
  locationIds: string[];
}

/**
 * Validates the new shift configuration payload
 */
export function validateShiftConfig(payload: Partial<ShiftFormPayload>): {
  valid: boolean;
  error?: string;
} {
  if (!payload.siteId || !payload.siteId.trim()) {
    return { valid: false, error: 'siteId wajib diisi atau dipilih' };
  }
  if (!payload.name || !payload.name.trim()) {
    return { valid: false, error: 'Nama shift (name) wajib diisi' };
  }
  if (!payload.startTime || !payload.startTime.trim()) {
    return { valid: false, error: 'Jam mulai (startTime) wajib diisi' };
  }
  if (!payload.endTime || !payload.endTime.trim()) {
    return { valid: false, error: 'Jam selesai (endTime) wajib diisi' };
  }
  if (typeof payload.intervalMinutes !== 'number' || isNaN(payload.intervalMinutes) || payload.intervalMinutes <= 0) {
    return { valid: false, error: 'intervalMinutes harus berupa angka positif dalam menit' };
  }
  if (typeof payload.gracePeriodMinutes !== 'number' || isNaN(payload.gracePeriodMinutes) || payload.gracePeriodMinutes < 0) {
    return { valid: false, error: 'gracePeriodMinutes harus berupa angka non-negatif dalam menit' };
  }
  if (typeof payload.enforceSequence !== 'boolean') {
    return { valid: false, error: 'enforceSequence harus bertipe boolean (true/false)' };
  }
  if (payload.locationIds && payload.locationIds.length === 0) {
    return { valid: false, error: 'Pilih minimal satu lokasi checkpoint untuk shift ini' };
  }
  return { valid: true };
}

/**
 * Formats a clean JSON payload representation conforming to requirements
 */
export function formatShiftPayloadJson(payload: ShiftFormPayload): string {
  return JSON.stringify(
    {
      siteId: payload.siteId,
      name: payload.name,
      startTime: payload.startTime,
      endTime: payload.endTime,
      intervalMinutes: payload.intervalMinutes,
      gracePeriodMinutes: payload.gracePeriodMinutes,
      enforceSequence: payload.enforceSequence,
      locations: payload.locationIds,
    },
    null,
    2
  );
}

/**
 * Reorders location IDs in sequence when enforceSequence is activated
 */
export function reorderShiftLocations(
  locationIds: string[],
  fromIndex: number,
  toIndex: number
): string[] {
  if (fromIndex < 0 || fromIndex >= locationIds.length || toIndex < 0 || toIndex >= locationIds.length) {
    return locationIds;
  }
  const result = [...locationIds];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}
