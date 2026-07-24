import { Navigate,useLocation } from 'react-router-dom';

import { ErrorState,LoadingState } from '../components/common/States';
import { useAuth } from './AuthProvider';
import type { DashboardRole } from './auth.types';

export function RequireAuthentication({role,children}:{role:DashboardRole;children:React.ReactNode}){const {user,isLoading,error,refresh}=useAuth();const location=useLocation();if(isLoading)return <LoadingState/>;if(error&&!user)return <ErrorState error={error} retry={()=>void refresh(role)}/>;if(!user)return <Navigate to={`/${role==='ADMIN'?'admin':'provider'}/login?from=${encodeURIComponent(location.pathname+location.search)}`} replace/>;if(user.role!==role)return <Navigate to="/unauthorized" replace/>;return <>{children}</>;}
