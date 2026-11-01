import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import { DashboardView } from "./components/DashboardView";
import { Header } from "./components/Header";
import { MonitoringView } from "./components/MonitoringView";
import { NavTab, Sidebar } from "./components/Sidebar";
import { INITIAL_CALENDAR_DAYS } from "./data/calendarMockData";
import {
  FINDINGS,
  PATROL_SCHEDULES,
  PatrolScheduleItem,
} from "./data/mockData";
import {
  applyDateRangeShiftToCalendar,
  applyLeaveToCalendar,
  DateRangeShiftPayload,
  DayShift,
  SecurityLeaveRecord,
  ShiftOfficerAssignment,
  syncShiftToCalendarDays,
} from "./utils/security-logic";

import { Toaster } from "@/components/ui/sonner";
import { useLocation, useNavigate } from "react-router-dom";
import { AnalyticAuditView } from "./components/AnalyticAuditView";
import { CutiIzinView } from "./components/CutiIzinView";
import { JadwalPatroliView } from "./components/JadwalPatroliView";
import { KalenderShiftView } from "./components/KalenderShiftView";
import { KelolaPenggunaView } from "./components/KelolaPenggunaView";
import LoginForm from "./components/LoginForm";
import ManajemenRondeView from "./components/ManajemenRondeView";
import { QuestionBuilderView } from "./components/QuestionBuilderView";
import { RiwayatPatroliView } from "./components/RiwayatPatroliView";
import { TagNfcView } from "./components/TagNfcView";
import { TambahJadwalShiftView } from "./components/TambahJadwalShiftView";
import { TemuanPatroliView } from "./components/TemuanPatroliView";
import { TitikPatroliView } from "./components/TitikPatroliView";
import { TukarShiftView } from "./components/TukarShiftView";
import { AuthProvider } from "./contexts/AuthProvider";
import { ScheduleProvider } from "./contexts/ScheduleProvider";
import { useMe } from "./hooks/auth";

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const hasAccessToken = Boolean(localStorage.getItem("accessToken"));
  const { data, isPending, isError } = useMe(hasAccessToken);
  const [currentTab, setCurrentTab] = useState<NavTab>("dashboard");
  const [selectedSite, setSelectedSite] = useState<string>("all");

  const siteId = data?.data.siteId ?? "";
  const [schedules, setSchedules] =
    useState<PatrolScheduleItem[]>(PATROL_SCHEDULES);
  const [calendarDays, setCalendarDays] = useState<(DayShift | null)[]>(
    INITIAL_CALENDAR_DAYS,
  );
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number>(24);

  useEffect(() => {
    if (!hasAccessToken && location.pathname !== "/login") {
      navigate("/login", { replace: true });
    }

    if (hasAccessToken && location.pathname === "/login") {
      navigate("/", { replace: true });
    }
  }, [hasAccessToken, location.pathname, navigate]);

  const [leaveRecords, setLeaveRecords] = useState<SecurityLeaveRecord[]>([
    {
      id: "LEV-001",
      officerId: "USR-008",
      officerName: "Agus Setiawan",
      leaveType: "Cuti Tahunan",
      startDate: "2025-05-25",
      endDate: "2025-05-27",
      reason: "Cuti tahunan keperluan keluarga di luar kota",
      backupOfficerId: "USR-010",
      backupOfficerName: "Arif Wibowo",
      status: "Disetujui",
      createdAt: "2025-05-22",
    },
  ]);

  const openFindingsCount = FINDINGS.filter(
    (f) =>
      f.status !== "Close" &&
      (selectedSite === "all" || f.siteId === selectedSite),
  ).length;

  const handleAddDateRangeScheduleAndSyncCalendar = (
    newSchedules: PatrolScheduleItem[],
    dateRangePayload: DateRangeShiftPayload,
  ) => {
    // 1. Prepend schedules to table
    setSchedules((prev) => [...newSchedules, ...prev]);

    // 2. Synchronize across calendar days
    setCalendarDays((prev) =>
      applyDateRangeShiftToCalendar(prev, dateRangePayload),
    );

    const firstDay = parseInt(dateRangePayload.startDate.split("-")[2], 10);
    if (firstDay) {
      setSelectedCalendarDay(firstDay);
    }
  };

  const handleAddScheduleAndSyncCalendar = (
    newSchedule: PatrolScheduleItem,
    dayShiftPayload: {
      day: number;
      dateStr: string;
      shiftType: "Pagi" | "Siang" | "Malam";
      squad: string;
      danru: string;
      sector: string;
      siteName: string;
      requiredCount: number;
      officers: ShiftOfficerAssignment[];
    },
  ) => {
    setSchedules((prev) => [newSchedule, ...prev]);

    setCalendarDays((prev) =>
      syncShiftToCalendarDays(prev, {
        day: dayShiftPayload.day,
        dateStr: dayShiftPayload.dateStr,
        shift: {
          type: dayShiftPayload.shiftType,
          squad: dayShiftPayload.squad,
          danru: dayShiftPayload.danru,
          count: dayShiftPayload.officers.length,
          required: dayShiftPayload.requiredCount,
          sector: dayShiftPayload.sector,
          siteName: dayShiftPayload.siteName,
          officers: dayShiftPayload.officers,
        },
      }),
    );

    setSelectedCalendarDay(dayShiftPayload.day);
  };

  const handleSubmitLeaveRecord = (
    leaveRecord: SecurityLeaveRecord,
    backupOfficer?: ShiftOfficerAssignment,
  ) => {
    setLeaveRecords((prev) => [leaveRecord, ...prev]);
    setCalendarDays((prev) =>
      applyLeaveToCalendar(prev, leaveRecord, backupOfficer),
    );
  };

  if (!hasAccessToken) {
    return <LoginForm />;
  }

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf8ff]">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (isError || !data?.data) {
    return <LoginForm />;
  }

  return (
    <AuthProvider user={data?.data}>
      <ScheduleProvider>
        <SidebarProvider>
          <div className="flex min-h-screen w-full text-[#131b2e] font-sans selection:bg-[#2563eb] selection:text-white">
            {/* Sidebar */}
            <Sidebar
              user={data?.data}
              currentTab={currentTab}
              onSelectTab={setCurrentTab}
              openFindingsCount={openFindingsCount}
            />

            <SidebarInset className="min-w-0 bg-[#faf8ff]">
              {/* Header */}
              <div className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b bg-[#faf8ff] px-6">
                <SidebarTrigger />

                <Separator orientation="vertical" className="h-5" />

                <div className="min-w-0 flex-1">
                  <Header
                    currentTab={currentTab}
                    selectedSite={siteId}
                    onSelectSite={setSelectedSite}
                    onSelectTab={setCurrentTab}
                  />
                </div>
              </div>

              {/* Workspace */}
              <main className="w-full flex-1 px-6 py-6 lg:px-8 bg-slate-100">
                {/* DASHBOARD */}
                {currentTab === "dashboard" && <DashboardView />}

                {/* MONITORING */}
                {currentTab === "monitoring" && (
                  <MonitoringView
                    selectedSite={siteId}
                    onNavigate={setCurrentTab}
                  />
                )}

                {/* JADWAL PATROLI */}
                {currentTab === "jadwal" && (
                  <JadwalPatroliView
                    selectedSite={siteId}
                    onNavigate={setCurrentTab}
                    schedules={schedules}
                    onUpdateSchedules={setSchedules}
                    onAddScheduleAndSyncCalendar={
                      handleAddScheduleAndSyncCalendar
                    }
                  />
                )}

                {/* KALENDER SHIFT */}
                {currentTab === "kalender" && (
                  <KalenderShiftView
                    onNavigate={setCurrentTab}
                    siteId={selectedSite}
                  />
                )}

                {/* TAMBAH JADWAL */}
                {currentTab === "tambah-jadwal" && (
                  <TambahJadwalShiftView
                    onNavigate={setCurrentTab}
                    onAddDateRangeScheduleAndSyncCalendar={
                      handleAddDateRangeScheduleAndSyncCalendar
                    }
                    calendarDays={calendarDays}
                  />
                )}

                {/* TUKAR SHIFT */}
                {currentTab === "tukar-shift" && (
                  <TukarShiftView onNavigate={setCurrentTab} />
                )}

                {/* CUTI & IZIN */}
                {currentTab === "cuti-izin" && (
                  <CutiIzinView
                    selectedSite={siteId}
                    onNavigate={setCurrentTab}
                    calendarDays={calendarDays}
                    leaveRecords={leaveRecords}
                    onSubmitLeave={handleSubmitLeaveRecord}
                  />
                )}

                {currentTab === "manajemen-ronde" && (
                  <ManajemenRondeView selectedSite={siteId} />
                )}

                {/* TITIK PATROLI */}
                {currentTab === "titik" && (
                  <TitikPatroliView selectedSite={siteId} />
                )}

                {/* PERANGKAT NFC */}
                {currentTab === "nfc" && <TagNfcView selectedSite={siteId} />}

                {/* CHECKLIST */}
                {currentTab === "question-builder" && <QuestionBuilderView />}

                {/* RIWAYAT PATROLI */}
                {currentTab === "riwayat" && (
                  <RiwayatPatroliView selectedSite={siteId} />
                )}

                {/* TEMUAN PATROLI */}
                {currentTab === "temuan" && (
                  <TemuanPatroliView selectedSite={siteId} />
                )}

                {/* KELOLA PENGGUNA */}
                {currentTab === "pengguna" && (
                  <KelolaPenggunaView selectedSite={siteId} />
                )}

                {/* ANALITIK & AUDIT */}
                {currentTab === "analytic-audit" && (
                  <AnalyticAuditView selectedSite={siteId} />
                )}
              </main>
              <Toaster position="bottom-right" richColors />
            </SidebarInset>
          </div>
        </SidebarProvider>
      </ScheduleProvider>
    </AuthProvider>
  );
}
