import { useQuery } from "@tanstack/react-query";
import {
  getFindingFeed,
  getFindingFeedById,
} from "../../services/finding/finding.service";
import type { FindingQuery } from "../../types";

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
