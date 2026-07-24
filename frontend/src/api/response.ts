import type { AxiosResponse } from 'axios'; import type { ApiFailure,ApiSuccess } from '../types/api'; import { ApiError } from './apiError';
export function dataOf<T>(response:AxiosResponse<unknown>):ApiSuccess<T>{const body=response.data as ApiSuccess<T>|ApiFailure;if(!body.success)throw new ApiError(body.message,400,body.errors || [],body.code);return body;}
