import React from 'react';
import { RefreshCw, Clock } from 'lucide-react';
import { useDashboard } from '@/hooks/useAttendance';
import { AttendanceCard } from './AttendanceCard';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { formatTime } from '@/lib/utils';
import type { TeacherStatus } from '@/types';

const STATUS_CONFIG: Record<
  TeacherStatus['status'],
  { label: string; variant: 'success' | 'danger' | 'warning' | 'default' }
> = {
  present: { label: 'Presente', variant: 'success' },
  absent: { label: 'Ausente', variant: 'danger' },
  late: { label: 'Tarde', variant: 'warning' },
  no_schedule: { label: 'Sin turno', variant: 'default' },
};

function TeacherStatusTable({ teachers }: { teachers: TeacherStatus[] }) {
  if (teachers.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-gray-400">
        No hay docentes programados para hoy.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="py-3 px-4 text-left font-medium text-gray-500">Docente</th>
            <th className="py-3 px-4 text-left font-medium text-gray-500 hidden sm:table-cell">
              Aula
            </th>
            <th className="py-3 px-4 text-left font-medium text-gray-500 hidden md:table-cell">
              Hora programada
            </th>
            <th className="py-3 px-4 text-left font-medium text-gray-500 hidden md:table-cell">
              Fichó
            </th>
            <th className="py-3 px-4 text-left font-medium text-gray-500">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {teachers.map((t) => {
            const cfg = STATUS_CONFIG[t.status] ?? { label: t.status, variant: 'default' };
            return (
              <tr key={t.teacher_id} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium text-gray-900">{t.teacher_name}</p>
                    {t.subject_name && (
                      <p className="text-xs text-gray-400 sm:hidden">{t.subject_name}</p>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 hidden sm:table-cell text-gray-600">
                  {t.classroom_name || '—'}
                  {t.subject_name && (
                    <p className="text-xs text-gray-400">{t.subject_name}</p>
                  )}
                </td>
                <td className="py-3 px-4 hidden md:table-cell text-gray-600">
                  {t.scheduled_time ? formatTime(t.scheduled_time) : '—'}
                </td>
                <td className="py-3 px-4 hidden md:table-cell text-gray-600">
                  {t.check_in_time ? (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      {formatTime(t.check_in_time)}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="py-3 px-4">
                  <Badge variant={cfg.variant}>{cfg.label}</Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function DashboardPage() {
  const { data: dashboard, isLoading, dataUpdatedAt, refetch, isFetching } = useDashboard();

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString('es-AR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <AttendanceCard
              title="Total docentes hoy"
              value={dashboard?.total_teachers ?? 0}
              icon="users"
              variant="indigo"
              description="Con turno programado"
            />
            <AttendanceCard
              title="Presentes"
              value={dashboard?.present_count ?? 0}
              icon="check"
              variant="success"
              description={
                dashboard?.total_teachers
                  ? `${Math.round(((dashboard.present_count ?? 0) / dashboard.total_teachers) * 100)}% asistencia`
                  : undefined
              }
            />
            <AttendanceCard
              title="Ausentes"
              value={dashboard?.absent_count ?? 0}
              icon="x"
              variant="danger"
            />
            <AttendanceCard
              title="Tarde"
              value={dashboard?.late_count ?? 0}
              icon="clock"
              variant="warning"
            />
          </div>

          {/* Teacher status table */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="font-semibold text-gray-900">Estado de docentes</h2>
              {lastUpdated && (
                <span className="text-xs text-gray-400">Actualizado: {lastUpdated}</span>
              )}
            </div>
            <TeacherStatusTable teachers={dashboard?.teacher_statuses ?? []} />
          </div>
        </>
      )}
    </div>
  );
}
