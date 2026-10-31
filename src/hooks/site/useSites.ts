import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getSites,
  getActiveSites,
  getSiteById,
  createSite,
  updateSite,
  activateSite,
  deactivateSite,
  deleteSite,
} from "../../services/sites/site.service";

import type {
  CreateSiteRequest,
  UpdateSiteRequest,
} from "../../types/site/site";

// Query keys
export const siteKeys = {
  all: ["sites"] as const,
  lists: () => [...siteKeys.all, "list"] as const,
  active: () => [...siteKeys.all, "active"] as const,
  details: () => [...siteKeys.all, "detail"] as const,
  detail: (id: string) => [...siteKeys.details(), id] as const,
};

// GET /sites
export const useSites = () => {
  return useQuery({
    queryKey: siteKeys.lists(),
    queryFn: getSites,
  });
};

// GET /sites/active
export const useActiveSites = () => {
  return useQuery({
    queryKey: siteKeys.active(),
    queryFn: getActiveSites,
  });
};

// GET /sites/:id
export const useSiteById = (id: string) => {
  return useQuery({
    queryKey: siteKeys.detail(id),
    queryFn: () => getSiteById(id),
    enabled: Boolean(id),
  });
};

// POST /sites
export const useCreateSite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSiteRequest) => createSite(payload),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: siteKeys.all,
      });
    },
  });
};

// PATCH /sites/:id
export const useUpdateSite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSiteRequest }) =>
      updateSite(id, payload),

    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: siteKeys.lists(),
        }),
        queryClient.invalidateQueries({
          queryKey: siteKeys.active(),
        }),
        queryClient.invalidateQueries({
          queryKey: siteKeys.detail(variables.id),
        }),
      ]);
    },
  });
};

// PATCH /sites/:id/activate
export const useActivateSite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => activateSite(id),

    onSuccess: async (_data, id) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: siteKeys.lists(),
        }),
        queryClient.invalidateQueries({
          queryKey: siteKeys.active(),
        }),
        queryClient.invalidateQueries({
          queryKey: siteKeys.detail(id),
        }),
      ]);
    },
  });
};

// PATCH /sites/:id/deactivate
export const useDeactivateSite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deactivateSite(id),

    onSuccess: async (_data, id) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: siteKeys.lists(),
        }),
        queryClient.invalidateQueries({
          queryKey: siteKeys.active(),
        }),
        queryClient.invalidateQueries({
          queryKey: siteKeys.detail(id),
        }),
      ]);
    },
  });
};

// DELETE /sites/:id
export const useDeleteSite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSite(id),

    onSuccess: async (_data, id) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: siteKeys.lists(),
        }),
        queryClient.invalidateQueries({
          queryKey: siteKeys.active(),
        }),
        queryClient.removeQueries({
          queryKey: siteKeys.detail(id),
          exact: true,
        }),
      ]);
    },
  });
};
