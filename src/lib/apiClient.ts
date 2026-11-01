import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

const BASE_URL = import.meta.env.VITE_API_URL;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Client khusus refresh token.
// Tidak menggunakan interceptor apiClient agar tidak terjadi refresh berulang.
const refreshClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

interface RefreshTokenResponse {
  message?: string;
  data: {
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
  };
}

interface RetryableRequest extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let refreshPromise: Promise<string> | null = null;

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Refresh access token
const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = localStorage.getItem("refreshToken");

  if (!refreshToken) {
    throw new Error("Refresh token tidak ditemukan.");
  }

  const response = await refreshClient.post<RefreshTokenResponse>(
    "/auth/refresh",
    {
      refreshToken,
    },
  );

  const tokens = response.data.data;

  if (!tokens?.accessToken) {
    throw new Error("Access token baru tidak ditemukan.");
  }

  localStorage.setItem("accessToken", tokens.accessToken);

  // Simpan refresh token baru jika backend melakukan rotasi token.
  if (tokens.refreshToken) {
    localStorage.setItem("refreshToken", tokens.refreshToken);
  }

  return tokens.accessToken;
};

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequest | undefined;

    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Jangan refresh ulang jika request ini sudah pernah dicoba.
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // Jangan mencoba refresh jika endpoint login atau refresh sendiri gagal.
    const requestUrl = originalRequest.url ?? "";

    if (
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/refresh") ||
      requestUrl.includes("/auth/logout")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      // Beberapa request yang mendapat 401 bersamaan
      // akan menggunakan satu proses refresh yang sama.
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const newAccessToken = await refreshPromise;

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      return apiClient(originalRequest);
    } catch (refreshError) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");

      // Hindari redirect berulang jika sudah berada di halaman login.
      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }

      return Promise.reject(refreshError);
    }
  },
);
