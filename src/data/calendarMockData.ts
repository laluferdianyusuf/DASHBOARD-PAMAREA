import { DayShift, CalendarShiftItem, ShiftOfficerAssignment } from '../utils/security-logic';

export const INITIAL_OFFICERS_POOL: ShiftOfficerAssignment[] = [
  {
    officerId: 'USR-002',
    officerName: 'Ahmad Fauzi',
    role: 'Komandan Regu (Danru)',
    post: 'Pos Komando Lobi Utama',
    npp: 'NPP-882144',
    callSign: 'Alpha-01',
    phone: '0813-8821-4455',
  },
  {
    officerId: 'USR-003',
    officerName: 'Rian Hidayat',
    role: 'Petugas Lapangan',
    post: 'Pintu Masuk Lobi Utama & Metal Detector',
    npp: 'NPP-882189',
    callSign: 'Alpha-02',
    phone: '0815-7762-3390',
  },
  {
    officerId: 'USR-004',
    officerName: 'Budi Hartono',
    role: 'Petugas Lapangan',
    post: 'Patroli Lift & Koridor VIP Lantai 1-10',
    npp: 'NPP-882190',
    callSign: 'Alpha-03',
    phone: '0816-5541-2299',
  },
  {
    officerId: 'USR-008',
    officerName: 'Agus Setiawan',
    role: 'Petugas Lapangan',
    post: 'Pintu Evakuasi Barat & Loading Bay',
    npp: 'NPP-882195',
    callSign: 'Alpha-04',
    phone: '0812-4433-2211',
  },
  {
    officerId: 'USR-005',
    officerName: 'Wahyu Hidayat',
    role: 'Komandan Regu (Danru)',
    post: 'Pos Pengawasan Dermaga Kontainer',
    npp: 'NPP-883011',
    callSign: 'Charlie-01',
    phone: '0817-2233-4411',
  },
  {
    officerId: 'USR-009',
    officerName: 'Surya Saputra',
    role: 'Petugas Lapangan',
    post: 'Patroli Yard Kontainer Utara',
    npp: 'NPP-883012',
    callSign: 'Charlie-02',
    phone: '0817-5566-7788',
  },
  {
    officerId: 'USR-010',
    officerName: 'Arif Wibowo',
    role: 'Petugas Lapangan',
    post: 'Pos Timbangan & Pintu Gerbang Tol',
    npp: 'NPP-883013',
    callSign: 'Charlie-03',
    phone: '0817-9988-7766',
  },
  {
    officerId: 'USR-006',
    officerName: 'Joko Susilo',
    role: 'Komandan Regu (Danru)',
    post: 'Pos Pengamanan Server Vault B2',
    npp: 'NPP-883045',
    callSign: 'Delta-01',
    phone: '0818-9900-1122',
  },
  {
    officerId: 'USR-011',
    officerName: 'Hendra Kurniawan',
    role: 'Petugas Lapangan',
    post: 'Ruang Server & Genset Darurat',
    npp: 'NPP-883046',
    callSign: 'Delta-02',
    phone: '0818-1122-3344',
  },
  {
    officerId: 'USR-012',
    officerName: 'Eko Prasetyo',
    role: 'Petugas Lapangan',
    post: 'Patroli Perimeter Selatan & Pagar Listrik',
    npp: 'NPP-883047',
    callSign: 'Delta-03',
    phone: '0818-5544-3322',
  },
  {
    officerId: 'USR-013',
    officerName: 'Dedi Mulyadi',
    role: 'Petugas Lapangan',
    post: 'Gerbang Timur & Pos Pemeriksaan X-Ray',
    npp: 'NPP-883048',
    callSign: 'Delta-04',
    phone: '0818-6677-8899',
  },
  {
    officerId: 'USR-014',
    officerName: 'Fajar Nugroho',
    role: 'Petugas Lapangan',
    post: 'Pos Pantau CCTV & Loading Bay Logistik',
    npp: 'NPP-883049',
    callSign: 'Delta-05',
    phone: '0818-7788-9900',
  },
  {
    officerId: 'USR-015',
    officerName: 'Teguh Santoso',
    role: 'Komandan Regu Cadangan',
    post: 'Pusat Komando Reaksi Cepat',
    npp: 'NPP-884100',
    callSign: 'Echo-01',
    phone: '0819-1100-2233',
  },
  {
    officerId: 'USR-016',
    officerName: 'Bambang Sudrajat',
    role: 'Komandan Regu (Danru)',
    post: 'Posko Gerbang Utama Hub Cakung',
    npp: 'NPP-882200',
    callSign: 'Bravo-01',
    phone: '0811-2233-4455',
  },
];

export const INITIAL_CALENDAR_DAYS: (DayShift | null)[] = [
  null, null, null, // Mon, Tue, Wed empty padding (May 1 starts Thursday)
  {
    day: 1,
    dateStr: '2025-05-01',
    shifts: [
      {
        type: 'Pagi',
        squad: 'Regu Alpha',
        danru: 'Ahmad Fauzi',
        count: 4,
        required: 4,
        sector: 'Lobi & Perimeter',
        siteName: 'Sudirman Central Tower',
        officers: INITIAL_OFFICERS_POOL.slice(0, 4),
      },
      {
        type: 'Siang',
        squad: 'Regu Bravo',
        danru: 'Bambang Sudrajat',
        count: 4,
        required: 4,
        sector: 'Gudang & Tol',
        siteName: 'Hub Logistik Cakung',
      },
      {
        type: 'Malam',
        squad: 'Regu Charlie',
        danru: 'Wahyu Hidayat',
        count: 4,
        required: 4,
        sector: 'Dermaga & Yard',
        siteName: 'Hub Logistik Cakung',
      },
    ],
  },
  {
    day: 2,
    dateStr: '2025-05-02',
    shifts: [
      { type: 'Pagi', squad: 'Regu Delta', danru: 'Joko Susilo', count: 5, required: 5 },
      { type: 'Siang', squad: 'Regu Alpha', danru: 'Ahmad Fauzi', count: 4, required: 4 },
      { type: 'Malam', squad: 'Regu Bravo', danru: 'Bambang Sudrajat', count: 4, required: 4 },
    ],
  },
  {
    day: 3,
    dateStr: '2025-05-03',
    shifts: [
      { type: 'Pagi', squad: 'Regu Charlie', danru: 'Wahyu Hidayat', count: 4, required: 4 },
      { type: 'Siang', squad: 'Regu Delta', danru: 'Joko Susilo', count: 5, required: 5 },
      { type: 'Malam', squad: 'Regu Alpha', danru: 'Ahmad Fauzi', count: 4, required: 4 },
    ],
  },
  {
    day: 4,
    dateStr: '2025-05-04',
    shifts: [
      { type: 'Pagi', squad: 'Regu Bravo', danru: 'Bambang Sudrajat', count: 4, required: 4 },
      { type: 'Siang', squad: 'Regu Charlie', danru: 'Wahyu Hidayat', count: 4, required: 4 },
      { type: 'Malam', squad: 'Regu Delta', danru: 'Joko Susilo', count: 5, required: 5 },
    ],
  },
  ...Array.from({ length: 19 }, (_, i) => {
    const d = i + 5;
    const squads = ['Regu Alpha', 'Regu Bravo', 'Regu Charlie', 'Regu Delta'];
    const danrus = ['Ahmad Fauzi', 'Bambang Sudrajat', 'Wahyu Hidayat', 'Joko Susilo'];
    return {
      day: d,
      dateStr: `2025-05-${String(d).padStart(2, '0')}`,
      shifts: [
        {
          type: 'Pagi' as const,
          squad: squads[d % 4],
          danru: danrus[d % 4],
          count: 4,
          required: 4,
          sector: 'Area Perimeter & Pos Utama',
        },
        {
          type: 'Siang' as const,
          squad: squads[(d + 1) % 4],
          danru: danrus[(d + 1) % 4],
          count: 4,
          required: 4,
          sector: 'Koridor Dalam & Fasilitas',
        },
        {
          type: 'Malam' as const,
          squad: squads[(d + 2) % 4],
          danru: danrus[(d + 2) % 4],
          count: 4,
          required: 4,
          sector: 'Gerbang Luar & Jalur Ronda',
        },
      ],
    };
  }),
  // Day 24 (Today)
  {
    day: 24,
    dateStr: '2025-05-24',
    isToday: true,
    shifts: [
      {
        type: 'Pagi',
        squad: 'Regu Delta',
        danru: 'Joko Susilo',
        count: 5,
        required: 5,
        sector: 'Server Vault B2 & Perimeter Selatan',
        siteName: 'Data Center Cikarang',
        officers: [
          INITIAL_OFFICERS_POOL[7], // Joko Susilo
          INITIAL_OFFICERS_POOL[8], // Hendra Kurniawan
          INITIAL_OFFICERS_POOL[9], // Eko Prasetyo
          INITIAL_OFFICERS_POOL[10], // Dedi Mulyadi
          INITIAL_OFFICERS_POOL[11], // Fajar Nugroho
        ],
      },
      {
        type: 'Siang',
        squad: 'Regu Alpha',
        danru: 'Ahmad Fauzi',
        count: 4,
        required: 4,
        sector: 'Lobi Utama, Podium & Lift VIP',
        siteName: 'Sudirman Central Tower',
        officers: [
          INITIAL_OFFICERS_POOL[0], // Ahmad Fauzi
          INITIAL_OFFICERS_POOL[1], // Rian Hidayat
          INITIAL_OFFICERS_POOL[2], // Budi Hartono
          INITIAL_OFFICERS_POOL[3], // Agus Setiawan
        ],
      },
      {
        type: 'Malam',
        squad: 'Regu Charlie',
        danru: 'Wahyu Hidayat',
        count: 3,
        required: 4, // Shortage!
        sector: 'Dermaga Kontainer & Yard Utara',
        siteName: 'Hub Logistik Cakung',
        officers: [
          INITIAL_OFFICERS_POOL[4], // Wahyu Hidayat
          INITIAL_OFFICERS_POOL[5], // Surya Saputra
          INITIAL_OFFICERS_POOL[6], // Arif Wibowo
        ],
      },
    ],
  },
  ...Array.from({ length: 7 }, (_, i) => {
    const d = i + 25;
    const squads = ['Regu Alpha', 'Regu Bravo', 'Regu Charlie', 'Regu Delta'];
    const danrus = ['Ahmad Fauzi', 'Bambang Sudrajat', 'Wahyu Hidayat', 'Joko Susilo'];
    return {
      day: d,
      dateStr: `2025-05-${String(d).padStart(2, '0')}`,
      shifts: [
        {
          type: 'Pagi' as const,
          squad: squads[d % 4],
          danru: danrus[d % 4],
          count: 4,
          required: 4,
          sector: 'Area Terjadwal',
        },
        {
          type: 'Siang' as const,
          squad: squads[(d + 1) % 4],
          danru: danrus[(d + 1) % 4],
          count: 4,
          required: 4,
          sector: 'Area Terjadwal',
        },
        {
          type: 'Malam' as const,
          squad: squads[(d + 2) % 4],
          danru: danrus[(d + 2) % 4],
          count: 4,
          required: 4,
          sector: 'Area Terjadwal',
        },
      ],
    };
  }),
];
