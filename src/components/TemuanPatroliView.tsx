import React, { useMemo, useState } from "react";

import { useFindings } from "../hooks/finding/useFIndings";
import type { Finding, FindingQuery } from "../types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

import {
  ChevronDown,
  Download,
  Eye,
  Image as ImageIcon,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import { formatDate } from "../helpers/dateTime";
import { exportFindingExcel } from "../utils/exportFindingExcel";
import { getPhotoUrl } from "../utils/getPhoto";
import { PaginationComponent } from "./PaginationComponent";

interface TemuanPatroliViewProps {
  selectedSite: string;
}

type FindingStatusFilter = "all" | "OPEN" | "IN_PROGRESS" | "RESOLVED";

type FindingSeverityFilter = "all" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

type ColumnSearch = {
  title: string;
  reportedBy: string;
  assignedTo: string;
  status: string;
  hasPhoto: string;
};

interface TimelinePoint {
  date: Date;
  key: string;
  label: string;
  reportedCount: number;
  resolvedCount: number;
  openCount: number;
  inProgressCount: number;
}

const now = new Date();

const MONTH_OPTIONS = [
  { value: "1", label: "Januari" },
  { value: "2", label: "Februari" },
  { value: "3", label: "Maret" },
  { value: "4", label: "April" },
  { value: "5", label: "Mei" },
  { value: "6", label: "Juni" },
  { value: "7", label: "Juli" },
  { value: "8", label: "Agustus" },
  { value: "9", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
];

const YEAR_OPTIONS = Array.from({ length: 5 }, (_, index) =>
  String(now.getFullYear() - index),
);

const INITIAL_COLUMN_SEARCH: ColumnSearch = {
  title: "",
  reportedBy: "",
  assignedTo: "",
  status: "",
  hasPhoto: "",
};

const STATUS_OPTIONS: {
  value: Exclude<FindingStatusFilter, "all">;
  label: string;
}[] = [
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "Progress" },
  { value: "RESOLVED", label: "Close" },
];

const DONUT_STATUS_OPTIONS = [
  {
    value: "OPEN",
    label: "Open",
    color: "#e11d48",
  },
  {
    value: "IN_PROGRESS",
    label: "Progress",
    color: "#f59e0b",
  },
  {
    value: "RESOLVED",
    label: "Selesai",
    color: "#059669",
  },
] as const;

const getStatusLabel = (status: Finding["status"]) => {
  switch (status) {
    case "OPEN":
      return "Open";
    case "IN_PROGRESS":
      return "Progress";
    case "RESOLVED":
      return "Close";
    default:
      return status;
  }
};

const getStatusBadge = (status: Finding["status"]) => {
  const styles: Record<string, string> = {
    OPEN: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-50",
    IN_PROGRESS:
      "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50",
    RESOLVED:
      "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
  };

  return (
    <Badge
      variant="outline"
      className={`whitespace-nowrap font-medium ${styles[status] ?? ""}`}
    >
      {getStatusLabel(status)}
    </Badge>
  );
};

const getSeverityLabel = (severity: Finding["severity"]) => {
  switch (severity) {
    case "LOW":
      return "Rendah";
    case "MEDIUM":
      return "Sedang";
    case "HIGH":
      return "Tinggi";
    case "CRITICAL":
      return "Kritis";
    default:
      return severity;
  }
};

const normalize = (value: unknown) =>
  String(value ?? "")
    .toLowerCase()
    .trim();

const getLocalDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;

export const TemuanPatroliView: React.FC<TemuanPatroliViewProps> = ({
  selectedSite,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState("10");

  const [selectedSeverity, setSelectedSeverity] =
    useState<FindingSeverityFilter>("all");

  const [selectedStatus, setSelectedStatus] =
    useState<FindingStatusFilter>("all");

  const [columnSearch, setColumnSearch] = useState<ColumnSearch>(
    INITIAL_COLUMN_SEARCH,
  );

  const [showCharts, setShowCharts] = useState(true);

  const [selectedMonth, setSelectedMonth] = useState(
    String(now.getMonth() + 1),
  );

  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));

  const [viewingPhotoFinding, setViewingPhotoFinding] =
    useState<Finding | null>(null);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const tableQuery = useMemo<FindingQuery>(
    () => ({
      page: currentPage,
      limit: Number(pageSize),
      ...(selectedStatus !== "all" && {
        status: selectedStatus as FindingQuery["status"],
      }),
      ...(selectedSeverity !== "all" && {
        severity: selectedSeverity as FindingQuery["severity"],
      }),
    }),
    [currentPage, pageSize, selectedStatus, selectedSeverity],
  );

  const analyticsQuery = useMemo<FindingQuery>(
    () => ({
      page: 1,
      limit: 100,
    }),
    [],
  );

  const handlePageChange = (page: number) => {
    if (page < 1 || page > (meta?.totalPages ?? 1)) return;

    setCurrentPage(page);
  };

  const handlePageSizeChange = (value: string | null) => {
    if (!value) return;

    setPageSize(value);
    setCurrentPage(1);
  };

  const {
    data: findingData,
    isLoading: isFindingsLoading,
    isError: isFindingsError,
    refetch: refetchFindings,
    isFetching: isFindingsFetching,
  } = useFindings(tableQuery);

  const {
    data: analyticsData,
    isLoading: isAnalyticsLoading,
    isError: isAnalyticsError,
    refetch: refetchAnalytics,
    isFetching: isAnalyticsFetching,
  } = useFindings(analyticsQuery);

  const findings: Finding[] = findingData?.data ?? [];
  const analyticsFindings: Finding[] = analyticsData?.data ?? [];
  const meta = findingData?.meta;

  const isFetching = isFindingsFetching || isAnalyticsFetching;

  const refetchAll = () => {
    void Promise.all([refetchFindings(), refetchAnalytics()]);
  };

  const chartFindings = useMemo(() => {
    const year = Number(selectedYear);
    const month = Number(selectedMonth);

    return analyticsFindings.filter((finding) => {
      if (
        selectedSite !== "all" &&
        finding.patrolPoint?.site?.id !== selectedSite
      ) {
        return false;
      }

      const createdAt = new Date(finding.createdAt);

      if (Number.isNaN(createdAt.getTime())) {
        return false;
      }

      return (
        createdAt.getFullYear() === year && createdAt.getMonth() + 1 === month
      );
    });
  }, [analyticsFindings, selectedSite, selectedMonth, selectedYear]);

  const timelineData = useMemo<TimelinePoint[]>(() => {
    const year = Number(selectedYear);
    const month = Number(selectedMonth);
    const totalDays = new Date(year, month, 0).getDate();

    const days: TimelinePoint[] = Array.from(
      { length: totalDays },
      (_, index) => {
        const date = new Date(year, month - 1, index + 1);

        return {
          date,
          key: getLocalDateKey(date),
          label: String(index + 1),
          reportedCount: 0,
          resolvedCount: 0,
          openCount: 0,
          inProgressCount: 0,
        };
      },
    );

    const dayMap = new Map(days.map((day) => [day.key, day]));

    chartFindings.forEach((finding) => {
      const createdAt = new Date(finding.createdAt);

      if (Number.isNaN(createdAt.getTime())) return;

      const day = dayMap.get(getLocalDateKey(createdAt));

      if (!day) return;

      day.reportedCount += 1;

      switch (finding.status) {
        case "OPEN":
          day.openCount += 1;
          break;
        case "IN_PROGRESS":
          day.inProgressCount += 1;
          break;
        case "RESOLVED":
          day.resolvedCount += 1;
          break;
      }
    });

    return days;
  }, [chartFindings, selectedMonth, selectedYear]);

  const dailyChartMax = useMemo(() => {
    const maxValue = Math.max(
      0,
      ...timelineData.flatMap((point) => [
        point.reportedCount,
        point.resolvedCount,
      ]),
    );

    return Math.max(1, maxValue);
  }, [timelineData]);

  const statusDistribution = useMemo(() => {
    const counts = {
      OPEN: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
    };

    chartFindings.forEach((finding) => {
      if (finding.status in counts) {
        counts[finding.status as keyof typeof counts] += 1;
      }
    });

    const total = counts.OPEN + counts.IN_PROGRESS + counts.RESOLVED;

    return {
      total,
      items: DONUT_STATUS_OPTIONS.map((status) => ({
        ...status,
        count: counts[status.value],
        percentage: total > 0 ? (counts[status.value] / total) * 100 : 0,
      })),
    };
  }, [chartFindings]);

  const donutSegments = useMemo(() => {
    const circumference = 2 * Math.PI * 42;
    let offset = 0;

    return statusDistribution.items.map((item) => {
      const segmentLength = (item.percentage / 100) * circumference;

      const segment = {
        ...item,
        circumference,
        segmentLength,
        offset,
      };

      offset += segmentLength;

      return segment;
    });
  }, [statusDistribution]);

  const baseFiltered = useMemo(() => {
    return findings.filter((finding) => {
      if (
        selectedSite !== "all" &&
        finding.patrolPoint?.site?.id !== selectedSite
      ) {
        return false;
      }

      if (!finding.patrolPoint || !finding.reportedBy) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = normalize(searchQuery);

        const searchableText = [
          finding.id,
          finding.title,
          finding.description,
          finding.patrolPoint.code,
          finding.patrolPoint.name,
          finding.patrolPoint.site.name,
          finding.reportedBy.fullName,
          finding.reportedBy.username,
          finding.assignedTo?.fullName,
          finding.assignedTo?.username,
        ]
          .map(normalize)
          .join(" ");

        if (!searchableText.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [findings, selectedSite, searchQuery]);

  const filteredFindings = useMemo(() => {
    return baseFiltered.filter((finding) => {
      const titleSearch = normalize(columnSearch.title);
      const reporterSearch = normalize(columnSearch.reportedBy);
      const assignedSearch = normalize(columnSearch.assignedTo);

      if (titleSearch) {
        const titleText = normalize(`${finding.title} ${finding.description}`);

        if (!titleText.includes(titleSearch)) return false;
      }

      if (reporterSearch) {
        const reporterText = normalize(
          `${finding.reportedBy?.fullName} ${finding.reportedBy?.username}`,
        );

        if (!reporterText.includes(reporterSearch)) return false;
      }

      if (assignedSearch) {
        const assignedText = normalize(
          `${finding.assignedTo?.fullName ?? ""} ${
            finding.assignedTo?.username ?? ""
          }`,
        );

        if (!assignedText.includes(assignedSearch)) return false;
      }

      if (columnSearch.status && finding.status !== columnSearch.status) {
        return false;
      }

      if (
        columnSearch.hasPhoto === "ada" &&
        (!finding.photos || finding.photos.length === 0)
      ) {
        return false;
      }

      if (
        columnSearch.hasPhoto === "tanpa" &&
        finding.photos &&
        finding.photos.length > 0
      ) {
        return false;
      }

      return true;
    });
  }, [baseFiltered, columnSearch]);

  const isAnyColumnFilterActive = Object.values(columnSearch).some(
    (value) => value.trim().length > 0,
  );

  const updateColumnSearch = (key: keyof ColumnSearch, value: string) => {
    setColumnSearch((previous) => ({
      ...previous,
      [key]: value === "all" ? "" : value,
    }));
  };

  const clearAllColumnFilters = () => {
    setColumnSearch(INITIAL_COLUMN_SEARCH);
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedSeverity("all");
    setSelectedStatus("all");
    setCurrentPage(1);
    clearAllColumnFilters();
  };

  const handleExportCSV = () => {
    const headers = [
      "ID Temuan",
      "Judul",
      "Deskripsi",
      "Tingkat Keparahan",
      "Status",
      "Kode Titik",
      "Titik Patroli",
      "Site",
      "Pelapor",
      "Username Pelapor",
      "Waktu Temuan",
      "Jumlah Foto",
    ];

    const escapeCSV = (value: unknown) =>
      `"${String(value ?? "-").replace(/"/g, '""')}"`;

    const rows = filteredFindings.map((finding) =>
      [
        finding.id,
        finding.title,
        finding.description,
        getSeverityLabel(finding.severity),
        getStatusLabel(finding.status),
        finding.patrolPoint?.code,
        finding.patrolPoint?.name,
        finding.patrolPoint?.site?.name,
        finding.reportedBy?.fullName,
        finding.reportedBy?.username,
        formatDate(finding.createdAt),
        finding.photos?.length ?? 0,
      ]
        .map(escapeCSV)
        .join(","),
    );

    const csvContent = [headers.map(escapeCSV).join(","), ...rows].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "Temuan_Patroli_PAMAREA.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const selectedMonthLabel =
    MONTH_OPTIONS.find((month) => month.value === selectedMonth)?.label ??
    "Pilih Bulan";

  const handleExportExcel = async () => {
    if (filteredFindings.length === 0 || isExportingExcel) return;

    try {
      setIsExportingExcel(true);

      await exportFindingExcel(
        filteredFindings.map((finding) => ({
          id: finding.id,
          title: finding.title,
          description: finding.description,
          createdAt: finding.createdAt,
          reportedBy: finding.reportedBy
            ? {
                fullName: finding.reportedBy.fullName,
                employeeNumber: finding.reportedBy.employeeNumber,
                username: finding.reportedBy.username,
              }
            : null,
          patrolPoint: finding.patrolPoint
            ? {
                name: finding.patrolPoint.name,
              }
            : null,
          photos:
            finding.photos?.map((photo) => ({
              id: photo.id,
              fileUrl: photo.fileUrl,
            })) ?? [],
        })),
      );
    } catch (error) {
      console.error("Gagal mengekspor Excel temuan:", error);

      alert("Gagal mengekspor laporan temuan. Silakan coba kembali.");
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Temuan Patroli
          </h1>

          <p className="text-sm text-muted-foreground">
            Pemantauan temuan inspeksi, anomali keamanan, kerusakan fasilitas,
            dan tindak lanjut lapangan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            disabled={
              isFindingsLoading ||
              isFindingsError ||
              !filteredFindings.length ||
              isExportingExcel
            }
          >
            {isExportingExcel ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Ekspor Excel
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="rounded text-xs"
            disabled={isFetching}
            onClick={refetchAll}
          >
            <RefreshCw
              className={`mr-2 size-3.5 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,0.85fr)]">
        <div className="flex min-w-0 flex-col gap-3">
          <section className="space-y-3">
            <div className="flex flex-col gap-3 rounded-md border bg-white p-3">
              <div className="flex flex-col gap-2 lg:flex-row">
                <InputGroup className="rounded">
                  <InputGroupAddon>
                    <Search className="size-4 text-slate-400" />
                  </InputGroupAddon>

                  <InputGroupInput
                    placeholder="Cari ID, judul, deskripsi, pelapor, atau lokasi..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                </InputGroup>

                <Select
                  value={selectedStatus}
                  onValueChange={(value) => {
                    setSelectedStatus(value as FindingStatusFilter);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full text-xs">
                    <SelectValue>
                      {selectedStatus === "all"
                        ? "Semua Status"
                        : (STATUS_OPTIONS.find(
                            (status) => status.value === selectedStatus,
                          )?.label ?? "Status Penanganan")}
                    </SelectValue>
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>

                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  className="shrink-0"
                  onClick={clearAllFilters}
                >
                  <X className="mr-2 h-3.5 w-3.5" />
                  Reset Filter
                </Button>
              </div>
            </div>
          </section>

          <div className="space-y-2">
            <PaginationComponent
              totalItems={meta?.total ?? 0}
              startItem={
                (meta?.total ?? 0) === 0
                  ? 0
                  : (currentPage - 1) * Number(pageSize) + 1
              }
              endItem={Math.min(
                currentPage * Number(pageSize),
                meta?.total ?? 0,
              )}
              pageSize={pageSize}
              currentPage={currentPage}
              totalPages={meta?.totalPages ?? 1}
              onPageSizeChange={handlePageSizeChange}
              onPageChange={handlePageChange}
            />
          </div>

          <section className="min-w-0 overflow-hidden rounded-md border bg-white">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold">Daftar Temuan Patroli</h2>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  Data inspeksi dan tindak lanjut anomali lapangan.
                </p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={clearAllColumnFilters}
                disabled={!isAnyColumnFilterActive}
              >
                <X className="mr-1.5 h-3.5 w-3.5" />
                Reset Kolom
              </Button>
            </div>

            <div className="min-w-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="text-xs font-semibold">
                      Judul & Deskripsi
                    </TableHead>

                    <TableHead className="text-xs font-semibold">
                      Pelapor & Waktu
                    </TableHead>

                    <TableHead className="text-xs font-semibold">
                      Status
                    </TableHead>

                    <TableHead className="text-center text-xs font-semibold">
                      Foto
                    </TableHead>
                  </TableRow>

                  <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                    <TableHead>
                      <Input
                        placeholder="Cari anomali..."
                        value={columnSearch.title}
                        onChange={(event) =>
                          updateColumnSearch("title", event.target.value)
                        }
                        className="h-8 bg-white text-xs"
                      />
                    </TableHead>

                    <TableHead>
                      <Input
                        placeholder="Cari pelapor..."
                        value={columnSearch.reportedBy}
                        onChange={(event) =>
                          updateColumnSearch("reportedBy", event.target.value)
                        }
                        className="h-8 bg-white text-xs"
                      />
                    </TableHead>

                    <TableHead>
                      <Select
                        value={columnSearch.status || "all"}
                        onValueChange={(value) =>
                          updateColumnSearch("status", value ?? "")
                        }
                      >
                        <SelectTrigger className="h-8 bg-white text-xs">
                          <SelectValue>
                            {!columnSearch.status
                              ? "Semua"
                              : (STATUS_OPTIONS.find(
                                  (status) =>
                                    status.value === columnSearch.status,
                                )?.label ?? "Semua")}
                          </SelectValue>
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="all">Semua</SelectItem>

                          {STATUS_OPTIONS.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableHead>

                    <TableHead>
                      <Select
                        value={columnSearch.hasPhoto || "all"}
                        onValueChange={(value) =>
                          updateColumnSearch("hasPhoto", value ?? "")
                        }
                      >
                        <SelectTrigger className="h-8 min-w-[80px] bg-white text-xs">
                          <SelectValue>
                            {columnSearch.hasPhoto === "ada"
                              ? "Ada"
                              : columnSearch.hasPhoto === "tanpa"
                                ? "Tanpa"
                                : "Semua"}
                          </SelectValue>
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="all">Semua</SelectItem>
                          <SelectItem value="ada">Ada</SelectItem>
                          <SelectItem value="tanpa">Tanpa</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {isFindingsLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center">
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
                          Memuat data temuan patroli...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : isFindingsError ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <p className="text-sm text-rose-600">
                            Gagal mengambil data temuan patroli.
                          </p>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void refetchFindings()}
                          >
                            Coba Lagi
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredFindings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Search className="h-6 w-6 opacity-40" />

                          <p className="text-sm font-medium">
                            Tidak ada temuan ditemukan
                          </p>

                          <p className="text-xs">
                            Coba ubah kata kunci atau filter pencarian.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredFindings.map((finding) => (
                      <TableRow key={finding.id} className="align-middle">
                        <TableCell>
                          <p className="font-medium text-slate-900">
                            {finding.title}
                          </p>

                          <p className="mt-1 line-clamp-2 max-w-[280px] text-xs leading-relaxed text-muted-foreground">
                            {finding.description}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {finding.patrolPoint?.site?.name} ·{" "}
                            {finding.patrolPoint?.name}
                          </p>
                        </TableCell>

                        <TableCell>
                          <p className="font-medium">
                            {finding.reportedBy?.fullName}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDate(finding.createdAt)}
                          </p>
                        </TableCell>

                        <TableCell>{getStatusBadge(finding.status)}</TableCell>

                        <TableCell className="text-center">
                          {finding.photos && finding.photos.length > 0 ? (
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setViewingPhotoFinding(finding)}
                              title="Lihat foto bukti"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              -
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <section className="min-w-0 overflow-hidden rounded-md border bg-white">
            <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold">
                  Analitik Temuan Patroli
                </h2>

                <p className="mt-1 text-xs text-muted-foreground">
                  Statistik temuan berdasarkan periode.
                </p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 shrink-0 text-xs"
                onClick={() => setShowCharts((previous) => !previous)}
              >
                {showCharts ? "Sembunyikan" : "Tampilkan"}

                <ChevronDown
                  className={`ml-2 h-4 w-4 transition-transform ${
                    showCharts ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </div>

            {showCharts && (
              <div className="space-y-4 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={selectedMonth}
                    onValueChange={(value) => setSelectedMonth(value ?? "")}
                  >
                    <SelectTrigger className="h-8 w-[125px] bg-white text-xs">
                      <SelectValue>{selectedMonthLabel}</SelectValue>
                    </SelectTrigger>

                    <SelectContent>
                      {MONTH_OPTIONS.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedYear}
                    onValueChange={(value) => setSelectedYear(value ?? "")}
                  >
                    <SelectTrigger className="h-8 w-[90px] bg-white text-xs">
                      <SelectValue>{selectedYear}</SelectValue>
                    </SelectTrigger>

                    <SelectContent>
                      {YEAR_OPTIONS.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {isAnalyticsLoading ? (
                  <div className="flex h-64 items-center justify-center rounded-md border bg-slate-50 text-sm text-muted-foreground">
                    Memuat analitik temuan...
                  </div>
                ) : isAnalyticsError ? (
                  <div className="flex h-64 items-center justify-center rounded-md border bg-slate-50 text-sm text-rose-600">
                    Gagal memuat data analitik.
                  </div>
                ) : (
                  <>
                    <section className="space-y-3 rounded-md border p-3">
                      <div>
                        <h3 className="text-sm font-semibold">
                          Tren Temuan Harian
                        </h3>

                        <p className="mt-1 text-xs text-muted-foreground">
                          Perbandingan temuan dilaporkan dan berstatus selesai.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs">
                        <span className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-sm bg-blue-600" />
                          Dilaporkan
                        </span>

                        <span className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-600" />
                          Selesai
                        </span>
                      </div>

                      {chartFindings.length === 0 ? (
                        <div className="flex h-48 items-center justify-center rounded-md bg-slate-50 text-xs text-muted-foreground">
                          Tidak ada temuan pada periode ini.
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-md bg-slate-50 p-3">
                          <div className="flex h-48 min-w-[540px] items-end gap-1">
                            {timelineData.map((point) => {
                              const reportedHeight =
                                (point.reportedCount / dailyChartMax) * 135;

                              const resolvedHeight =
                                (point.resolvedCount / dailyChartMax) * 135;

                              return (
                                <div
                                  key={point.key}
                                  className="flex h-full min-w-0 flex-1 flex-col justify-end"
                                  title={`${point.label} ${selectedMonthLabel}: ${point.reportedCount} dilaporkan, ${point.resolvedCount} selesai`}
                                >
                                  <div className="flex h-[150px] items-end justify-center gap-[2px]">
                                    <div
                                      className="w-1/2 max-w-[10px] rounded-t-sm bg-blue-600 transition-all"
                                      style={{
                                        height: `${reportedHeight}px`,
                                        minHeight:
                                          point.reportedCount > 0 ? "3px" : "0",
                                      }}
                                    />

                                    <div
                                      className="w-1/2 max-w-[10px] rounded-t-sm bg-emerald-600 transition-all"
                                      style={{
                                        height: `${resolvedHeight}px`,
                                        minHeight:
                                          point.resolvedCount > 0 ? "3px" : "0",
                                      }}
                                    />
                                  </div>

                                  <span className="mt-2 text-center text-[9px] text-slate-500">
                                    {Number(point.label) % 5 === 0 ||
                                    point.label === "1" ||
                                    point.label === String(timelineData.length)
                                      ? point.label
                                      : ""}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </section>

                    <section className="space-y-3 rounded-md border p-3">
                      <div>
                        <h3 className="text-sm font-semibold">
                          Distribusi Status Temuan
                        </h3>

                        <p className="mt-1 text-xs text-muted-foreground">
                          Komposisi status temuan pada periode terpilih.
                        </p>
                      </div>

                      {statusDistribution.total === 0 ? (
                        <div className="flex h-48 items-center justify-center rounded-md bg-slate-50 text-xs text-muted-foreground">
                          Tidak ada data status temuan.
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-5 py-2 sm:flex-row sm:justify-center">
                          <div className="relative h-40 w-40 shrink-0">
                            <svg
                              viewBox="0 0 100 100"
                              className="h-full w-full -rotate-90"
                            >
                              <circle
                                cx="50"
                                cy="50"
                                r="42"
                                fill="none"
                                stroke="#e2e8f0"
                                strokeWidth="12"
                              />

                              {donutSegments.map((segment) => (
                                <circle
                                  key={segment.value}
                                  cx="50"
                                  cy="50"
                                  r="42"
                                  fill="none"
                                  stroke={segment.color}
                                  strokeWidth="12"
                                  strokeDasharray={`${segment.segmentLength} ${segment.circumference}`}
                                  strokeDashoffset={-segment.offset}
                                  strokeLinecap="butt"
                                />
                              ))}
                            </svg>

                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-2xl font-semibold text-slate-900">
                                {statusDistribution.total}
                              </span>

                              <span className="text-[10px] text-muted-foreground">
                                Total Temuan
                              </span>
                            </div>
                          </div>

                          <div className="w-full space-y-3">
                            {statusDistribution.items.map((item) => (
                              <div
                                key={item.value}
                                className="flex items-center justify-between gap-3"
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    className="h-3 w-3 rounded-sm"
                                    style={{
                                      backgroundColor: item.color,
                                    }}
                                  />

                                  <span className="text-xs text-slate-600">
                                    {item.label}
                                  </span>
                                </div>

                                <div className="text-right">
                                  <span className="text-sm font-semibold text-slate-900">
                                    {item.count}
                                  </span>

                                  <span className="ml-2 text-xs text-muted-foreground">
                                    {item.percentage.toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </section>
                  </>
                )}
              </div>
            )}
          </section>
        </div>
      </div>

      <Dialog
        open={!!viewingPhotoFinding}
        onOpenChange={(open) => {
          if (!open) setViewingPhotoFinding(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-blue-600" />
              Foto Bukti Temuan
            </DialogTitle>

            <DialogDescription>
              {viewingPhotoFinding?.id} - {viewingPhotoFinding?.title}
            </DialogDescription>
          </DialogHeader>

          {viewingPhotoFinding && (
            <div className="space-y-4">
              {viewingPhotoFinding.photos &&
              viewingPhotoFinding.photos.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {viewingPhotoFinding.photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="overflow-hidden rounded-md border bg-slate-100"
                    >
                      <img
                        src={getPhotoUrl(photo.fileUrl)}
                        alt={viewingPhotoFinding.title}
                        className="max-h-[300px] w-full object-contain"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-40 flex-col items-center justify-center rounded-md border bg-slate-50 text-muted-foreground">
                  <ImageIcon className="mb-2 h-8 w-8" />
                  <p className="text-sm">Tidak ada foto bukti.</p>
                </div>
              )}

              <div className="space-y-2 rounded-md border p-3">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Deskripsi Temuan
                  </p>

                  <p className="mt-1 text-sm">
                    {viewingPhotoFinding.description}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setViewingPhotoFinding(null)}
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemuanPatroliView;
