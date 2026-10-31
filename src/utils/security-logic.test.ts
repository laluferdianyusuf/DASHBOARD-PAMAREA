import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCompliance,
  evaluateStaffingStatus,
  isValidNfcUid,
  evaluateIncidentDispatch,
  filterBySite,
  validateSquadData,
  unassignNfcCheckpointConnection,
  assignNfcCheckpointConnection,
  validateShiftSchedule,
  syncShiftToCalendarDays,
  assignOfficerToDayShift,
  unassignOfficerFromDayShift,
  getDatesInRange,
  applyDateRangeShiftToCalendar,
  swapOfficersOnDate,
  applyLeaveToCalendar,
  PatrolSchedule,
  SecurityIncident,
  DayShift,
  getOpenFindingsForCheckpoint,
  validatePatrolQuestion,
  reorderPatrolQuestions,
  PatrolQuestionItem,
  filterSystemAuditLogs,
  computeLeaderboardScore,
  calculateFindingsAnalytics,
  generateFindingsTimelineTrend,
  filterItemsByColumnCriteria,
  validateShiftConfig,
  formatShiftPayloadJson,
  reorderShiftLocations,
  ShiftFormPayload,
} from './security-logic';

test('calculateCompliance calculates percentages accurately', () => {
  assert.equal(calculateCompliance(20, 20), 100);
  assert.equal(calculateCompliance(19, 20), 95);
  assert.equal(calculateCompliance(0, 20), 0);
  assert.equal(calculateCompliance(22, 20), 100);
  assert.equal(calculateCompliance(14, 15), 93.3);
});

test('evaluateStaffingStatus correctly flags personnel shortages', () => {
  const completeSchedule: PatrolSchedule = {
    id: 'SCH-1',
    siteId: 'site-a',
    squad: 'Alpha',
    shift: 'Pagi',
    startTime: '07:00',
    endTime: '15:00',
    requiredGuards: 4,
    assignedGuards: 4,
  };
  assert.deepEqual(evaluateStaffingStatus(completeSchedule), { status: 'lengkap', missingGuards: 0 });

  const minusOne: PatrolSchedule = { ...completeSchedule, assignedGuards: 3 };
  assert.deepEqual(evaluateStaffingStatus(minusOne), { status: 'kurang', missingGuards: 1 });

  const critical: PatrolSchedule = { ...completeSchedule, assignedGuards: 2 };
  assert.deepEqual(evaluateStaffingStatus(critical), { status: 'kritis', missingGuards: 2 });
});

test('isValidNfcUid validates 4-byte and 7-byte hex formats', () => {
  assert.equal(isValidNfcUid('04:A2:3B:5F'), true);
  assert.equal(isValidNfcUid('04:A2:3B:5F:8C:1D:9E'), true);
  assert.equal(isValidNfcUid('04-A2-3B-5F-8C-1D-9E'), true);
  assert.equal(isValidNfcUid('invalid-uid'), false);
  assert.equal(isValidNfcUid('04:A2:ZZ:5F'), false);
  assert.equal(isValidNfcUid(''), false);
});

test('validateSquadData ensures regu data completeness', () => {
  assert.equal(validateSquadData({ name: 'Regu Echo', danru: 'Budi Santoso', memberCount: 4 }).valid, true);
  assert.equal(validateSquadData({ name: 'R', danru: 'Budi', memberCount: 4 }).valid, false);
  assert.equal(validateSquadData({ name: 'Regu Echo', danru: '', memberCount: 4 }).valid, false);
  assert.equal(validateSquadData({ name: 'Regu Echo', danru: 'Budi', memberCount: 0 }).valid, false);
});

test('evaluateIncidentDispatch assigns proper urgency and recommendations', () => {
  const critical: SecurityIncident = {
    id: 'INC-1',
    severity: 'Kritis',
    reportedAt: '2026-10-30T10:00:00Z',
    requiresRapidResponse: true,
  };
  const resCritical = evaluateIncidentDispatch(critical);
  assert.equal(resCritical.urgencyLevel, 'IMMEDIATE');
  assert.match(resCritical.dispatchRecommendation, /TRC/);

  const medium: SecurityIncident = {
    id: 'INC-2',
    severity: 'Sedang',
    reportedAt: '2026-10-30T10:00:00Z',
    requiresRapidResponse: false,
  };
  const resMedium = evaluateIncidentDispatch(medium);
  assert.equal(resMedium.urgencyLevel, 'ROUTINE');
});

test('filterBySite handles site filtering properly', () => {
  const list = [
    { id: '1', site: 'Site A - Sudirman' },
    { id: '2', site: 'Site B - Cakung' },
    { id: '3', site: 'Site C - Cikarang' },
  ];
  assert.equal(filterBySite(list, 'Semua Area (Site)').length, 3);
  assert.equal(filterBySite(list, 'Sudirman').length, 1);
  assert.equal(filterBySite(list, 'Cakung').length, 1);
});

test('unassignNfcCheckpointConnection detaches link from both checkpoint and tag', () => {
  const cp = {
    id: 'CP-SDR-001',
    name: 'Pintu Masuk Lobi Utama',
    tagUid: '04:A2:3B:5F:8C:1D:9E',
    tagType: 'NFC NTAG213',
    status: 'Aktif Normal',
  };
  const tag = {
    uid: '04:A2:3B:5F:8C:1D:9E',
    linkedCheckpointId: 'CP-SDR-001',
    linkedCheckpointName: 'Pintu Masuk Lobi Utama',
    status: 'Terkoneksi Normal',
  };

  const { updatedCheckpoint, updatedTag } = unassignNfcCheckpointConnection(cp, tag);
  assert.equal(updatedCheckpoint.tagUid, '');
  assert.equal(updatedCheckpoint.tagType, 'Tanpa Tag (Unassigned)');
  assert.equal(updatedCheckpoint.status, 'Belum Terhubung Tag');
  assert.ok(updatedTag);
  assert.equal(updatedTag.linkedCheckpointId, '');
  assert.equal(updatedTag.linkedCheckpointName, 'Belum Ditautkan (Unassigned)');
  assert.equal(updatedTag.status, 'Belum Ditautkan');
});

test('assignNfcCheckpointConnection binds tag to checkpoint correctly', () => {
  const cp = {
    id: 'CP-SDR-002',
    name: 'Ruang Server Lantai 3',
    tagUid: '',
    tagType: 'Tanpa Tag (Unassigned)',
    status: 'Belum Terhubung Tag',
  };
  const tag = {
    uid: '04:B1:C2:D3:E4:F5:00',
    type: 'NFC NTAG213',
    linkedCheckpointId: '',
    linkedCheckpointName: 'Belum Ditautkan (Unassigned)',
    status: 'Belum Ditautkan',
  };

  const { updatedCheckpoint, updatedTag } = assignNfcCheckpointConnection(cp, tag);
  assert.equal(updatedCheckpoint.tagUid, '04:B1:C2:D3:E4:F5:00');
  assert.equal(updatedCheckpoint.status, 'Aktif Normal');
  assert.equal(updatedTag.linkedCheckpointId, 'CP-SDR-002');
  assert.equal(updatedTag.linkedCheckpointName, 'Ruang Server Lantai 3');
  assert.equal(updatedTag.status, 'Terkoneksi Normal');
});

test('validateShiftSchedule validates required fields properly', () => {
  assert.equal(
    validateShiftSchedule({ shiftType: 'Pagi', squad: 'Regu Alpha', danru: 'Ahmad Fauzi', requiredCount: 4 }).valid,
    true
  );
  assert.equal(
    validateShiftSchedule({ shiftType: 'InvalidShift', squad: 'Regu Alpha', danru: 'Ahmad', requiredCount: 4 }).valid,
    false
  );
  assert.equal(
    validateShiftSchedule({ shiftType: 'Siang', squad: '', danru: 'Ahmad', requiredCount: 4 }).valid,
    false
  );
  assert.equal(
    validateShiftSchedule({ shiftType: 'Malam', squad: 'Regu Charlie', danru: '', requiredCount: 4 }).valid,
    false
  );
  assert.equal(
    validateShiftSchedule({ shiftType: 'Pagi', squad: 'Regu Delta', danru: 'Joko', requiredCount: 0 }).valid,
    false
  );
});

test('syncShiftToCalendarDays integrates scheduled shift and assigned officers into calendar', () => {

  const initialCalendar: DayShift[] = [
    {
      day: 24,
      dateStr: '2025-05-24',
      shifts: [
        { type: 'Pagi' as const, squad: 'Regu Delta', danru: 'Joko Susilo', count: 2, required: 4, officers: [] },
      ],
    },
    {
      day: 25,
      dateStr: '2025-05-25',
      shifts: [],
    },
  ];

  // 1. Sync new Shift Sore / Siang to Day 24 with 2 assigned officers
  const updatedDays = syncShiftToCalendarDays(initialCalendar, {
    day: 24,
    shift: {
      type: 'Siang',
      squad: 'Regu Alpha',
      danru: 'Ahmad Fauzi',
      count: 2,
      required: 4,
      sector: 'Lobi Utama & Koridor Barat',
      officers: [
        { officerId: 'USR-003', officerName: 'Rian Hidayat', role: 'Petugas Lapangan', post: 'Pos Utama Gerbang Depan' },
        { officerId: 'USR-004', officerName: 'Budi Hartono', role: 'Petugas Lapangan', post: 'Patroli Koridor' },
      ],
    },
  });

  const day24 = updatedDays.find((d: any) => d && d.day === 24);
  assert.ok(day24);
  const siangShift = day24.shifts.find((s: any) => s.type === 'Siang');
  assert.ok(siangShift);
  assert.equal(siangShift.squad, 'Regu Alpha');
  assert.equal(siangShift.count, 2);
  assert.equal(siangShift.required, 4);
  assert.equal(siangShift.officers!.length, 2);
  assert.equal(siangShift.officers![0].officerName, 'Rian Hidayat');

  // 2. Assign another officer to Day 24 Shift Siang
  const afterAssign = assignOfficerToDayShift(updatedDays, 24, 'Siang', {
    officerId: 'USR-005',
    officerName: 'Wahyu Hidayat',
    role: 'Danru Backup',
    post: 'Pos Pantau Lobi',
  });
  const updatedSiang = afterAssign.find((d: any) => d.day === 24)!.shifts.find((s: any) => s.type === 'Siang')!;
  assert.equal(updatedSiang.count, 3);
  assert.equal(updatedSiang.officers!.length, 3);

  // 3. Unassign an officer from Day 24 Shift Siang
  const afterUnassign = unassignOfficerFromDayShift(afterAssign, 24, 'Siang', 'USR-003');
  const finalSiang = afterUnassign.find((d: any) => d.day === 24)!.shifts.find((s: any) => s.type === 'Siang')!;
  assert.equal(finalSiang.count, 2);
  assert.equal(finalSiang.officers!.length, 2);
  assert.equal(finalSiang.officers!.some((o: any) => o.officerId === 'USR-003'), false);
});

test('getDatesInRange produces contiguous array of dates', () => {
  const dates = getDatesInRange('2025-05-24', '2025-05-26');
  assert.deepEqual(dates, ['2025-05-24', '2025-05-25', '2025-05-26']);

  const single = getDatesInRange('2025-05-24', '2025-05-24');
  assert.deepEqual(single, ['2025-05-24']);
});

test('applyDateRangeShiftToCalendar propagates shifts across multiple dates', () => {
  const calendar = [
    { day: 24, dateStr: '2025-05-24', shifts: [] },
    { day: 25, dateStr: '2025-05-25', shifts: [] },
    { day: 26, dateStr: '2025-05-26', shifts: [] },
  ];

  const updated = applyDateRangeShiftToCalendar(calendar, {
    shiftName: 'Shift Siang Terpadu',
    shiftType: 'Siang',
    startTime: '15:00',
    endTime: '23:00',
    squad: 'Regu Alpha',
    danru: 'Ahmad Fauzi',
    locations: [{ siteId: 'site-a', siteName: 'Sudirman Central', sector: 'Lobi', selectedPosts: ['Pos 1'] }],
    startDate: '2025-05-24',
    endDate: '2025-05-26',
    requiredCount: 2,
    officers: [
      { officerId: 'USR-002', officerName: 'Ahmad Fauzi', role: 'Danru', post: 'Pos Komando' },
      { officerId: 'USR-003', officerName: 'Rian Hidayat', role: 'Petugas', post: 'Pos Depan' },
    ],
  });

  assert.equal(updated.length, 3);
  for (const day of updated) {
    assert.ok(day);
    const shift = day.shifts.find((s) => s.type === 'Siang');
    assert.ok(shift);
    assert.equal(shift.squad, 'Regu Alpha');
    assert.equal(shift.count, 2);
  }
});

test('swapOfficersOnDate successfully exchanges officer posts between shifts', () => {
  const calendar = [
    {
      day: 25,
      dateStr: '2025-05-25',
      shifts: [
        {
          type: 'Pagi' as const,
          squad: 'Regu Alpha',
          danru: 'Ahmad',
          count: 1,
          required: 1,
          officers: [
            { officerId: 'USR-001', officerName: 'Petugas A', role: 'Petugas', post: 'Pos Gerbang Pagi' },
          ],
        },
        {
          type: 'Siang' as const,
          squad: 'Regu Bravo',
          danru: 'Budi',
          count: 1,
          required: 1,
          officers: [
            { officerId: 'USR-002', officerName: 'Petugas B', role: 'Petugas', post: 'Pos Lobi Siang' },
          ],
        },
      ],
    },
  ];

  const result = swapOfficersOnDate(calendar, {
    dateStr: '2025-05-25',
    officerAId: 'USR-001',
    officerAName: 'Petugas A',
    shiftTypeA: 'Pagi',
    officerBId: 'USR-002',
    officerBName: 'Petugas B',
    shiftTypeB: 'Siang',
    reason: 'Kebutuhan mendesak keluarga',
  });

  assert.equal(result.success, true);
  const day25 = result.updatedCalendarDays[0]!;
  const pagi = day25.shifts.find((s) => s.type === 'Pagi')!;
  const siang = day25.shifts.find((s) => s.type === 'Siang')!;

  assert.equal(pagi.officers![0].officerId, 'USR-002');
  assert.equal(siang.officers![0].officerId, 'USR-001');
});

test('applyLeaveToCalendar replaces officer with backup officer during leave range', () => {
  const calendar = [
    {
      day: 24,
      dateStr: '2025-05-24',
      shifts: [
        {
          type: 'Pagi' as const,
          squad: 'Regu Alpha',
          danru: 'Ahmad',
          count: 1,
          required: 1,
          officers: [
            { officerId: 'USR-001', officerName: 'Petugas A', role: 'Petugas', post: 'Pos Gerbang' },
          ],
        },
      ],
    },
  ];

  const updated = applyLeaveToCalendar(
    calendar,
    {
      id: 'LEV-001',
      officerId: 'USR-001',
      officerName: 'Petugas A',
      leaveType: 'Cuti Tahunan',
      startDate: '2025-05-24',
      endDate: '2025-05-24',
      reason: 'Cuti tahunan disetujui HRD',
      status: 'Disetujui',
      createdAt: '2025-05-23',
    },
    {
      officerId: 'USR-BACKUP',
      officerName: 'Petugas Cadangan',
      role: 'Petugas Lapangan',
      post: 'Pos Pengganti',
    }
  );

  const pagi = updated[0]!.shifts[0];
  assert.equal(pagi.officers!.length, 1);
  assert.equal(pagi.officers![0].officerId, 'USR-BACKUP');
  assert.match(pagi.officers![0].post, /Cadangan Cuti: Petugas A/);
});

test('getOpenFindingsForCheckpoint returns only active unresolved findings for a checkpoint', () => {
  const cp = {
    id: 'CP-SDR-014',
    name: 'Pintu Darurat Timur Lt. 14',
    zoneFloor: 'Lantai 14 - Koridor Sayap Timur',
  };

  const sampleFindings = [
    {
      id: 'FND-1',
      title: 'Pintu Terganjal',
      checkpointId: 'CP-SDR-014',
      location: 'Lantai 14',
      status: 'Dalam Penanganan',
    },
    {
      id: 'FND-2',
      title: 'Kaca Retak',
      checkpointId: 'CP-SDR-014',
      location: 'Lantai 14',
      status: 'Selesai Terverifikasi', // Closed, should not be included
    },
    {
      id: 'FND-3',
      title: 'Lampu Mati',
      checkpointId: 'CP-CKG-007',
      location: 'Dermaga Bay 7',
      status: 'Baru', // Other checkpoint
    },
    {
      id: 'FND-4',
      title: 'Kamera Rusak di Pintu Darurat Timur Lt. 14',
      location: 'Pintu Darurat Timur Lt. 14',
      status: 'Baru', // Matched by location string
    },
  ];

  const results = getOpenFindingsForCheckpoint(cp, sampleFindings);
  assert.equal(results.length, 2);
  assert.equal(results[0].id, 'FND-1');
  assert.equal(results[1].id, 'FND-4');
});

test('validatePatrolQuestion accurately validates question builder inputs', () => {
  assert.equal(
    validatePatrolQuestion({
      questionText: 'Apakah lampu darurat menyala?',
      category: 'K3',
      inputType: 'boolean',
    }).valid,
    true
  );

  // Too short question text
  assert.equal(
    validatePatrolQuestion({
      questionText: 'Apa?',
      category: 'K3',
      inputType: 'boolean',
    }).valid,
    false
  );

  // Missing options for multiple choice
  assert.equal(
    validatePatrolQuestion({
      questionText: 'Pilih kondisi APAR:',
      category: 'K3',
      inputType: 'multiple_choice',
      options: ['Hanya 1 opsi'],
    }).valid,
    false
  );

  // Invalid min/max for numeric
  assert.equal(
    validatePatrolQuestion({
      questionText: 'Nilai suhu trafo:',
      category: 'Utilitas',
      inputType: 'numeric',
      minVal: 100,
      maxVal: 20,
    }).valid,
    false
  );
});

test('reorderPatrolQuestions moves question items up and down properly', () => {
  const sample: PatrolQuestionItem[] = [
    {
      id: 'Q-1',
      category: 'K3',
      questionText: 'Pertanyaan 1',
      description: '',
      inputType: 'boolean',
      required: true,
      requirePhoto: false,
      autoTriggerFinding: false,
      findingSeverity: 'Sedang',
      assignedCheckpoints: ['all'],
      status: 'Aktif',
      order: 1,
    },
    {
      id: 'Q-2',
      category: 'K3',
      questionText: 'Pertanyaan 2',
      description: '',
      inputType: 'boolean',
      required: true,
      requirePhoto: false,
      autoTriggerFinding: false,
      findingSeverity: 'Sedang',
      assignedCheckpoints: ['all'],
      status: 'Aktif',
      order: 2,
    },
  ];

  const movedDown = reorderPatrolQuestions(sample, 'Q-1', 'down');
  assert.equal(movedDown[0].id, 'Q-2');
  assert.equal(movedDown[0].order, 1);
  assert.equal(movedDown[1].id, 'Q-1');
  assert.equal(movedDown[1].order, 2);

  const movedUp = reorderPatrolQuestions(movedDown, 'Q-1', 'up');
  assert.equal(movedUp[0].id, 'Q-1');
  assert.equal(movedUp[1].id, 'Q-2');
});

test('filterSystemAuditLogs accurately filters by category, site, and keyword', () => {
  const logs = [
    {
      id: 'AUD-01',
      timestamp: '24 Mei 2025, 14:00 WIB',
      category: 'Admin & Pengguna' as const,
      action: 'Tambah Pengguna Baru',
      actorName: 'Bambang Prasetyo',
      actorRole: 'Admin' as const,
      targetEntity: 'USR-011',
      siteId: 'all',
      siteName: 'Headquarter',
      status: 'Berhasil' as const,
      details: 'Menambahkan petugas lapangan baru.',
    },
    {
      id: 'AUD-02',
      timestamp: '24 Mei 2025, 14:30 WIB',
      category: 'Operasional Patroli' as const,
      action: 'Pindai Titik Checkpoint NFC',
      actorName: 'Rian Hidayat',
      actorRole: 'Satpam' as const,
      targetEntity: 'CP-SDR-014',
      siteId: 'site-a',
      siteName: 'Sudirman Central Tower',
      status: 'Berhasil' as const,
      details: 'Pindai NFC tag tepat waktu.',
    },
  ];

  const filteredAdmin = filterSystemAuditLogs(logs, { category: 'Admin & Pengguna' });
  assert.equal(filteredAdmin.length, 1);
  assert.equal(filteredAdmin[0].id, 'AUD-01');

  const filteredSiteA = filterSystemAuditLogs(logs, { siteId: 'site-a' });
  assert.equal(filteredSiteA.length, 1);
  assert.equal(filteredSiteA[0].id, 'AUD-02');

  const filteredSearch = filterSystemAuditLogs(logs, { searchQuery: 'Rian' });
  assert.equal(filteredSearch.length, 1);
  assert.equal(filteredSearch[0].actorName, 'Rian Hidayat');
});

test('computeLeaderboardScore computes weighted score within 0-100', () => {
  const scorePerfect = computeLeaderboardScore({
    complianceRate: 100,
    onTimeRate: 100,
    checkpointsScanned: 35,
    findingsReported: 2,
    incidentsResolved: 1,
  });
  assert.equal(scorePerfect, 100);

  const scoreMedium = computeLeaderboardScore({
    complianceRate: 90,
    onTimeRate: 85,
    checkpointsScanned: 20,
    findingsReported: 1,
    incidentsResolved: 0,
  });
  assert.ok(scoreMedium >= 80 && scoreMedium <= 95);
});

test('calculateFindingsAnalytics produces accurate status and severity statistics', () => {
  const findings = [
    { status: 'Baru', severity: 'Kritis' },
    { status: 'Dalam Penanganan', severity: 'Tinggi' },
    { status: 'Selesai Terverifikasi', severity: 'Sedang' },
    { status: 'Selesai Terverifikasi', severity: 'Rendah' },
  ];

  const res = calculateFindingsAnalytics(findings);
  assert.equal(res.total, 4);
  assert.equal(res.statusCounts.baru, 1);
  assert.equal(res.statusCounts.dalamPenanganan, 1);
  assert.equal(res.statusCounts.selesai, 2);
  assert.equal(res.severityCounts.kritis, 1);
  assert.equal(res.severityCounts.tinggi, 1);
  assert.equal(res.resolvedRate, 50);
});

test('generateFindingsTimelineTrend returns 7-day chronological time points with valid metrics', () => {
  const trend = generateFindingsTimelineTrend();
  assert.equal(trend.length, 7);
  assert.equal(trend[0].label, '18 Mei');
  assert.equal(trend[6].label, '24 Mei');

  for (const point of trend) {
    assert.ok(point.reportedCount >= 0);
    assert.ok(point.resolvedCount >= 0);
    assert.ok(point.openBacklog >= 0);
    assert.ok(point.avgResolutionMinutes > 0);
  }
});

test('filterItemsByColumnCriteria filters rows across multiple column criteria', () => {
  const items = [
    { id: 'FND-001', title: 'Pintu Darurat Terbuka', severity: 'Tinggi', site: 'Site A' },
    { id: 'FND-002', title: 'APAR Rusak', severity: 'Sedang', site: 'Site B' },
    { id: 'FND-003', title: 'Panel Listrik B2', severity: 'Kritis', site: 'Site A' },
  ];

  const extractors = {
    id: (i: any) => i.id,
    title: (i: any) => i.title,
    severity: (i: any) => i.severity,
    site: (i: any) => i.site,
  };

  // 1. Single column filter
  const bySeverity = filterItemsByColumnCriteria(items, { severity: 'Kritis' }, extractors);
  assert.equal(bySeverity.length, 1);
  assert.equal(bySeverity[0].id, 'FND-003');

  // 2. Multi column filter simultaneously
  const multi = filterItemsByColumnCriteria(items, { site: 'Site A', severity: 'Tinggi' }, extractors);
  assert.equal(multi.length, 1);
  assert.equal(multi[0].id, 'FND-001');

  // 3. No match
  const none = filterItemsByColumnCriteria(items, { site: 'Site B', severity: 'Tinggi' }, extractors);
  assert.equal(none.length, 0);

  // 4. Empty filter returns all
  const all = filterItemsByColumnCriteria(items, { id: '', title: '' }, extractors);
  assert.equal(all.length, 3);
});

test('validateShiftConfig validates the requested schema fields correctly', () => {
  const validPayload: ShiftFormPayload = {
    siteId: 'site-a',
    name: 'Shift Pagi',
    startTime: '07:00',
    endTime: '15:00',
    intervalMinutes: 120,
    gracePeriodMinutes: 30,
    enforceSequence: false,
    locationIds: ['CP-SDR-001', 'CP-SDR-002'],
  };

  const validRes = validateShiftConfig(validPayload);
  assert.equal(validRes.valid, true);

  // Missing siteId
  const missingSite = validateShiftConfig({ ...validPayload, siteId: '' });
  assert.equal(missingSite.valid, false);
  assert.match(missingSite.error!, /siteId/);

  // Missing name
  const missingName = validateShiftConfig({ ...validPayload, name: '' });
  assert.equal(missingName.valid, false);
  assert.match(missingName.error!, /name/);

  // Invalid intervalMinutes
  const invalidInterval = validateShiftConfig({ ...validPayload, intervalMinutes: 0 });
  assert.equal(invalidInterval.valid, false);
  assert.match(invalidInterval.error!, /intervalMinutes/);

  // Negative gracePeriodMinutes
  const invalidGrace = validateShiftConfig({ ...validPayload, gracePeriodMinutes: -5 });
  assert.equal(invalidGrace.valid, false);
  assert.match(invalidGrace.error!, /gracePeriodMinutes/);

  // enforceSequence not boolean
  const invalidSeq = validateShiftConfig({ ...validPayload, enforceSequence: undefined as any });
  assert.equal(invalidSeq.valid, false);
  assert.match(invalidSeq.error!, /enforceSequence/);

  // Empty locations list
  const emptyLocs = validateShiftConfig({ ...validPayload, locationIds: [] });
  assert.equal(emptyLocs.valid, false);
  assert.match(emptyLocs.error!, /lokasi/);
});

test('formatShiftPayloadJson generates exact JSON output matching user specification', () => {
  const payload: ShiftFormPayload = {
    siteId: 'site-a',
    name: 'Shift Pagi',
    startTime: '07:00',
    endTime: '15:00',
    intervalMinutes: 120,
    gracePeriodMinutes: 30,
    enforceSequence: false,
    locationIds: ['CP-SDR-001', 'CP-SDR-003'],
  };

  const jsonStr = formatShiftPayloadJson(payload);
  const parsed = JSON.parse(jsonStr);

  assert.equal(parsed.siteId, 'site-a');
  assert.equal(parsed.name, 'Shift Pagi');
  assert.equal(parsed.startTime, '07:00');
  assert.equal(parsed.endTime, '15:00');
  assert.equal(parsed.intervalMinutes, 120);
  assert.equal(parsed.gracePeriodMinutes, 30);
  assert.equal(parsed.enforceSequence, false);
  assert.deepEqual(parsed.locations, ['CP-SDR-001', 'CP-SDR-003']);
});

test('reorderShiftLocations correctly shifts location order in sequence', () => {
  const locations = ['CP-1', 'CP-2', 'CP-3', 'CP-4'];
  const reordered = reorderShiftLocations(locations, 0, 2);
  assert.deepEqual(reordered, ['CP-2', 'CP-3', 'CP-1', 'CP-4']);

  // Move back up
  const movedUp = reorderShiftLocations(reordered, 2, 0);
  assert.deepEqual(movedUp, ['CP-1', 'CP-2', 'CP-3', 'CP-4']);

  // Out of bounds preserves list
  assert.deepEqual(reorderShiftLocations(locations, -1, 2), locations);
  assert.deepEqual(reorderShiftLocations(locations, 0, 99), locations);
});
