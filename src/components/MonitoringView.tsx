import React, { useEffect, useMemo, useState } from "react";
import type { SecurityLeaderboardItem } from "../utils/security-logic";
import { filterItemsByColumnCriteria } from "../utils/security-logic";

import {
  Activity,
  Download,
  Eye,
  RefreshCw,
  RotateCcw,
  Search,
  TrendingUp,
} from "lucide-react";

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
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatDate } from "../helpers/dateTime";
import { useFindings } from "../hooks/finding/useFIndings";
import { usePatrolRoundsGroupedByUser } from "../hooks/schedule/usePatrolRound";
import { useGetScheduleAssignments } from "../hooks/schedule/usePatrolScheduleAssignment";
import { usePatrolSchedules } from "../hooks/schedule/usePatrolSchedules";
import { Finding } from "../types";
import {
  ColumnSearch,
  MonitoringViewProps,
  PatrolRound,
  PatrolSchedule,
  PatrolUserGroup,
  ScheduleAssignment,
} from "../types/monitoring/monitoring";
import { exportSecurityLeaderboardExcel } from "../utils/secityLeaderboardExcel";
import { PaginationComponent } from "./PaginationComponent";

const INITIAL_COLUMN_SEARCH: ColumnSearch = {
  rank: "",
  officer: "",
  squadSite: "",
  compliance: "",
  score: "",
  status: "",
};

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "#16a34a",
  IN_PROGRESS: "#2563eb",
  PENDING: "#94a3b8",
  PARTIAL: "#d97706",
  MISSED: "#dc2626",
  CANCELLED: "#64748b",
};

const STATUS_LABELS: Record<string, string> = {
  COMPLETED: "Selesai",
  IN_PROGRESS: "Berlangsung",
  PENDING: "Menunggu",
  PARTIAL: "Sebagian",
  MISSED: "Terlewat",
  CANCELLED: "Dibatalkan",
};

const formatMonth = (value: string) => {
  const [year, month] = value.split("-").map(Number);

  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
};

const getDateKey = (value?: string | null) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getRoundDate = (round: PatrolRound) => {
  return (
    getDateKey(round.scheduleDate?.date) || getDateKey(round.scheduledStartAt)
  );
};

const getRequiredCheckpoints = (rounds: PatrolRound[]) => {
  return rounds.flatMap((round) =>
    (round.checkpoints ?? []).filter((checkpoint) => checkpoint.required),
  );
};

const getCompletedCheckpoints = (rounds: PatrolRound[]) => {
  return getRequiredCheckpoints(rounds).filter(
    (checkpoint) => checkpoint.status === "COMPLETED",
  );
};

const getComplianceRate = (rounds: PatrolRound[]) => {
  const required = getRequiredCheckpoints(rounds).length;

  if (required === 0) return 0;

  const completed = getCompletedCheckpoints(rounds).length;

  return Math.round((completed / required) * 100);
};

const getOnTimeRate = (rounds: PatrolRound[], gracePeriodMinutes: number) => {
  const completedRounds = rounds.filter(
    (round) => round.status === "COMPLETED" && round.startedAt,
  );

  if (completedRounds.length === 0) return 0;

  const onTimeRounds = completedRounds.filter((round) => {
    const scheduledStart = new Date(round.scheduledStartAt).getTime();
    const actualStart = new Date(round.startedAt as string).getTime();

    if (Number.isNaN(scheduledStart) || Number.isNaN(actualStart)) {
      return false;
    }

    const deadline =
      scheduledStart + Math.max(0, gracePeriodMinutes) * 60 * 1000;

    return actualStart <= deadline;
  });

  return Math.round((onTimeRounds.length / completedRounds.length) * 100);
};

const getScore = (complianceRate: number, onTimeRate: number) => {
  return Math.round(complianceRate * 0.6 + onTimeRate * 0.4);
};

const getBadgeTitle = (score: number) => {
  if (score >= 95) return "Sangat Baik";
  if (score >= 85) return "Baik";
  if (score >= 70) return "Cukup";
  return "Perlu Evaluasi";
};

const getOfficerStatus = (
  rounds: PatrolRound[],
  assignments: ScheduleAssignment[],
): SecurityLeaderboardItem["status"] => {
  if (rounds.some((round) => round.status === "IN_PROGRESS")) {
    return "Bertugas Aktif";
  }

  const now = new Date();

  const hasActiveAssignment = assignments.some((assignment) => {
    if (assignment.status !== "ACTIVE") return false;

    const start = new Date(assignment.startDate);
    const end = new Date(assignment.endDate);

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return now >= start && now <= end;
  });

  if (hasActiveAssignment) {
    return "Siaga di Pos";
  }

  return "Off / Libur";
};

const normalizeArray = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];

  if (
    value &&
    typeof value === "object" &&
    "data" in value &&
    Array.isArray((value as { data: unknown }).data)
  ) {
    return (value as { data: T[] }).data;
  }

  return [];
};

export const MonitoringView: React.FC<MonitoringViewProps> = ({
  selectedSite,
  onNavigate,
}) => {
  const {
    data: patrolRoundsData,
    isLoading: isRoundsLoading,
    isError: isRoundsError,
    isFetching: isRoundsFetching,
    refetch: refetchRounds,
  } = usePatrolRoundsGroupedByUser();

  const {
    data: assignmentsData,
    isLoading: isAssignmentsLoading,
    isError: isAssignmentsError,
    isFetching: isAssignmentsFetching,
    refetch: refetchAssignments,
  } = useGetScheduleAssignments();

  const {
    data: schedulesData,
    isLoading: isSchedulesLoading,
    isError: isSchedulesError,
    isFetching: isSchedulesFetching,
    refetch: refetchSchedules,
  } = usePatrolSchedules();

  const {
    data: findingsData,
    isFetching: isFindingsFetching,
    refetch: refetchFindings,
  } = useFindings();

  const isRefreshing =
    isRoundsFetching ||
    isAssignmentsFetching ||
    isSchedulesFetching ||
    isFindingsFetching;

  const handleRefresh = async () => {
    await Promise.all([
      refetchRounds(),
      refetchAssignments(),
      refetchSchedules(),
      refetchFindings(),
    ]);
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState("10");
  const [selectedSquad, setSelectedSquad] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [columnSearch, setColumnSearch] = useState<ColumnSearch>(
    INITIAL_COLUMN_SEARCH,
  );
  const [selectedOfficer, setSelectedOfficer] =
    useState<SecurityLeaderboardItem | null>(null);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const isLoading =
    isRoundsLoading || isAssignmentsLoading || isSchedulesLoading;

  const isError = isRoundsError || isAssignmentsError || isSchedulesError;

  const userGroups = useMemo(
    () => normalizeArray<PatrolUserGroup>(patrolRoundsData),
    [patrolRoundsData],
  );

  const assignments = useMemo(
    () => normalizeArray<ScheduleAssignment>(assignmentsData),
    [assignmentsData],
  );

  const schedules = useMemo(
    () => normalizeArray<PatrolSchedule>(schedulesData),
    [schedulesData],
  );

  const findings = useMemo(
    () => normalizeArray<Finding>(findingsData),
    [findingsData],
  );

  const now = useMemo(() => new Date(), []);

  const leaderboard = useMemo<SecurityLeaderboardItem[]>(() => {
    const result: SecurityLeaderboardItem[] = [];

    userGroups.forEach((group) => {
      const userId = group.user.id;

      const userAssignments = assignments.filter(
        (assignment) => assignment.userId === userId,
      );

      const userRounds = (group.rounds ?? []).filter((round) => {
        const roundDate = getRoundDate(round);

        if (!roundDate) return false;

        const roundDateTime = new Date(`${roundDate}T00:00:00`);

        return roundDateTime <= now;
      });

      const siteRounds = userRounds.filter((round) => {
        if (selectedSite === "all") return true;

        return round.schedule?.site?.id === selectedSite;
      });

      const siteAssignments = userAssignments.filter((assignment) => {
        if (selectedSite === "all") return true;

        return (
          assignment.schedule?.siteId === selectedSite ||
          assignment.schedule?.site?.id === selectedSite
        );
      });

      const siteAssignmentIds = new Set(
        siteAssignments.map((assignment) => assignment.scheduleId),
      );

      const filteredRounds =
        selectedSite === "all"
          ? siteRounds
          : siteRounds.filter(
              (round) =>
                !round.schedule?.id ||
                siteAssignmentIds.has(round.schedule.id) ||
                round.schedule.site?.id === selectedSite,
            );

      const completedCheckpoints =
        getCompletedCheckpoints(filteredRounds).length;

      const complianceRate = getComplianceRate(filteredRounds);

      const gracePeriodMinutes = Math.max(
        0,
        ...siteAssignments.map(
          (assignment) => assignment.schedule?.gracePeriodMinutes ?? 30,
        ),
        ...schedules
          .filter((schedule) =>
            selectedSite === "all" ? true : schedule.siteId === selectedSite,
          )
          .map((schedule) => schedule.gracePeriodMinutes ?? 30),
      );

      const onTimeRate = getOnTimeRate(filteredRounds, gracePeriodMinutes);

      const score = getScore(complianceRate, onTimeRate);

      const siteInfo = filteredRounds.find((round) => round.schedule?.site)
        ?.schedule?.site;

      const assignmentSite = siteAssignments.find(
        (assignment) => assignment.schedule?.site,
      )?.schedule?.site;

      const siteName =
        siteInfo?.name || assignmentSite?.name || "Belum ditentukan";

      const siteId =
        siteInfo?.id ||
        assignmentSite?.id ||
        siteAssignments[0]?.schedule?.siteId ||
        "";

      const squad = group.user.teamName || "Belum ada regu";

      const status = getOfficerStatus(filteredRounds, siteAssignments);

      const userFindings = findings.filter(
        (finding) =>
          finding.reportedById === userId || finding.reportedBy?.id === userId,
      );

      const findingsReported = userFindings.length;

      const incidentsResolved = userFindings.filter(
        (finding) => finding.status === "RESOLVED",
      ).length;

      result.push({
        id: userId,
        rank: 0,
        name: group.user.fullName,
        npp: group.user.employeeNumber || "-",
        role: "Security",
        squad,
        siteId,
        siteName,
        complianceRate,
        score,
        onTimeRate,
        totalCheckpointsScanned: completedCheckpoints,
        findingsReported,
        incidentsResolved,
        status,
        badgeTitle: getBadgeTitle(score),
      });
    });

    return result
      .sort((a, b) => b.score - a.score)
      .map((officer, index) => ({
        ...officer,
        rank: index + 1,
      }));
  }, [userGroups, assignments, schedules, selectedSite, now]);

  const squadOptions = useMemo(
    () =>
      Array.from(new Set(leaderboard.map((officer) => officer.squad))).sort(),
    [leaderboard],
  );

  const allRounds = useMemo(
    () =>
      userGroups.flatMap((group) =>
        (group.rounds ?? []).map((round) => ({
          ...round,
          userId: group.user.id,
        })),
      ),
    [userGroups],
  );

  const siteFilteredRounds = useMemo(() => {
    return allRounds.filter((round) => {
      if (selectedSite === "all") return true;

      return round.schedule?.site?.id === selectedSite;
    });
  }, [allRounds, selectedSite]);

  const monthOptions = useMemo(() => {
    const months = siteFilteredRounds
      .map((round) => getRoundDate(round))
      .filter(Boolean)
      .map((date) => date.slice(0, 7));

    return Array.from(new Set(months)).sort((a, b) => b.localeCompare(a));
  }, [siteFilteredRounds]);

  const activeMonth =
    selectedMonth && monthOptions.includes(selectedMonth)
      ? selectedMonth
      : monthOptions[0] || "";

  const baseFilteredLeaderboard = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return leaderboard.filter((officer) => {
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
  }, [leaderboard, selectedSquad, searchQuery]);

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

  const totalItems = filteredLeaderboard.length;
  const pageSizeNumber = Number(pageSize);
  const totalPages = Math.ceil(totalItems / pageSizeNumber);

  const paginatedLeaderboard = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSizeNumber;

    return filteredLeaderboard.slice(startIndex, startIndex + pageSizeNumber);
  }, [filteredLeaderboard, currentPage, pageSizeNumber]);

  const startItem =
    totalItems === 0 ? 0 : (currentPage - 1) * pageSizeNumber + 1;

  const endItem = Math.min(currentPage * pageSizeNumber, totalItems);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedSquad, columnSearch, selectedSite, pageSize]);

  const topPerformers = filteredLeaderboard.slice(0, 3);

  const chartRounds = useMemo(() => {
    if (!activeMonth) return [];

    return siteFilteredRounds.filter((round) => {
      const date = getRoundDate(round);

      return (
        date.startsWith(`${activeMonth}-`) &&
        new Date(round.scheduledStartAt).getTime() <= Date.now()
      );
    });
  }, [siteFilteredRounds, activeMonth]);

  const barChartData = useMemo(() => {
    const grouped = new Map<
      string,
      {
        date: string;
        label: string;
        scheduled: number;
        completed: number;
      }
    >();

    chartRounds.forEach((round) => {
      const date = getRoundDate(round);

      if (!date) return;

      const current = grouped.get(date) ?? {
        date,
        label: formatDate(date),
        scheduled: 0,
        completed: 0,
      };

      current.scheduled += 1;

      if (round.status === "COMPLETED") {
        current.completed += 1;
      }

      grouped.set(date, current);
    });

    return Array.from(grouped.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }, [chartRounds]);

  const handleExportExcel = async () => {
    if (filteredLeaderboard.length === 0) {
      alert("Tidak ada data security untuk diekspor.");
      return;
    }

    try {
      setIsExporting(true);

      await exportSecurityLeaderboardExcel(filteredLeaderboard);
    } catch (error) {
      console.error("Gagal export monitoring:", error);
      alert("Gagal mengunduh laporan monitoring.");
    } finally {
      setIsExporting(false);
    }
  };

  const donutChartData = useMemo(() => {
    const statusCounts = new Map<string, number>();

    chartRounds.forEach((round) => {
      statusCounts.set(round.status, (statusCounts.get(round.status) ?? 0) + 1);
    });

    const statusOrder = [
      "COMPLETED",
      "IN_PROGRESS",
      "PENDING",
      "PARTIAL",
      "MISSED",
      "CANCELLED",
    ];

    return statusOrder
      .map((status) => ({
        name: STATUS_LABELS[status] ?? status,
        status,
        value: statusCounts.get(status) ?? 0,
        fill: STATUS_COLORS[status] ?? "#94a3b8",
      }))
      .filter((item) => item.value > 0);
  }, [chartRounds]);

  const donutTotal = donutChartData.reduce(
    (total, item) => total + item.value,
    0,
  );

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

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto size-7 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" />
          <p className="mt-3 text-xs text-muted-foreground">
            Memuat data monitoring...
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded border">
        <Activity className="size-7 text-slate-400" />
        <p className="text-xs text-muted-foreground">
          Gagal memuat data monitoring.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleRefresh}
        >
          <RotateCcw className="mr-2 size-3.5" />
          Coba Lagi
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 border-b pb-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Monitoring Kinerja Security
          </h1>

          <p className="mt-1 text-xs text-muted-foreground">
            Pantau kepatuhan patroli, ketepatan waktu, dan peringkat security.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded text-xs"
            onClick={handleExportExcel}
            disabled={isExporting || filteredLeaderboard.length === 0}
          >
            <Download
              className={`mr-2 size-3.5 ${isExporting ? "animate-pulse" : ""}`}
            />
            {isExporting ? "Mengunduh..." : "Export Excel"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="rounded text-xs"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh semua data"
          >
            <RefreshCw
              className={`mr-2 size-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[350px_minmax(0,1fr)]">
        <section className="min-w-0 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Security dengan Kinerja Terbaik
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
                      title="Lihat detail security"
                    >
                      <Eye className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded border p-6 text-center text-xs text-muted-foreground">
              Tidak ada data security untuk ditampilkan.
            </p>
          )}

          <div className="space-y-3 border-t pt-4">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-4 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    Aktivitas Patroli
                  </h3>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Perbandingan ronde terjadwal dan selesai.
                </p>
              </div>

              <Select
                value={activeMonth}
                onValueChange={(value) => setSelectedMonth(value ?? "")}
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

            {barChartData.length > 0 ? (
              <>
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={barChartData}
                      margin={{
                        top: 10,
                        right: 8,
                        left: -20,
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
                        allowDecimals={false}
                        tick={{ fontSize: 10, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
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
                        contentStyle={{
                          borderRadius: 4,
                          border: "1px solid #e2e8f0",
                          fontSize: 11,
                        }}
                      />

                      <Legend
                        verticalAlign="bottom"
                        height={32}
                        iconType="circle"
                        iconSize={7}
                        wrapperStyle={{
                          fontSize: 10,
                          paddingTop: 8,
                        }}
                      />

                      <Bar
                        dataKey="scheduled"
                        name="Terjadwal"
                        fill="#cbd5e1"
                        radius={[3, 3, 0, 0]}
                        maxBarSize={22}
                      />

                      <Bar
                        dataKey="completed"
                        name="Selesai"
                        fill="#16a34a"
                        radius={[3, 3, 0, 0]}
                        maxBarSize={22}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <p className="text-[10px] text-muted-foreground">
                  Menampilkan aktivitas patroli {formatMonth(activeMonth)}.
                </p>
              </>
            ) : (
              <div className="flex min-h-[200px] flex-col items-center justify-center rounded border border-dashed px-4 text-center">
                <TrendingUp className="mb-2 size-6 text-slate-400" />
                <p className="text-xs font-medium text-slate-700">
                  Belum ada aktivitas patroli
                </p>
                <p className="mt-1 max-w-[240px] text-[11px] text-muted-foreground">
                  Data ronde patroli untuk{" "}
                  {activeMonth ? formatMonth(activeMonth) : "bulan ini"} belum
                  tersedia.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3 border-t pt-4">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="size-4 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Distribusi Status Patroli
                </h3>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Komposisi status ronde pada bulan terpilih.
              </p>
            </div>

            {donutChartData.length > 0 ? (
              <>
                <div className="relative h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="46%"
                        innerRadius={58}
                        outerRadius={82}
                        paddingAngle={3}
                        strokeWidth={1}
                      >
                        {donutChartData.map((item) => (
                          <Cell key={item.status} fill={item.fill} />
                        ))}
                      </Pie>

                      <Tooltip
                        formatter={(value, name) => [`${value} ronde`, name]}
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
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-7">
                    <p className="text-2xl font-bold tabular-nums text-slate-900">
                      {donutTotal}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Total Ronde
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex min-h-[200px] flex-col items-center justify-center rounded border border-dashed px-4 text-center">
                <Activity className="mb-2 size-6 text-slate-400" />
                <p className="text-xs font-medium text-slate-700">
                  Belum ada distribusi status
                </p>
                <p className="mt-1 max-w-[240px] text-[11px] text-muted-foreground">
                  Data status ronde belum tersedia untuk bulan terpilih.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="min-w-0 space-y-3">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Papan Peringkat Security
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Cari dan bandingkan hasil kinerja setiap security.
              </p>
            </div>

            <span className="text-xs text-muted-foreground">
              Menampilkan{" "}
              <span className="font-semibold text-slate-900">
                {filteredLeaderboard.length}
              </span>{" "}
              dari {leaderboard.length} security
            </span>
          </div>

          <div className="flex flex-col gap-2 rounded border bg-slate-50 p-3 md:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />

              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cari nama, NPP, regu, site, atau predikat..."
                className=" bg-white pl-9 text-xs"
              />
            </div>

            <Select
              value={selectedSquad}
              onValueChange={(value) => setSelectedSquad(value ?? "all")}
            >
              <SelectTrigger className="h-9 w-full bg-white text-xs md:w-[170px]">
                <SelectValue placeholder="Semua Regu">
                  {selectedSquad === "all" || !selectedSquad
                    ? "Semua Regu"
                    : selectedSquad}
                </SelectValue>
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
                className="shrink-0 bg-white"
                onClick={clearFilters}
              >
                <RotateCcw className="mr-1.5 size-3.5" />
                Reset
              </Button>
            )}
          </div>

          <PaginationComponent
            totalItems={totalItems}
            startItem={startItem}
            endItem={endItem}
            pageSize={pageSize}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageSizeChange={(value) => {
              setPageSize(value || "10");
              setCurrentPage(1);
            }}
            onPageChange={(page) => {
              setCurrentPage(Math.max(1, Math.min(page, totalPages)));
            }}
          />

          <div className="overflow-hidden rounded border">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="w-14 text-center text-[11px]">
                      Rank
                    </TableHead>
                    <TableHead className="min-w-[160px] text-[11px]">
                      Security
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
                    paginatedLeaderboard.map((officer) => (
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
                            Tidak ada security yang sesuai dengan filter.
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

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-3 h-8 w-full text-xs"
                        onClick={() => {
                          setSelectedOfficer(null);
                          onNavigate("temuan");
                        }}
                      >
                        <Eye className="mr-2 size-3.5" />
                        Lihat Temuan
                      </Button>
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
