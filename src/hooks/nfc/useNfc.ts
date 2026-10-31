import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  activateNfcTag,
  createNfcTag,
  deactivateNfcTag,
  deleteNfcTag,
  getNfcTagById,
  getNfcTagByUid,
  getNfcTags,
  getUnassignedNfcTags,
  markNfcTagDamaged,
  markNfcTagLost,
  replaceNfcTag,
  updateNfcTag,
} from "../../services/nfc/nfc.service";

import type {
  CreateNfcTagRequest,
  NfcTagQuery,
  ReplaceNfcTagRequest,
  UpdateNfcTagRequest,
} from "../../types/nfc/nfc";

export const nfcQueryKeys = {
  all: ["nfc-tags"] as const,

  lists: () => [...nfcQueryKeys.all, "list"] as const,

  list: (query?: NfcTagQuery) => [...nfcQueryKeys.lists(), query] as const,

  unassigned: () => [...nfcQueryKeys.all, "unassigned"] as const,

  details: () => ["nfc-tag"] as const,

  detail: (id: string) => [...nfcQueryKeys.details(), id] as const,

  byUid: (uid: string) => [...nfcQueryKeys.all, "uid", uid] as const,
};

export const useNfcTags = (query?: NfcTagQuery) => {
  return useQuery({
    queryKey: nfcQueryKeys.list(query),
    queryFn: () => getNfcTags(query),
  });
};

export const useUnassignedNfcTags = () => {
  return useQuery({
    queryKey: nfcQueryKeys.unassigned(),
    queryFn: getUnassignedNfcTags,
  });
};

export const useNfcTagsById = (id: string) => {
  return useQuery({
    queryKey: nfcQueryKeys.detail(id),
    queryFn: () => getNfcTagById(id),
    enabled: Boolean(id),
  });
};

export const useNfcTagByUid = (uid: string) => {
  return useQuery({
    queryKey: nfcQueryKeys.byUid(uid),
    queryFn: () => getNfcTagByUid(uid),
    enabled: Boolean(uid),
  });
};

export const useCreateNfcTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateNfcTagRequest) => createNfcTag(payload),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: nfcQueryKeys.all,
      });
    },
  });
};

export const useUpdateNfcTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateNfcTagRequest;
    }) => updateNfcTag(id, payload),

    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: nfcQueryKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: nfcQueryKeys.detail(data.id),
        }),
      ]);
    },
  });
};

export const useActivateNfc = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => activateNfcTag(id),

    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: nfcQueryKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: nfcQueryKeys.detail(data.id),
        }),
      ]);
    },
  });
};

export const useDeactivateNfc = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deactivateNfcTag(id),

    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: nfcQueryKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: nfcQueryKeys.detail(data.id),
        }),
      ]);
    },
  });
};

export const useMarkNfcTagDamaged = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markNfcTagDamaged(id),

    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: nfcQueryKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: nfcQueryKeys.detail(data.id),
        }),
      ]);
    },
  });
};

export const useMarkNfcTagLost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markNfcTagLost(id),

    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: nfcQueryKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: nfcQueryKeys.detail(data.id),
        }),
      ]);
    },
  });
};

export const useReplaceNfcTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ReplaceNfcTagRequest;
    }) => replaceNfcTag(id, payload),

    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: nfcQueryKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: nfcQueryKeys.detail(data.oldNfcId),
        }),
        queryClient.invalidateQueries({
          queryKey: nfcQueryKeys.detail(data.newNfc.id),
        }),
        queryClient.invalidateQueries({
          queryKey: nfcQueryKeys.unassigned(),
        }),
      ]);
    },
  });
};

export const useDeleteNfcTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteNfcTag(id),

    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: nfcQueryKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: nfcQueryKeys.detail(data.id),
        }),
        queryClient.invalidateQueries({
          queryKey: nfcQueryKeys.unassigned(),
        }),
      ]);
    },
  });
};
