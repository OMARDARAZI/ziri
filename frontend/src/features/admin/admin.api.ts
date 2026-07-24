import { api } from '../../api/client';import { endpoints } from '../../api/endpoints';import { dataOf } from '../../api/response';import type { Pagination } from '../../types/api';import type { ResourceRecord } from '../../types/models';
export async function adminSummary(){return dataOf<Record<string,number>>(await api.get(endpoints.dashboard.admin.summary)).data;}
export async function related(){return dataOf<{provider_users:ResourceRecord[];providers:ResourceRecord[]}>(await api.get(endpoints.dashboard.admin.related)).data;}
export async function listResource(name:string,params:URLSearchParams){const result=dataOf<ResourceRecord[]>(await api.get(endpoints.dashboard.admin.resource(name),{params}));return {items:result.data,pagination:result.pagination};}
export async function getResource(name:string,id:string){return dataOf<ResourceRecord>(await api.get(endpoints.dashboard.admin.item(name,id))).data;}
export async function saveResource(name:string,id:string|undefined,data:FormData|Record<string,unknown>){const body=data instanceof FormData?data:data;const response=id?await api.patch(endpoints.dashboard.admin.item(name,id),body):await api.post(endpoints.dashboard.admin.resource(name),body);return dataOf<ResourceRecord>(response).data;}
export async function deleteResource(name:string,id:string){return dataOf<Record<string,never>>(await api.delete(endpoints.dashboard.admin.item(name,id))).data;}
export async function bookingAction(id:string,action:'confirm'|'cancel'){return dataOf<Record<string,never>>(await api.post(endpoints.dashboard.admin.bookingAction(id),{action})).data;}
export async function cancelQr(id:string){return dataOf<Record<string,never>>(await api.post(endpoints.dashboard.admin.cancelQr(id))).data;}
export type ResourceList={items:ResourceRecord[];pagination?:Pagination};
