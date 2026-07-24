export interface ApiSuccess<T> { success: true; message: string; data: T; pagination?: Pagination; }
export interface ApiFailure { success: false; message: string; code?: string; errors?: FieldError[]; }
export interface FieldError { field: string; message: string; }
export interface Pagination { page: number; limit: number; total: number; pages: number; }
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
