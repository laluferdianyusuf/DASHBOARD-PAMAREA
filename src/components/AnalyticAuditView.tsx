import {
  Activity,
  Download,
  FileSearch,
  Filter,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import React, { useMemo, useState } from "react";

import { SYSTEM_AUDIT_LOGS } from "../data/mockData";
import {
  SystemAuditLog,
  filterItemsByColumnCriteria,
  filterSystemAuditLogs,
} from "../utils/security-logic";

// Shadcn UI
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AnalyticAuditViewProps {
  selectedSite: string;
}

type AuditTab = "all" | "admin" | "patrol" | "findings" | "schedule";

interface ColumnSearch extends Record<string, string> {
  idTimestamp: string;
  category: string;
  action: string;
  actor: string;
  targetLocation: string;
  status: string;
}

const INITIAL_COLUMN_SEARCH: ColumnSearch = {
  idTimestamp: "",
  category: "",
  action: "",
  actor: "",
  targetLocation: "",
  status: "",
};

const CATEGORY_BY_TAB: Record<Exclude<AuditTab, "all">, string> = {
  admin: "Admin & Pengguna",
  patrol: "Operasional Patroli",
  findings: "Temuan & Insiden",
  schedule: "Jadwal & Shift",
};

const formatCsvValue = (value: unknown) => {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Berhasil":
      return (
        <Badge
          variant="outline"
          className="border-emerald-200 bg-emerald-50 text-emerald-700"
        >
          Berhasil
        </Badge>
      );

    case "Peringatan":
      return (
        <Badge
          variant="outline"
          className="border-amber-200 bg-amber-50 text-amber-700"
        >
          Peringatan
        </Badge>
      );

    default:
      return (
        <Badge
          variant="outline"
          className="border-rose-200 bg-rose-50 text-rose-700"
        >
          Gagal
        </Badge>
      );
  }
};

const getCategoryBadge = (category: string) => {
  const styles: Record<string, string> = {
    "Admin & Pengguna": "border-purple-200 bg-purple-50 text-purple-700",
    "Operasional Patroli": "border-emerald-200 bg-emerald-50 text-emerald-700",
    "Temuan & Insiden": "border-rose-200 bg-rose-50 text-rose-700",
    "Jadwal & Shift": "border-cyan-200 bg-cyan-50 text-cyan-700",
    "Tag & Checkpoint": "border-amber-200 bg-amber-50 text-amber-700",
  };

  return (
    <Badge
      variant="outline"
      className={
        styles[category] ?? "border-slate-200 bg-slate-50 text-slate-700"
      }
    >
      {category}
    </Badge>
  );
};

export const AnalyticAuditView: React.FC<AnalyticAuditViewProps> = ({
  selectedSite,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [activeTab, setActiveTab] = useState<AuditTab>("all");

  const [selectedLogDetail, setSelectedLogDetail] =
    useState<SystemAuditLog | null>(null);

  const [columnSearch, setColumnSearch] = useState<ColumnSearch>(
    INITIAL_COLUMN_SEARCH,
  );

  const logs = SYSTEM_AUDIT_LOGS;

  const baseFilteredLogs = useMemo(() => {
    const category = activeTab === "all" ? "all" : CATEGORY_BY_TAB[activeTab];

    return filterSystemAuditLogs(logs, {
      siteId: selectedSite,
      category,
      actorRole: selectedRole,
      status: selectedStatus,
      searchQuery,
    });
  }, [
    logs,
    selectedSite,
    activeTab,
    selectedRole,
    selectedStatus,
    searchQuery,
  ]);

  const filteredLogs = useMemo(() => {
    return filterItemsByColumnCriteria(baseFilteredLogs, columnSearch, {
      idTimestamp: (log) => `${log.id} ${log.timestamp}`,

      category: (log) => log.category,

      action: (log) => `${log.action} ${log.details}`,

      actor: (log) => `${log.actorName} ${log.actorRole}`,

      targetLocation: (log) => `${log.targetEntity} ${log.siteName}`,

      status: (log) => log.status,
    });
  }, [baseFilteredLogs, columnSearch]);

  const metrics = useMemo(() => {
    const total = filteredLogs.length;

    const countByCategory = (category: string) =>
      filteredLogs.filter((log) => log.category === category).length;

    const successCount = filteredLogs.filter(
      (log) => log.status === "Berhasil",
    ).length;

    return {
      total,
      admin: countByCategory("Admin & Pengguna"),
      patrol: countByCategory("Operasional Patroli"),
      findings: countByCategory("Temuan & Insiden"),
      schedule: countByCategory("Jadwal & Shift"),
      tag: countByCategory("Tag & Checkpoint"),
      success: successCount,
      successRate: total > 0 ? Math.round((successCount / total) * 100) : 0,
    };
  }, [filteredLogs]);

  const isAnyColumnFilterActive = Object.values(columnSearch).some(
    (value) => value.trim().length > 0,
  );

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedRole !== "all" ||
    selectedStatus !== "all" ||
    isAnyColumnFilterActive;

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedRole("all");
    setSelectedStatus("all");
    setColumnSearch(INITIAL_COLUMN_SEARCH);
  };

  const updateColumnSearch = (key: keyof ColumnSearch, value: string) => {
    setColumnSearch((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  // -------------------------------------------------------
  // EXPORT CSV
  // -------------------------------------------------------

  const handleExportCsv = () => {
    const headers = [
      "ID",
      "Waktu",
      "Kategori",
      "Aksi",
      "Aktor",
      "Role",
      "Entitas Target",
      "Site",
      "Status",
      "Detail",
      "IP Address",
      "Device",
    ];

    const rows = filteredLogs.map((log) =>
      [
        log.id,
        log.timestamp,
        log.category,
        log.action,
        log.actorName,
        log.actorRole,
        log.targetEntity,
        log.siteName,
        log.status,
        log.details,
        log.ipAddress || "",
        log.device || "",
      ]
        .map(formatCsvValue)
        .join(","),
    );

    const csvContent = [headers.map(formatCsvValue).join(","), ...rows].join(
      "\n",
    );

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* PAGE HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Analytic & Audit Log
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Riwayat aktivitas dan perubahan yang tercatat di dalam sistem.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCsv}
          disabled={filteredLogs.length === 0}
        >
          <Download className="mr-2 size-4" />
          Export CSV
        </Button>
      </div>

      <Separator />

      {/* AUDIT TABLE SECTION */}
      <div className="space-y-4">
        {/* CATEGORY TABS */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as AuditTab)}
        >
          <TabsList className="h-auto flex-wrap justify-start bg-transparent p-0">
            <TabsTrigger value="all">Semua ({logs.length})</TabsTrigger>

            <TabsTrigger value="admin">Admin</TabsTrigger>

            <TabsTrigger value="patrol">Patroli</TabsTrigger>

            <TabsTrigger value="findings">Temuan & Insiden</TabsTrigger>

            <TabsTrigger value="schedule">Jadwal & Shift</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* FILTER TOOLBAR */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Cari ID audit, aktor, aksi, atau detail..."
              className="pl-9"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Select
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value ?? "all")}
            >
              <SelectTrigger className="w-full sm:w-[190px]">
                <SelectValue placeholder="Semua peran" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">Semua Peran</SelectItem>
                <SelectItem value="Admin">Administrator</SelectItem>
                <SelectItem value="Danru">Komandan Regu</SelectItem>
                <SelectItem value="Satpam">Petugas Lapangan</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={selectedStatus}
              onValueChange={(value) => setSelectedStatus(value ?? "all")}
            >
              <SelectTrigger className="w-full sm:w-[170px]">
                <SelectValue placeholder="Semua status" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="Berhasil">Berhasil</SelectItem>
                <SelectItem value="Peringatan">Peringatan</SelectItem>
                <SelectItem value="Gagal">Gagal</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={clearAllFilters}
                title="Reset semua filter"
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-hidden rounded border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="min-w-[150px]">Waktu & ID</TableHead>

                  <TableHead className="min-w-[160px]">Kategori</TableHead>

                  <TableHead className="min-w-[220px]">
                    Aksi / Kegiatan
                  </TableHead>

                  <TableHead className="min-w-[160px]">Aktor</TableHead>

                  <TableHead className="min-w-[180px]">
                    Target & Lokasi
                  </TableHead>

                  <TableHead className="w-[120px]">Status</TableHead>

                  <TableHead className="w-[90px] text-right">Detail</TableHead>
                </TableRow>

                {/* COLUMN FILTERS */}
                <TableRow className="bg-background hover:bg-background">
                  <TableHead>
                    <Input
                      value={columnSearch.idTimestamp}
                      onChange={(event) =>
                        updateColumnSearch("idTimestamp", event.target.value)
                      }
                      placeholder="Cari ID / waktu"
                      className="h-8 min-w-[120px] text-xs"
                    />
                  </TableHead>

                  <TableHead>
                    <Select
                      value={columnSearch.category || "all"}
                      onValueChange={(value) =>
                        updateColumnSearch(
                          "category",
                          value === "all" ? "" : (value ?? ""),
                        )
                      }
                    >
                      <SelectTrigger className="h-8 min-w-[135px] text-xs">
                        <SelectValue placeholder="Semua kategori" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="all">Semua Kategori</SelectItem>
                        <SelectItem value="Admin & Pengguna">
                          Admin & Pengguna
                        </SelectItem>
                        <SelectItem value="Operasional Patroli">
                          Operasional Patroli
                        </SelectItem>
                        <SelectItem value="Temuan & Insiden">
                          Temuan & Insiden
                        </SelectItem>
                        <SelectItem value="Jadwal & Shift">
                          Jadwal & Shift
                        </SelectItem>
                        <SelectItem value="Tag & Checkpoint">
                          Tag & Checkpoint
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableHead>

                  <TableHead>
                    <Input
                      value={columnSearch.action}
                      onChange={(event) =>
                        updateColumnSearch("action", event.target.value)
                      }
                      placeholder="Cari aksi"
                      className="h-8 min-w-[150px] text-xs"
                    />
                  </TableHead>

                  <TableHead>
                    <Input
                      value={columnSearch.actor}
                      onChange={(event) =>
                        updateColumnSearch("actor", event.target.value)
                      }
                      placeholder="Cari aktor"
                      className="h-8 min-w-[120px] text-xs"
                    />
                  </TableHead>

                  <TableHead>
                    <Input
                      value={columnSearch.targetLocation}
                      onChange={(event) =>
                        updateColumnSearch("targetLocation", event.target.value)
                      }
                      placeholder="Cari target / lokasi"
                      className="h-8 min-w-[140px] text-xs"
                    />
                  </TableHead>

                  <TableHead>
                    <Select
                      value={columnSearch.status || "all"}
                      onValueChange={(value) =>
                        updateColumnSearch(
                          "status",
                          value === "all" ? "" : (value ?? ""),
                        )
                      }
                    >
                      <SelectTrigger className="h-8 min-w-[110px] text-xs">
                        <SelectValue placeholder="Semua" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="all">Semua</SelectItem>
                        <SelectItem value="Berhasil">Berhasil</SelectItem>
                        <SelectItem value="Peringatan">Peringatan</SelectItem>
                        <SelectItem value="Gagal">Gagal</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableHead>

                  <TableHead className="text-right">
                    {isAnyColumnFilterActive && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setColumnSearch(INITIAL_COLUMN_SEARCH)}
                        className="h-8 px-2 text-xs"
                      >
                        Reset
                      </Button>
                    )}
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-36 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <FileSearch className="size-8" />

                        <p className="text-sm font-medium">
                          Tidak ada data audit
                        </p>

                        <p className="text-xs">
                          Coba ubah kata kunci atau filter pencarian.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="font-mono text-xs font-medium text-slate-900">
                          {log.id}
                        </div>

                        <div className="mt-1 whitespace-nowrap text-xs text-muted-foreground">
                          {log.timestamp}
                        </div>
                      </TableCell>

                      <TableCell>{getCategoryBadge(log.category)}</TableCell>

                      <TableCell>
                        <p className="font-medium text-slate-900">
                          {log.action}
                        </p>

                        <p className="mt-1 max-w-[280px] truncate text-xs text-muted-foreground">
                          {log.details}
                        </p>
                      </TableCell>

                      <TableCell>
                        <p className="font-medium text-slate-900">
                          {log.actorName}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {log.actorRole}
                        </p>
                      </TableCell>

                      <TableCell>
                        <p className="font-medium text-slate-900">
                          {log.targetEntity}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {log.siteName}
                        </p>
                      </TableCell>

                      <TableCell>{getStatusBadge(log.status)}</TableCell>

                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLogDetail(log)}
                        >
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* TABLE FOOTER */}
        <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            Menampilkan{" "}
            <strong className="font-medium text-slate-900">
              {filteredLogs.length}
            </strong>{" "}
            dari{" "}
            <strong className="font-medium text-slate-900">
              {logs.length}
            </strong>{" "}
            catatan audit
          </span>

          <span>
            <Filter className="mr-1 inline size-3.5" />
            Data mengikuti filter site yang dipilih
          </span>
        </div>
      </div>

      {/* AUDIT DETAIL DIALOG */}
      <Dialog
        open={Boolean(selectedLogDetail)}
        onOpenChange={(open) => {
          if (!open) setSelectedLogDetail(null);
        }}
      >
        <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto rounded">
          {selectedLogDetail && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-5 text-blue-600" />

                  <DialogTitle>Detail Audit Log</DialogTitle>
                </div>

                <DialogDescription>
                  Rincian aktivitas yang tercatat di dalam sistem.
                </DialogDescription>
              </DialogHeader>

              <Separator />

              {/* GENERAL INFORMATION */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">ID Audit</p>

                  <p className="mt-1 font-mono text-sm font-medium text-slate-900">
                    {selectedLogDetail.id}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Waktu</p>

                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {selectedLogDetail.timestamp}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Kategori</p>

                  <div className="mt-1">
                    {getCategoryBadge(selectedLogDetail.category)}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Status</p>

                  <div className="mt-1">
                    {getStatusBadge(selectedLogDetail.status)}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Site</p>

                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {selectedLogDetail.siteName}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Entitas Target
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {selectedLogDetail.targetEntity}
                  </p>
                </div>
              </div>

              <Separator />

              {/* ACTIVITY */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Aksi</p>

                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {selectedLogDetail.action}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Aktor</p>

                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {selectedLogDetail.actorName}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {selectedLogDetail.actorRole}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Keterangan Aktivitas
                  </p>

                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                    {selectedLogDetail.details || "-"}
                  </p>
                </div>
              </div>

              {/* METADATA */}
              {(selectedLogDetail.ipAddress || selectedLogDetail.device) && (
                <>
                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Activity className="size-4 text-muted-foreground" />

                      <h3 className="text-sm font-semibold text-slate-900">
                        Metadata
                      </h3>
                    </div>

                    {selectedLogDetail.ipAddress && (
                      <div>
                        <p className="text-xs text-muted-foreground">
                          IP Address
                        </p>

                        <p className="mt-1 font-mono text-sm text-slate-900">
                          {selectedLogDetail.ipAddress}
                        </p>
                      </div>
                    )}

                    {selectedLogDetail.device && (
                      <div>
                        <p className="text-xs text-muted-foreground">Device</p>

                        <p className="mt-1 text-sm text-slate-900">
                          {selectedLogDetail.device}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setSelectedLogDetail(null)}
                >
                  Tutup
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
