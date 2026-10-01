import { apiClient } from '@/lib/api/client';
import type {
  SendOtpPayload,
  VerifyOtpPayload,
  VerifyOtpResponse,
  RegisterCompletePayload,
  AuthContext,
  User,
} from '@/types/auth';

export const authApi = {
  sendOtp: (payload: SendOtpPayload) =>
    apiClient.post<{ channels: string[] }>('/auth/otp/send-unified', payload, {
      skipAuth: true,
    }),

  verifyOtp: (payload: VerifyOtpPayload) =>
    apiClient.post<VerifyOtpResponse>(
      '/auth/otp/verify-unified',
      { ...payload, isMobile: false },
      { skipAuth: true }
    ),

  registerComplete: (payload: RegisterCompletePayload) =>
    apiClient.post<{ user: User; token: string }>(
      '/auth/register-complete',
      payload,
      { skipAuth: true }
    ),

  getMe: () => apiClient.get<AuthContext>('/auth/me'),

  updateProfile: (data: Partial<User>) =>
    apiClient.put<{ user: User }>('/auth/me', data),
};
