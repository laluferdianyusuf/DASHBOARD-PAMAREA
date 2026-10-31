import React, { useMemo, useState } from "react";
import { SECURITY_LEADERBOARD_DATA } from "../data/mockData";
import type { SecurityLeaderboardItem } from "../utils/security-logic";
import { filterItemsByColumnCriteria } from "../utils/security-logic";

import { Eye, RotateCcw, Search, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface SecurityPerformanceHistoryItem {
  officerId: string;
  date: string; // Format: YYYY-MM-DD
  score: number;
}

interface MonitoringViewProps {
  selectedSite: string;
  performanceHistory?: SecurityPerformanceHistoryItem[];
}

type ColumnSearch = {
  rank: string;
  officer: string;
  squadSite: string;
  compliance: string;
  score: string;
  status: string;
};

const INITIAL_COLUMN_SEARCH: ColumnSearch = {
  rank: "",
  officer: "",
  squadSite: "",
  compliance: "",
  score: "",
  status: "",
};

const CHART_COLORS = ["#2563eb", "#16a34a", "#d97706"];

const formatMonth = (value: string) => {
  const [year, month] = value.split("-").map(Number);

  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
};

const formatDate = (value: string) => {
  const date = new Date(`${value}T00:00:00`);

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
  }).format(date);
};

export const MonitoringView: React.FC<MonitoringViewProps> = ({
  selectedSite,
  performanceHistory = [],
}) => {
  const [selectedSquad, setSelectedSquad] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [columnSearch, setColumnSearch] = useState<ColumnSearch>(
    INITIAL_COLUMN_SEARCH,
  );
  const [selectedOfficer, setSelectedOfficer] =
    useState<SecurityLeaderboardItem | null>(null);
  const [selectedMonth, setSelectedMonth] = useState("");

  const leaderboard = SECURITY_LEADERBOARD_DATA;

  // Pilihan regu berdasarkan data personel.
  const squadOptions = useMemo(
    () =>
      Array.from(new Set(leaderboard.map((officer) => officer.squad))).sort(),
    [leaderboard],
  );

  // Daftar bulan yang tersedia di riwayat skor.
  const monthOptions = useMemo(() => {
    const months = Array.from(
      new Set(
        performanceHistory
          .filter((item) => /^\d{4}-\d{2}-\d{2}$/.test(item.date))
          .map((item) => item.date.slice(0, 7)),
      ),
    );

    return months.sort((a, b) => b.localeCompare(a));
  }, [performanceHistory]);

  // Jika belum dipilih, gunakan bulan terbaru yang tersedia.
  const activeMonth = selectedMonth || monthOptions[0] || "";

  // Filter site, regu, dan pencarian umum.
  const baseFilteredLeaderboard = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return leaderboard.filter((officer) => {
      if (selectedSite !== "all" && officer.siteId !== selectedSite) {
        return false;
      }

      if (selectedSquad !== "all" && officer.squad !== selectedSquad) {
        return false;
      }

      if (query) {
        const searchableText = [
          officer.name,
          officer.npp,
          officer.squad,
          officer.role,
          officer.siteName,
          officer.badgeTitle,
          officer.status,
        ]
          .join(" ")
          .toLowerCase();

        if (!searchableText.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [leaderboard, selectedSite, selectedSquad, searchQuery]);

  // Filter per kolom tabel.
  const filteredLeaderboard = useMemo(() => {
    const result = filterItemsByColumnCriteria(
      baseFilteredLeaderboard,
      columnSearch,
      {
        rank: (officer) => `#${officer.rank} ${officer.rank}`,
        officer: (officer) => `${officer.name} ${officer.npp} ${officer.role}`,
        squadSite: (officer) => `${officer.squad} ${officer.siteName}`,
        compliance: (officer) => `${officer.complianceRate}%`,
        score: (officer) => `${officer.score}`,
        status: (officer) => officer.status,
      },
    );

    return [...result].sort((a, b) => a.rank - b.rank);
  }, [baseFilteredLeaderboard, columnSearch]);

  // Tiga personel terbaik dari hasil filter.
  const topPerformers = filteredLeaderboard.slice(0, 3);

  // Data grafik: satu baris untuk satu tanggal, satu kolom untuk setiap personel.
  const chartData = useMemo(() => {
    if (!activeMonth || topPerformers.length === 0) {
      return [];
    }

    const topOfficerIds = new Set(topPerformers.map((officer) => officer.id));

    const historyForMonth = performanceHistory.filter(
      (item) =>
        item.date.startsWith(`${activeMonth}-`) &&
        topOfficerIds.has(item.officerId),
    );

    const grouped = new Map<string, Record<string, string | number>>();

    historyForMonth.forEach((item) => {
      const current = grouped.get(item.date) ?? {
        date: item.date,
        label: formatDate(item.date),
      };

      current[item.officerId] = item.score;
      grouped.set(item.date, current);
    });

    return Array.from(grouped.values()).sort((a, b) =>
      String(a.date).localeCompare(String(b.date)),
    );
  }, [activeMonth, performanceHistory, topPerformers]);

  const updateColumnSearch = (key: keyof ColumnSearch, value: string) => {
    setColumnSearch((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedSquad("all");
    setColumnSearch({ ...INITIAL_COLUMN_SEARCH });
  };

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedSquad !== "all" ||
    Object.values(columnSearch).some((value) => value.trim().length > 0);

  const getScoreStyle = (score: number) => {
    if (score >= 98) return "text-emerald-700";
    if (score >= 95) return "text-blue-700";
    return "text-amber-700";
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return "bg-amber-100 text-amber-800";
    if (rank === 2) return "bg-slate-200 text-slate-700";
    if (rank === 3) return "bg-orange-100 text-orange-800";
    return "bg-slate-100 text-slate-600";
  };

  const getStatusStyle = (status: string) => {
    if (status === "Bertugas Aktif") {
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }

    if (status === "Siaga di Pos") {
      return "border-blue-200 bg-blue-50 text-blue-700";
    }

    return "border-slate-200 bg-slate-50 text-slate-600";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 border-b pb-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Monitoring Kinerja Security
          </h1>

          <p className="mt-1 text-xs text-muted-foreground">
            Pantau kepatuhan patroli, ketepatan waktu, dan peringkat personel.
          </p>
        </div>

        <Badge variant="outline" className="w-fit rounded">
          {selectedSite === "all"
            ? "Semua Site"
            : (leaderboard.find((officer) => officer.siteId === selectedSite)
                ?.siteName ?? "Site Terpilih")}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[350px_minmax(0,1fr)]">
        {/* Kolom kiri: Personel terbaik dan grafik */}
        <section className="min-w-0 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Personel dengan Kinerja Terbaik
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Berdasarkan peringkat pada data yang sedang difilter.
            </p>
          </div>

          {topPerformers.length > 0 ? (
            <div className="overflow-hidden rounded border">
              {topPerformers.map((officer, index) => (
                <div
                  key={officer.id}
                  className={`flex items-center justify-between gap-2 px-3 py-3 ${
                    index !== topPerformers.length - 1 ? "border-b" : ""
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded text-xs font-bold ${getRankStyle(
                        officer.rank,
                      )}`}
                    >
                      {officer.rank}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-900">
                        {officer.name}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {officer.npp} · {officer.squad}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground">Skor</p>
                      <p
                        className={`text-sm font-bold tabular-nums ${getScoreStyle(
                          officer.score,
                        )}`}
                      >
                        {officer.score}
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => setSelectedOfficer(officer)}
                      title="Lihat detail personel"
                    >
                      <Eye className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded border p-6 text-center text-xs text-muted-foreground">
              Tidak ada data personel untuk ditampilkan.
            </p>
          )}

          {/* Grafik garis */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-4 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    Tren Kinerja
                  </h3>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Perubahan skor personel berdasarkan tanggal.
                </p>
              </div>

              <Select
                value={activeMonth}
                onValueChange={(value) => setSelectedMonth(value as string)}
                disabled={monthOptions.length === 0}
              >
                <SelectTrigger className="h-8 w-full text-xs sm:w-[155px]">
                  <SelectValue placeholder="Pilih bulan" />
                </SelectTrigger>

                <SelectContent>
                  {monthOptions.map((month) => (
                    <SelectItem key={month} value={month}>
                      {formatMonth(month)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {chartData.length > 0 ? (
              <>
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{
                        top: 10,
                        right: 12,
                        left: -18,
                        bottom: 0,
                      }}
                    >
                      <CartesianGrid
                        stroke="#e2e8f0"
                        strokeDasharray="3 3"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                        tickMargin={8}
                      />

                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 10, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                        tickCount={6}
                      />

                      <Tooltip
                        labelFormatter={(_, payload) =>
                          payload?.[0]?.payload?.date
                            ? new Intl.DateTimeFormat("id-ID", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              }).format(
                                new Date(`${payload[0].payload.date}T00:00:00`),
                              )
                            : ""
                        }
                        formatter={(value) => [`${value} poin`, "Skor"]}
                        contentStyle={{
                          borderRadius: 4,
                          border: "1px solid #e2e8f0",
                          fontSize: 11,
                        }}
                      />

                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        iconSize={7}
                        wrapperStyle={{
                          fontSize: 10,
                          paddingTop: 8,
                        }}
                      />

                      {topPerformers.map((officer, index) => (
                        <Line
                          key={officer.id}
                          type="monotone"
                          dataKey={officer.id}
                          name={officer.name}
                          stroke={CHART_COLORS[index]}
                          strokeWidth={2}
                          connectNulls
                          dot={{ r: 3, strokeWidth: 1 }}
                          activeDot={{ r: 5 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <p className="text-[10px] text-muted-foreground">
                  Menampilkan riwayat skor {formatMonth(activeMonth)}.
                </p>
              </>
            ) : (
              <div className="flex min-h-[200px] flex-col items-center justify-center rounded border border-dashed px-4 text-center">
                <TrendingUp className="mb-2 size-6 text-slate-400" />
                <p className="text-xs font-medium text-slate-700">
                  Belum ada riwayat skor
                </p>
                <p className="mt-1 max-w-[240px] text-[11px] text-muted-foreground">
                  Data historis personel untuk{" "}
                  {activeMonth ? formatMonth(activeMonth) : "bulan ini"} belum
                  tersedia.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Kolom kanan: Leaderboard */}
        <section className="min-w-0 space-y-3">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Papan Peringkat Personel
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Cari dan bandingkan hasil kinerja setiap personel.
              </p>
            </div>

            <span className="text-xs text-muted-foreground">
              Menampilkan{" "}
              <span className="font-semibold text-slate-900">
                {filteredLeaderboard.length}
              </span>{" "}
              dari {leaderboard.length} personel
            </span>
          </div>

          {/* Filter utama */}
          <div className="flex flex-col gap-2 rounded border bg-slate-50 p-3 md:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />

              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cari nama, NPP, regu, site, atau predikat..."
                className="h-9 bg-white pl-9 text-xs"
              />
            </div>

            <Select
              value={selectedSquad}
              onValueChange={(value) => setSelectedSquad(value as string)}
            >
              <SelectTrigger className="h-9 w-full bg-white text-xs md:w-[170px]">
                <SelectValue placeholder="Semua Regu" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">Semua Regu</SelectItem>
                {squadOptions.map((squad) => (
                  <SelectItem key={squad} value={squad}>
                    {squad}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 shrink-0 bg-white"
                onClick={clearFilters}
              >
                <RotateCcw className="mr-1.5 size-3.5" />
                Reset
              </Button>
            )}
          </div>

          {/* Tabel leaderboard */}
          <div className="overflow-hidden rounded border">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="w-14 text-center text-[11px]">
                      Rank
                    </TableHead>
                    <TableHead className="min-w-[160px] text-[11px]">
                      Personel
                    </TableHead>
                    <TableHead className="min-w-[120px] text-[11px]">
                      Regu / Site
                    </TableHead>
                    <TableHead className="text-center text-[11px]">
                      Kepatuhan
                    </TableHead>
                    <TableHead className="text-center text-[11px]">
                      Skor
                    </TableHead>
                    <TableHead className="min-w-[120px] text-[11px]">
                      Status
                    </TableHead>
                  </TableRow>

                  {/* Filter per kolom */}
                  <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                    <TableCell className="p-1.5">
                      <Input
                        value={columnSearch.rank}
                        onChange={(event) =>
                          updateColumnSearch("rank", event.target.value)
                        }
                        placeholder="#"
                        className="h-7 min-w-0 px-1 text-center text-[10px]"
                      />
                    </TableCell>

                    <TableCell className="p-1.5">
                      <Input
                        value={columnSearch.officer}
                        onChange={(event) =>
                          updateColumnSearch("officer", event.target.value)
                        }
                        placeholder="Nama / NPP"
                        className="h-7 min-w-0 px-2 text-[10px]"
                      />
                    </TableCell>

                    <TableCell className="p-1.5">
                      <Input
                        value={columnSearch.squadSite}
                        onChange={(event) =>
                          updateColumnSearch("squadSite", event.target.value)
                        }
                        placeholder="Regu / Site"
                        className="h-7 min-w-0 px-2 text-[10px]"
                      />
                    </TableCell>

                    <TableCell className="p-1.5">
                      <Input
                        value={columnSearch.compliance}
                        onChange={(event) =>
                          updateColumnSearch("compliance", event.target.value)
                        }
                        placeholder="%"
                        className="h-7 min-w-0 px-1 text-center text-[10px]"
                      />
                    </TableCell>

                    <TableCell className="p-1.5">
                      <Input
                        value={columnSearch.score}
                        onChange={(event) =>
                          updateColumnSearch("score", event.target.value)
                        }
                        placeholder="Skor"
                        className="h-7 min-w-0 px-1 text-center text-[10px]"
                      />
                    </TableCell>

                    <TableCell className="p-1.5">
                      <Input
                        value={columnSearch.status}
                        onChange={(event) =>
                          updateColumnSearch("status", event.target.value)
                        }
                        placeholder="Status"
                        className="h-7 min-w-0 px-2 text-[10px]"
                      />
                    </TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredLeaderboard.length > 0 ? (
                    filteredLeaderboard.map((officer) => (
                      <TableRow
                        key={officer.id}
                        className="cursor-pointer"
                        onClick={() => setSelectedOfficer(officer)}
                      >
                        <TableCell className="text-center">
                          <span
                            className={`inline-flex size-7 items-center justify-center rounded text-xs font-bold ${getRankStyle(
                              officer.rank,
                            )}`}
                          >
                            {officer.rank}
                          </span>
                        </TableCell>

                        <TableCell>
                          <p className="text-xs font-semibold text-slate-900">
                            {officer.name}
                          </p>
                          <p className="mt-0.5 text-[10px] text-muted-foreground">
                            {officer.npp} · {officer.role}
                          </p>
                        </TableCell>

                        <TableCell>
                          <p className="text-xs font-medium text-slate-800">
                            {officer.squad}
                          </p>
                          <p className="mt-0.5 text-[10px] text-muted-foreground">
                            {officer.siteName}
                          </p>
                        </TableCell>

                        <TableCell className="text-center">
                          <span className="text-xs font-semibold tabular-nums text-emerald-700">
                            {officer.complianceRate}%
                          </span>
                        </TableCell>

                        <TableCell className="text-center">
                          <span
                            className={`text-xs font-bold tabular-nums ${getScoreStyle(
                              officer.score,
                            )}`}
                          >
                            {officer.score}
                          </span>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`rounded whitespace-nowrap text-[10px] font-medium ${getStatusStyle(
                              officer.status,
                            )}`}
                          >
                            {officer.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-28 text-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Search className="size-5" />
                          <p className="text-xs">
                            Tidak ada personel yang sesuai dengan filter.
                          </p>
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            onClick={clearFilters}
                          >
                            Hapus semua filter
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </section>
      </div>

      {/* Detail personel */}
      <Dialog
        open={Boolean(selectedOfficer)}
        onOpenChange={(open) => {
          if (!open) setSelectedOfficer(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          {selectedOfficer && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div
                    className={`flex size-10 shrink-0 items-center justify-center rounded text-sm font-bold ${getRankStyle(
                      selectedOfficer.rank,
                    )}`}
                  >
                    #{selectedOfficer.rank}
                  </div>

                  <div className="min-w-0">
                    <DialogTitle className="text-base">
                      {selectedOfficer.name}
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                      {selectedOfficer.npp} · {selectedOfficer.role}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 border-y py-3">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">
                      Regu
                    </Label>
                    <p className="mt-1 text-xs font-semibold">
                      {selectedOfficer.squad}
                    </p>
                  </div>

                  <div>
                    <Label className="text-[10px] text-muted-foreground">
                      Site
                    </Label>
                    <p className="mt-1 text-xs font-semibold">
                      {selectedOfficer.siteName}
                    </p>
                  </div>

                  <div>
                    <Label className="text-[10px] text-muted-foreground">
                      Status
                    </Label>
                    <p className="mt-1 text-xs font-semibold">
                      {selectedOfficer.status}
                    </p>
                  </div>

                  <div>
                    <Label className="text-[10px] text-muted-foreground">
                      Predikat
                    </Label>
                    <p className="mt-1 text-xs font-semibold">
                      {selectedOfficer.badgeTitle}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-xs font-bold text-slate-900">
                    Ringkasan Kinerja
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded border p-3">
                      <p className="text-[10px] text-muted-foreground">
                        Skor KPI
                      </p>
                      <p className="mt-1 text-xl font-bold text-slate-900">
                        {selectedOfficer.score}
                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                          / 100
                        </span>
                      </p>
                    </div>

                    <div className="rounded border p-3">
                      <p className="text-[10px] text-muted-foreground">
                        Kepatuhan Patroli
                      </p>
                      <p className="mt-1 text-xl font-bold text-emerald-700">
                        {selectedOfficer.complianceRate}%
                      </p>
                    </div>

                    <div className="rounded border p-3">
                      <p className="text-[10px] text-muted-foreground">
                        Ketepatan Waktu
                      </p>
                      <p className="mt-1 text-xl font-bold text-slate-900">
                        {selectedOfficer.onTimeRate}%
                      </p>
                    </div>

                    <div className="rounded border p-3">
                      <p className="text-[10px] text-muted-foreground">
                        Checkpoint Di-scan
                      </p>
                      <p className="mt-1 text-xl font-bold text-slate-900">
                        {selectedOfficer.totalCheckpointsScanned}
                      </p>
                    </div>

                    <div className="col-span-2 rounded border p-3">
                      <p className="text-[10px] text-muted-foreground">
                        Laporan Temuan
                      </p>
                      <p className="mt-1 text-lg font-bold text-slate-900">
                        {selectedOfficer.findingsReported}
                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                          laporan
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedOfficer(null)}
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
