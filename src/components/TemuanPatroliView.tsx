import React, { useMemo, useState } from "react";

import { FINDINGS, FindingItem, SITES } from "../data/mockData";

import {
  filterItemsByColumnCriteria,
  generateFindingsTimelineTrend,
} from "../utils/security-logic";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Tabs, TabsContent } from "@/components/ui/tabs";

import {
  AlertTriangle,
  Check,
  ChevronDown,
  Download,
  Eye,
  Image as ImageIcon,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";

interface TemuanPatroliViewProps {
  selectedSite: string;
}

type ChartMetric = "volume";

type ColumnSearch = {
  id: string;
  hasPhoto: string;
  title: string;
  severity: string;
  location: string;
  reportedBy: string;
  assignedTo: string;
  status: string;
};

const INITIAL_COLUMN_SEARCH: ColumnSearch = {
  id: "",
  hasPhoto: "",
  title: "",
  severity: "",
  location: "",
  reportedBy: "",
  assignedTo: "",
  status: "",
};

const INITIAL_NEW_FINDING = {
  title: "",
  description: "",
  siteId: "site-a",
  location: "",
  assignedTo: "Tim K3 & Fasilitas",
  photoUrl: "",
};

const STATUS_OPTIONS = [
  "Baru",
  "Dalam Penanganan",
  "Selesai Terverifikasi",
] as const;

const formatCurrentDate = () =>
  new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const formatCurrentTime = () =>
  new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

const getNextFindingId = (findings: FindingItem[]) => {
  const year = new Date().getFullYear();

  const sequences = findings.map((finding) => {
    const match = finding.id.match(/^FND-\d{4}-(\d+)$/);
    return match ? Number(match[1]) : 0;
  });

  const nextNumber = Math.max(79, ...sequences) + 1;

  return `FND-${year}-${String(nextNumber).padStart(3, "0")}`;
};

const getStatusBadge = (status: FindingItem["status"]) => {
  const styles: Record<string, string> = {
    Baru: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-50",
    "Dalam Penanganan":
      "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50",
    "Selesai Terverifikasi":
      "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
  };

  return (
    <Badge
      variant="outline"
      className={`whitespace-nowrap font-medium ${styles[status] || ""}`}
    >
      {status}
    </Badge>
  );
};

export const TemuanPatroliView: React.FC<TemuanPatroliViewProps> = ({
  selectedSite,
}) => {
  const [findings, setFindings] = useState<FindingItem[]>(FINDINGS);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [columnSearch, setColumnSearch] = useState<ColumnSearch>(
    INITIAL_COLUMN_SEARCH,
  );

  const [showCharts, setShowCharts] = useState(true);
  const [chartMetric, setChartMetric] = useState<ChartMetric>("volume");

  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(
    null,
  );

  // Dialog states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingFinding, setEditingFinding] = useState<FindingItem | null>(
    null,
  );

  const [deletingFinding, setDeletingFinding] = useState<FindingItem | null>(
    null,
  );

  const [viewingPhotoFinding, setViewingPhotoFinding] =
    useState<FindingItem | null>(null);

  // Form
  const [newFinding, setNewFinding] = useState(INITIAL_NEW_FINDING);

  const timelineData = useMemo(() => generateFindingsTimelineTrend(), []);

  const baseFiltered = useMemo(() => {
    return findings.filter((finding) => {
      if (selectedSite !== "all" && finding.siteId !== selectedSite) {
        return false;
      }

      if (selectedStatus !== "all" && finding.status !== selectedStatus) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();

        const searchableText = [
          finding.id,
          finding.title,
          finding.description,
          finding.location,
          finding.reportedBy,
          finding.siteName,
        ]
          .join(" ")
          .toLowerCase();

        if (!searchableText.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [findings, selectedSite, selectedSeverity, selectedStatus, searchQuery]);

  const filteredFindings = useMemo(() => {
    return filterItemsByColumnCriteria(baseFiltered, columnSearch, {
      id: (f) => f.id,
      hasPhoto: (f) => (f.photoUrl ? "ada" : "tanpa"),
      title: (f) => `${f.title} ${f.description} ${f.notes || ""}`,
      location: (f) => `${f.location} ${f.siteName}`,
      reportedBy: (f) => `${f.reportedBy} ${f.reportedAt}`,
      assignedTo: (f) => f.assignedTo || "",
      status: (f) => f.status,
    });
  }, [baseFiltered, columnSearch]);

  const isAnyColumnFilterActive = Object.values(columnSearch).some(
    (value) => value.trim().length > 0,
  );

  const updateColumnSearch = (key: keyof ColumnSearch, value: string) => {
    setColumnSearch((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearAllColumnFilters = () => {
    setColumnSearch(INITIAL_COLUMN_SEARCH);
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedSeverity("all");
    setSelectedStatus("all");
    clearAllColumnFilters();
  };

  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Judul",
      "Deskripsi",
      "Site",
      "Lokasi",
      "Pelapor",
      "Waktu",
      "Status",
      "Ditugaskan Ke",
      "Catatan",
    ];

    const escapeCSV = (value: unknown) =>
      `"${String(value ?? "-").replace(/"/g, '""')}"`;

    const rows = filteredFindings.map((f) =>
      [
        f.id,
        f.title,
        f.description,
        f.siteName,
        f.location,
        f.reportedBy,
        f.reportedAt,
        f.status,
        f.assignedTo,
        f.notes,
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

  const handleCreateFinding = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const siteObj =
      SITES.find((site) => site.id === newFinding.siteId) || SITES[1];

    const newId = getNextFindingId(findings);

    const created: FindingItem = {
      id: newId,
      title: newFinding.title.trim(),
      description: newFinding.description.trim(),
      siteId: newFinding.siteId,
      siteName: siteObj.name.replace(/^Site [A-D] - /, ""),
      location: newFinding.location.trim(),
      reportedBy: "Bambang Prasetyo (Superintendent)",
      reportedAt: `${formatCurrentDate()}, ${formatCurrentTime()} WIB`,
      status: "Open",
      assignedTo: newFinding.assignedTo.trim(),
      photoUrl: newFinding.photoUrl.trim(),
    };

    setFindings((prev) => [created, ...prev]);

    setIsAddModalOpen(false);
    setNewFinding(INITIAL_NEW_FINDING);
  };

  const handleEditFinding = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!editingFinding) return;

    setFindings((prev) =>
      prev.map((finding) =>
        finding.id === editingFinding.id ? editingFinding : finding,
      ),
    );

    setEditingFinding(null);
  };

  const handleDeleteFinding = () => {
    if (!deletingFinding) return;

    setFindings((prev) =>
      prev.filter((finding) => finding.id !== deletingFinding.id),
    );
    setDeletingFinding(null);
  };

  const handleUpdateStatus = (
    findingId: string,
    nextStatus: FindingItem["status"],
  ) => {
    setFindings((prev) =>
      prev.map((finding) =>
        finding.id === findingId ? { ...finding, status: nextStatus } : finding,
      ),
    );
  };

  const getChartTitle = () => {
    switch (chartMetric) {
      case "volume":
        return "Tren Temuan Masuk, Selesai, dan Backlog";
      default:
        return "";
    }
  };

  const getChartPoints = () => {
    return timelineData.map((point, index) => {
      const x = 55 + index * 98;

      return {
        x,
        point,
        yReported: 175 - (point.reportedCount / 7) * 150,
        yResolved: 175 - (point.resolvedCount / 7) * 150,
        yBacklog: 175 - (point.openBacklog / 7) * 150,
        ySla: 175 - ((point.avgResolutionMinutes - 30) / 40) * 150,
        yDoor: 175 - (point.doorAccessCount / 4) * 150,
        yElectrical: 175 - (point.electricalCount / 4) * 150,
        yFire: 175 - (point.fireSafetyCount / 4) * 150,
      };
    });
  };

  const chartPoints = getChartPoints();

  const createPath = (points: { x: number; y: number }[]) =>
    points
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ");

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
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Ekspor CSV
          </Button>

          <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Buat Temuan
          </Button>
        </div>
      </div>

      <section className="rounded-md border bg-white">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold">Analitik Temuan Patroli</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Tren laporan, penyelesaian, SLA, dan kategori temuan.
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCharts((prev) => !prev)}
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
            <Tabs
              value={chartMetric}
              onValueChange={(value) => setChartMetric(value as ChartMetric)}
            >
              <TabsContent value="volume">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-medium">{getChartTitle()}</h3>

                    <div className="flex flex-wrap gap-3 text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-blue-600" />
                        Dilaporkan
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-600" />
                        Selesai
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        Backlog
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-md border bg-slate-50 p-3">
                    <div className="min-w-[620px]">
                      <svg
                        viewBox="0 0 680 210"
                        className="h-52 w-full select-none"
                      >
                        {[25, 65, 105, 145, 175].map((y) => (
                          <line
                            key={y}
                            x1="45"
                            y1={y}
                            x2="655"
                            y2={y}
                            stroke="#e2e8f0"
                            strokeDasharray="3 3"
                          />
                        ))}

                        {["7", "5", "3", "1", "0"].map((label, index) => (
                          <text
                            key={label}
                            x="35"
                            y={[29, 69, 109, 149, 178][index]}
                            textAnchor="end"
                            fontSize="10"
                            fill="#94a3b8"
                          >
                            {label}
                          </text>
                        ))}

                        <path
                          d={`${createPath(
                            chartPoints.map((p) => ({
                              x: p.x,
                              y: p.yReported,
                            })),
                          )} L ${
                            chartPoints[chartPoints.length - 1]?.x
                          } 175 L ${chartPoints[0]?.x} 175 Z`}
                          fill="#2563eb"
                          fillOpacity="0.08"
                        />

                        {[
                          {
                            key: "backlog",
                            color: "#f59e0b",
                            field: "yBacklog" as const,
                          },
                          {
                            key: "resolved",
                            color: "#059669",
                            field: "yResolved" as const,
                          },
                          {
                            key: "reported",
                            color: "#2563eb",
                            field: "yReported" as const,
                          },
                        ].map((series) => (
                          <path
                            key={series.key}
                            d={createPath(
                              chartPoints.map((p) => ({
                                x: p.x,
                                y: p[series.field],
                              })),
                            )}
                            fill="none"
                            stroke={series.color}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        ))}

                        {chartPoints.map((p, index) => (
                          <g
                            key={p.point.label}
                            onMouseEnter={() => setHoveredPointIndex(index)}
                            onMouseLeave={() => setHoveredPointIndex(null)}
                            className="cursor-pointer"
                          >
                            {hoveredPointIndex === index && (
                              <line
                                x1={p.x}
                                y1="25"
                                x2={p.x}
                                y2="175"
                                stroke="#94a3b8"
                                strokeDasharray="3 3"
                              />
                            )}

                            <circle
                              cx={p.x}
                              cy={p.yReported}
                              r="4.5"
                              fill="#2563eb"
                              stroke="white"
                              strokeWidth="2"
                            />

                            <circle
                              cx={p.x}
                              cy={p.yResolved}
                              r="4"
                              fill="#059669"
                              stroke="white"
                              strokeWidth="2"
                            />

                            <circle
                              cx={p.x}
                              cy={p.yBacklog}
                              r="3.5"
                              fill="#f59e0b"
                              stroke="white"
                              strokeWidth="2"
                            />
                          </g>
                        ))}

                        {chartPoints.map((p, index) => (
                          <text
                            key={p.point.label}
                            x={p.x}
                            y="196"
                            textAnchor="middle"
                            fontSize="11"
                            fontWeight={
                              hoveredPointIndex === index ? "bold" : "normal"
                            }
                            fill={
                              hoveredPointIndex === index
                                ? "#2563eb"
                                : "#475569"
                            }
                          >
                            {p.point.label}
                          </text>
                        ))}
                      </svg>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Chart Tooltip */}
            {hoveredPointIndex !== null && timelineData[hoveredPointIndex] && (
              <div className="rounded-md border bg-slate-50 p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  Detail {timelineData[hoveredPointIndex].label}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                  <div>
                    <p className="text-muted-foreground">Dilaporkan</p>
                    <p className="mt-1 font-semibold text-blue-600">
                      {timelineData[hoveredPointIndex].reportedCount} kasus
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Selesai</p>
                    <p className="mt-1 font-semibold text-emerald-600">
                      {timelineData[hoveredPointIndex].resolvedCount} kasus
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Backlog</p>
                    <p className="mt-1 font-semibold text-amber-600">
                      {timelineData[hoveredPointIndex].openBacklog} kasus
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Rata-rata SLA</p>
                    <p className="mt-1 font-semibold text-teal-600">
                      {timelineData[hoveredPointIndex].avgResolutionMinutes}{" "}
                      menit
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-3 rounded-md border bg-white p-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari ID, judul, deskripsi, pelapor, atau lokasi..."
              className="h-9 pl-9 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 lg:flex">
            <Select
              value={selectedStatus}
              onValueChange={(value) => setSelectedStatus(value as string)}
            >
              <SelectTrigger className="h-9 w-full text-xs lg:w-[190px]">
                <SelectValue placeholder="Status Penanganan" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-9 shrink-0"
            onClick={clearAllFilters}
          >
            <X className="mr-2 h-3.5 w-3.5" />
            Reset Filter
          </Button>
        </div>
      </section>

      <section className="overflow-hidden rounded-md border bg-white">
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

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="min-w-[230px] text-xs font-semibold">
                  Judul & Deskripsi
                </TableHead>

                <TableHead className="min-w-[175px] text-xs font-semibold">
                  Pelapor & Waktu
                </TableHead>

                <TableHead className="min-w-[145px] text-xs font-semibold">
                  Ditugaskan Ke
                </TableHead>

                <TableHead className="min-w-[155px] text-xs font-semibold">
                  Status
                </TableHead>

                <TableHead className="min-w-[85px] text-center text-xs font-semibold">
                  Foto
                </TableHead>

                <TableHead className="min-w-[190px] text-right text-xs font-semibold">
                  Aksi
                </TableHead>
              </TableRow>

              <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                <TableHead>
                  <Input
                    placeholder="Cari anomali..."
                    value={columnSearch.title}
                    onChange={(e) =>
                      updateColumnSearch("title", e.target.value)
                    }
                    className="h-8 min-w-[150px] bg-white text-xs"
                  />
                </TableHead>

                <TableHead>
                  <Input
                    placeholder="Cari pelapor..."
                    value={columnSearch.reportedBy}
                    onChange={(e) =>
                      updateColumnSearch("reportedBy", e.target.value)
                    }
                    className="h-8 min-w-[130px] bg-white text-xs"
                  />
                </TableHead>

                <TableHead>
                  <Input
                    placeholder="Cari penugasan..."
                    value={columnSearch.assignedTo}
                    onChange={(e) =>
                      updateColumnSearch("assignedTo", e.target.value)
                    }
                    className="h-8 min-w-[120px] bg-white text-xs"
                  />
                </TableHead>

                <TableHead>
                  <Select
                    value={columnSearch.status || "all"}
                    onValueChange={(value) =>
                      updateColumnSearch("status", value ?? "")
                    }
                  >
                    <SelectTrigger className="h-8 min-w-[125px] bg-white text-xs">
                      <SelectValue placeholder="Semua" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="all">Semua</SelectItem>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
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
                      <SelectValue placeholder="Foto" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="all">Semua</SelectItem>
                      <SelectItem value="ada">Ada</SelectItem>
                      <SelectItem value="tanpa">Tanpa</SelectItem>
                    </SelectContent>
                  </Select>
                </TableHead>

                <TableHead />
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredFindings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center">
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

                      {finding.notes && (
                        <p className="mt-1 text-xs text-blue-600">
                          Catatan: {finding.notes}
                        </p>
                      )}
                    </TableCell>

                    <TableCell>
                      <p className="font-medium">{finding.reportedBy}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {finding.reportedAt}
                      </p>
                    </TableCell>

                    <TableCell>
                      <span className="text-xs">
                        {finding.assignedTo || (
                          <span className="text-muted-foreground">
                            Belum ditugaskan
                          </span>
                        )}
                      </span>
                    </TableCell>

                    <TableCell>{getStatusBadge(finding.status)}</TableCell>
                    {/* PHOTO */}
                    <TableCell className="text-center">
                      {finding.photoUrl ? (
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
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {finding.status === "Open" && (
                          <Button
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() =>
                              handleUpdateStatus(finding.id, "Open")
                            }
                          >
                            Proses
                          </Button>
                        )}

                        {finding.status === "Close" && (
                          <Button
                            size="sm"
                            className="h-7 bg-emerald-600 px-2 text-xs hover:bg-emerald-700"
                            onClick={() =>
                              handleUpdateStatus(finding.id, "Close")
                            }
                          >
                            <Check className="mr-1 h-3 w-3" />
                            Selesai
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          title="Hapus temuan"
                          onClick={() => setDeletingFinding(finding)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-2 border-t bg-slate-50 px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>Data temuan terintegrasi dengan audit log K3.</span>

          <span>Prioritas Kritis dan Tinggi wajib dimitigasi.</span>
        </div>
      </section>

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
              {viewingPhotoFinding.photoUrl ? (
                <div className="overflow-hidden rounded-md border bg-slate-100">
                  <img
                    src={viewingPhotoFinding.photoUrl}
                    alt={viewingPhotoFinding.title}
                    className="max-h-[420px] w-full object-contain"
                  />
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

                <div className="grid grid-cols-2 gap-3 border-t pt-3 text-xs">
                  <div>
                    <p className="text-muted-foreground">Lokasi</p>
                    <p className="mt-1 font-medium">
                      {viewingPhotoFinding.siteName} -{" "}
                      {viewingPhotoFinding.location}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Pelapor</p>
                    <p className="mt-1 font-medium">
                      {viewingPhotoFinding.reportedBy}
                    </p>
                  </div>
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

      <AlertDialog
        open={!!deletingFinding}
        onOpenChange={(open) => {
          if (!open) setDeletingFinding(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-rose-50">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
            </div>

            <AlertDialogTitle>Hapus Temuan Patroli?</AlertDialogTitle>

            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus temuan{" "}
              <strong className="text-foreground">{deletingFinding?.id}</strong>{" "}
              ({deletingFinding?.title})? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>

            <AlertDialogAction
              onClick={handleDeleteFinding}
              className="bg-rose-600 hover:bg-rose-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ================================================== */}
      {/* DIALOG: CREATE FINDING */}
      {/* ================================================== */}

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Buat Temuan Patroli</DialogTitle>
            <DialogDescription>
              Masukkan informasi anomali atau kondisi berisiko yang ditemukan
              selama patroli.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateFinding} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Judul Temuan</label>
              <Input
                required
                placeholder="Contoh: Kaca jendela ruang rapat retak"
                value={newFinding.title}
                onChange={(e) =>
                  setNewFinding({
                    ...newFinding,
                    title: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Deskripsi Temuan</label>
              <Textarea
                required
                rows={3}
                placeholder="Jelaskan kondisi, lokasi, dan potensi risiko..."
                value={newFinding.description}
                onChange={(e) =>
                  setNewFinding({
                    ...newFinding,
                    description: e.target.value,
                  })
                }
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Site</label>

                <Select
                  value={newFinding.siteId}
                  onValueChange={(value) =>
                    setNewFinding({
                      ...newFinding,
                      siteId: value as string,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih site" />
                  </SelectTrigger>

                  <SelectContent>
                    {SITES.filter((site) => site.id !== "all").map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Detail Lokasi</label>
                <Input
                  required
                  placeholder="Contoh: Lantai 8 Sayap Selatan"
                  value={newFinding.location}
                  onChange={(e) =>
                    setNewFinding({
                      ...newFinding,
                      location: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Tugaskan Ke</label>
                <Input
                  value={newFinding.assignedTo}
                  onChange={(e) =>
                    setNewFinding({
                      ...newFinding,
                      assignedTo: e.target.value,
                    })
                  }
                  placeholder="Nama tim penanggung jawab"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                URL Foto Bukti (Opsional)
              </label>
              <Input
                type="url"
                placeholder="https://..."
                value={newFinding.photoUrl}
                onChange={(e) =>
                  setNewFinding({
                    ...newFinding,
                    photoUrl: e.target.value,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Masukkan URL foto jika tersedia. Upload file lokal memerlukan
                integrasi penyimpanan.
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
              >
                Batal
              </Button>

              <Button type="submit">
                <Plus className="mr-2 h-4 w-4" />
                Simpan Temuan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemuanPatroliView;
