import { ChevronRight } from "lucide-react";
import React from "react";

import { useMe } from "../hooks/auth";
import { NavTab } from "./Sidebar";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

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
    title: "Tambah Shift & Lokasi",
  },
  "tukar-shift": {
    category: "Operasional",
    title: "Tukar Shift Security",
  },
  "cuti-izin": {
    category: "Operasional",
    title: "Manajemen Cuti, Izin & Security Pengganti",
  },
  "manajemen-ronde": {
    category: "Operasional",
    title: "Manajemen ronde & checkpoint",
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

export const Header: React.FC<HeaderProps> = ({ currentTab }) => {
  const { data: meResponse, isLoading } = useMe();

  const user = meResponse?.data;

  const tabInfo = TAB_TITLES[currentTab] ?? {
    category: "Operasional",
    title: "Operasional Keamanan",
  };

  const initials =
    user?.fullName
      ?.trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((name) => name.charAt(0))
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  const userRole = user?.role?.name
    ?.replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return (
    <header className="flex h-full min-w-0 items-center justify-between gap-4">
      {/* Breadcrumb */}
      <div className="flex min-w-0 items-center gap-2 overflow-hidden text-sm">
        <span className="hidden shrink-0 font-bold tracking-tight text-slate-900 sm:block">
          PAMAREA
        </span>

        <ChevronRight className="hidden size-3.5 shrink-0 text-slate-400 sm:block" />

        <span className="hidden shrink-0 text-slate-500 md:block">
          {tabInfo.category}
        </span>

        <ChevronRight className="hidden size-3.5 shrink-0 text-slate-400 md:block" />

        <h1 className="truncate font-semibold text-slate-800">
          {tabInfo.title}
        </h1>
      </div>

      {/* User Profile */}
      <div className="flex shrink-0 items-center gap-3">
        {isLoading ? (
          <>
            <Skeleton className="size-9 rounded-full" />

            <div className="hidden space-y-1.5 sm:block">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </>
        ) : (
          <>
            <Avatar className="size-9 border border-slate-200">
              <AvatarImage
                src={user?.photoUrl || undefined}
                alt={user?.fullName || "Pengguna"}
              />

              <AvatarFallback className="bg-slate-900 text-xs font-semibold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="hidden min-w-0 sm:block">
              <p className="max-w-40 truncate text-sm font-semibold text-slate-800">
                {user?.fullName || "Pengguna"}
              </p>

              <p className="text-xs text-slate-500">{userRole || "Pengguna"}</p>
            </div>
          </>
        )}
      </div>
    </header>
  );
};
