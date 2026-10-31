import { useContext } from "react";

import { ScheduleContext } from "../../contexts/ScheduleContext";

export function useScheduleContext() {
  const context = useContext(ScheduleContext);

  if (!context) {
    throw new Error(
      "useScheduleContext harus digunakan di dalam ScheduleProvider",
    );
  }

  return context;
}
