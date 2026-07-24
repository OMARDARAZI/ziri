import { QueryClient } from '@tanstack/react-query'; import { ApiError } from './apiError';
export const queryClient=new QueryClient({defaultOptions:{queries:{retry:(count,error)=>!(error instanceof ApiError&&error.status!==undefined&&error.status>=400&&error.status<500)&&count<2,staleTime:15000,refetchOnWindowFocus:false},mutations:{retry:false}}});
