import { api } from '../../api/client';import { endpoints } from '../../api/endpoints';import { dataOf } from '../../api/response';import type { Booking,ResourceRecord } from '../../types/models';
export interface QrValidationResult { participant:{id:number;full_name:string;phone:string}; booking:{id:number;booking_code:string;scheduled_at:string;offering_title:string;provider_name:string}; qr_status:string; }
export async function providerSummary(){return dataOf<ResourceRecord>(await api.get(endpoints.dashboard.provider.summary)).data;}
export async function providerBookings(){const data=dataOf<Booking[]>(await api.get(endpoints.dashboard.provider.bookings));return {items:data.data,pagination:data.pagination};}
export async function providerBooking(id:string){return dataOf<Booking>(await api.get(endpoints.dashboard.provider.booking(id))).data;}
export async function providerHistory(){return dataOf<ResourceRecord[]>(await api.get(endpoints.dashboard.provider.history)).data;}
export async function providerProfile(){return dataOf<ResourceRecord>(await api.get(endpoints.dashboard.provider.profile)).data;}
export async function saveProviderProfile(values:Record<string,unknown>){return dataOf<ResourceRecord>(await api.patch(endpoints.dashboard.provider.profile,values)).data;}
export async function validateQr(token:string){return dataOf<QrValidationResult>(await api.post(endpoints.dashboard.provider.validate,{token})).data;}
