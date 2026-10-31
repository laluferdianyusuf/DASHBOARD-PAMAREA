/**
 * Helper tanggal dan waktu untuk aplikasi PAMAREA.
 *
 * Locale  : Indonesia (id-ID)
 * Timezone: Asia/Makassar (WITA)
 *
 * Catatan:
 * - Timestamp ISO yang memiliki Z atau offset akan dikonversi
 *   berdasarkan timezone Asia/Makassar.
 * - String tanggal YYYY-MM-DD diperlakukan sebagai tanggal kalender
 *   agar tidak bergeser ke hari sebelumnya.
 */

export const APP_TIMEZONE = "Asia/Makassar";
export const APP_LOCALE = "id-ID";

export type DateInput = Date | string | number | null | undefined;

const isValidDate = (date: Date): boolean => !Number.isNaN(date.getTime());

/**
 * Mengonversi input menjadi Date.
 */
export const toDate = (value: DateInput): Date | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const date =
    value instanceof Date ? new Date(value.getTime()) : new Date(value);

  return isValidDate(date) ? date : null;
};

/**
 * Mengambil tanggal kalender YYYY-MM-DD.
 * Berguna untuk input type="date".
 */
export const formatDateInput = (value: DateInput): string => {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  // String YYYY-MM-DD dianggap sebagai tanggal kalender.
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return value;
    }

    return "";
  }

  const date = toDate(value);

  if (!date) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/**
 * Mengambil waktu HH:mm.
 * Mendukung string waktu seperti "06:30" atau "06:30:00".
 */
export const formatTime = (
  value: DateInput,
  timezone = APP_TIMEZONE,
): string => {
  if (typeof value === "string") {
    const match = value.match(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/);

    if (match) {
      return `${match[1]}:${match[2]}`;
    }
  }

  const date = toDate(value);

  if (!date) return "-";

  return new Intl.DateTimeFormat(APP_LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: timezone,
  }).format(date);
};

/**
 * Format tanggal: 25 Oktober 2026
 */
export const formatDate = (
  value: DateInput,
  timezone = APP_TIMEZONE,
): string => {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = toDate(`${value}T12:00:00`);

    if (!date || formatDateInput(value) === "") return "-";

    return new Intl.DateTimeFormat(APP_LOCALE, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  }

  const date = toDate(value);

  if (!date) return "-";

  return new Intl.DateTimeFormat(APP_LOCALE, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: timezone,
  }).format(date);
};

/**
 * Format tanggal singkat: 25 Okt 2026
 */
export const formatDateShort = (
  value: DateInput,
  timezone = APP_TIMEZONE,
): string => {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = toDate(`${value}T12:00:00`);

    if (!date || formatDateInput(value) === "") return "-";

    return new Intl.DateTimeFormat(APP_LOCALE, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  }

  const date = toDate(value);

  if (!date) return "-";

  return new Intl.DateTimeFormat(APP_LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: timezone,
  }).format(date);
};

/**
 * Format lengkap: Minggu, 25 Oktober 2026
 */
export const formatDateFull = (
  value: DateInput,
  timezone = APP_TIMEZONE,
): string => {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = toDate(`${value}T12:00:00`);

    if (!date || formatDateInput(value) === "") return "-";

    return new Intl.DateTimeFormat(APP_LOCALE, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  }

  const date = toDate(value);

  if (!date) return "-";

  return new Intl.DateTimeFormat(APP_LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: timezone,
  }).format(date);
};

/**
 * Format tanggal dan waktu:
 * 25 Okt 2026, 14:30
 */
export const formatDateTime = (
  value: DateInput,
  timezone = APP_TIMEZONE,
): string => {
  const date = toDate(value);

  if (!date) return "-";

  return new Intl.DateTimeFormat(APP_LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: timezone,
  }).format(date);
};

/**
 * Format tanggal dan waktu lengkap:
 * Minggu, 25 Oktober 2026 pukul 14.30
 */
export const formatDateTimeFull = (
  value: DateInput,
  timezone = APP_TIMEZONE,
): string => {
  const date = toDate(value);

  if (!date) return "-";

  const formattedDate = new Intl.DateTimeFormat(APP_LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: timezone,
  }).format(date);

  const formattedTime = new Intl.DateTimeFormat(APP_LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: timezone,
  }).format(date);

  return `${formattedDate} pukul ${formattedTime}`;
};

/**
 * Format bulan dan tahun: Oktober 2026
 */
export const formatMonthYear = (
  value: DateInput,
  timezone = APP_TIMEZONE,
): string => {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = toDate(`${value}T12:00:00`);

    if (!date || formatDateInput(value) === "") return "-";

    return new Intl.DateTimeFormat(APP_LOCALE, {
      month: "long",
      year: "numeric",
    }).format(date);
  }

  const date = toDate(value);

  if (!date) return "-";

  return new Intl.DateTimeFormat(APP_LOCALE, {
    month: "long",
    year: "numeric",
    timeZone: timezone,
  }).format(date);
};

/**
 * Format durasi dalam menit.
 * Contoh: 150 -> 2 jam 30 menit
 */
export const formatDuration = (totalMinutes: number): string => {
  if (!Number.isFinite(totalMinutes)) return "-";

  const sign = totalMinutes < 0 ? "-" : "";
  const minutes = Math.floor(Math.abs(totalMinutes));
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${sign}${remainingMinutes} menit`;
  }

  if (remainingMinutes === 0) {
    return `${sign}${hours} jam`;
  }

  return `${sign}${hours} jam ${remainingMinutes} menit`;
};

/**
 * Menghitung selisih waktu dalam menit.
 * Hasil negatif berarti waktu akhir lebih awal daripada waktu awal.
 */
export const getTimeDifference = (
  start: DateInput,
  end: DateInput,
): number | null => {
  const startDate = toDate(start);
  const endDate = toDate(end);

  if (!startDate || !endDate) return null;

  return Math.round((endDate.getTime() - startDate.getTime()) / 60000);
};

/**
 * Menghitung durasi shift dari HH:mm ke HH:mm.
 * Mendukung shift melewati tengah malam.
 *
 * Contoh:
 * 22:00 - 07:00 = 9 jam
 */
export const getShiftDuration = (
  startTime: string,
  endTime: string,
): number | null => {
  const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

  if (!timePattern.test(startTime) || !timePattern.test(endTime)) {
    return null;
  }

  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;

  let duration = end - start;

  if (duration <= 0) {
    duration += 24 * 60;
  }

  return duration;
};

/**
 * Membandingkan dua tanggal kalender.
 */
export const isSameDate = (first: DateInput, second: DateInput): boolean => {
  const firstDate = formatDateInput(first);
  const secondDate = formatDateInput(second);

  return firstDate !== "" && firstDate === secondDate;
};

/**
 * Mengambil tanggal hari ini dalam timezone aplikasi.
 */
export const getToday = (timezone = APP_TIMEZONE): string => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: timezone,
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
};

/**
 * Mengecek apakah tanggal merupakan hari ini.
 */
export const isToday = (value: DateInput, timezone = APP_TIMEZONE): boolean => {
  if (!value) return false;

  // Tanggal kalender dibandingkan langsung tanpa konversi timezone.
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return formatDateInput(value) === getToday(timezone);
  }

  const date = toDate(value);

  if (!date) return false;

  const dateInTimezone = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: timezone,
  }).format(date);

  return dateInTimezone === getToday(timezone);
};

/**
 * Mengambil tanggal relatif terhadap hari ini.
 * offset: -1 = kemarin, 0 = hari ini, 1 = besok.
 */
export const getRelativeDate = (
  offset: number,
  timezone = APP_TIMEZONE,
): string => {
  const today = getToday(timezone);
  const [year, month, day] = today.split("-").map(Number);

  // Gunakan tengah hari UTC agar aman dari pergantian hari lokal.
  const date = new Date(Date.UTC(year, month - 1, day + offset, 12));

  return date.toISOString().slice(0, 10);
};

/**
 * Menghasilkan label relatif untuk tanggal kalender.
 */
export const getRelativeDateLabel = (
  value: DateInput,
  timezone = APP_TIMEZONE,
): string => {
  const date = formatDateInput(value);

  if (!date) return "-";

  if (date === getRelativeDate(0, timezone)) return "Hari ini";
  if (date === getRelativeDate(-1, timezone)) return "Kemarin";
  if (date === getRelativeDate(1, timezone)) return "Besok";

  return formatDateShort(value, timezone);
};

/**
 * Format waktu relatif untuk timestamp.
 * Contoh: 5 menit yang lalu, 2 jam yang lalu.
 */

export const formatRelativeTime = (
  value: DateInput,
  _timezone = APP_TIMEZONE,
): string => {
  const date = toDate(value);

  if (!date) return "-";

  const differenceSeconds = Math.round((date.getTime() - Date.now()) / 1000);

  const absSeconds = Math.abs(differenceSeconds);

  if (absSeconds < 10) return "Baru saja";

  const units: Array<{
    seconds: number;
    unit: Intl.RelativeTimeFormatUnit;
  }> = [
    { seconds: 60, unit: "second" },
    { seconds: 3600, unit: "minute" },
    { seconds: 86400, unit: "hour" },
    { seconds: 604800, unit: "day" },
    { seconds: 2629800, unit: "week" },
    { seconds: 31557600, unit: "month" },
  ];

  let amount = differenceSeconds;
  let unit: Intl.RelativeTimeFormatUnit = "second";

  for (const item of units) {
    if (absSeconds < item.seconds) break;

    amount = Math.round(differenceSeconds / item.seconds);

    unit = item.unit;
  }

  return new Intl.RelativeTimeFormat(APP_LOCALE, {
    numeric: "auto",
    style: "long",
  }).format(amount, unit);
};

/**
 * Menambahkan jumlah hari ke tanggal kalender.
 */
export const addDays = (value: DateInput, amount: number): string => {
  const dateString = formatDateInput(value);

  if (!dateString || !Number.isInteger(amount)) return "";

  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + amount, 12));

  return date.toISOString().slice(0, 10);
};

/**
 * Mengambil jumlah hari dalam bulan tertentu.
 * Month menggunakan format 1-12.
 */
export const getDaysInMonth = (year: number, month: number): number => {
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    return 0;
  }

  return new Date(Date.UTC(year, month, 0)).getUTCDate();
};

/**
 * Mendapatkan rentang tanggal satu bulan.
 */
export const getMonthRange = (
  year: number,
  month: number,
): { startDate: string; endDate: string } => {
  const monthString = String(month).padStart(2, "0");
  const lastDay = getDaysInMonth(year, month);

  if (!lastDay) {
    return { startDate: "", endDate: "" };
  }

  return {
    startDate: `${year}-${monthString}-01`,
    endDate: `${year}-${monthString}-${String(lastDay).padStart(2, "0")}`,
  };
};

/** * Format jam WITA. * * Contoh: * 14:30 WITA */
export const formatWITA = (value: DateInput): string => {
  const date = toDate(value);
  if (!date) return "-";
  const time = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Makassar",
  }).format(date);
  return `${time} WITA`;
};
/** * Format tanggal dan jam WITA. * * Contoh: * 25 Okt 2026, 14:30 WITA */
export const formatDateTimeWITA = (value: DateInput): string => {
  const date = toDate(value);
  if (!date) return "-";
  const formatted = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Makassar",
  }).format(date);
  return `${formatted} WITA`;
};
/** * Format tanggal lengkap dan jam WITA. * * Contoh: * Minggu, 25 Oktober 2026 pukul 14:30 WITA */ export const formatDateTimeFullWITA =
  (value: DateInput): string => {
    const date = toDate(value);
    if (!date) return "-";
    const formattedDate = new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Makassar",
    }).format(date);
    const formattedTime = new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: "Asia/Makassar",
    }).format(date);
    return `${formattedDate} pukul ${formattedTime} WITA`;
  };
