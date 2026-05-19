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
  is_active: boolean;
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
  // Extended fields used by DashboardPage
  total_teachers: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  teacher_statuses: TeacherStatus[];
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
  // Extended fields used by DashboardPage
  status: 'present' | 'absent' | 'late' | 'no_schedule';
  scheduled_time: string | null;
  check_in_time: string | null;
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

/* ── Catálogo Académico ─────────────────────────────────────────── */

export type InstitucionSlug = 'ices' | 'ucse' | 'otro_convenio';

export interface Carrera {
  id: number;
  institucion: InstitucionSlug;
  institucion_display: string;
  codigo: string;
  nombre: string;
  duracion_anios: number;
  activo: boolean;
}

export interface Materia {
  id: number;
  codigo_siu: string;
  nombre: string;
  anio: number;
  activa: boolean;
}

export interface SlotHorario {
  id: number;
  materia: number;
  materia_nombre: string;
  dia_semana: string;
  dia_semana_display: string;
  hora_inicio: string;
  hora_fin: string;
  activo: boolean;
}

/* ── Secretaría ─────────────────────────────────────────────────── */

export type RolDocente = 'titular' | 'adjunto';

export interface AsignacionDocente {
  id: number;
  docente: number;
  docente_nombre: string;
  materia: number;
  materia_nombre: string;
  rol: RolDocente;
  rol_display: string;
  activa: boolean;
  fecha_inicio: string;
  fecha_fin: string | null;
}

export interface EventoCalendario {
  id: number;
  fecha: string;
  fecha_fin: string | null;
  descripcion: string;
  creado_por: number | null;
  creado_por_nombre: string | null;
}

export interface Configuracion {
  id: number;
  dia_corte_mensual: number;
  margen_minutos_horario: number;
  red_wifi_campus: string | null;
  campus_latitud: string | null;
  campus_longitud: string | null;
  campus_radio_metros: number;
  metodo_validacion_ubicacion: 'gps_o_wifi' | 'solo_wifi' | 'solo_gps';
  metodo_validacion_display: string;
  actualizado_en: string;
  actualizado_por: number | null;
}

export interface SolicitudEmergencia {
  id: number;
  docente: number;
  docente_nombre: string;
  slot_horario: number | null;
  fecha: string;
  nota_docente: string | null;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  estado_display: string;
  nota_secretaria: string | null;
  revisado_por: number | null;
  revisado_en: string | null;
  creado_en: string;
}

/* ── QR / Fichar ─────────────────────────────────────────────────── */

export interface SlotActual {
  slot_id: number;
  materia_id: number;
  materia_nombre: string;
  materia_codigo_siu: string;
  hora_inicio: string;
  hora_fin: string;
  en_curso: boolean;
  ya_fichado: boolean;
  tiene_salida: boolean;
}

export interface SlotActualResponse {
  fecha: string;
  slots: SlotActual[];
}

export type TipoClase = 'presencial' | 'virtual_sincronica' | 'asincronica';

export interface FicharPayload {
  slot_id?: number;
  tipo_clase: TipoClase;
  latitud?: number | null;
  longitud?: number | null;
  nota?: string;
}

export interface FicharResponse {
  detail: string;
  tipo_scan: 'entrada' | 'salida';
  ubicacion_validada: boolean | null;
  registro: {
    id: number;
    fecha: string;
    hora_entrada: string;
    hora_salida: string | null;
    tipo_clase: string;
    ubicacion_validada: boolean | null;
  };
}
