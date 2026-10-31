import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  AssignNfcRequest,
  PatrolPointNfcResponse,
} from "../../types/patrol-point-nfc/patrol-point-nfc";
import { assignNfc } from "../../services/patrol-point-nfc/patrolPointNfc.service";

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
