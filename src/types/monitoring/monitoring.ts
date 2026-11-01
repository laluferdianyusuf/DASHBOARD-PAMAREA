import { NavTab } from "@/src/components/Sidebar";

export interface SecurityPerformanceHistoryItem {
  officerId: string;
  date: string;
  score: number;
}

export interface MonitoringViewProps {
  selectedSite: string;
  performanceHistory?: SecurityPerformanceHistoryItem[];
  onNavigate: (tab: NavTab) => void;
}

export type ColumnSearch = {
  rank: string;
  officer: string;
  squadSite: string;
  compliance: string;
  score: string;
  status: string;
};

export interface PatrolCheckpoint {
  id: string;
  sequence: number;
  required: boolean;
  status: string;
  visitedAt?: string | null;
}

export interface PatrolRound {
  id: string;
  roundNumber: number;
  status: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  scheduleDate?: {
    date: string;
  };
  checkpoints?: PatrolCheckpoint[];
  schedule?: {
    id: string;
    name: string;
    startTime?: string;
    endTime?: string;
    site?: {
      id: string;
      name: string;
    };
  };
}

export interface PatrolUserGroup {
  user: {
    id: string;
    employeeNumber?: string;
    fullName: string;
    username?: string;
    teamName?: string | null;
  };
  rounds: PatrolRound[];
}

export interface ScheduleAssignment {
  id: string;
  userId: string;
  scheduleId: string;
  startDate: string;
  endDate: string;
  status: string;
  user?: {
    id: string;
    employeeNumber?: string;
    fullName: string;
    username?: string;
  };
  schedule?: {
    id: string;
    name: string;
    siteId: string;
    startTime?: string;
    endTime?: string;
    gracePeriodMinutes?: number;
    site?: {
      id: string;
      name: string;
    };
  };
}

export interface PatrolSchedule {
  id: string;
  siteId: string;
  name: string;
  startTime: string;
  endTime: string;
  gracePeriodMinutes?: number;
  status: string;
  site?: {
    id: string;
    name: string;
  };
}
