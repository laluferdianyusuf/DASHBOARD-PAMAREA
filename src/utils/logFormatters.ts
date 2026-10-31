/**
 * Mengubah action log menjadi label yang mudah dibaca.
 */
export const formatAction = (action: string): string => {
  const actionLabels: Record<string, string> = {
    // Autentikasi dan sesi
    LOGIN: "Login",
    LOGOUT: "Logout",
    LOGIN_FAILED: "Login Gagal",
    REFRESH_TOKEN: "Refresh Token",
    REVOKE_SESSION: "Mengakhiri Sesi",
    REVOKE_ALL_SESSIONS: "Mengakhiri Semua Sesi",

    // Manajemen pengguna
    CREATE_USER: "Menambahkan Pengguna",
    UPDATE_USER: "Memperbarui Pengguna",
    DELETE_USER: "Menghapus Pengguna",
    ACTIVATE_USER: "Mengaktifkan Pengguna",
    DEACTIVATE_USER: "Menonaktifkan Pengguna",

    // Jadwal patroli
    CREATE_PATROL_SCHEDULE: "Membuat Jadwal Patroli",
    UPDATE_PATROL_SCHEDULE: "Memperbarui Jadwal Patroli",
    DELETE_PATROL_SCHEDULE: "Menghapus Jadwal Patroli",
    ACTIVATE_PATROL_SCHEDULE: "Mengaktifkan Jadwal Patroli",

    // Pelaksanaan patroli
    CREATE_PATROL: "Memulai Patroli",
    UPDATE_PATROL: "Memperbarui Patroli",
    COMPLETE_PATROL: "Menyelesaikan Patroli",

    // Checkpoint
    CREATE_PATROL_POINT: "Menambahkan Titik Patroli",
    UPDATE_PATROL_POINT: "Memperbarui Titik Patroli",
    DELETE_PATROL_POINT: "Menghapus Titik Patroli",

    // NFC
    CREATE_NFC_TAG: "Mendaftarkan NFC",
    UPDATE_NFC_TAG: "Memperbarui NFC",
    ACTIVATE_NFC_TAG: "Mengaktifkan NFC",
    ASSIGN_NFC_TAG: "Menghubungkan NFC",

    // Temuan
    CREATE_FINDING: "Membuat Temuan",
    UPDATE_FINDING: "Memperbarui Temuan",
    DELETE_FINDING: "Menghapus Temuan",
    RESOLVE_FINDING: "Menyelesaikan Temuan",
  };

  if (actionLabels[action]) {
    return actionLabels[action];
  }

  // Fallback jika action belum terdaftar.
  return action
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * Mengubah entityType menjadi nama modul yang mudah dibaca.
 */
export const formatModule = (entityType: string): string => {
  const moduleLabels: Record<string, string> = {
    USER: "Pengguna",
    ROLE: "Role",
    SESSION: "Authentication",
    DEVICE: "Perangkat",

    PATROL: "Patroli",
    PATROL_ROUND: "Putaran Patroli",
    PATROL_SCHEDULE: "Jadwal Patroli",
    PATROL_ASSIGNMENT: "Penugasan Patroli",
    PATROL_POINT: "Titik Patroli",

    NFC_TAG: "NFC",
    PATROL_POINT_NFC: "Penugasan NFC",

    FINDING: "Temuan",
    SHIFT: "Shift",
    SHIFT_CHANGE: "Perubahan Shift",

    SITE: "Lokasi",
    TEAM: "Tim",
    QUESTION: "Pertanyaan",
  };

  if (moduleLabels[entityType]) {
    return moduleLabels[entityType];
  }

  // Fallback jika entityType belum terdaftar.
  return entityType
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * Menentukan status log berdasarkan action.
 *
 * Catatan:
 * Action yang menandakan kegagalan harus disesuaikan
 * dengan enum dan implementasi backend.
 */
export const getActionStatus = (action: string): "Failed" | "Recorded" => {
  const failedActions = new Set([
    "LOGIN_FAILED",
    "LOGIN_FAILURE",
    "AUTH_FAILED",
    "AUTH_FAILURE",
    "REQUEST_FAILED",
    "OPERATION_FAILED",
  ]);

  return failedActions.has(action.toUpperCase()) ? "Failed" : "Recorded";
};
