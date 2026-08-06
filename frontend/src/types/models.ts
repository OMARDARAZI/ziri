export type Role = 'ADMIN' | 'PROVIDER' | 'CUSTOMER';
export interface User { id:number; role:Role; full_name:string; phone:string; email?:string; is_active:boolean; created_at?:string; updated_at?:string; }
export type RecordValue = string | number | boolean | null | undefined;
export interface ResourceRecord { id?:number|string; [key:string]: unknown; }
export interface BookingParticipant extends ResourceRecord { id:number; full_name:string; phone:string; is_owner:boolean; qr?:QrRecord; }
export interface Booking extends ResourceRecord { id:number; booking_code:string; offering_title?:string; provider_name?:string; scheduled_at:string; currency:'USD'|'LBP'; unit_price:number; participant_count:number; total_amount:number; status:'PENDING'|'CONFIRMED'|'CANCELLED'|'COMPLETED'; participants?:BookingParticipant[]; }
export interface QrRecord extends ResourceRecord { id?:number; public_token?:string; status:string; valid_from?:string; valid_until?:string; used_at?:string|null; expired_reason?:string|null; public_url?:string; image_url?:string; }
