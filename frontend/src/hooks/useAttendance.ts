import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '@/lib/api';
import type { CheckInPayload } from '@/types';
import toast from 'react-hot-toast';

export function useDashboard(date?: string) {
  return useQuery({
    queryKey: ['dashboard', date],
    queryFn: () => attendanceApi.dashboard(date),
    refetchInterval: 60_000,
  });
}

export function useAttendanceRecords(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['attendance-records', params],
    queryFn: () => attendanceApi.records(params),
  });
}

export function useAttendanceReport(params: {
  start_date: string;
  end_date: string;
  teacher_id?: number;
  institution_id?: number;
} | null) {
  return useQuery({
    queryKey: ['attendance-report', params],
    queryFn: () => attendanceApi.report(params!),
    enabled: !!params,
  });
}

export function useCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CheckInPayload) => attendanceApi.checkIn(payload),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message || '¡Presencia registrada!');
        qc.invalidateQueries({ queryKey: ['dashboard'] });
      } else {
        toast.error(data.message || 'No se pudo registrar la presencia');
      }
    },
    onError: () => {
      toast.error('Error al registrar la presencia. Intente nuevamente.');
    },
  });
}
