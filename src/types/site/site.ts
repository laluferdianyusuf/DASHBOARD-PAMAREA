import type { SiteStatus } from "../enums/prisma-enums";

export interface Site {
  id: string;
  createdById: string | null;
  code: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  status: SiteStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSiteRequest {
  code: string;
  name: string;
  address?: string | null;

  latitude?: number | null;
  longitude?: number | null;

  status?: SiteStatus;
}

// Payload untuk memperbarui site
export interface UpdateSiteRequest {
  code?: string;
  name?: string;
  address?: string | null;

  latitude?: number | null;
  longitude?: number | null;

  status?: SiteStatus;
}

// Query untuk pencarian dan filter site
export interface SiteQuery {
  search?: string;
  status?: SiteStatus;

  page?: number;
  limit?: number;

  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Data ringkas site
export interface SiteSummary {
  id: string;
  code: string;
  name: string;
  status: SiteStatus;
}
