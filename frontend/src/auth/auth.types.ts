import type { ApiError } from '../api/apiError';
import type { Role,User } from '../types/models';

export type DashboardRole=Extract<Role,'ADMIN'|'PROVIDER'>;
export interface AuthState{user:User|null;csrfToken:string|null;isLoading:boolean;error:ApiError|null;}
