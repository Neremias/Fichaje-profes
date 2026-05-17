export type Role = 'teacher' | 'admin';

export interface Institution {
  id: number;
  name: string;
  slug: string;
  address: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  institution: Institution | null;
  phone: string;
  dni: string;
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  career: string;
  institution: number;
  institution_name?: string;
}

export interface Classroom {
  id: number;
  name: string;
  building: string;
  institution: number;
  institution_name?: string;
  gps_latitude: number | null;
  gps_longitude: number | null;
  gps_radius_meters: number;
}

export interface Schedule {
  id: number;
  teacher: number;
  teacher_name?: string;
  subject: number;
  subject_name?: string;
  classroom: number;
  classroom_name?: string;
  day_of_week: number;
  day_name?: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  valid_from: string;
  valid_until: string;
}

export interface AttendanceRecord {
  id: number;
  teacher: number;
  teacher_name?: string;
  schedule: number | null;
  classroom_name: string;
  date: string;
  checked_in_at: string;
  gps_latitude: number | null;
  gps_longitude: number | null;
  gps_valid: boolean;
  network_valid: boolean;
  institution: number;
}

export interface CheckInPayload {
  institution_slug: string;
  classroom_id: number;
  gps_latitude?: number;
  gps_longitude?: number;
}

export interface CheckInResponse {
  success: boolean;
  message: string;
  record?: AttendanceRecord;
  validation: {
    gps_valid: boolean;
    network_valid: boolean;
    gps_message: string;
    network_message: string;
  };
}

export interface AbsenceReport {
  teacher_id: number;
  teacher_name: string;
  total_scheduled: number;
  total_present: number;
  total_absent: number;
  attendance_rate: number;
  details: AbsenceDetail[];
}

export interface AbsenceDetail {
  date: string;
  subject: string;
  classroom: string;
  start_time: string;
  end_time: string;
  present: boolean;
  checked_in_at: string | null;
  gps_valid: boolean | null;
  network_valid: boolean | null;
}

export interface DashboardSummary {
  date: string;
  total_scheduled: number;
  total_present: number;
  total_absent: number;
  teachers_present: TeacherStatus[];
}

export interface TeacherStatus {
  teacher_id: number;
  teacher_name: string;
  checked_in: boolean;
  checked_in_at: string | null;
  classroom_name: string | null;
  schedule_start: string | null;
  schedule_end: string | null;
  subject_name: string | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
