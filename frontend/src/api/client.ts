import axios from 'axios'; import { env } from './env'; import { ApiError } from './apiError';
export const api = axios.create({baseURL:env.apiBaseUrl,withCredentials:true,timeout:15000,headers:{Accept:'application/json'}});
let csrfToken:string | null = null;
export function setCsrfToken(token:string | null){csrfToken=token;}
api.interceptors.request.use((config)=>{if(csrfToken && !['get','head','options'].includes(config.method || 'get')) config.headers.set('X-CSRF-Token',csrfToken); return config;});
api.interceptors.response.use((response)=>{if(env.logging) console.info(`${response.config.method?.toUpperCase()} ${response.config.url}`,response.status);return response;},(error)=>{const body=error.response?.data as {message?:string;code?:string;errors?:{field:string;message:string}[]}|undefined;return Promise.reject(new ApiError(body?.message || error.message || 'Network request failed',error.response?.status,body?.errors || [],body?.code));});
