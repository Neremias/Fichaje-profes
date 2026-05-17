import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin,
  Wifi,
  CheckCircle2,
  XCircle,
  Loader2,
  GraduationCap,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { classroomsApi, institutionsApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useCheckIn } from '@/hooks/useAttendance';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { Classroom } from '@/types';

type ValidationStatus = 'idle' | 'checking' | 'valid' | 'invalid' | 'warning';

interface StatusIndicatorProps {
  status: ValidationStatus;
  label: string;
  message: string;
}

function StatusIndicator({ status, label, message }: StatusIndicatorProps) {
  const configs: Record<
    ValidationStatus,
    { icon: React.ReactNode; color: string; bg: string }
  > = {
    idle: {
      icon: <Loader2 className="h-5 w-5 animate-spin text-gray-400" />,
      color: 'text-gray-500',
      bg: 'bg-gray-50 border-gray-200',
    },
    checking: {
      icon: <Loader2 className="h-5 w-5 animate-spin text-yellow-500" />,
      color: 'text-yellow-700',
      bg: 'bg-yellow-50 border-yellow-200',
    },
    valid: {
      icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      color: 'text-green-700',
      bg: 'bg-green-50 border-green-200',
    },
    invalid: {
      icon: <XCircle className="h-5 w-5 text-red-500" />,
      color: 'text-red-700',
      bg: 'bg-red-50 border-red-200',
    },
    warning: {
      icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
      color: 'text-yellow-700',
      bg: 'bg-yellow-50 border-yellow-200',
    },
  };

  const config = configs[status];

  return (
    <div className={cn('flex items-center gap-3 rounded-xl border px-4 py-3', config.bg)}>
      <div className="flex-shrink-0">{config.icon}</div>
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm font-medium', config.color)}>{label}</p>
        <p className={cn('text-xs truncate', config.color, 'opacity-80')}>{message}</p>
      </div>
    </div>
  );
}

function SuccessScreen({ teacherName }: { teacherName: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-10">
      <div className="relative">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
        </div>
        <div className="absolute inset-0 rounded-full bg-green-200 animate-ping opacity-30" />
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">¡Presencia registrada!</h2>
        <p className="mt-2 text-gray-600">
          Hola, <span className="font-semibold">{teacherName}</span>
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Tu asistencia fue registrada correctamente.
        </p>
      </div>
      <div className="flex items-center gap-2 rounded-full bg-green-50 px-4 py-2">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <span className="text-sm text-green-700 font-medium">
          {new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

export default function FicharPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const institutionSlug = searchParams.get('inst') ?? '';

  const [selectedClassroom, setSelectedClassroom] = useState<number | ''>('');
  const [networkStatus, setNetworkStatus] = useState<ValidationStatus>('checking');
  const [networkMessage, setNetworkMessage] = useState('Verificando conexión...');
  const [checkInSuccess, setCheckInSuccess] = useState(false);

  const { coords, error: gpsError, isLoading: gpsLoading, locationValid, locationMessage } =
    useGeolocation(selectedClassroom ? Number(selectedClassroom) : undefined);

  const { data: institutionData } = useQuery({
    queryKey: ['institution', institutionSlug],
    queryFn: () =>
      institutionsApi
        .list()
        .then((list) => list.find((i) => i.slug === institutionSlug) ?? null),
    enabled: !!institutionSlug,
  });

  const { data: classroomsData, isLoading: classroomsLoading } = useQuery({
    queryKey: ['classrooms', institutionSlug],
    queryFn: () =>
      classroomsApi
        .list(institutionSlug ? { institution__slug: institutionSlug } : undefined)
        .then((r) => r.results),
    enabled: isAuthenticated,
  });

  const checkIn = useCheckIn();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate(`/login?next=${encodeURIComponent(`/fichar?inst=${institutionSlug}`)}`, {
        replace: true,
      });
    }
  }, [authLoading, isAuthenticated, navigate, institutionSlug]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (navigator.onLine) {
        setNetworkStatus('valid');
        setNetworkMessage('Conexión activa');
      } else {
        setNetworkStatus('invalid');
        setNetworkMessage('Sin conexión a internet');
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const gpsStatus: ValidationStatus = gpsLoading
    ? 'checking'
    : gpsError
    ? 'invalid'
    : coords === null
    ? 'idle'
    : locationValid === null
    ? 'checking'
    : locationValid
    ? 'valid'
    : 'invalid';

  const gpsMessage = gpsLoading
    ? 'Solicitando ubicación...'
    : gpsError
    ? gpsError
    : coords === null
    ? 'Esperando GPS...'
    : locationMessage || (coords ? `Precisión: ±${Math.round(coords.accuracy)}m` : '');

  const canSubmit =
    !checkIn.isPending &&
    selectedClassroom !== '' &&
    coords !== null &&
    !gpsLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !user) return;

    checkIn.mutate(
      {
        institution_slug: institutionSlug || user.institution?.slug || '',
        classroom_id: Number(selectedClassroom),
        gps_latitude: coords?.latitude,
        gps_longitude: coords?.longitude,
      },
      {
        onSuccess: (data) => {
          if (data.success) {
            setCheckInSuccess(true);
          } else {
            toast.error(data.message);
          }
        },
      }
    );
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const teacherName = user
    ? `${user.first_name} ${user.last_name}`.trim() || user.username
    : '';

  const institutionName =
    institutionData?.name ?? user?.institution?.name ?? 'Institución';

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex flex-col">
      {/* Top bar */}
      <header className="bg-indigo-700 px-5 py-4 flex items-center gap-3 shadow-md">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white leading-tight">{institutionName}</h1>
          <p className="text-xs text-indigo-200">Sistema de Fichaje Docente</p>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {checkInSuccess ? (
            <div className="rounded-2xl bg-white shadow-lg p-6">
              <SuccessScreen teacherName={teacherName} />
            </div>
          ) : (
            <>
              {/* Greeting */}
              <div className="mb-6 text-center">
                <h2 className="text-xl font-bold text-gray-900">
                  ¡Hola, {user?.first_name || 'Docente'}!
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Registrá tu asistencia seleccionando el aula
                </p>
              </div>

              {/* Validation status */}
              <div className="mb-5 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Validaciones
                  </span>
                </div>
                <StatusIndicator
                  status={gpsStatus}
                  label="Ubicación GPS"
                  message={gpsMessage}
                />
                <StatusIndicator
                  status={networkStatus}
                  label="Red"
                  message={networkMessage}
                />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="rounded-2xl bg-white shadow-lg p-5 space-y-5">
                <div className="space-y-1">
                  <label
                    htmlFor="classroom"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Aula / Sala
                  </label>
                  {classroomsLoading ? (
                    <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      <span className="text-sm text-gray-400">Cargando aulas...</span>
                    </div>
                  ) : (
                    <select
                      id="classroom"
                      value={selectedClassroom}
                      onChange={(e) => setSelectedClassroom(e.target.value === '' ? '' : Number(e.target.value))}
                      className={cn(
                        'w-full rounded-lg border px-3 py-2.5 text-sm',
                        'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
                        'transition-colors duration-150',
                        selectedClassroom === '' ? 'text-gray-400 border-gray-300' : 'text-gray-900 border-gray-300'
                      )}
                      required
                    >
                      <option value="">Seleccioná el aula</option>
                      {(classroomsData as Classroom[] ?? []).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}{c.building ? ` — ${c.building}` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {gpsError && (
                  <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-yellow-700">
                      No se pudo obtener tu ubicación. Podés registrar igualmente, pero se marcará
                      como ubicación no verificada.
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={checkIn.isPending}
                  disabled={selectedClassroom === '' || checkIn.isPending}
                  className="w-full"
                  rightIcon={!checkIn.isPending ? <ChevronRight className="h-5 w-5" /> : undefined}
                >
                  {checkIn.isPending ? 'Registrando...' : 'Registrar presencia'}
                </Button>
              </form>

              {/* Current time */}
              <p className="mt-4 text-center text-xs text-gray-400">
                {new Date().toLocaleDateString('es-AR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
