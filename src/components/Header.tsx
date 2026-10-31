import React, { useState } from "react";
import { SITES } from "../data/mockData";
import { NavTab } from "./Sidebar";

import {
  AlertCircle,
  Bell,
  Building2,
  ChevronRight,
  Info,
  TriangleAlert,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMe } from "../hooks/auth";

interface HeaderProps {
  currentTab: NavTab;
  selectedSite: string;
  onSelectSite: (siteId: string) => void;
  activeIncidentsCount?: number;
  onOpenSosModal?: () => void;
}

const TAB_TITLES: Record<NavTab, { category: string; title: string }> = {
  dashboard: {
    category: "Dasbor",
    title: "Peta & Titik Patroli",
  },
  monitoring: {
    category: "Manajemen Sistem",
    title: "Monitoring Kinerja & Peringkat Security",
  },
  "analytic-audit": {
    category: "Manajemen Sistem",
    title: "Analitik & Audit Sistem",
  },
  jadwal: {
    category: "Operasional",
    title: "Jadwal Patroli Lapangan",
  },
  kalender: {
    category: "Operasional",
    title: "Kalender Shift Terpadu",
  },
  "tambah-jadwal": {
    category: "Operasional",
    title: "Alur 3-Langkah Tambah Shift & Lokasi",
  },
  "tukar-shift": {
    category: "Operasional",
    title: "Tukar Shift Personel",
  },
  "cuti-izin": {
    category: "Operasional",
    title: "Manajemen Cuti, Izin & Personel Pengganti",
  },
  pengguna: {
    category: "Master Data",
    title: "Kelola Pengguna Sistem",
  },
  titik: {
    category: "Master Data",
    title: "Titik Patroli (Checkpoints)",
  },
  nfc: {
    category: "Master Data",
    title: "Manajemen Tag NFC & RFID",
  },
  "question-builder": {
    category: "Master Data",
    title: "Question Builder (Checklist Patroli)",
  },
  riwayat: {
    category: "Manajemen Sistem",
    title: "Riwayat Sesi Patroli",
  },
  temuan: {
    category: "Operasional",
    title: "Daftar Temuan Lapangan",
  },
};

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  selectedSite,
  onSelectSite,
}) => {
  const tabInfo = TAB_TITLES[currentTab] || {
    category: "Operasional",
    title: "Operasional Keamanan",
  };

  const { data: meResponse, isLoading } = useMe();

  const user = meResponse?.data;

  const initials =
    user?.fullName
      ?.trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((name) => name.charAt(0))
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  // Mengambil nama role dari backend
  const userRole = user?.role?.name
    ?.replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return (
    <div className="flex h-full min-w-0 items-center justify-between gap-4">
      {/* Breadcrumb */}
      <div className="flex min-w-0 items-center gap-2 overflow-hidden text-xs">
        <span className="hidden shrink-0 font-semibold text-slate-900 sm:block">
          PAMAREA
        </span>

        <ChevronRight className="hidden size-3 shrink-0 text-slate-400 sm:block" />

        <span className="hidden shrink-0 text-slate-500 md:block">
          {tabInfo.category}
        </span>

        <ChevronRight className="hidden size-3 shrink-0 text-slate-400 md:block" />

        <span className="truncate font-semibold text-blue-600">
          {tabInfo.title}
        </span>
      </div>

      {/* Global Controls */}
      <div className="ml-4 flex shrink-0 items-center gap-2">
        {isLoading ? (
          <>
            <div className="h-9 w-9 animate-pulse rounded-full bg-gray-200" />
            <div className="hidden space-y-1 sm:block">
              <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
              <div className="h-2.5 w-28 animate-pulse rounded bg-gray-200" />
            </div>
          </>
        ) : (
          <>
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-black">
              {user?.photoUrl ? (
                <img
                  src={user.photoUrl}
                  alt={user.fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-sm font-bold text-white">{initials}</span>
              )}
            </div>

            <div className="hidden sm:block">
              <h2 className="text-sm font-semibold text-gray-800">
                {user?.fullName || "Pengguna"}
              </h2>

              <p className="text-xs tracking-wide text-gray-500">
                {userRole || "Pengguna"}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
