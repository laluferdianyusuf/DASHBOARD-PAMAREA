import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  assignNfc,
  unassignNfc,
} from "../../services/patrol-point-nfc/patrolPointNfc.service";
import type {
  AssignNfcRequest,
  PatrolPointNfcResponse,
  UnassignNfcRequest,
} from "../../types/patrol-point-nfc/patrol-point-nfc";

export const useAssignNfc = () => {
  const queryClient = useQueryClient();

  return useMutation<PatrolPointNfcResponse, Error, AssignNfcRequest>({
    mutationFn: (payload: AssignNfcRequest) => assignNfc(payload),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["patrol-point-nfc"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["patrol-points"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["nfc-tags"],
        }),
      ]);
    },
  });
};

export const useUnassignNfc = () => {
  const queryClient = useQueryClient();

  return useMutation<PatrolPointNfcResponse, Error, UnassignNfcRequest>({
    mutationFn: (payload) => unassignNfc(payload),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["patrol-point-nfc"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["patrol-points"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["nfc-tags"],
        }),
      ]);
    },
  });
};
