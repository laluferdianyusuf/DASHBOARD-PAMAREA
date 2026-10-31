import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { checkpointService } from "../../services/checkpoints/checkpoint.service";

import type {
  CreateCheckpointPayload,
  UpdateCheckpointPayload,
} from "../../types/patrol-point/checkpoints";

export const checkpointKeys = {
  all: ["checkpoints"] as const,
  detail: (id: string) => ["checkpoints", id] as const,
};

// Mengambil daftar checkpoint
export function useCheckpoints() {
  return useQuery({
    queryKey: checkpointKeys.all,
    queryFn: checkpointService.getAll,
  });
}

// Menambahkan checkpoint
export function useCreateCheckpoint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCheckpointPayload) =>
      checkpointService.create(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: checkpointKeys.all,
      });
    },
  });
}

// Memperbarui checkpoint
export function useUpdateCheckpoint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateCheckpointPayload;
    }) => checkpointService.update(id, payload),

    onSuccess: (checkpoint) => {
      queryClient.invalidateQueries({
        queryKey: checkpointKeys.all,
      });

      queryClient.invalidateQueries({
        queryKey: checkpointKeys.detail(checkpoint.id),
      });
    },
  });
}

// Menghapus checkpoint
export function useDeleteCheckpoint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => checkpointService.delete(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: checkpointKeys.all,
      });
    },
  });
}
