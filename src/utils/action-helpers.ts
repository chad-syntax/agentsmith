import { ActionResponse } from '@/types/action-response';

export const createSuccessResponse = <T>(data?: T, message?: string): ActionResponse<T> => ({
  success: true,
  data,
  message,
});

export const createErrorResponse = (
  message: string,
  errors?: Record<string, string[]>,
): ActionResponse => ({
  success: false,
  message,
  errors,
});
