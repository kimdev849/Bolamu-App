export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

export interface ApiError {
  status: number;
  message: string;
  errors?: string[];
}

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: string;
  direction: SortDirection;
}

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  hidden?: boolean;
}

export interface PaginationConfig {
  currentPage: number;
  pageSize: number;
  totalItems: number;
}
