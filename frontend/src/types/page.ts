export enum Order {
  ASC = 'ASC',
  DESC = 'DESC',
}

export interface PageOptions {
  page?: number;
  take?: number;
  order?: Order;
  q?: string; // Search query
}

export interface PageMeta {
  page: number;
  take: number;
  itemCount: number;
  pageCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface Page<T> {
  data: T[];
  meta: PageMeta;
} 