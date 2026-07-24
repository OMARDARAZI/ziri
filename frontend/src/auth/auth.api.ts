import { api } from '../api/client';import { endpoints } from '../api/endpoints';import { dataOf } from '../api/response';import type { DashboardRole } from './auth.types';import type { User } from '../types/models';
export interface AuthPayload{user:User;csrf_token:string;}
export async function login(role:DashboardRole,phone:string,password:string){return dataOf(await api.post(role==='ADMIN'?endpoints.dashboard.admin.login:endpoints.dashboard.provider.login,{phone,password})).data as AuthPayload;}
export async function currentUser(role:DashboardRole){return dataOf(await api.get(role==='ADMIN'?endpoints.dashboard.admin.me:endpoints.dashboard.provider.me)).data as AuthPayload;}
export async function logout(role:DashboardRole){return dataOf(await api.post(role==='ADMIN'?endpoints.dashboard.admin.logout:endpoints.dashboard.provider.logout)).data;}
