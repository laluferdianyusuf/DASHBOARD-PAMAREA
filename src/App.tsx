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
  CheckpointItem,
  CHECKPOINTS,
  FINDINGS,
  NFC_TAGS,
  NfcTagItem,
  PATROL_SCHEDULES,
  PatrolScheduleItem,
} from "./data/mockData";
import {
  applyDateRangeShiftToCalendar,
  applyLeaveToCalendar,
  assignOfficerToDayShift,
  DateRangeShiftPayload,
  DayShift,
  SecurityLeaveRecord,
  ShiftOfficerAssignment,
  ShiftSwapRecord,
  swapOfficersOnDate,
  syncShiftToCalendarDays,
  unassignOfficerFromDayShift,
} from "./utils/security-logic";

import { AnalyticAuditView } from "./components/AnalyticAuditView";
import { CutiIzinView } from "./components/CutiIzinView";
import { JadwalPatroliView } from "./components/JadwalPatroliView";
import { KalenderShiftView } from "./components/KalenderShiftView";
import { KelolaPenggunaView } from "./components/KelolaPenggunaView";
import LoginForm from "./components/LoginForm";
import { QuestionBuilderView } from "./components/QuestionBuilderView";
import { RiwayatPatroliView } from "./components/RiwayatPatroliView";
import { TagNfcView } from "./components/TagNfcView";
import { TambahJadwalShiftView } from "./components/TambahJadwalShiftView";
import { TemuanPatroliView } from "./components/TemuanPatroliView";
import { TitikPatroliView } from "./components/TitikPatroliView";
import { TukarShiftView } from "./components/TukarShiftView";
import { AuthProvider } from "./contexts/AuthProvider";
import { ScheduleProvider } from "./contexts/ScheduleProvider";
import LoginForm from "./components/LoginForm";
import { useLocation, useNavigate } from "react-router-dom";

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // Periksa apakah access token tersedia
  const hasAccessToken = Boolean(localStorage.getItem("accessToken"));
  const { data, isPending, isError } = useMe(hasAccessToken);
  const [currentTab, setCurrentTab] = useState<NavTab>("dashboard");
  const [selectedSite, setSelectedSite] = useState<string>("all");

  // Synchronized Checkpoint and NFC inventory state
  const [checkpoints, setCheckpoints] = useState<CheckpointItem[]>(CHECKPOINTS);
  const [tags, setTags] = useState<NfcTagItem[]>(NFC_TAGS);

  // Synchronized Schedules and Calendar Shifts state
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

  // Swap Shift & Leave Management state
  const [swapRecords, setSwapRecords] = useState<ShiftSwapRecord[]>([
    {
      id: "SWP-20250524-001",
      dateStr: "2025-05-24",
      officerA: {
        officerId: "USR-003",
        officerName: "Rian Hidayat",
        shiftType: "Siang",
        post: "Pintu Masuk Lobi Utama & Metal Detector",
      },
      officerB: {
        officerId: "USR-005",
        officerName: "Wahyu Hidayat",
        shiftType: "Malam",
        post: "Pos Pengawasan Dermaga Kontainer",
      },
      reason: "Penyesuaian jam kuliah malam dan urusan keluarga mendesak",
      status: "Disetujui & Aktif",
      createdAt: "2025-05-23 14:30",
      approvedBy: "Danru Ahmad Fauzi",
    },
  ]);

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

  /**
   * Synchronized Unassign: Detaches an NFC tag from a Checkpoint
   */
  const handleUnassignTagFromCheckpoint = (checkpointId: string) => {
    const targetCp = checkpoints.find((c) => c.id === checkpointId);
    if (!targetCp) return;

    const previousTagUid = targetCp.tagUid;

    // 1. Update Checkpoint
    setCheckpoints((prev) =>
      prev.map((c) => {
        if (c.id === checkpointId) {
          return {
            ...c,
            tagUid: "",
            tagType: "Tanpa Tag (Unassigned)",
            status: "Belum Terhubung Tag",
          };
        }
        return c;
      }),
    );

    // 2. Update Tag NFC inventory to release connection
    setTags((prev) =>
      prev.map((t) => {
        if (
          t.linkedCheckpointId === checkpointId ||
          (previousTagUid && t.uid === previousTagUid)
        ) {
          return {
            ...t,
            linkedCheckpointId: "",
            linkedCheckpointName: "Belum Ditautkan (Unassigned)",
            status: "Belum Ditautkan",
          };
        }
        return t;
      }),
    );
  };

  /**
   * Synchronized Unassign: Detaches a Checkpoint from an NFC Tag
   */
  const handleUnassignCheckpointFromTag = (tagUid: string) => {
    const targetTag = tags.find((t) => t.uid === tagUid);
    if (!targetTag) return;

    const previousCheckpointId = targetTag.linkedCheckpointId;

    // 1. Update Tag NFC inventory
    setTags((prev) =>
      prev.map((t) => {
        if (t.uid === tagUid) {
          return {
            ...t,
            linkedCheckpointId: "",
            linkedCheckpointName: "Belum Ditautkan (Unassigned)",
            status: "Belum Ditautkan",
          };
        }
        return t;
      }),
    );

    // 2. Update Checkpoint to clear its tag
    setCheckpoints((prev) =>
      prev.map((c) => {
        if (c.id === previousCheckpointId || c.tagUid === tagUid) {
          return {
            ...c,
            tagUid: "",
            tagType: "Tanpa Tag (Unassigned)",
            status: "Belum Terhubung Tag",
          };
        }
        return c;
      }),
    );
  };

  /**
   * Synchronized Assign: Connects a Checkpoint and an NFC Tag
   */
  const handleAssignNfcConnection = (checkpointId: string, tagUid: string) => {
    const cp = checkpoints.find((c) => c.id === checkpointId);
    const tag = tags.find((t) => t.uid === tagUid);
    if (!cp || !tag) return;

    // 1. Update Checkpoint
    setCheckpoints((prev) =>
      prev.map((c) => {
        if (c.id === checkpointId) {
          return {
            ...c,
            tagUid: tag.uid,
            tagType: tag.type.includes("RFID") ? "RFID UHF" : "NFC NTAG213",
            status: "Aktif Normal",
          };
        }
        // If another checkpoint had this tag, detach it
        if (c.tagUid === tagUid && c.id !== checkpointId) {
          return {
            ...c,
            tagUid: "",
            tagType: "Tanpa Tag (Unassigned)",
            status: "Belum Terhubung Tag",
          };
        }
        return c;
      }),
    );

    // 2. Update Tag NFC
    setTags((prev) =>
      prev.map((t) => {
        if (t.uid === tagUid) {
          return {
            ...t,
            linkedCheckpointId: cp.id,
            linkedCheckpointName: cp.name,
            siteId: cp.siteId,
            siteName: cp.siteName,
            status: "Terkoneksi Normal",
          };
        }
        // If another tag was linked to this checkpoint, detach it
        if (t.linkedCheckpointId === checkpointId && t.uid !== tagUid) {
          return {
            ...t,
            linkedCheckpointId: "",
            linkedCheckpointName: "Belum Ditautkan (Unassigned)",
            status: "Belum Ditautkan",
          };
        }
        return t;
      }),
    );
  };

  /**
   * Synchronized Add Date-Range Schedule & Plot Security across calendar dates
   */
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

  /**
   * Synchronized Add Single Schedule & Plot Security to Calendar
   */
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
    // 1. Update schedules table
    setSchedules((prev) => [newSchedule, ...prev]);

    // 2. Synchronize with calendar days
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

  /**
   * Swap Shift Execution & Calendar Sync
   */
  const handleExecuteSwapShift = (swapRequest: {
    dateStr: string;
    officerAId: string;
    officerAName: string;
    shiftTypeA: "Pagi" | "Siang" | "Malam";
    postA?: string;
    officerBId: string;
    officerBName: string;
    shiftTypeB: "Pagi" | "Siang" | "Malam";
    postB?: string;
    reason: string;
  }) => {
    const result = swapOfficersOnDate(calendarDays, swapRequest);
    if (result.success) {
      setCalendarDays(result.updatedCalendarDays);
      const newSwapItem: ShiftSwapRecord = {
        id: `SWP-${Date.now().toString().slice(-4)}`,
        dateStr: swapRequest.dateStr,
        officerA: {
          officerId: swapRequest.officerAId,
          officerName: swapRequest.officerAName,
          shiftType: swapRequest.shiftTypeA,
          post: swapRequest.postA || "Pos Jaga",
        },
        officerB: {
          officerId: swapRequest.officerBId,
          officerName: swapRequest.officerBName,
          shiftType: swapRequest.shiftTypeB,
          post: swapRequest.postB || "Pos Jaga",
        },
        reason: swapRequest.reason,
        status: "Disetujui & Aktif",
        createdAt: "2025-05-24 10:15",
        approvedBy: "Admin Pusat PAMAREA",
      };
      setSwapRecords((prev) => [newSwapItem, ...prev]);
    }
  };

  /**
   * Leave / Cuti / Izin submission & Calendar Backup Sync
   */
  const handleSubmitLeaveRecord = (
    leaveRecord: SecurityLeaveRecord,
    backupOfficer?: ShiftOfficerAssignment,
  ) => {
    setLeaveRecords((prev) => [leaveRecord, ...prev]);
    setCalendarDays((prev) =>
      applyLeaveToCalendar(prev, leaveRecord, backupOfficer),
    );
  };

  /**
   * Assign officer directly from Calendar View
   */
  const handleAssignOfficerToShift = (
    day: number,
    shiftType: "Pagi" | "Siang" | "Malam",
    officer: ShiftOfficerAssignment,
  ) => {
    setCalendarDays((prev) =>
      assignOfficerToDayShift(prev, day, shiftType, officer),
    );
  };

  /**
   * Unassign officer directly from Calendar View
   */
  const handleUnassignOfficerFromShift = (
    day: number,
    shiftType: "Pagi" | "Siang" | "Malam",
    officerId: string,
  ) => {
    setCalendarDays((prev) =>
      unassignOfficerFromDayShift(prev, day, shiftType, officerId),
    );
  };

  // 1. Belum memiliki access token
  if (!hasAccessToken) {
    return <LoginForm />;
  }

  // 2. Sedang memeriksa autentikasi
  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf8ff]">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  // 3. Autentikasi gagal atau data user tidak tersedia
  if (isError || !data?.data) {
    return <LoginForm />;
  }

  return (
    <AuthProvider user={data?.data}>
      <ScheduleProvider>
        <SidebarProvider>
          <div className="flex min-h-screen w-full bg-[#faf8ff] text-[#131b2e] font-sans selection:bg-[#2563eb] selection:text-white">
            {/* Sidebar */}
            <Sidebar
              currentTab={currentTab}
              onSelectTab={setCurrentTab}
              openFindingsCount={openFindingsCount}
            />

            {/* Main Content */}
            <SidebarInset className="min-w-0 bg-[#faf8ff]">
              {/* Header */}
              <div className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b bg-white px-6">
                <SidebarTrigger />

                <Separator orientation="vertical" className="h-5" />

                <div className="min-w-0 flex-1">
                  <Header
                    currentTab={currentTab}
                    selectedSite={siteId}
                    onSelectSite={setSelectedSite}
                  />
                </div>
              </div>

              {/* Workspace */}
              <main className="w-full flex-1 px-6 py-6 lg:px-8">
                {/* DASHBOARD */}
                {currentTab === "dashboard" && <DashboardView />}

                {/* MONITORING */}
                {currentTab === "monitoring" && (
                  <MonitoringView selectedSite={siteId} />
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
                    calendarDays={calendarDays}
                    selectedDay={selectedCalendarDay}
                    onSelectDay={setSelectedCalendarDay}
                    onAssignOfficerToShift={handleAssignOfficerToShift}
                    onUnassignOfficerFromShift={handleUnassignOfficerFromShift}
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
                  <TukarShiftView
                    onNavigate={setCurrentTab}
                    calendarDays={calendarDays}
                    swapRecords={swapRecords}
                    onExecuteSwap={handleExecuteSwapShift}
                  />
                )}

                {/* CUTI & IZIN */}
                {currentTab === "cuti-izin" && (
                  <CutiIzinView
                    onNavigate={setCurrentTab}
                    calendarDays={calendarDays}
                    leaveRecords={leaveRecords}
                    onSubmitLeave={handleSubmitLeaveRecord}
                  />
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
            </SidebarInset>
          </div>
        </SidebarProvider>
      </ScheduleProvider>
    </AuthProvider>
  );
}
