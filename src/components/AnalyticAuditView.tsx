import {
  Activity,
  FileSearch,
  Filter,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

import { SystemAuditLog } from "../utils/security-logic";

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

import { useAuditLogs } from "../hooks/audit/useAuditLogs";
import { PaginationComponent } from "./PaginationComponent";

interface AnalyticAuditViewProps {
  selectedSite: string;
}

type AuditTab = "all" | "admin" | "patrol" | "findings" | "schedule" | "tags";

interface ColumnSearch {
  idTimestamp: string;
  category: string;
  action: string;
  actor: string;
  status: string;
}

interface AuditLogResponse {
  id: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  description?: string | null;
  ipAddress?: string | null;
  createdAt: string;
  user?: {
    id: string;
    fullName?: string | null;
    employeeNumber?: string | null;
    role?: {
      id: string;
      name: string;
    } | null;
    devices?: {
      id: string;
      deviceIdentifier?: string | null;
      osVersion?: string | null;
      platform?: string | null;
    }[];
  } | null;
}

interface AuditLogMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface AuditLogApiResponse {
  data: AuditLogResponse[];
  meta?: AuditLogMeta;
}

const INITIAL_COLUMN_SEARCH: ColumnSearch = {
  idTimestamp: "",
  category: "",
  action: "",
  actor: "",
  status: "",
};

const normalize = (value: unknown): string =>
  String(value ?? "")
    .toLowerCase()
    .trim();

const formatDateTime = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
};

const getAuditCategory = (
  entityType?: string | null,
  action?: string | null,
): string => {
  const normalize = (value?: string | null) =>
    (value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");

  const entity = normalize(entityType);
  const act = normalize(action);

  if (
    entity.includes("FINDING") ||
    entity.includes("INCIDENT") ||
    act.includes("FINDING") ||
    act.includes("INCIDENT")
  ) {
    return "Temuan & Insiden";
  }

  if (
    entity.includes("SCHEDULE") ||
    entity.includes("ASSIGNMENT") ||
    entity.includes("SHIFT") ||
    entity.includes("ROSTER") ||
    act.includes("ASSIGNMENT") ||
    act.includes("SCHEDULE") ||
    act.includes("SHIFT") ||
    act.includes("ROSTER")
  ) {
    return "Jadwal & Shift";
  }

  if (
    entity.includes("NFC") ||
    entity.includes("TAG") ||
    act.includes("NFC") ||
    act.includes("TAG")
  ) {
    return "Tag & Checkpoint";
  }

  if (
    entity.includes("PATROL") ||
    entity.includes("CHECKPOINT") ||
    entity.includes("ROUND") ||
    entity.includes("POINT") ||
    act.includes("PATROL") ||
    act.includes("CHECKPOINT") ||
    act.includes("ROUND") ||
    act.includes("ATTENDANCE")
  ) {
    return "Operasional Patroli";
  }

  if (
    entity.includes("USER") ||
    entity.includes("ROLE") ||
    entity.includes("AUTH") ||
    entity.includes("ADMIN") ||
    entity.includes("DEVICE") ||
    entity.includes("SESSION") ||
    act.includes("LOGIN") ||
    act.includes("LOGOUT") ||
    act.includes("TOKEN") ||
    act.includes("USER") ||
    act.includes("ROLE") ||
    act.includes("PASSWORD") ||
    act.includes("PERMISSION") ||
    act.includes("DEVICE")
  ) {
    return "Admin & Pengguna";
  }

  return "Lainnya";
};

const getAuditStatus = (action: string): string => {
  const normalized = normalize(action);

  if (
    normalized.includes("fail") ||
    normalized.includes("error") ||
    normalized.includes("reject")
  ) {
    return "Gagal";
  }

  if (
    normalized.includes("warning") ||
    normalized.includes("bypass") ||
    normalized.includes("cancel")
  ) {
    return "Peringatan";
  }

  return "Berhasil";
};

const getAuditActorRole = (role?: string | null): string => {
  if (!role) return "-";

  const normalized = role.toLowerCase().replace(/[_\s-]/g, "");

  if (normalized.includes("admin")) return "Admin";

  if (normalized.includes("danru") || normalized.includes("leader")) {
    return "Danru";
  }

  if (
    normalized.includes("security") ||
    normalized.includes("satpam") ||
    normalized.includes("guard")
  ) {
    return "Satpam";
  }

  return role;
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

const matchesText = (value: unknown, keyword: string): boolean => {
  if (!keyword.trim()) return true;

  return normalize(value).includes(normalize(keyword));
};

const extractAuditResponse = (response: unknown): AuditLogApiResponse => {
  const first = response as Record<string, unknown> | undefined;

  if (!first) {
    return { data: [] };
  }

  const firstData = first.data as
    | Record<string, unknown>
    | AuditLogResponse[]
    | undefined;

  if (Array.isArray(firstData)) {
    return {
      data: firstData as AuditLogResponse[],
      meta: first.meta as AuditLogMeta | undefined,
    };
  }

  if (firstData && typeof firstData === "object") {
    const nested = firstData as Record<string, unknown>;

    if (Array.isArray(nested.data)) {
      return {
        data: nested.data as AuditLogResponse[],
        meta: nested.meta as AuditLogMeta | undefined,
      };
    }
  }

  return { data: [] };
};

export const AnalyticAuditView: React.FC<AnalyticAuditViewProps> = ({
  selectedSite,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [activeTab, setActiveTab] = useState<AuditTab>("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState("20");

  const [selectedLogDetail, setSelectedLogDetail] =
    useState<SystemAuditLog | null>(null);

  const [columnSearch, setColumnSearch] = useState<ColumnSearch>(
    INITIAL_COLUMN_SEARCH,
  );

  const {
    data: auditData,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useAuditLogs({
    page: currentPage,
    limit: Number(pageSize),
  });

  const auditResponse = useMemo(
    () => extractAuditResponse(auditData),
    [auditData],
  );

  const logs = useMemo<SystemAuditLog[]>(() => {
    return auditResponse.data.map((item) => {
      const category = getAuditCategory(item.entityType, item.action);
      const status = getAuditStatus(item.action);
      const actorRole = getAuditActorRole(item.user?.role?.name);

      return {
        id: item.id,
        timestamp: formatDateTime(item.createdAt),
        category,
        action: item.action,
        details: item.description ?? item.entityType ?? "-",
        actorName: item.user?.fullName ?? "System",
        actorRole,
        targetEntity: item.entityId ?? item.entityType ?? "-",
        siteName: "-",
        status,
        ipAddress: item.ipAddress ?? undefined,
        device: item.user?.devices?.[0]
          ? `${item.user.devices[0].platform ?? "-"} - ${
              item.user.devices[0].deviceIdentifier ?? "-"
            }`
          : undefined,
      } as SystemAuditLog;
    });
  }, [auditResponse]);

  const meta: AuditLogMeta = auditResponse.meta ?? {
    page: currentPage,
    limit: Number(pageSize),
    total: logs.length,
    totalPages: logs.length > 0 ? 1 : 0,
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const category = normalize(log.category);
      const role = normalize(log.actorRole);
      const status = normalize(log.status);

      const matchesTab = (() => {
        if (activeTab === "all") return true;

        const categoryByTab: Record<Exclude<AuditTab, "all">, string> = {
          admin: "Admin & Pengguna",
          patrol: "Operasional Patroli",
          findings: "Temuan & Insiden",
          schedule: "Jadwal & Shift",
          tags: "Tag & Checkpoint",
        };

        return normalize(log.category) === normalize(categoryByTab[activeTab]);
      })();

      const matchesRole =
        selectedRole === "all" || role === normalize(selectedRole);

      const matchesStatus =
        selectedStatus === "all" || status === normalize(selectedStatus);

      const matchesGlobalSearch =
        !searchQuery.trim() ||
        [
          log.id,
          log.timestamp,
          log.category,
          log.action,
          log.details,
          log.actorName,
          log.actorRole,
          log.targetEntity,
          log.siteName,
          log.ipAddress,
          log.device,
        ].some((value) => matchesText(value, searchQuery));

      const matchesColumnSearch =
        matchesText(`${log.id} ${log.timestamp}`, columnSearch.idTimestamp) &&
        matchesText(log.category, columnSearch.category) &&
        matchesText(log.action, columnSearch.action) &&
        matchesText(`${log.actorName} ${log.actorRole}`, columnSearch.actor) &&
        matchesText(log.status, columnSearch.status);

      return (
        matchesTab &&
        matchesRole &&
        matchesStatus &&
        matchesGlobalSearch &&
        matchesColumnSearch
      );
    });
  }, [
    logs,
    activeTab,
    selectedRole,
    selectedStatus,
    searchQuery,
    columnSearch,
  ]);

  const isAnyColumnFilterActive = Object.values(columnSearch).some(
    (value) => value.trim().length > 0,
  );

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedRole !== "all" ||
    selectedStatus !== "all" ||
    activeTab !== "all" ||
    isAnyColumnFilterActive;

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedRole("all");
    setSelectedStatus("all");
    setActiveTab("all");
    setColumnSearch(INITIAL_COLUMN_SEARCH);
    setCurrentPage(1);
  };

  const updateColumnSearch = (key: keyof ColumnSearch, value: string) => {
    setColumnSearch((previous) => ({
      ...previous,
      [key]: value,
    }));

    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [
    selectedSite,
    activeTab,
    selectedRole,
    selectedStatus,
    searchQuery,
    pageSize,
  ]);

  const startItem = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;

  const endItem = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="space-y-5">
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
          type="button"
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="w-fit"
        >
          <RefreshCw
            className={`mr-2 size-4 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <Separator />

      <div className="space-y-4">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as AuditTab)}
        >
          <TabsList className="h-auto flex-wrap justify-start bg-transparent p-0">
            <TabsTrigger value="all">Semua ({meta.total})</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
            <TabsTrigger value="patrol">Patroli</TabsTrigger>
            <TabsTrigger value="findings">Temuan & Insiden</TabsTrigger>
            <TabsTrigger value="schedule">Jadwal & Shift</TabsTrigger>
            <TabsTrigger value="tags">Tag & Checkpoint</TabsTrigger>
          </TabsList>
        </Tabs>

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
                <SelectValue>
                  {selectedRole === "all"
                    ? "Semua Peran"
                    : selectedRole === "Admin"
                      ? "Administrator"
                      : selectedRole === "Danru"
                        ? "Komandan Regu"
                        : selectedRole === "Satpam"
                          ? "Petugas Lapangan"
                          : "Semua Peran"}
                </SelectValue>
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
                <SelectValue>
                  {selectedStatus === "all"
                    ? "Semua Status"
                    : selectedStatus === "Berhasil"
                      ? "Berhasil"
                      : selectedStatus === "Peringatan"
                        ? "Peringatan"
                        : selectedStatus === "Gagal"
                          ? "Gagal"
                          : "Semua Status"}
                </SelectValue>
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

        <PaginationComponent
          totalItems={meta.total}
          startItem={startItem}
          endItem={endItem}
          pageSize={pageSize}
          currentPage={meta.page}
          totalPages={meta.totalPages}
          onPageSizeChange={(value) => {
            setPageSize(value || "20");
            setCurrentPage(1);
          }}
          onPageChange={(page) => {
            setCurrentPage(Math.max(1, Math.min(page, meta.totalPages || 1)));
          }}
        />

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

                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[90px] text-right">Detail</TableHead>
                </TableRow>

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
                        <SelectValue>
                          {columnSearch.category || "Semua Kategori"}
                        </SelectValue>
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
                        <SelectItem value="Lainnya">Lainnya</SelectItem>
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
                        <SelectValue>
                          {columnSearch.status || "Semua"}
                        </SelectValue>
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
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-36 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <RefreshCw className="size-7 animate-spin" />
                        <p className="text-sm">Memuat data audit...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-36 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <FileSearch className="size-8" />
                        <p className="text-sm font-medium">
                          Gagal memuat data audit
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => refetch()}
                        >
                          Coba Lagi
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
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
                          {log.id.slice(0, 7).toUpperCase()}
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
            data pada halaman ini
          </span>

          <span>
            <Filter className="mr-1 inline size-3.5" />
            {selectedSite === "all"
              ? "Semua site"
              : "Filter site belum tersedia dari API audit"}
          </span>
        </div>
      </div>

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

              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">ID Audit</p>
                  <p className="mt-1 break-all font-mono text-sm font-medium text-slate-900">
                    {selectedLogDetail.id.slice(0, 7).toUpperCase()}
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
              </div>

              <Separator />

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
