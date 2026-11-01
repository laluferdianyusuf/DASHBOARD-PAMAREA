import { FileSpreadsheet } from "lucide-react";
import React, { useState } from "react";

import { useMe } from "../hooks/auth";
import { NavTab } from "./Sidebar";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import ExcelTransferDialog from "./ExcelTransferDialog";

interface HeaderProps {
  currentTab: NavTab;
  selectedSite: string;
  onSelectSite: (siteId: string) => void;
  activeIncidentsCount?: number;
  onOpenSosModal?: () => void;
  onSelectTab: (tab: NavTab) => void;
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

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  selectedSite,
  onSelectTab,
}) => {
  const { data: meResponse, isLoading } = useMe();
  const [isExcelDialogOpen, setIsExcelDialogOpen] = useState(false);
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
      <Breadcrumb className="min-w-0 overflow-hidden">
        <BreadcrumbList className="flex-nowrap text-sm">
          <BreadcrumbItem className="hidden shrink-0 sm:flex">
            <BreadcrumbLink
              onClick={() => onSelectTab("dashboard")}
              className="font-bold tracking-tight cursor-pointer text-slate-900"
            >
              PAMAREA
            </BreadcrumbLink>
          </BreadcrumbItem>

          <BreadcrumbSeparator className="hidden sm:flex" />

          <BreadcrumbItem className="hidden shrink-0 md:flex">
            <BreadcrumbLink href="#" className="text-slate-500">
              {tabInfo.category}
            </BreadcrumbLink>
          </BreadcrumbItem>

          <BreadcrumbSeparator className="hidden md:flex" />

          <BreadcrumbItem className="min-w-0">
            <BreadcrumbPage className="truncate font-semibold text-slate-800">
              {tabInfo.title}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-row items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="shrink-0 text-black bg-[#FED400] hover:bg-[#e9c300]"
          title="Import & Export Excel"
          onClick={() => setIsExcelDialogOpen(true)}
        >
          <FileSpreadsheet className="size-4" />
          Download Template
        </Button>
      </div>

      <ExcelTransferDialog
        open={isExcelDialogOpen}
        onOpenChange={setIsExcelDialogOpen}
        siteId={selectedSite}
      />
    </header>
  );
};
