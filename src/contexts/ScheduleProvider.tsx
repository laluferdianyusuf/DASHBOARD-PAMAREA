import { useState } from "react";
import type { ReactNode } from "react";

import { ScheduleContext, type Schedule } from "./ScheduleContext";

interface ScheduleProviderProps {
  children: ReactNode;
}

export function ScheduleProvider({ children }: ScheduleProviderProps) {
  const [schedule, setSchedule] = useState<Schedule | null>(null);

  return (
    <ScheduleContext.Provider
      value={{
        schedule,
        setSchedule,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
}
