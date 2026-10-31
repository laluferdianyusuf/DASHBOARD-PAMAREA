import { NfcAssignment } from "../types";
import { PatrolPointResponse } from "../types/patrol-point/patrolPoint";

export const getActiveAssignment = (
  point: PatrolPointResponse,
): NfcAssignment | undefined => {
  return point.nfcAssignments?.find(
    (assignment) => assignment.status === "ACTIVE" && !assignment.unassignedAt,
  );
};

export const getStatusLabel = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "Aktif";
    case "INACTIVE":
      return "Nonaktif";
    case "MAINTENANCE":
      return "Pemeliharaan";
    default:
      return status;
  }
};

export const getStatusClass = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "INACTIVE":
      return "border-slate-200 bg-slate-50 text-slate-600";
    case "MAINTENANCE":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
};
