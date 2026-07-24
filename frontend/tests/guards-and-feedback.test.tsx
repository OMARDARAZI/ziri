import { render,screen } from '@testing-library/react';
import { MemoryRouter,Route,Routes } from 'react-router-dom';
import { describe,expect,it,vi } from 'vitest';

import { ApiError } from '../src/api/apiError';
import { RequireAuthentication } from '../src/auth/RequireAuthentication';
import { ErrorState } from '../src/components/common/States';
import { StatusBadge } from '../src/components/common/StatusBadge';
import { scanResultFromValidation } from '../src/features/provider/ProviderScanner';

const state={user:null as {role:string}|null,isLoading:false,error:null,refresh:vi.fn()};
vi.mock('../src/auth/AuthProvider',()=>({useAuth:()=>state}));

function guarded(role:'ADMIN'|'PROVIDER'){return <MemoryRouter initialEntries={[`/${role==='ADMIN'?'admin':'provider'}/bookings`]}><Routes><Route path="/admin/login" element={<p>Admin login</p>}/><Route path="/provider/login" element={<p>Provider login</p>}/><Route path="/unauthorized" element={<p>Unauthorized</p>}/><Route path="*" element={<RequireAuthentication role={role}><p>Private content</p></RequireAuthentication>}/></Routes></MemoryRouter>}

describe('role guards and feedback',()=>{
  it('redirects an unauthenticated admin route to admin login',()=>{state.user=null;state.error=null;render(guarded('ADMIN'));expect(screen.getByText('Admin login')).toBeInTheDocument();});
  it('redirects an unauthenticated provider route to provider login',()=>{state.user=null;state.error=null;render(guarded('PROVIDER'));expect(screen.getByText('Provider login')).toBeInTheDocument();});
  it('rejects provider access to an admin route',()=>{state.user={role:'PROVIDER'};state.error=null;render(guarded('ADMIN'));expect(screen.getByText('Unauthorized')).toBeInTheDocument();});
  it('allows matching dashboard roles',()=>{state.user={role:'ADMIN'};state.error=null;render(guarded('ADMIN'));expect(screen.getByText('Private content')).toBeInTheDocument();});
  it('renders active QR state',()=>{render(<StatusBadge value="ACTIVE"/>);expect(screen.getByText('ACTIVE')).toBeInTheDocument();});
  it('renders invalid QR state without treating it as valid',()=>{render(<StatusBadge value="EXPIRED"/>);expect(screen.getByText('EXPIRED')).toBeInTheDocument();});
  it('preserves stable API error codes and validation fields',()=>{const error=new ApiError('Validation failed',422,[{field:'title',message:'Title is required'}],'VALIDATION_ERROR');expect(error.status).toBe(422);expect(error.code).toBe('VALIDATION_ERROR');expect(error.fields[0].field).toBe('title');});
  it('identifies session-expiration status',()=>{const error=new ApiError('Session expired',401);expect(error.status).toBe(401);});
  it('explains a missing provider profile without treating it as a server error',()=>{render(<ErrorState error={new ApiError('Setup required',403,[],'PROVIDER_PROFILE_REQUIRED')}/>);expect(screen.getByText('Provider setup required')).toBeInTheDocument();});
  it('renders the nested participant and booking fields returned by QR validation',()=>{expect(scanResultFromValidation({participant:{id:1,full_name:'Dana Customer',phone:'+96170123456'},booking:{id:3,booking_code:'ZR-123',scheduled_at:'2026-08-02T10:00:00.000Z',offering_title:'Island tour',provider_name:'Zeere Tours'},qr_status:'VALIDATED'})).toMatchObject({success:true,participantName:'Dana Customer',bookingCode:'ZR-123',offeringTitle:'Island tour'});});
});
