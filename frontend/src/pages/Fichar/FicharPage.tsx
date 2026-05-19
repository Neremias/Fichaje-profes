import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MapPin,
  CheckCircle2,
  XCircle,
  Loader2,
  GraduationCap,
  BookOpen,
  ChevronRight,
  AlertTriangle,
  Clock,
  LogIn,
  LogOut,
  WifiOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ficharApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { SlotActual, TipoClase } from '@/types';

/* ── Types ──────────────────────────────────────────────────────── */

type GpsStatus = 'idle' | 'checking' | 'ok' | 'error';

interface GpsState {
  status: GpsStatus;
  coords: GeolocationCoordinates | null;
  message: string;
}

type ScanType = 'entrada' | 'salida';

interface SuccessData {
  materia: string;
  tipo_scan: ScanType;
  ubicacion_validada: boolean | null;
}

/* ── Helpers ────────────────────────────────────────────────────── */

function slotScanState(slot: SlotActual): 'pendiente_entrada' | 'pendiente_salida' | 'completo' {
  if (!slot.ya_fichado) return 'pendiente_entrada';
  if (!slot.tiene_salida) return 'pendiente_salida';
  return 'completo';
}

function isVirtual(tipo: TipoClase) {
  return tipo === 'asincronica' || tipo === 'virtual_sincronica';
}

/* ── Sub-components ─────────────────────────────────────────────── */

function StatusRow({
  icon,
  label,
  message,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  message: string;
  color: string;
}) {
  return (
    <div className={cn('flex items-center gap-3 rounded-xl border px-4 py-3', color)}>
      <div className="flex-shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs opacity-80 truncate">{message}</p>
      </div>
    </div>
  );
}

function SlotCard({
  slot,
  selected,
  onSelect,
}: {
  slot: SlotActual;
  selected: boolean;
  onSelect: () => void;
}) {
  const scanState = slotScanState(slot);
  const isComplete = scanState === 'completo';

  return (
    <button
      type="button"
      disabled={isComplete}
      onClick={onSelect}
      className={cn(
        'w-full text-left rounded-xl border-2 p-4 transition-all',
        isComplete
          ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
          : selected
          ? 'border-indigo-500 bg-indigo-50 shadow-sm'
          : slot.en_curso
          ? 'border-indigo-300 bg-white hover:border-indigo-500'
          : 'border-gray-200 bg-white hover:border-gray-300',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
            selected ? 'bg-indigo-100' : slot.en_curso ? 'bg-indigo-50' : 'bg-gray-100',
          )}
        >
          <BookOpen
            className={cn(
              'h-4 w-4',
              selected || slot.en_curso ? 'text-indigo-600' : 'text-gray-500',
            )}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('font-semibold text-sm', selected || slot.en_curso ? 'text-indigo-900' : 'text-gray-800')}>
            {slot.materia_nombre}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {slot.materia_codigo_siu} &bull;{' '}
            <Clock className="inline h-3 w-3 mb-0.5" /> {slot.hora_inicio}–{slot.hora_fin}
          </p>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1">
          {slot.en_curso && !isComplete && (
            <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide">
              En curso
            </span>
          )}
          {scanState === 'pendiente_salida' && (
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide">
              Falta salida
            </span>
          )}
          {isComplete && (
            <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" /> Completo
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function SuccessScreen({
  teacherName,
  data,
  onReset,
}: {
  teacherName: string;
  data: SuccessData;
  onReset: () => void;
}) {
  const isExit = data.tipo_scan === 'salida';
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-6">
      <div className="relative">
        <div
          className={cn(
            'flex h-24 w-24 items-center justify-center rounded-full',
            isExit ? 'bg-amber-100' : 'bg-green-100',
          )}
        >
          {isExit ? (
            <LogOut className="h-12 w-12 text-amber-500" />
          ) : (
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          )}
        </div>
        <div
          className={cn(
            'absolute inset-0 rounded-full animate-ping opacity-20',
            isExit ? 'bg-amber-200' : 'bg-green-200',
          )}
        />
      </div>
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold text-gray-900">Escaneo exitoso</h2>
        <p className={cn('font-semibold', isExit ? 'text-amber-700' : 'text-green-700')}>
          {isExit ? 'Salida registrada' : 'Entrada registrada'}
        </p>
        <p className="text-gray-600 text-sm">
          Hola, <span className="font-semibold">{teacherName}</span>
        </p>
        <p className="text-sm text-indigo-700 font-medium">{data.materia}</p>
        <p className="text-xs text-gray-400">
          {new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
        </p>
        {data.ubicacion_validada === false && (
          <p className="text-xs text-amber-600 mt-2 flex items-center justify-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            Ubicación no validada — registrado igualmente
          </p>
        )}
        {data.ubicacion_validada === null && (
          <p className="text-xs text-gray-400 mt-2 flex items-center justify-center gap-1">
            <WifiOff className="h-3.5 w-3.5" />
            Clase virtual — ubicación no requerida
          </p>
        )}
      </div>
      <Button variant="outline" size="sm" onClick={onReset}>
        Registrar otro
      </Button>
    </div>
  );
}

/* ── Constants ──────────────────────────────────────────────────── */

const TIPO_CLASE_OPTIONS: { value: TipoClase; label: string }[] = [
  { value: 'presencial', label: 'Presencial' },
  { value: 'virtual_sincronica', label: 'Virtual sincrónica' },
  { value: 'asincronica', label: 'Asincrónica' },
];

/* ── Main Page ───────────────────────────────────────────────────── */

export default function FicharPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [gps, setGps] = useState<GpsState>({ status: 'idle', coords: null, message: '' });
  const [tipoClase, setTipoClase] = useState<TipoClase>('presencial');
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [successData, setSuccessData] = useState<SuccessData | null>(null);

  const watchIdRef = useRef<number | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate(`/login?next=${encodeURIComponent('/fichar')}`, { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // GPS watch — only for non-virtual (Req 5)
  useEffect(() => {
    if (!isAuthenticated || isVirtual(tipoClase)) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (isVirtual(tipoClase)) {
        setGps({ status: 'idle', coords: null, message: 'No requerida para clase virtual' });
      }
      return;
    }
    if (!('geolocation' in navigator)) {
      setGps({ status: 'error', coords: null, message: 'GPS no disponible en este dispositivo' });
      return;
    }
    setGps({ status: 'checking', coords: null, message: 'Solicitando ubicación…' });
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setGps({
          status: 'ok',
          coords: pos.coords,
          message: `Precisión: ±${Math.round(pos.coords.accuracy)} m`,
        });
      },
      (err) => {
        setGps({
          status: 'error',
          coords: null,
          message:
            err.code === err.PERMISSION_DENIED
              ? 'Permiso de ubicación denegado'
              : 'No se pudo obtener la ubicación',
        });
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
    );
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isAuthenticated, tipoClase]);

  // Fetch current slots
  const { data: slotData, isLoading: slotsLoading, error: slotsError } = useQuery({
    queryKey: ['slot-actual'],
    queryFn: ficharApi.slotActual,
    enabled: isAuthenticated,
    retry: 1,
    refetchInterval: 60_000,
  });

  // Auto-select first actionable slot
  useEffect(() => {
    const slots = slotData?.slots ?? [];
    if (selectedSlotId !== null) return;
    const first =
      slots.find((s) => s.en_curso && slotScanState(s) !== 'completo') ??
      slots.find((s) => slotScanState(s) !== 'completo');
    if (first) setSelectedSlotId(first.slot_id);
  }, [slotData, selectedSlotId]);

  const ficharMutation = useMutation({
    mutationFn: ficharApi.fichar,
    onSuccess: (data) => {
      const materia =
        slotData?.slots.find((s) => s.slot_id === selectedSlotId)?.materia_nombre ?? 'Materia';
      setSuccessData({ materia, tipo_scan: data.tipo_scan, ubicacion_validada: data.ubicacion_validada });
      // Req 3: success notification
      toast.success(data.detail);
      queryClient.invalidateQueries({ queryKey: ['slot-actual'] });
    },
    onError: (err: unknown) => {
      // Req 4: specific rejection reason
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Error al registrar la asistencia';
      toast.error(detail, { duration: 6000 });
    },
  });

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

  const slots = slotData?.slots ?? [];
  const selectedSlot = slots.find((s) => s.slot_id === selectedSlotId) ?? null;
  const scanState = selectedSlot ? slotScanState(selectedSlot) : null;
  const canSubmit =
    !ficharMutation.isPending && !!selectedSlot && scanState !== 'completo';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;
    ficharMutation.mutate({
      slot_id: selectedSlot.slot_id,
      tipo_clase: tipoClase,
      latitud: !isVirtual(tipoClase) ? (gps.coords?.latitude ?? null) : null,
      longitud: !isVirtual(tipoClase) ? (gps.coords?.longitude ?? null) : null,
    });
  };

  const gpsConfig = {
    idle:     { icon: <Loader2 className="h-5 w-5 animate-spin text-gray-400" />,    color: 'bg-gray-50  border-gray-200  text-gray-600' },
    checking: { icon: <Loader2 className="h-5 w-5 animate-spin text-yellow-500" />,  color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
    ok:       { icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,            color: 'bg-green-50  border-green-200  text-green-700' },
    error:    { icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,           color: 'bg-amber-50  border-amber-200  text-amber-700' },
  }[gps.status];

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex flex-col">
      {/* Header */}
      <header className="bg-indigo-700 px-5 py-4 flex items-center gap-3 shadow-md">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white leading-tight">Fichaje Docente</h1>
          <p className="text-xs text-indigo-200">Registro de asistencia</p>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {successData ? (
            <div className="rounded-2xl bg-white shadow-lg p-6">
              <SuccessScreen
                teacherName={teacherName}
                data={successData}
                onReset={() => {
                  setSuccessData(null);
                  setSelectedSlotId(null);
                  queryClient.invalidateQueries({ queryKey: ['slot-actual'] });
                }}
              />
            </div>
          ) : (
            <>
              {/* Greeting */}
              <div className="mb-5 text-center">
                <h2 className="text-xl font-bold text-gray-900">
                  ¡Hola, {user?.first_name || 'Docente'}!
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date().toLocaleDateString('es-AR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </p>
              </div>

              {/* GPS status — hidden for virtual (Req 5) */}
              {!isVirtual(tipoClase) && (
                <div className="mb-4">
                  <StatusRow
                    icon={gpsConfig.icon}
                    label="Ubicación GPS"
                    message={gps.message || 'Iniciando…'}
                    color={gpsConfig.color}
                  />
                </div>
              )}

              {/* Slots list */}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Materias en horario
                  </span>
                </div>

                {slotsLoading ? (
                  <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    <span className="text-sm text-gray-500">Consultando horario vigente…</span>
                  </div>
                ) : slotsError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-2 text-red-700 text-sm">
                    <XCircle className="h-4 w-4 shrink-0" />
                    No se pudo obtener el horario
                  </div>
                ) : slots.length === 0 ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center gap-2 text-amber-700 text-sm">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    No tiene materias asignadas en este horario
                  </div>
                ) : (
                  <div className="space-y-2">
                    {slots.map((s) => (
                      <SlotCard
                        key={s.slot_id}
                        slot={s}
                        selected={selectedSlotId === s.slot_id}
                        onSelect={() => setSelectedSlotId(s.slot_id)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Registration form */}
              {selectedSlot && scanState !== 'completo' && (
                <form onSubmit={handleSubmit} className="rounded-2xl bg-white shadow-lg p-5 space-y-4">
                  {/* Req 5: tipo clase selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Modalidad de clase
                    </label>
                    <select
                      value={tipoClase}
                      onChange={(e) => setTipoClase(e.target.value as TipoClase)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {TIPO_CLASE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    {isVirtual(tipoClase) && (
                      <p className="mt-1.5 text-xs text-indigo-600 flex items-center gap-1">
                        <WifiOff className="h-3.5 w-3.5" />
                        Clase virtual — no se requiere validación de ubicación
                      </p>
                    )}
                  </div>

                  {/* GPS warning for presencial without location (Req 4) */}
                  {!isVirtual(tipoClase) && gps.status === 'error' && (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      <p className="text-xs text-amber-700">
                        Sin GPS — se registrará igualmente como ubicación no verificada.
                      </p>
                    </div>
                  )}

                  {/* Submit button — shows entrada or salida (Req 2) */}
                  <Button
                    type="submit"
                    size="lg"
                    isLoading={ficharMutation.isPending}
                    disabled={!canSubmit}
                    className="w-full"
                    rightIcon={
                      !ficharMutation.isPending
                        ? scanState === 'pendiente_salida'
                          ? <LogOut className="h-5 w-5" />
                          : <LogIn className="h-5 w-5" />
                        : undefined
                    }
                  >
                    {ficharMutation.isPending
                      ? 'Registrando…'
                      : scanState === 'pendiente_salida'
                      ? 'Registrar salida'
                      : 'Registrar entrada'}
                  </Button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
