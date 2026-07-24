import { Navigate,useLocation } from 'react-router-dom';

import { ErrorState,LoadingState } from '../components/common/States';
import { useAuth } from './AuthProvider';
import type { DashboardRole } from './auth.types';

export function PublicOnlyRoute({children}:{children:React.ReactNode}){const {user,isLoading,error,refresh}=useAuth();const location=useLocation();const role:DashboardRole=location.pathname.startsWith('/provider')?'PROVIDER':'ADMIN';if(isLoading)return <LoadingState/>;if(error&&!user)return <ErrorState error={error} retry={()=>void refresh(role)}/>;if(user)return <Navigate to={user.role==='ADMIN'?'/admin/dashboard':'/provider/dashboard'} replace/>;return <>{children}</>;}
