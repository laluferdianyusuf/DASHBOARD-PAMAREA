import { createContext } from "react";
import type { ReactNode } from "react";

export interface Schedule {
  id: string;
  scheduleId: string | null;
  name: string;
}

interface ScheduleContextValue {
  schedule: Schedule | null;
  setSchedule: (schedule: Schedule | null) => void;
}

interface ScheduleProviderProps {
  children: ReactNode;
}

export const ScheduleContext = createContext<ScheduleContextValue | null>(null);

export type { ScheduleContextValue, ScheduleProviderProps };
