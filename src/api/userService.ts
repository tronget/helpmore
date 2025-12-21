import { requestJson } from './http';
import { USER_SERVICE_BASE_URL } from './config';

export type UserRole = 'user' | 'moderator' | 'admin';

export interface UserProfileResponse {
  name: string;
  surname: string;
  middleName: string | null;
  avatar: string | null;
  faculty: string | null;
  phoneNumber: string | null;
  telegram: string | null;
  rate: number;
}

export interface UserResponse {
  id: number;
  email: string;
  role: UserRole;
  bannedTill: string | null;
  createdAt: string;
  profile: UserProfileResponse | null;
}

export interface UserProfileRequest {
  name: string;
  surname: string;
  middleName?: string | null;
  avatar?: string | null;
  faculty?: string | null;
  phoneNumber?: string | null;
  telegram?: string | null;
}

export interface UserRoleUpdateRequest {
  role: UserRole;
}

export interface UserBanRequest {
  bannedTill: string | null;
}

export interface UserUpdateRateRequest {
  userId: number;
  newMark: number;
}

export type ReportType = 'spam' | 'fraud' | 'insult' | 'illegal' | 'other';

export interface ReportCreateRequest {
  reportedUserId: number;
  type: ReportType;
  title: string;
  description?: string | null;
}

export interface ReportUpdateRequest {
  type?: ReportType | null;
  title?: string | null;
  description?: string | null;
}

export interface ReportResponse {
  id: number;
  userId: number;
  reporterName?: string | null;
  reportedUserId: number;
  reportedName?: string | null;
  type: ReportType;
  title: string;
  description: string | null;
  createdAt: string;
}

export interface BugReportCreateRequest {
  title: string;
  description?: string | null;
}

export interface BugReportUpdateRequest {
  title?: string | null;
  description?: string | null;
}

export interface BugReportResponse {
  id: number;
  userId: number;
  userName: string | null;
  userSurname: string | null;
  title: string;
  description: string | null;
  createdAt: string;
}

const withAuth = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export const loginWithYandex = async (token: string) => {
  await requestJson<string>(`${USER_SERVICE_BASE_URL}/auth/yandex`, {
    method: 'POST',
    body: { token },
  });
};

export const checkAuth = async (token: string) => {
  await requestJson<void>(`${USER_SERVICE_BASE_URL}/auth/check`, {
    headers: withAuth(token),
  });
};


export const listUsers = async (token: string) =>
  requestJson<UserResponse[]>(`${USER_SERVICE_BASE_URL}/users`, {
    headers: withAuth(token),
  });

export const getUserById = async (token: string, userId: number) =>
  requestJson<UserResponse>(`${USER_SERVICE_BASE_URL}/users/${userId}`, {
    headers: withAuth(token),
  });

export const updateUserProfile = async (
  token: string,
  userId: number,
  profile: UserProfileRequest,
) =>
  requestJson<UserResponse>(`${USER_SERVICE_BASE_URL}/users/${userId}/profile`, {
    method: 'PATCH',
    headers: withAuth(token),
    body: profile,
  });

export const getCurrentUser = async (token: string) =>
  requestJson<UserResponse>(`${USER_SERVICE_BASE_URL}/users/me`, {
    headers: withAuth(token),
  });

export const updateUserRole = async (
  token: string,
  userId: number,
  payload: UserRoleUpdateRequest,
) =>
  requestJson<UserResponse>(`${USER_SERVICE_BASE_URL}/users/${userId}/role`, {
    method: 'PATCH',
    headers: withAuth(token),
    body: payload,
  });

export const updateUserBan = async (
  token: string,
  userId: number,
  payload: UserBanRequest,
) =>
  requestJson<UserResponse>(`${USER_SERVICE_BASE_URL}/users/${userId}/ban`, {
    method: 'PATCH',
    headers: withAuth(token),
    body: payload,
  });

export const deleteUser = async (token: string, userId: number) =>
  requestJson<void>(`${USER_SERVICE_BASE_URL}/users/${userId}`, {
    method: 'DELETE',
    headers: withAuth(token),
  });

export const updateUserRate = async (token: string, payload: UserUpdateRateRequest) =>
  requestJson<void>(`${USER_SERVICE_BASE_URL}/users/rate`, {
    method: 'POST',
    headers: withAuth(token),
    body: payload,
  });

export const findUserByEmail = async (token: string, email: string) => {
  const users = await listUsers(token);
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
};

export const createReport = async (token: string, payload: ReportCreateRequest) =>
  requestJson<ReportResponse>(`${USER_SERVICE_BASE_URL}/reports`, {
    method: 'POST',
    headers: withAuth(token),
    body: payload,
  });

export const updateReport = async (
  token: string,
  reportId: number,
  payload: ReportUpdateRequest,
) =>
  requestJson<ReportResponse>(`${USER_SERVICE_BASE_URL}/reports/${reportId}`, {
    method: 'PATCH',
    headers: withAuth(token),
    body: payload,
  });

export const deleteReport = async (token: string, reportId: number) =>
  requestJson<void>(`${USER_SERVICE_BASE_URL}/reports/${reportId}`, {
    method: 'DELETE',
    headers: withAuth(token),
  });

export const getMyReports = async (token: string) =>
  requestJson<ReportResponse[]>(`${USER_SERVICE_BASE_URL}/reports/me`, {
    headers: withAuth(token),
  });

export const getAllReports = async (token: string) =>
  requestJson<ReportResponse[]>(`${USER_SERVICE_BASE_URL}/reports`, {
    headers: withAuth(token),
  });

export const createBugReport = async (token: string, payload: BugReportCreateRequest) =>
  requestJson<BugReportResponse>(`${USER_SERVICE_BASE_URL}/bug-reports`, {
    method: 'POST',
    headers: withAuth(token),
    body: payload,
  });

export const updateBugReport = async (
  token: string,
  reportId: number,
  payload: BugReportUpdateRequest,
) =>
  requestJson<BugReportResponse>(`${USER_SERVICE_BASE_URL}/bug-reports/${reportId}`, {
    method: 'PATCH',
    headers: withAuth(token),
    body: payload,
  });

export const deleteBugReport = async (token: string, reportId: number) =>
  requestJson<void>(`${USER_SERVICE_BASE_URL}/bug-reports/${reportId}`, {
    method: 'DELETE',
    headers: withAuth(token),
  });

export const getBugReports = async (token: string) =>
  requestJson<BugReportResponse[]>(`${USER_SERVICE_BASE_URL}/bug-reports`, {
    headers: withAuth(token),
  });

export const getMyBugReports = async (token: string) =>
  requestJson<BugReportResponse[]>(`${USER_SERVICE_BASE_URL}/bug-reports/me`, {
    headers: withAuth(token),
  });
