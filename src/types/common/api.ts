export interface ApiResponse<T> {
  message?: string;
  data: T;
}

export interface ApiErrorResponse {
  statusCode?: number;
  message: string | string[];
  error?: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SearchQuery extends PaginationQuery {
  search?: string;
}

export type SortDirection = "asc" | "desc";

export interface SortQuery {
  sortBy?: string;
  sortOrder?: SortDirection;
}
