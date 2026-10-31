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
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const notifications = [
  {
    id: "notif-1",
    title: "Tombol SOS Gerbang Barat Cakung Aktif",
    time: "2 menit lalu",
    severity: "high",
  },
  {
    id: "notif-2",
    title: "Pintu Darurat Lt. 14 Terganjal",
    time: "18 menit lalu",
    severity: "medium",
  },
  {
    id: "notif-3",
    title: "Regu Alpha Shift Siang Selesai Inspeksi Sektor B",
    time: "45 menit lalu",
    severity: "low",
  },
];

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  selectedSite,
  onSelectSite,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  const tabInfo = TAB_TITLES[currentTab] || {
    category: "Operasional",
    title: "Operasional Keamanan",
  };

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
      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        {/* Site Selector */}
        <div className="hidden items-center gap-2 sm:flex">
          <Building2 className="size-4 text-slate-500" />

          <Select
            value={selectedSite}
            onValueChange={(value) => onSelectSite(value as string)}
          >
            <SelectTrigger className="h-9 w-[170px] border-slate-200 bg-slate-50 text-xs">
              <SelectValue placeholder="Pilih Site" />
            </SelectTrigger>

            <SelectContent>
              {SITES.map((site) => (
                <SelectItem key={site.id} value={site.id}>
                  {site.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* System Status */}
        <Badge
          variant="outline"
          className="hidden gap-1.5 border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 lg:inline-flex"
        >
          <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
          Sistem Normal
        </Badge>

        {/* Notifications */}
        <Popover open={showNotifications} onOpenChange={setShowNotifications}>
          <PopoverTrigger>
            <Button
              variant="ghost"
              size="icon"
              className="relative size-9 shrink-0 text-slate-600"
              aria-label="Notifikasi sistem"
            >
              <Bell className="size-[18px]" />

              <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white">
                3
              </span>
            </Button>
          </PopoverTrigger>

          <PopoverContent align="end" className="w-[340px] p-0">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Notifikasi
                </p>
                <p className="text-xs text-slate-500">
                  Informasi aktivitas keamanan
                </p>
              </div>

              <Badge variant="secondary">3 Baru</Badge>
            </div>

            <div className="max-h-[320px] overflow-y-auto">
              {notifications.map((notification) => {
                const Icon =
                  notification.severity === "high"
                    ? TriangleAlert
                    : notification.severity === "medium"
                      ? AlertCircle
                      : Info;

                const iconColor =
                  notification.severity === "high"
                    ? "text-red-500"
                    : notification.severity === "medium"
                      ? "text-amber-500"
                      : "text-blue-500";

                return (
                  <div
                    key={notification.id}
                    className="flex gap-3 border-b px-4 py-3 last:border-0 hover:bg-slate-50"
                  >
                    <div className="mt-0.5">
                      <Icon className={`size-4 ${iconColor}`} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium leading-relaxed text-slate-800">
                        {notification.title}
                      </p>

                      <p className="mt-1 text-[11px] text-slate-400">
                        {notification.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-blue-600"
                onClick={() => setShowNotifications(false)}
              >
                Tutup Notifikasi
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Profile */}
        <div className="flex shrink-0 items-center gap-2 border-l pl-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-[#101b35] text-xs font-bold text-white">
            BP
          </div>

          <div className="hidden min-w-0 flex-col sm:flex">
            <span className="truncate text-xs font-semibold text-slate-900">
              Bambang Prasetyo
            </span>

            <span className="truncate text-[10px] text-blue-600">
              Security Superintendent
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
