import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  AuthTokens,
  LoginCredentials,
  User,
  Classroom,
  Schedule,
  Subject,
  AttendanceRecord,
  CheckInPayload,
  CheckInResponse,
  DashboardSummary,
  AbsenceReport,
  PaginatedResponse,
  Carrera,
  Materia,
  SlotHorario,
} from '@/types';

const BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const access = localStorage.getItem('access_token');
  if (access && config.headers) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token!);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refresh = localStorage.getItem('refresh_token');
      if (!refresh) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post<{ access: string }>(`${BASE_URL}/api/auth/token/refresh/`, {
          refresh,
        });
        localStorage.setItem('access_token', data.access);
        processQueue(null, data.access);
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  login: (credentials: LoginCredentials) =>
    api.post<AuthTokens>('/api/auth/token/', credentials).then((r) => r.data),

  refresh: (refresh: string) =>
    api.post<{ access: string }>('/api/auth/token/refresh/', { refresh }).then((r) => r.data),

  me: () => api.get<User>('/api/auth/me/').then((r) => r.data),
};

export const teachersApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    api.get<PaginatedResponse<User>>('/api/teachers/', { params }).then((r) => r.data),

  get: (id: number) => api.get<User>(`/api/teachers/${id}/`).then((r) => r.data),

  create: (data: Record<string, unknown>) =>
    api.post<User>('/api/teachers/', data).then((r) => r.data),

  update: (id: number, data: Record<string, unknown>) =>
    api.patch<User>(`/api/teachers/${id}/`, data).then((r) => r.data),

  remove: (id: number) => api.delete(`/api/teachers/${id}/`),
  /** Alias for remove */
  delete: (id: number) => api.delete(`/api/teachers/${id}/`),
};

export const classroomsApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    api.get<PaginatedResponse<Classroom>>('/api/classrooms/', { params }).then((r) => r.data),

  get: (id: number) => api.get<Classroom>(`/api/classrooms/${id}/`).then((r) => r.data),

  create: (data: Partial<Classroom>) =>
    api.post<Classroom>('/api/classrooms/', data).then((r) => r.data),

  update: (id: number, data: Partial<Classroom>) =>
    api.patch<Classroom>(`/api/classrooms/${id}/`, data).then((r) => r.data),

  remove: (id: number) => api.delete(`/api/classrooms/${id}/`),
  delete: (id: number) => api.delete(`/api/classrooms/${id}/`),

  listAll: () =>
    api.get<Classroom[]>('/api/classrooms/all/').then((r) => r.data),
};

export const subjectsApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    api.get<PaginatedResponse<Subject>>('/api/subjects/', { params }).then((r) => r.data),

  get: (id: number) => api.get<Subject>(`/api/subjects/${id}/`).then((r) => r.data),

  create: (data: Partial<Subject>) =>
    api.post<Subject>('/api/subjects/', data).then((r) => r.data),

  update: (id: number, data: Partial<Subject>) =>
    api.patch<Subject>(`/api/subjects/${id}/`, data).then((r) => r.data),

  remove: (id: number) => api.delete(`/api/subjects/${id}/`),
  delete: (id: number) => api.delete(`/api/subjects/${id}/`),
};

export const schedulesApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    api.get<PaginatedResponse<Schedule>>('/api/schedules/', { params }).then((r) => r.data),

  get: (id: number) => api.get<Schedule>(`/api/schedules/${id}/`).then((r) => r.data),

  create: (data: Record<string, unknown>) =>
    api.post<Schedule>('/api/schedules/', data).then((r) => r.data),

  update: (id: number, data: Record<string, unknown>) =>
    api.patch<Schedule>(`/api/schedules/${id}/`, data).then((r) => r.data),

  remove: (id: number) => api.delete(`/api/schedules/${id}/`),
  delete: (id: number) => api.delete(`/api/schedules/${id}/`),
};

export const attendanceApi = {
  checkIn: (payload: CheckInPayload) =>
    api.post<CheckInResponse>('/api/attendance/check-in/', payload).then((r) => r.data),

  records: (params?: Record<string, string>) =>
    api.get<PaginatedResponse<AttendanceRecord>>('/api/attendance/records/', { params }).then((r) => r.data),

  dashboard: (date?: string) =>
    api.get<DashboardSummary>('/api/attendance/dashboard/', { params: date ? { date } : {} }).then((r) => r.data),

  report: (params: Record<string, unknown>) =>
    api.get<AbsenceReport[]>('/api/attendance/report/', { params }).then((r) => r.data),

  /** Alias for report — accepts date_from/date_to/teacher_id/status */
  getReport: (params: Record<string, unknown>) =>
    api.get<AbsenceReport[]>('/api/attendance/report/', { params }).then((r) => r.data),

  validateLocation: (lat: number, lng: number, classroomId?: number) =>
    api
      .post<{ valid: boolean; message: string }>('/api/attendance/validate-location/', {
        latitude: lat,
        longitude: lng,
        classroom_id: classroomId,
      })
      .then((r) => r.data),

  exportCsv: (params: Record<string, unknown>) =>
    api.get('/api/attendance/export/csv/', { params, responseType: 'blob' }).then((r) => r.data),

  exportXlsx: (params: Record<string, unknown>) =>
    api.get('/api/attendance/export/xlsx/', { params, responseType: 'blob' }).then((r) => r.data),

  /** Generic export — delegates to exportCsv or exportXlsx */
  export: (format: 'csv' | 'xlsx', params: Record<string, unknown>) =>
    format === 'csv'
      ? api.get('/api/attendance/export/csv/', { params, responseType: 'blob' }).then((r) => r.data)
      : api.get('/api/attendance/export/xlsx/', { params, responseType: 'blob' }).then((r) => r.data),
};

export const institutionsApi = {
  list: () => api.get<{ id: number; name: string; slug: string; address: string }[]>('/api/institutions/').then((r) => r.data),
};

export const carrerasApi = {
  list: (params?: Record<string, string | number | boolean | undefined>) =>
    api.get<Carrera[]>('/api/carreras/', { params }).then((r) => r.data),

  get: (id: number) => api.get<Carrera>(`/api/carreras/${id}/`).then((r) => r.data),

  create: (data: Partial<Carrera>) =>
    api.post<Carrera>('/api/carreras/', data).then((r) => r.data),

  update: (id: number, data: Partial<Carrera>) =>
    api.patch<Carrera>(`/api/carreras/${id}/`, data).then((r) => r.data),

  remove: (id: number) => api.delete(`/api/carreras/${id}/`),
};

export const materiasApi = {
  list: (params?: Record<string, string | number | boolean | undefined>) =>
    api.get<Materia[]>('/api/materias/', { params }).then((r) => r.data),

  get: (id: number) => api.get<Materia>(`/api/materias/${id}/`).then((r) => r.data),

  create: (data: Partial<Materia>) =>
    api.post<Materia>('/api/materias/', data).then((r) => r.data),

  update: (id: number, data: Partial<Materia>) =>
    api.patch<Materia>(`/api/materias/${id}/`, data).then((r) => r.data),

  remove: (id: number) => api.delete(`/api/materias/${id}/`),
};

export const slotsApi = {
  list: (params?: Record<string, string | number | boolean | undefined>) =>
    api.get<SlotHorario[]>('/api/slots/', { params }).then((r) => r.data),

  get: (id: number) => api.get<SlotHorario>(`/api/slots/${id}/`).then((r) => r.data),

  create: (data: Partial<SlotHorario>) =>
    api.post<SlotHorario>('/api/slots/', data).then((r) => r.data),

  update: (id: number, data: Partial<SlotHorario>) =>
    api.patch<SlotHorario>(`/api/slots/${id}/`, data).then((r) => r.data),

  remove: (id: number) => api.delete(`/api/slots/${id}/`),
};
