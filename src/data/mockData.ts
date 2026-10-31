export interface Site {
  id: string;
  name: string;
  code: string;
  location: string;
}

export const SITES: Site[] = [
  { id: 'all', name: 'Semua Area (Site)', code: 'ALL', location: 'Seluruh Wilayah Operasional' },
  { id: 'site-a', name: 'Site A - Sudirman Central Tower', code: 'SDR', location: 'Jl. Jend. Sudirman Kav. 52-53, Jakarta Selatan' },
  { id: 'site-b', name: 'Site B - Hub Logistik Cakung', code: 'CKG', location: 'Kawasan Industri Pulogadung - Cakung, Jakarta Timur' },
  { id: 'site-c', name: 'Site C - Data Center Cikarang', code: 'CKR', location: 'Greenland International Industrial Center, Cikarang' },
  { id: 'site-d', name: 'Site D - Pergudangan Marunda', code: 'MRD', location: 'Kawasan Berikat Marunda Center, Bekasi' },
];

export interface LiveActivity {
  id: string;
  timestamp: string;
  siteId: string;
  siteName: string;
  guardName: string;
  squad: string;
  checkpointName: string;
  checkpointId: string;
  scanType: 'NFC NTAG213' | 'RFID UHF' | 'QR Code Dynamic';
  status: 'Tepat Waktu' | 'Terlambat' | 'Anomali';
  battery: number;
}

export const INITIAL_ACTIVITIES: LiveActivity[] = [
  {
    id: 'ACT-9021',
    timestamp: '14:28:45 WIB',
    siteId: 'site-a',
    siteName: 'Sudirman Central Tower',
    guardName: 'Rian Hidayat',
    squad: 'Regu Alpha',
    checkpointName: 'Pintu Darurat Timur Lt. 14',
    checkpointId: 'CP-SDR-014',
    scanType: 'NFC NTAG213',
    status: 'Tepat Waktu',
    battery: 94,
  },
  {
    id: 'ACT-9020',
    timestamp: '14:26:12 WIB',
    siteId: 'site-b',
    siteName: 'Hub Logistik Cakung',
    guardName: 'Agus Santoso',
    squad: 'Regu Charlie',
    checkpointName: 'Dermaga Kontainer Bay 07',
    checkpointId: 'CP-CKG-007',
    scanType: 'RFID UHF',
    status: 'Tepat Waktu',
    battery: 88,
  },
  {
    id: 'ACT-9019',
    timestamp: '14:24:02 WIB',
    siteId: 'site-c',
    siteName: 'Data Center Cikarang',
    guardName: 'Doni Pratama',
    squad: 'Regu Delta',
    checkpointName: 'Perimeter Pagar Sensor P12',
    checkpointId: 'CP-CKR-012',
    scanType: 'NFC NTAG213',
    status: 'Tepat Waktu',
    battery: 91,
  },
  {
    id: 'ACT-9018',
    timestamp: '14:19:30 WIB',
    siteId: 'site-a',
    siteName: 'Sudirman Central Tower',
    guardName: 'Budi Hartono',
    squad: 'Regu Alpha',
    checkpointName: 'Ruang Trafo & Genset B2',
    checkpointId: 'CP-SDR-003',
    scanType: 'NFC NTAG213',
    status: 'Terlambat',
    battery: 76,
  },
  {
    id: 'ACT-9017',
    timestamp: '14:15:10 WIB',
    siteId: 'site-d',
    siteName: 'Pergudangan Marunda',
    guardName: 'Eko Wahyudi',
    squad: 'Regu Bravo',
    checkpointName: 'Pintu Gerbang Utama Gerilya',
    checkpointId: 'CP-MRD-001',
    scanType: 'QR Code Dynamic',
    status: 'Tepat Waktu',
    battery: 82,
  },
];

export interface GuardPost {
  id: string;
  name: string;
  siteId: string;
  siteName: string;
  danru: string;
  guardCount: number;
  status: 'Aman & Terjaga' | 'Siaga Penuh' | 'Pemeriksaan Aktif';
  lastPatrol: string;
  cctvCount: number;
}

export const GUARD_POSTS: GuardPost[] = [
  {
    id: 'POST-01',
    name: 'Pos Utama & Gerbang Akses Lobi',
    siteId: 'site-a',
    siteName: 'Sudirman Central Tower',
    danru: 'Ahmad Fauzi',
    guardCount: 6,
    status: 'Aman & Terjaga',
    lastPatrol: '14:20 WIB',
    cctvCount: 16,
  },
  {
    id: 'POST-02',
    name: 'Pos Timbangan & Dermaga Kontainer',
    siteId: 'site-b',
    siteName: 'Hub Logistik Cakung',
    danru: 'Wahyu Hidayat',
    guardCount: 4,
    status: 'Pemeriksaan Aktif',
    lastPatrol: '14:26 WIB',
    cctvCount: 12,
  },
  {
    id: 'POST-03',
    name: 'Pos Pengamanan Server Vault B2',
    siteId: 'site-c',
    siteName: 'Data Center Cikarang',
    danru: 'Joko Susilo',
    guardCount: 5,
    status: 'Siaga Penuh',
    lastPatrol: '14:15 WIB',
    cctvCount: 24,
  },
  {
    id: 'POST-04',
    name: 'Pos Pintu Evakuasi Barat & Loading Bay',
    siteId: 'site-a',
    siteName: 'Sudirman Central Tower',
    danru: 'Ahmad Fauzi',
    guardCount: 3,
    status: 'Aman & Terjaga',
    lastPatrol: '14:10 WIB',
    cctvCount: 8,
  },
];

export interface MonitoringGuard {
  id: string;
  name: string;
  callSign: string;
  squad: string;
  danru: string;
  siteId: string;
  siteName: string;
  shift: string;
  status: 'Patroli Berjalan' | 'Siaga di Pos' | 'Verifikasi Temuan' | 'Menuju Checkpoint';
  currentCheckpoint: string;
  nextCheckpoint: string;
  scannedCount: number;
  totalCheckpoints: number;
  battery: number;
  signalStrength: 'Sangat Kuat' | 'Kuat' | 'Sedang';
  gpsCoordinates: string;
  lastPing: string;
  mapX: number; // percentage on floor plan
  mapY: number;
}

export const MONITORING_GUARDS: MonitoringGuard[] = [
  {
    id: 'GRD-01',
    name: 'Rian Hidayat',
    callSign: 'Alpha-02',
    squad: 'Regu Alpha',
    danru: 'Ahmad Fauzi',
    siteId: 'site-a',
    siteName: 'Sudirman Central Tower',
    shift: 'Shift Siang (15:00 - 23:00)',
    status: 'Patroli Berjalan',
    currentCheckpoint: 'CP-SDR-014: Pintu Darurat Lt. 14',
    nextCheckpoint: 'CP-SDR-015: Tangga Darurat Utara Lt. 15',
    scannedCount: 18,
    totalCheckpoints: 24,
    battery: 94,
    signalStrength: 'Sangat Kuat',
    gpsCoordinates: '-6.22415, 106.80931',
    lastPing: '30 detik lalu',
    mapX: 42,
    mapY: 38,
  },
  {
    id: 'GRD-02',
    name: 'Budi Hartono',
    callSign: 'Alpha-03',
    squad: 'Regu Alpha',
    danru: 'Ahmad Fauzi',
    siteId: 'site-a',
    siteName: 'Sudirman Central Tower',
    shift: 'Shift Siang (15:00 - 23:00)',
    status: 'Verifikasi Temuan',
    currentCheckpoint: 'CP-SDR-003: Ruang Trafo B2',
    nextCheckpoint: 'CP-SDR-004: Tangki Chiller B2',
    scannedCount: 6,
    totalCheckpoints: 12,
    battery: 76,
    signalStrength: 'Kuat',
    gpsCoordinates: '-6.22430, 106.80950',
    lastPing: '1 menit lalu',
    mapX: 28,
    mapY: 72,
  },
  {
    id: 'GRD-03',
    name: 'Agus Santoso',
    callSign: 'Charlie-01',
    squad: 'Regu Charlie',
    danru: 'Wahyu Hidayat',
    siteId: 'site-b',
    siteName: 'Hub Logistik Cakung',
    shift: 'Shift Siang (15:00 - 23:00)',
    status: 'Patroli Berjalan',
    currentCheckpoint: 'CP-CKG-007: Dermaga Bay 07',
    nextCheckpoint: 'CP-CKG-008: Gerbang Timur Kontainer',
    scannedCount: 14,
    totalCheckpoints: 22,
    battery: 88,
    signalStrength: 'Sangat Kuat',
    gpsCoordinates: '-6.17511, 106.94231',
    lastPing: '15 detik lalu',
    mapX: 68,
    mapY: 45,
  },
  {
    id: 'GRD-04',
    name: 'Doni Pratama',
    callSign: 'Delta-04',
    squad: 'Regu Delta',
    danru: 'Joko Susilo',
    siteId: 'site-c',
    siteName: 'Data Center Cikarang',
    shift: 'Shift Pagi (07:00 - 15:00)',
    status: 'Menuju Checkpoint',
    currentCheckpoint: 'CP-CKR-012: Pagar Perimeter P12',
    nextCheckpoint: 'CP-CKR-013: Gardu Induk Sektor C',
    scannedCount: 21,
    totalCheckpoints: 25,
    battery: 91,
    signalStrength: 'Kuat',
    gpsCoordinates: '-6.33120, 107.16430',
    lastPing: '45 detik lalu',
    mapX: 82,
    mapY: 60,
  },
];

export interface PatrolScheduleItem {
  id: string;
  siteId: string;
  siteName: string;
  sector: string;
  squad: string;
  danru: string;
  shift: 'Shift Pagi (07:00 - 15:00)' | 'Shift Siang (15:00 - 23:00)' | 'Shift Malam (23:00 - 07:00)';
  routeName: string;
  checkpointCount: number;
  frequency: string;
  guardRatio: string;
  assignedCount: number;
  requiredCount: number;
  status: 'Berjalan Aktif' | 'Terjadwal' | 'Selesai Tuntas' | 'Perlu Pengganti';
  date: string;
}

export const PATROL_SCHEDULES: PatrolScheduleItem[] = [
  {
    id: 'SCH-2025-0524-01',
    siteId: 'site-a',
    siteName: 'Sudirman Central Tower',
    sector: 'Podium Utama, Lobi & Parkir B1 s.d. B3',
    squad: 'Regu Alpha',
    danru: 'Ahmad Fauzi',
    shift: 'Shift Siang (15:00 - 23:00)',
    routeName: 'Rute Vertikal Menara Utama (36 Titik)',
    checkpointCount: 36,
    frequency: 'Setiap 1 Jam',
    guardRatio: '4/4 Petugas Lengkap',
    assignedCount: 4,
    requiredCount: 4,
    status: 'Berjalan Aktif',
    date: '2025-05-24',
  },
  {
    id: 'SCH-2025-0524-02',
    siteId: 'site-b',
    siteName: 'Hub Logistik Cakung',
    sector: 'Gudang Kimia, Dermaga Kontainer & Gerbang Tol',
    squad: 'Regu Bravo',
    danru: 'Bambang Sudrajat',
    shift: 'Shift Pagi (07:00 - 15:00)',
    routeName: 'Rute Perimeter Luar (18 Titik NFC)',
    checkpointCount: 18,
    frequency: 'Setiap 2 Jam',
    guardRatio: '4/4 Petugas Lengkap',
    assignedCount: 4,
    requiredCount: 4,
    status: 'Selesai Tuntas',
    date: '2025-05-24',
  },
  {
    id: 'SCH-2025-0524-03',
    siteId: 'site-b',
    siteName: 'Hub Logistik Cakung',
    sector: 'Dermaga Kontainer & Pintu Gerbang Tol',
    squad: 'Regu Charlie',
    danru: 'Wahyu Hidayat',
    shift: 'Shift Malam (23:00 - 07:00)',
    routeName: 'Rute Logistik Terpadu (22 Titik NFC)',
    checkpointCount: 22,
    frequency: 'Setiap 1 Jam',
    guardRatio: '3/4 Petugas (1 Sakit)',
    assignedCount: 3,
    requiredCount: 4,
    status: 'Perlu Pengganti',
    date: '2025-05-24',
  },
  {
    id: 'SCH-2025-0524-04',
    siteId: 'site-c',
    siteName: 'Data Center Cikarang',
    sector: 'Sektor 1 s.d. 4 & Gerbang Induk',
    squad: 'Regu Delta',
    danru: 'Joko Susilo',
    shift: 'Shift Pagi (07:00 - 15:00)',
    routeName: 'Rute Kawasan Pabrik (25 Titik NFC)',
    checkpointCount: 25,
    frequency: 'Setiap 2 Jam',
    guardRatio: '5/5 Petugas Lengkap',
    assignedCount: 5,
    requiredCount: 5,
    status: 'Selesai Tuntas',
    date: '2025-05-24',
  },
  {
    id: 'SCH-2025-0524-05',
    siteId: 'site-a',
    siteName: 'Sudirman Central Tower',
    sector: 'Rooftop, Helipad & Ruang Genset B2',
    squad: 'Regu Alpha (Sub-tim 2)',
    danru: 'Ahmad Fauzi',
    shift: 'Shift Malam (23:00 - 07:00)',
    routeName: 'Rute Fasilitas Kritis (12 Titik NFC)',
    checkpointCount: 12,
    frequency: 'Setiap 3 Jam',
    guardRatio: '3/3 Petugas Siaga',
    assignedCount: 3,
    requiredCount: 3,
    status: 'Terjadwal',
    date: '2025-05-24',
  },
];

export interface CheckpointItem {
  id: string;
  name: string;
  siteId: string;
  siteName: string;
  zoneFloor: string;
  tagType: 'NFC NTAG213' | 'RFID UHF' | 'QR Code Dynamic' | 'Tanpa Tag (Unassigned)';
  tagUid: string;
  coordinates: string;
  frequency: string;
  status: 'Aktif Normal' | 'Perlu Kalibrasi' | 'Rusak / Gangguan' | 'Belum Terhubung Tag';
  lastScanned: string;
  lastGuard: string;
  mapX?: number; // percentage (0-100) for positioning on interactive site map
  mapY?: number;
}

export const CHECKPOINTS: CheckpointItem[] = [
  {
    id: 'CP-SDR-001',
    name: 'Pintu Masuk Lobi Utama & Metal Detector',
    siteId: 'site-a',
    siteName: 'Sudirman Central Tower',
    zoneFloor: 'Lantai Ground / West Gate',
    tagType: 'NFC NTAG213',
    tagUid: '04:A2:3B:5F:8C:1D:9E',
    coordinates: '-6.22410, 106.80920',
    frequency: 'Setiap 30 Menit',
    status: 'Aktif Normal',
    lastScanned: '14:20 WIB',
    lastGuard: 'Rian Hidayat',
    mapX: 25,
    mapY: 48,
  },
  {
    id: 'CP-SDR-002',
    name: 'Ruang Server & UPS Lantai 3',
    siteId: 'site-a',
    siteName: 'Sudirman Central Tower',
    zoneFloor: 'Lantai 3 - Koridor Sayap Selatan',
    tagType: 'NFC NTAG213',
    tagUid: '04:77:22:1A:3C:99:01',
    coordinates: '-6.22420, 106.80935',
    frequency: 'Setiap 1 Jam',
    status: 'Aktif Normal',
    lastScanned: '14:05 WIB',
    lastGuard: 'Budi Hartono',
    mapX: 42,
    mapY: 32,
  },
  {
    id: 'CP-SDR-003',
    name: 'Ruang Trafo & Genset Darurat B2',
    siteId: 'site-a',
    siteName: 'Sudirman Central Tower',
    zoneFloor: 'Basement 2 - Zona Utilitas',
    tagType: 'NFC NTAG213',
    tagUid: '04:C5:11:9A:2E:77:80',
    coordinates: '-6.22430, 106.80950',
    frequency: 'Setiap 1 Jam',
    status: 'Perlu Kalibrasi',
    lastScanned: '14:19 WIB',
    lastGuard: 'Budi Hartono',
    mapX: 72,
    mapY: 76,
  },
  {
    id: 'CP-SDR-014',
    name: 'Pintu Darurat Timur Lt. 14',
    siteId: 'site-a',
    siteName: 'Sudirman Central Tower',
    zoneFloor: 'Lantai 14 - Koridor Sayap Timur',
    tagType: 'NFC NTAG213',
    tagUid: '04:19:6F:42:0B:3C:99',
    coordinates: '-6.22415, 106.80931',
    frequency: 'Setiap 1 Jam',
    status: 'Aktif Normal',
    lastScanned: '14:28 WIB',
    lastGuard: 'Rian Hidayat',
    mapX: 78,
    mapY: 28,
  },
  {
    id: 'CP-CKG-007',
    name: 'Dermaga Kontainer Bay 07',
    siteId: 'site-b',
    siteName: 'Hub Logistik Cakung',
    zoneFloor: 'Area Yard Sektor Utara',
    tagType: 'RFID UHF',
    tagUid: 'E2:80:11:60:20:00:15',
    coordinates: '-6.17511, 106.94231',
    frequency: 'Setiap 1 Jam',
    status: 'Aktif Normal',
    lastScanned: '14:26 WIB',
    lastGuard: 'Agus Santoso',
    mapX: 35,
    mapY: 62,
  },
  {
    id: 'CP-CKG-002',
    name: 'Pos Pemeriksaan Muatan Gerbang Masuk',
    siteId: 'site-b',
    siteName: 'Hub Logistik Cakung',
    zoneFloor: 'Gerbang Masuk Sektor Barat',
    tagType: 'RFID UHF',
    tagUid: 'E2:80:11:60:20:00:22',
    coordinates: '-6.17502, 106.94210',
    frequency: 'Setiap 30 Menit',
    status: 'Aktif Normal',
    lastScanned: '14:12 WIB',
    lastGuard: 'Agus Santoso',
    mapX: 18,
    mapY: 30,
  },
  {
    id: 'CP-CKR-012',
    name: 'Perimeter Pagar Sensor P12',
    siteId: 'site-c',
    siteName: 'Data Center Cikarang',
    zoneFloor: 'Pagar Keliling Sisi Selatan',
    tagType: 'NFC NTAG213',
    tagUid: '04:88:7C:12:34:56:78',
    coordinates: '-6.33120, 107.16430',
    frequency: 'Setiap 2 Jam',
    status: 'Aktif Normal',
    lastScanned: '14:24 WIB',
    lastGuard: 'Doni Pratama',
    mapX: 60,
    mapY: 82,
  },
  {
    id: 'CP-MRD-001',
    name: 'Pintu Gerbang Utama Gerilya',
    siteId: 'site-d',
    siteName: 'Pergudangan Marunda',
    zoneFloor: 'Pos Gerbang Barat',
    tagType: 'QR Code Dynamic',
    tagUid: 'QR-MRD-001-A9F',
    coordinates: '-6.10540, 106.98320',
    frequency: 'Setiap 1 Jam',
    status: 'Aktif Normal',
    lastScanned: '14:15 WIB',
    lastGuard: 'Eko Wahyudi',
    mapX: 84,
    mapY: 52,
  },
];

export interface FindingItem {
  id: string;
  title: string;
  description: string;
  siteId: string;
  siteName: string;
  location: string;
  checkpointId?: string; // Explicit foreign link to CheckpointItem.id
  severity: 'Kritis' | 'Tinggi' | 'Sedang' | 'Rendah';
  reportedBy: string;
  reportedAt: string;
  status: 'Baru' | 'Dalam Penanganan' | 'Selesai Terverifikasi';
  assignedTo?: string;
  photoUrl?: string;
  notes?: string;
}

export const FINDINGS: FindingItem[] = [
  {
    id: 'FND-2025-081',
    title: 'Pintu Darurat Terganjal Palet Kayu',
    description: 'Akses keluar tangga darurat lantai 14 terhalang 3 palet kayu sisa renovasi kantor tenant 14B.',
    siteId: 'site-a',
    siteName: 'Sudirman Central Tower',
    location: 'Lantai 14 Koridor Sayap Timur',
    checkpointId: 'CP-SDR-014',
    severity: 'Tinggi',
    reportedBy: 'Rian Hidayat (Alpha-02)',
    reportedAt: '24 Mei 2025, 14:10 WIB',
    status: 'Dalam Penanganan',
    assignedTo: 'Tim Housekeeping & Fasilitas',
    photoUrl: 'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?w=800&auto=format&fit=crop&q=80',
    notes: 'Sudah dikoordinasikan dengan Building Management untuk dipindahkan dalam 30 menit.',
  },
  {
    id: 'FND-2025-080',
    title: 'APAR Kadaluarsa & Jarum Tekanan Merah',
    description: 'Unit APAR Powder 6kg di ruang trafo genset basement menunjukkan jarum tekanan di zona merah (drop).',
    siteId: 'site-a',
    siteName: 'Sudirman Central Tower',
    location: 'Basement 2 Ruang Trafo Panel Utama',
    checkpointId: 'CP-SDR-003',
    severity: 'Tinggi',
    reportedBy: 'Budi Hartono (Alpha-03)',
    reportedAt: '24 Mei 2025, 13:45 WIB',
    status: 'Baru',
    assignedTo: 'Tim K3 & Fire Safety',
    photoUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=800&auto=format&fit=crop&q=80',
    notes: 'Diperlukan penggantian tabung cadangan segera.',
  },
  {
    id: 'FND-2025-082',
    title: 'Temperatur Trafo Genset B2 Melebihi 52°C',
    description: 'Monitoring display suhu trafo sekunder menunjukkan lonjakan panas abnormal di atas ambang batas 50°C.',
    siteId: 'site-a',
    siteName: 'Sudirman Central Tower',
    location: 'Basement 2 Ruang Trafo Panel Utama',
    checkpointId: 'CP-SDR-003',
    severity: 'Kritis',
    reportedBy: 'Budi Hartono (Alpha-03)',
    reportedAt: '24 Mei 2025, 14:18 WIB',
    status: 'Baru',
    assignedTo: 'Teknisi Listrik Gedung',
    photoUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
    notes: 'Kipas pendingin tambahan telah dihidupkan, menunggu pengecekan beban gardu.',
  },
  {
    id: 'FND-2025-083',
    title: 'Palang Barrier Gate Dermaga 07 Macet',
    description: 'Motor hidrolik palang pembatas dermaga kontainer lambat merespons RFID saat truk peti kemas lewat.',
    siteId: 'site-b',
    siteName: 'Hub Logistik Cakung',
    location: 'Dermaga Kontainer Bay 07',
    checkpointId: 'CP-CKG-007',
    severity: 'Sedang',
    reportedBy: 'Agus Santoso (Charlie-01)',
    reportedAt: '24 Mei 2025, 14:22 WIB',
    status: 'Dalam Penanganan',
    assignedTo: 'Maintenance Dermaga',
    photoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
    notes: 'Pengaturan manual diaktifkan selama perbaikan sensor motor.',
  },
  {
    id: 'FND-2025-079',
    title: 'Lampu Penerangan Dermaga Padam 3 Titik',
    description: 'Dermaga Kontainer Bay 07-09 gelap total akibat saklar MCCB trip di panel distribusi luar.',
    siteId: 'site-b',
    siteName: 'Hub Logistik Cakung',
    location: 'Dermaga Kontainer Bay 07',
    checkpointId: 'CP-CKG-007',
    severity: 'Sedang',
    reportedBy: 'Agus Santoso (Charlie-01)',
    reportedAt: '24 Mei 2025, 12:30 WIB',
    status: 'Selesai Terverifikasi',
    assignedTo: 'Teknisi Elektrikal Cakung',
    notes: 'Sekring diganti oleh teknisi shift 1 pada pukul 13:15 WIB. Penerangan normal kembali.',
  },
  {
    id: 'FND-2025-078',
    title: 'Sensor Pagar Perimeter Kendor / Terkena Ranting',
    description: 'Alarm perimeter zona P12 aktif berkala (false positive) akibat ranting pohon menempel kabel sensor.',
    siteId: 'site-c',
    siteName: 'Data Center Cikarang',
    location: 'Pagar Sisi Selatan P12',
    checkpointId: 'CP-CKR-012',
    severity: 'Sedang',
    reportedBy: 'Doni Pratama (Delta-04)',
    reportedAt: '24 Mei 2025, 11:15 WIB',
    status: 'Selesai Terverifikasi',
    assignedTo: 'Regu Taman & Security',
    notes: 'Ranting pohon telah dipangkas. Sensor dikalibrasi ulang.',
  },
  {
    id: 'FND-2025-077',
    title: 'Gembok Pintu Gerbang Darurat Karatan',
    description: 'Kunci gembok susah dibuka saat simulasi jalur evakuasi barat.',
    siteId: 'site-d',
    siteName: 'Pergudangan Marunda',
    location: 'Pos Gerbang Barat',
    checkpointId: 'CP-MRD-001',
    severity: 'Rendah',
    reportedBy: 'Eko Wahyudi (Bravo-01)',
    reportedAt: '24 Mei 2025, 09:20 WIB',
    status: 'Baru',
    assignedTo: 'Danru Marunda',
    notes: 'Dibutuhkan pelumasan cairan anti-karat WD-40 atau penggantian master key.',
  },
];

import { PatrolQuestionItem, SystemAuditLog, SecurityLeaderboardItem } from '../utils/security-logic';

export const INITIAL_PATROL_QUESTIONS: PatrolQuestionItem[] = [
  {
    id: 'Q-001',
    category: 'K3 & Proteksi Kebakaran',
    questionText: 'Apakah lampu darurat (emergency light) menyala dan baterai cadangan terisi penuh?',
    description: 'Uji fungsional tombol test lampu darurat selama 3 detik untuk memastikan aktivasi otomatis saat listrik padam.',
    inputType: 'boolean',
    required: true,
    requirePhoto: false,
    autoTriggerFinding: true,
    findingSeverity: 'Tinggi',
    assignedCheckpoints: ['all'],
    status: 'Aktif',
    order: 1,
  },
  {
    id: 'Q-002',
    category: 'Akses & Pintu Darurat',
    questionText: 'Apakah akses pintu darurat bebas dari halangan, ganjalan palet, atau tumpukan barang tenant?',
    description: 'Periksa daun pintu, panic bar, dan engsel hidrolik door closer apakah menutup rapat otomatis.',
    inputType: 'boolean',
    required: true,
    requirePhoto: true,
    autoTriggerFinding: true,
    findingSeverity: 'Tinggi',
    assignedCheckpoints: ['CP-SDR-014', 'CP-MRD-001'],
    status: 'Aktif',
    order: 2,
  },
  {
    id: 'Q-003',
    category: 'K3 & Proteksi Kebakaran',
    questionText: 'Periksa posisi jarum manometer indikator tekanan tabung APAR:',
    description: 'Pastikan pin pengunci dan segel inspeksi tahunan masih utuh tanpa retak pada selang nozzle.',
    inputType: 'multiple_choice',
    options: ['Zona Hijau (Tekanan Normal)', 'Zona Merah Kiri (Tekanan Drop/Bocor)', 'Zona Merah Kanan (Overpressure)'],
    required: true,
    requirePhoto: true,
    autoTriggerFinding: true,
    findingSeverity: 'Tinggi',
    assignedCheckpoints: ['CP-SDR-003', 'CP-SDR-001', 'CP-CKG-007'],
    status: 'Aktif',
    order: 3,
  },
  {
    id: 'Q-004',
    category: 'Utilitas, Panel & Genset',
    questionText: 'Catat pembacaan nilai temperatur monitor Trafo & Panel Listrik Utama:',
    description: 'Ambang batas aman normal suhu operasi adalah 25°C - 50°C. Lebih dari 50°C wajib diinvestigasi.',
    inputType: 'numeric',
    unit: '°C',
    minVal: 15,
    maxVal: 85,
    required: true,
    requirePhoto: false,
    autoTriggerFinding: true,
    findingSeverity: 'Kritis',
    assignedCheckpoints: ['CP-SDR-003', 'CP-SDR-002'],
    status: 'Aktif',
    order: 4,
  },
  {
    id: 'Q-005',
    category: 'Perimeter & Pagar Pengaman',
    questionText: 'Kondisi fisik gembok rantai, sensor inframerah, dan kawat duri pagar pembatas:',
    description: 'Periksa apakah ada tanda-tanda pemotongan kawat duri, gesekan ranting, atau upaya perusakan.',
    inputType: 'multiple_choice',
    options: ['Terkunci Rapat & Bersih (Aman)', 'Karat / Seret Perlu Pelumas', 'Terpotong / Rusak Fisik'],
    required: true,
    requirePhoto: true,
    autoTriggerFinding: true,
    findingSeverity: 'Kritis',
    assignedCheckpoints: ['CP-CKR-012', 'CP-MRD-001'],
    status: 'Aktif',
    order: 5,
  },
  {
    id: 'Q-006',
    category: 'Logistik & Area Dermaga',
    questionText: 'Apakah palang penghalang otomatis (barrier gate) dan lampu sinyal dermaga beroperasi normal?',
    description: 'Verifikasi sensor deteksi loop kendaraan dan mekanisme motor saat kartu akses disodorkan.',
    inputType: 'boolean',
    required: true,
    requirePhoto: false,
    autoTriggerFinding: true,
    findingSeverity: 'Sedang',
    assignedCheckpoints: ['CP-CKG-007', 'CP-CKG-002'],
    status: 'Aktif',
    order: 6,
  },
  {
    id: 'Q-007',
    category: 'Peralatan & Aset Vital',
    questionText: 'Tingkat kebersihan, ketertiban, dan kesiapan operasional pos jaga:',
    description: 'Evaluasi kesiapan alat komunikasi HT, senter patroli cadangan, dan logbook serah terima shift.',
    inputType: 'rating',
    required: false,
    requirePhoto: false,
    autoTriggerFinding: false,
    findingSeverity: 'Rendah',
    assignedCheckpoints: ['all'],
    status: 'Aktif',
    order: 7,
  },
  {
    id: 'Q-008',
    category: 'Akses & Pintu Darurat',
    questionText: 'Catatan anomali khusus atau instruksi tindak lanjut untuk petugas regu berikutnya:',
    description: 'Tuliskan rincian jika ada hal mencurigakan, kunci titipan, atau instruksi tenant di luar SOP.',
    inputType: 'text',
    required: false,
    requirePhoto: false,
    autoTriggerFinding: false,
    findingSeverity: 'Rendah',
    assignedCheckpoints: ['all'],
    status: 'Aktif',
    order: 8,
  },
];

export interface IncidentItem {
  id: string;
  title: string;
  description: string;
  siteId: string;
  siteName: string;
  location: string;
  severity: 'Kritis' | 'Tinggi' | 'Sedang';
  reportedBy: string;
  reportedAt: string;
  responseTime: string;
  status: 'Darurat Kritis' | 'Penanganan Lapangan' | 'Terkendali & Teratasi';
  trcDispatched: boolean;
  trcUnits: string[];
  externalAuthoritiesContacted: string[];
  radioLog: { time: string; caller: string; message: string }[];
}

export const INCIDENTS: IncidentItem[] = [
  {
    id: 'INC-2025-014',
    title: 'Alarm Tombol Panik SOS Pos Jaga 2 Aktif',
    description: 'Petugas jaga Pos 2 Cakung mengaktifkan tombol darurat fisik setelah mendeteksi upaya pemaksaan masuk gerbang oleh 4 orang tidak dikenal.',
    siteId: 'site-b',
    siteName: 'Hub Logistik Cakung',
    location: 'Gerbang Masuk Truk Barat Kav. 8',
    severity: 'Kritis',
    reportedBy: 'Agus Santoso (Charlie-01)',
    reportedAt: '14:22 WIB',
    responseTime: '1 menit 40 detik',
    status: 'Penanganan Lapangan',
    trcDispatched: true,
    trcUnits: ['TRC Posko Cakung (3 Personel)', 'Mobil Patroli CKG-1'],
    externalAuthoritiesContacted: ['Polsek Cakung (Kordinasi Siaga)'],
    radioLog: [
      { time: '14:22:10', caller: 'Charlie-01', message: 'Mayday Mayday! Tombol darurat Pos 2 aktif, ada upaya dobrak gerbang barat!' },
      { time: '14:22:30', caller: 'Komando Posko', message: 'Diterima Charlie-01, TRC 3 personel bergerak dengan mobil patroli. Tetap di balik pos pengaman!' },
      { time: '14:23:50', caller: 'TRC CKG-1', message: 'TRC tiba di TKP. Situasi berhasil diisolasi, pelaku mundur ke arah jalan raya.' },
    ],
  },
  {
    id: 'INC-2025-013',
    title: 'Percikan Api Panel Distribusi Utama Genset B2',
    description: 'Asap terdeteksi pada panel trafo 20kV saat peralihan beban otomatis mingguan.',
    siteId: 'site-a',
    siteName: 'Sudirman Central Tower',
    location: 'Basement 2 Ruang Power Utama',
    severity: 'Tinggi',
    reportedBy: 'Budi Hartono (Alpha-03)',
    reportedAt: '11:15 WIB',
    responseTime: '2 menit 10 detik',
    status: 'Terkendali & Teratasi',
    trcDispatched: true,
    trcUnits: ['Regu Pemadam Internal Gedung', 'Tim K3'],
    externalAuthoritiesContacted: ['Damkar Sektor Setiabudi (Standby)'],
    radioLog: [
      { time: '11:15:00', caller: 'Alpha-03', message: 'Asap tipis keluar dari panel genset 2, bau gosong kabel.' },
      { time: '11:17:10', caller: 'Chief Engineering', message: 'Listrik dialihkan ke backup line, APAR CO2 sudah disemprotkan. Aman terkendali.' },
    ],
  },
];

export interface NfcTagItem {
  uid: string;
  type: 'NFC NTAG213' | 'Mifare Classic 1K' | 'RFID UHF 860MHz' | 'NTAG215';
  siteId: string;
  siteName: string;
  linkedCheckpointId: string;
  linkedCheckpointName: string;
  signalDbm: number;
  batteryPercent: number | 'Pasif';
  encryption: 'AES-128 Enkripsi Aktif' | 'Standard Read-Only';
  installedDate: string;
  status: 'Terkoneksi Normal' | 'Siaga Kalibrasi' | 'Sinyal Lemah' | 'Tag Rusak' | 'Belum Ditautkan';
}

export const NFC_TAGS: NfcTagItem[] = [
  {
    uid: '04:A2:3B:5F:8C:1D:9E',
    type: 'NFC NTAG213',
    siteId: 'site-a',
    siteName: 'Sudirman Central Tower',
    linkedCheckpointId: 'CP-SDR-001',
    linkedCheckpointName: 'Pintu Masuk Lobi Utama',
    signalDbm: -58,
    batteryPercent: 'Pasif',
    encryption: 'AES-128 Enkripsi Aktif',
    installedDate: '12 Jan 2024',
    status: 'Terkoneksi Normal',
  },
  {
    uid: '04:C5:11:9A:2E:77:80',
    type: 'NFC NTAG213',
    siteId: 'site-a',
    siteName: 'Sudirman Central Tower',
    linkedCheckpointId: 'CP-SDR-003',
    linkedCheckpointName: 'Ruang Trafo & Genset Darurat B2',
    signalDbm: -84,
    batteryPercent: 'Pasif',
    encryption: 'AES-128 Enkripsi Aktif',
    installedDate: '15 Feb 2024',
    status: 'Siaga Kalibrasi',
  },
  {
    uid: '04:19:6F:42:0B:3C:99',
    type: 'NFC NTAG213',
    siteId: 'site-a',
    siteName: 'Sudirman Central Tower',
    linkedCheckpointId: 'CP-SDR-014',
    linkedCheckpointName: 'Pintu Darurat Timur Lt. 14',
    signalDbm: -62,
    batteryPercent: 'Pasif',
    encryption: 'AES-128 Enkripsi Aktif',
    installedDate: '10 Mar 2024',
    status: 'Terkoneksi Normal',
  },
  {
    uid: 'E2:80:11:60:20:00:15',
    type: 'RFID UHF 860MHz',
    siteId: 'site-b',
    siteName: 'Hub Logistik Cakung',
    linkedCheckpointId: 'CP-CKG-007',
    linkedCheckpointName: 'Dermaga Kontainer Bay 07',
    signalDbm: -52,
    batteryPercent: 92,
    encryption: 'AES-128 Enkripsi Aktif',
    installedDate: '01 Nov 2023',
    status: 'Terkoneksi Normal',
  },
  {
    uid: '04:88:7C:12:34:56:78',
    type: 'NTAG215',
    siteId: 'site-c',
    siteName: 'Data Center Cikarang',
    linkedCheckpointId: 'CP-CKR-012',
    linkedCheckpointName: 'Perimeter Pagar Sensor P12',
    signalDbm: -67,
    batteryPercent: 'Pasif',
    encryption: 'AES-128 Enkripsi Aktif',
    installedDate: '20 Mei 2024',
    status: 'Terkoneksi Normal',
  },
];

export interface PatrolLogHistory {
  id: string;
  siteId: string;
  siteName: string;
  squad: string;
  danru: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  totalPoints: number;
  scannedPoints: number;
  missedPoints: number;
  complianceRate: number;
  supervisorSignOff: string;
  status: 'Lengkap Tuntas' | 'Sebagian Terlewat' | 'Dibatalkan Darurat';
  notes: string;
}

export const PATROL_LOGS: PatrolLogHistory[] = [
  {
    id: 'LOG-2025-0524-A1',
    siteId: 'site-a',
    siteName: 'Sudirman Central Tower',
    squad: 'Regu Alpha (Sub-tim 1)',
    danru: 'Ahmad Fauzi',
    date: '24 Mei 2025',
    startTime: '13:00 WIB',
    endTime: '14:15 WIB',
    durationMinutes: 75,
    totalPoints: 36,
    scannedPoints: 36,
    missedPoints: 0,
    complianceRate: 100,
    supervisorSignOff: 'Bambang Prasetyo (Superintendent)',
    status: 'Lengkap Tuntas',
    notes: 'Seluruh titik checkpoint tervaliasi tanpa anomali keamanan.',
  },
  {
    id: 'LOG-2025-0524-B1',
    siteId: 'site-b',
    siteName: 'Hub Logistik Cakung',
    squad: 'Regu Bravo',
    danru: 'Bambang Sudrajat',
    date: '24 Mei 2025',
    startTime: '11:00 WIB',
    endTime: '12:20 WIB',
    durationMinutes: 80,
    totalPoints: 22,
    scannedPoints: 21,
    missedPoints: 1,
    complianceRate: 95.5,
    supervisorSignOff: 'Bambang Prasetyo (Superintendent)',
    status: 'Sebagian Terlewat',
    notes: 'Titik CP-CKG-009 terlewat akibat forklift bongkar muat menutupi akses dinding.',
  },
  {
    id: 'LOG-2025-0524-C1',
    siteId: 'site-c',
    siteName: 'Data Center Cikarang',
    squad: 'Regu Delta',
    danru: 'Joko Susilo',
    date: '24 Mei 2025',
    startTime: '09:00 WIB',
    endTime: '10:30 WIB',
    durationMinutes: 90,
    totalPoints: 25,
    scannedPoints: 25,
    missedPoints: 0,
    complianceRate: 100,
    supervisorSignOff: 'Bambang Prasetyo (Superintendent)',
    status: 'Lengkap Tuntas',
    notes: 'Pemeriksaan perimeter perimeter sensor selesai 100%.',
  },
  {
    id: 'LOG-2025-0523-A3',
    siteId: 'site-a',
    siteName: 'Sudirman Central Tower',
    squad: 'Regu Alpha',
    danru: 'Ahmad Fauzi',
    date: '23 Mei 2025',
    startTime: '23:00 WIB',
    endTime: '00:45 WIB',
    durationMinutes: 105,
    totalPoints: 36,
    scannedPoints: 36,
    missedPoints: 0,
    complianceRate: 100,
    supervisorSignOff: 'Bambang Prasetyo (Superintendent)',
    status: 'Lengkap Tuntas',
    notes: 'Shift malam berjalan tertib, pintu kaca lobi terkunci ganda.',
  },
];

export interface UserAccount {
  id: string;
  npp: string;
  fullName: string;
  role: 'Security Superintendent' | 'Komandan Regu (Danru)' | 'Petugas Lapangan' | 'Operator Posko / Dispatcher';
  siteId: string;
  siteName: string;
  squad?: string;
  certification: 'Gada Pratama' | 'Gada Madya' | 'Gada Utama' | 'K3 Umum';
  phone: string;
  radioCallSign: string;
  status: 'Aktif' | 'Cuti' | 'Nonaktif';
  email: string;
}

export const USER_ACCOUNTS: UserAccount[] = [
  {
    id: 'USR-001',
    npp: 'NPP-882101',
    fullName: 'Bambang Prasetyo',
    role: 'Security Superintendent',
    siteId: 'all',
    siteName: 'Headquarter / Multi-Site',
    certification: 'Gada Utama',
    phone: '0812-9844-1100',
    radioCallSign: 'Komando-01',
    status: 'Aktif',
    email: 'bambang.prasetyo@pamarea.co.id',
  },
  {
    id: 'USR-002',
    npp: 'NPP-882144',
    fullName: 'Ahmad Fauzi',
    role: 'Komandan Regu (Danru)',
    siteId: 'site-a',
    siteName: 'Sudirman Central Tower',
    squad: 'Regu Alpha',
    certification: 'Gada Madya',
    phone: '0813-8821-4455',
    radioCallSign: 'Alpha-01',
    status: 'Aktif',
    email: 'ahmad.fauzi@pamarea.co.id',
  },
  {
    id: 'USR-003',
    npp: 'NPP-882189',
    fullName: 'Rian Hidayat',
    role: 'Petugas Lapangan',
    siteId: 'site-a',
    siteName: 'Sudirman Central Tower',
    squad: 'Regu Alpha',
    certification: 'Gada Pratama',
    phone: '0815-7762-3390',
    radioCallSign: 'Alpha-02',
    status: 'Aktif',
    email: 'rian.hidayat@pamarea.co.id',
  },
  {
    id: 'USR-004',
    npp: 'NPP-882190',
    fullName: 'Budi Hartono',
    role: 'Petugas Lapangan',
    siteId: 'site-a',
    siteName: 'Sudirman Central Tower',
    squad: 'Regu Alpha',
    certification: 'Gada Pratama',
    phone: '0816-5541-2299',
    radioCallSign: 'Alpha-03',
    status: 'Aktif',
    email: 'budi.hartono@pamarea.co.id',
  },
  {
    id: 'USR-005',
    npp: 'NPP-883011',
    fullName: 'Wahyu Hidayat',
    role: 'Komandan Regu (Danru)',
    siteId: 'site-b',
    siteName: 'Hub Logistik Cakung',
    squad: 'Regu Charlie',
    certification: 'Gada Madya',
    phone: '0817-2233-4411',
    radioCallSign: 'Charlie-01',
    status: 'Aktif',
    email: 'wahyu.hidayat@pamarea.co.id',
  },
  {
    id: 'USR-006',
    npp: 'NPP-883045',
    fullName: 'Joko Susilo',
    role: 'Komandan Regu (Danru)',
    siteId: 'site-c',
    siteName: 'Data Center Cikarang',
    squad: 'Regu Delta',
    certification: 'Gada Madya',
    phone: '0818-9900-1122',
    radioCallSign: 'Delta-01',
    status: 'Aktif',
    email: 'joko.susilo@pamarea.co.id',
  },
  {
    id: 'USR-007',
    npp: 'NPP-884012',
    fullName: 'Siti Rahmawati',
    role: 'Operator Posko / Dispatcher',
    siteId: 'all',
    siteName: 'Pusat Komando SOC',
    certification: 'K3 Umum',
    phone: '0819-3344-5566',
    radioCallSign: 'Dispatcher-01',
    status: 'Aktif',
    email: 'siti.rahmawati@pamarea.co.id',
  },
];

export interface SecuritySquadItem {
  id: string;
  name: string;
  danru: string;
  siteId: string;
  siteName: string;
  shiftDefault: 'Shift Pagi (07:00 - 15:00)' | 'Shift Siang (15:00 - 23:00)' | 'Shift Malam (23:00 - 07:00)';
  memberCount: number;
  status: 'Siaga Penuh' | 'Sedang Bertugas' | 'Off / Libur';
  contactRadio: string;
  assignedSector: string;
}

export const INITIAL_SQUADS: SecuritySquadItem[] = [
  {
    id: 'SQD-01',
    name: 'Regu Alpha',
    danru: 'Ahmad Fauzi',
    siteId: 'site-a',
    siteName: 'Sudirman Central Tower',
    shiftDefault: 'Shift Siang (15:00 - 23:00)',
    memberCount: 8,
    status: 'Sedang Bertugas',
    contactRadio: 'Alpha-01 (CH-02)',
    assignedSector: 'Podium Utama & Lobi VIP',
  },
  {
    id: 'SQD-02',
    name: 'Regu Bravo',
    danru: 'Bambang Sudrajat',
    siteId: 'site-b',
    siteName: 'Hub Logistik Cakung',
    shiftDefault: 'Shift Pagi (07:00 - 15:00)',
    memberCount: 6,
    status: 'Siaga Penuh',
    contactRadio: 'Bravo-01 (CH-03)',
    assignedSector: 'Gudang Kimia & Gerbang Tol',
  },
  {
    id: 'SQD-03',
    name: 'Regu Charlie',
    danru: 'Wahyu Hidayat',
    siteId: 'site-b',
    siteName: 'Hub Logistik Cakung',
    shiftDefault: 'Shift Malam (23:00 - 07:00)',
    memberCount: 6,
    status: 'Siaga Penuh',
    contactRadio: 'Charlie-01 (CH-04)',
    assignedSector: 'Dermaga Kontainer & Yard Utara',
  },
  {
    id: 'SQD-04',
    name: 'Regu Delta',
    danru: 'Joko Susilo',
    siteId: 'site-c',
    siteName: 'Data Center Cikarang',
    shiftDefault: 'Shift Pagi (07:00 - 15:00)',
    memberCount: 10,
    status: 'Sedang Bertugas',
    contactRadio: 'Delta-01 (CH-05)',
    assignedSector: 'Server Vault & Perimeter Selatan',
  },
  {
    id: 'SQD-05',
    name: 'Regu Echo (Cadangan Khusus)',
    danru: 'Teguh Santoso',
    siteId: 'all',
    siteName: 'Semua Area (Site)',
    shiftDefault: 'Shift Pagi (07:00 - 15:00)',
    memberCount: 5,
    status: 'Siaga Penuh',
    contactRadio: 'Echo-01 (CH-01)',
    assignedSector: 'Tim Reaksi Cepat / Cadangan',
  },
];

export const SYSTEM_AUDIT_LOGS: SystemAuditLog[] = [
  {
    id: 'AUD-2025-0524-001',
    timestamp: '24 Mei 2025, 14:38:12 WIB',
    category: 'Admin & Pengguna',
    action: 'Tambah Pengguna Baru',
    actorName: 'Bambang Prasetyo (Superintendent)',
    actorRole: 'Admin',
    targetEntity: 'USR-011 (Surya Pratama)',
    siteId: 'site-a',
    siteName: 'Sudirman Central Tower',
    status: 'Berhasil',
    details: 'Mendaftarkan petugas lapangan baru (NPP-885001) dengan kualifikasi Gada Pratama dan penugasan di Regu Alpha.',
    ipAddress: '192.168.10.45',
    device: 'Desktop Chrome / Workstation SOC-01',
  },
  {
    id: 'AUD-2025-0524-002',
    timestamp: '24 Mei 2025, 14:30:22 WIB',
    category: 'Operasional Patroli',
    action: 'Pindai Titik Checkpoint NFC',
    actorName: 'Rian Hidayat (Alpha-02)',
    actorRole: 'Satpam',
    targetEntity: 'CP-SDR-014 (Pintu Darurat Timur Lt. 14)',
    siteId: 'site-a',
    siteName: 'Sudirman Central Tower',
    status: 'Berhasil',
    details: 'Berhasil memindai tag NFC NTAG213 (UID: 04:19:6F:42:0B:3C:99) tepat waktu dengan kepatuhan rute 100%.',
    ipAddress: '10.20.4.112',
    device: 'Mobile Guard Handheld PDA-04',
  },
  {
    id: 'AUD-2025-0524-003',
    timestamp: '24 Mei 2025, 14:26:05 WIB',
    category: 'Operasional Patroli',
    action: 'Pindai Titik Checkpoint RFID',
    actorName: 'Agus Santoso (Charlie-01)',
    actorRole: 'Satpam',
    targetEntity: 'CP-CKG-007 (Dermaga Kontainer Bay 07)',
    siteId: 'site-b',
    siteName: 'Hub Logistik Cakung',
    status: 'Berhasil',
    details: 'Scan tag RFID UHF jarak jauh berhasil pada koordinat yard utara.',
    ipAddress: '10.20.8.44',
    device: 'Mobile Guard Handheld PDA-09',
  },
  {
    id: 'AUD-2025-0524-004',
    timestamp: '24 Mei 2025, 14:18:40 WIB',
    category: 'Temuan & Insiden',
    action: 'Pelaporan Temuan Anomali Kritis',
    actorName: 'Budi Hartono (Alpha-03)',
    actorRole: 'Satpam',
    targetEntity: 'FND-2025-082 (Temperatur Trafo Genset B2)',
    siteId: 'site-a',
    siteName: 'Sudirman Central Tower',
    status: 'Peringatan',
    details: 'Melaporkan lonjakan panas abnormal 52°C pada trafo sekunder basement 2 dengan bukti foto digital.',
    ipAddress: '10.20.4.115',
    device: 'Mobile Guard Handheld PDA-05',
  },
  {
    id: 'AUD-2025-0524-005',
    timestamp: '24 Mei 2025, 14:12:15 WIB',
    category: 'Jadwal & Shift',
    action: 'Persetujuan Tukar Shift (Swap)',
    actorName: 'Danru Ahmad Fauzi',
    actorRole: 'Danru',
    targetEntity: 'SWP-20250524-001 (Rian Hidayat ⇄ Wahyu Hidayat)',
    siteId: 'site-a',
    siteName: 'Sudirman Central Tower',
    status: 'Berhasil',
    details: 'Menyetujui permohonan pertukaran shift jaga malam dan siang karena penyesuaian jadwal kuliah dan keluarga.',
    ipAddress: '192.168.10.62',
    device: 'Tablet Danru Sektor-A',
  },
  {
    id: 'AUD-2025-0524-006',
    timestamp: '24 Mei 2025, 13:55:00 WIB',
    category: 'Tag & Checkpoint',
    action: 'Tautkan Tag NFC ke Checkpoint',
    actorName: 'Bambang Prasetyo (Superintendent)',
    actorRole: 'Admin',
    targetEntity: 'CP-SDR-014 ⇄ Tag UID 04:19:6F:42:0B:3C:99',
    siteId: 'site-a',
    siteName: 'Sudirman Central Tower',
    status: 'Berhasil',
    details: 'Sinkronisasi koneksi tag NFC NTAG213 ke titik checkpoint Pintu Darurat Timur Lt. 14 dengan verifikasi sinyal -62 dBm.',
    ipAddress: '192.168.10.45',
    device: 'Desktop Chrome / Workstation SOC-01',
  },
  {
    id: 'AUD-2025-0524-007',
    timestamp: '24 Mei 2025, 13:40:18 WIB',
    category: 'Temuan & Insiden',
    action: 'Update Status Temuan Selesai',
    actorName: 'Danru Wahyu Hidayat',
    actorRole: 'Danru',
    targetEntity: 'FND-2025-079 (Lampu Penerangan Dermaga Cakung)',
    siteId: 'site-b',
    siteName: 'Hub Logistik Cakung',
    status: 'Berhasil',
    details: 'Verifikasi penyelesaian penggantian sekring MCCB oleh teknisi shift 1, status diubah menjadi Selesai Terverifikasi.',
    ipAddress: '192.168.20.14',
    device: 'Workstation Pos Komando Cakung',
  },
  {
    id: 'AUD-2025-0524-008',
    timestamp: '24 Mei 2025, 13:15:30 WIB',
    category: 'Admin & Pengguna',
    action: 'Tambah Regu Pengamanan Baru',
    actorName: 'Bambang Prasetyo (Superintendent)',
    actorRole: 'Admin',
    targetEntity: 'SQD-05 (Regu Echo Cadangan Khusus)',
    siteId: 'all',
    siteName: 'Semua Area (Site)',
    status: 'Berhasil',
    details: 'Membentuk Regu Echo dengan 5 personel Tim Reaksi Cepat di bawah komando Danru Teguh Santoso.',
    ipAddress: '192.168.10.45',
    device: 'Desktop Chrome / Workstation SOC-01',
  },
  {
    id: 'AUD-2025-0524-009',
    timestamp: '24 Mei 2025, 12:45:10 WIB',
    category: 'Jadwal & Shift',
    action: 'Persetujuan Pengajuan Cuti Personel',
    actorName: 'Danru Bambang Sudrajat',
    actorRole: 'Danru',
    targetEntity: 'LEV-001 (Agus Setiawan)',
    siteId: 'site-b',
    siteName: 'Hub Logistik Cakung',
    status: 'Berhasil',
    details: 'Menyetujui cuti tahunan tanggal 25-27 Mei 2025 dengan menunjuk Arif Wibowo sebagai personel pengganti.',
    ipAddress: '192.168.20.19',
    device: 'Tablet Danru Sektor-B',
  },
  {
    id: 'AUD-2025-0524-010',
    timestamp: '24 Mei 2025, 11:20:00 WIB',
    category: 'Tag & Checkpoint',
    action: 'Lepas Tautan Tag NFC (Unassign)',
    actorName: 'Bambang Prasetyo (Superintendent)',
    actorRole: 'Admin',
    targetEntity: 'CP-CKG-002 (Pos Pemeriksaan Muatan Gerbang Masuk)',
    siteId: 'site-b',
    siteName: 'Hub Logistik Cakung',
    status: 'Berhasil',
    details: 'Melepaskan tag RFID UHF (E2:80:11:60:20:00:22) untuk keperluan penggantian bracket pelindung outdoor.',
    ipAddress: '192.168.10.45',
    device: 'Desktop Chrome / Workstation SOC-01',
  },
];

export const SECURITY_LEADERBOARD_DATA: SecurityLeaderboardItem[] = [
  {
    rank: 1,
    id: 'USR-003',
    npp: 'NPP-882189',
    name: 'Rian Hidayat',
    role: 'Petugas Lapangan',
    squad: 'Regu Alpha',
    siteId: 'site-a',
    siteName: 'Sudirman Central Tower',
    totalCheckpointsScanned: 38,
    complianceRate: 99.8,
    onTimeRate: 98.9,
    findingsReported: 2,
    incidentsResolved: 1,
    score: 99.4,
    status: 'Bertugas Aktif',
    badgeTitle: 'Top Performer Bulan Ini',
  },
  {
    rank: 2,
    id: 'USR-004',
    npp: 'NPP-882190',
    name: 'Budi Hartono',
    role: 'Petugas Lapangan',
    squad: 'Regu Alpha',
    siteId: 'site-a',
    siteName: 'Sudirman Central Tower',
    totalCheckpointsScanned: 36,
    complianceRate: 98.5,
    onTimeRate: 97.4,
    findingsReported: 3,
    incidentsResolved: 2,
    score: 98.2,
    status: 'Bertugas Aktif',
    badgeTitle: 'Detektif Anomali Kritis',
  },
  {
    rank: 3,
    id: 'USR-002',
    npp: 'NPP-882144',
    name: 'Ahmad Fauzi',
    role: 'Komandan Regu (Danru)',
    squad: 'Regu Alpha',
    siteId: 'site-a',
    siteName: 'Sudirman Central Tower',
    totalCheckpointsScanned: 30,
    complianceRate: 100.0,
    onTimeRate: 98.0,
    findingsReported: 2,
    incidentsResolved: 2,
    score: 98.0,
    status: 'Bertugas Aktif',
    badgeTitle: 'Danru Teladan & Responsif',
  },
  {
    rank: 4,
    id: 'USR-008',
    npp: 'NPP-883100',
    name: 'Agus Santoso',
    role: 'Petugas Lapangan',
    squad: 'Regu Charlie',
    siteId: 'site-b',
    siteName: 'Hub Logistik Cakung',
    totalCheckpointsScanned: 34,
    complianceRate: 98.0,
    onTimeRate: 96.5,
    findingsReported: 1,
    incidentsResolved: 1,
    score: 97.6,
    status: 'Bertugas Aktif',
    badgeTitle: 'Patroli Yard Terkonsisten',
  },
  {
    rank: 5,
    id: 'USR-009',
    npp: 'NPP-883120',
    name: 'Doni Pratama',
    role: 'Petugas Lapangan',
    squad: 'Regu Delta',
    siteId: 'site-c',
    siteName: 'Data Center Cikarang',
    totalCheckpointsScanned: 32,
    complianceRate: 97.2,
    onTimeRate: 95.8,
    findingsReported: 1,
    incidentsResolved: 0,
    score: 96.8,
    status: 'Bertugas Aktif',
    badgeTitle: 'Penjaga Perimeter Handal',
  },
  {
    rank: 6,
    id: 'USR-005',
    npp: 'NPP-883011',
    name: 'Wahyu Hidayat',
    role: 'Komandan Regu (Danru)',
    squad: 'Regu Charlie',
    siteId: 'site-b',
    siteName: 'Hub Logistik Cakung',
    totalCheckpointsScanned: 26,
    complianceRate: 97.5,
    onTimeRate: 95.0,
    findingsReported: 1,
    incidentsResolved: 1,
    score: 96.4,
    status: 'Siaga di Pos',
    badgeTitle: 'Pengawas Logistik Terdisiplin',
  },
  {
    rank: 7,
    id: 'USR-006',
    npp: 'NPP-883045',
    name: 'Joko Susilo',
    role: 'Komandan Regu (Danru)',
    squad: 'Regu Delta',
    siteId: 'site-c',
    siteName: 'Data Center Cikarang',
    totalCheckpointsScanned: 25,
    complianceRate: 96.8,
    onTimeRate: 94.5,
    findingsReported: 0,
    incidentsResolved: 1,
    score: 96.0,
    status: 'Siaga di Pos',
    badgeTitle: 'Integritas Posko Cikarang',
  },
  {
    rank: 8,
    id: 'USR-010',
    npp: 'NPP-883130',
    name: 'Eko Wahyudi',
    role: 'Petugas Lapangan',
    squad: 'Regu Bravo',
    siteId: 'site-d',
    siteName: 'Pergudangan Marunda',
    totalCheckpointsScanned: 28,
    complianceRate: 96.0,
    onTimeRate: 94.2,
    findingsReported: 1,
    incidentsResolved: 0,
    score: 95.5,
    status: 'Bertugas Aktif',
    badgeTitle: 'Disiplin Shift Siaga',
  },
];

