import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getFindingFeed,
  getFindingFeedById,
  resolveFinding,
  ResolveFindingRequest,
} from "../../services/finding/finding.service";
import type { FindingQuery } from "../../types";
interface ResolveFindingVariables {
  id: string;
  data: ResolveFindingRequest;
}

export const useFindings = (query?: FindingQuery) => {
  return useQuery({
    queryKey: ["findings", query],
    queryFn: () => getFindingFeed(query),
  });
};

export const useFindingsById = (id: string) => {
  return useQuery({
    queryKey: ["finding", id],
    queryFn: () => getFindingFeedById(id),
    enabled: Boolean(id),
  });
};

export const useResolveFinding = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: ResolveFindingVariables) =>
      resolveFinding(id, data),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["findings"],
      });

      queryClient.invalidateQueries({
        queryKey: ["finding", variables.id],
      });
    },
  });
};
