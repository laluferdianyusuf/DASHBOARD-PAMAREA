const API_URL =
  import.meta.env.VITE_API_URL || "https://api.pamarea.com/api/v1";

const API_ORIGIN = new URL(API_URL).origin;

export const getPhotoUrl = (fileUrl?: string | null): string => {
  if (!fileUrl) return "";

  // Jika URL sudah absolut, gunakan langsung.
  if (/^https?:\/\//i.test(fileUrl)) {
    return fileUrl;
  }

  // Jika URL relatif, arahkan ke origin backend.
  return new URL(
    fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`,
    API_ORIGIN,
  ).toString();
};

export const getPhotoUrlForExport = (fileUrl?: string | null): string => {
  if (!fileUrl) return "";

  // Ambil pathname agar URL gambar diarahkan melalui proxy Vite.
  const pathname = /^https?:\/\//i.test(fileUrl)
    ? new URL(fileUrl).pathname
    : fileUrl.startsWith("/")
      ? fileUrl
      : `/${fileUrl}`;

  return pathname;
};
