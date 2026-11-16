import { patrolWarningService } from "@/src/services/patrol/patrol-warning.service";
import { useQuery } from "@tanstack/react-query";

export const usePatrolWarning = (patrolId: string) => {
  return useQuery({
    queryKey: ["patrol-warning", patrolId],

    queryFn: () => patrolWarningService.getByPatrolId(patrolId),

    enabled: Boolean(patrolId),

    staleTime: 1000 * 60,

    retry: 1,
  });
};
