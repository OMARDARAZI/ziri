import { createContext,useCallback,useContext,useEffect,useMemo,useState } from 'react';
import { useLocation } from 'react-router-dom';

import { setCsrfToken } from '../api/client';
import { toApiError } from '../api/apiError';
import { queryClient } from '../api/queryClient';
import type { User } from '../types/models';
import { currentUser,login as loginRequest,logout as logoutRequest } from './auth.api';
import type { DashboardRole,AuthState } from './auth.types';

interface AuthContextValue extends AuthState { login:(role:DashboardRole,phone:string,password:string)=>Promise<User>; logout:()=>Promise<void>; refresh:(role:DashboardRole)=>Promise<void>; }

const AuthContext=createContext<AuthContextValue|undefined>(undefined);

function routeRole(path:string):DashboardRole{return path.startsWith('/provider')?'PROVIDER':'ADMIN';}

export function AuthProvider({children}:{children:React.ReactNode}){
  const location=useLocation();
  const [state,setState]=useState<AuthState>({user:null,csrfToken:null,isLoading:true,error:null});
  const apply=useCallback((user:User|null,token:string|null)=>{setCsrfToken(token);setState({user,csrfToken:token,isLoading:false,error:null});},[]);
  const refresh=useCallback(async(role:DashboardRole)=>{
    try{const result=await currentUser(role);apply(result.user,result.csrf_token);}
    catch(error){const apiError=toApiError(error);if([401,403].includes(apiError.status||0))apply(null,null);else setState((current)=>({...current,isLoading:false,error:apiError}));}
  },[apply]);
  useEffect(()=>{void refresh(routeRole(location.pathname));},[location.pathname,refresh]);
  const login=useCallback(async(role:DashboardRole,phone:string,password:string)=>{const result=await loginRequest(role,phone,password);apply(result.user,result.csrf_token);return result.user;},[apply]);
  const logout=useCallback(async()=>{if(state.user){await logoutRequest(state.user.role as DashboardRole);}queryClient.clear();apply(null,null);},[apply,state.user]);
  const value=useMemo(()=>({...state,login,logout,refresh}),[state,login,logout,refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(){const context=useContext(AuthContext);if(!context)throw new Error('useAuth must be used inside AuthProvider');return context;}
export function useRequestedPath(){return new URLSearchParams(useLocation().search).get('from') || '/';}
