import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { configuracionApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import type { Configuracion } from '@/types';

const schema = z.object({
  red_wifi_campus: z.string().optional(),
  campus_radio_metros: z.coerce.number().int().min(1).max(5000),
  campus_latitud: z.string().optional(),
  campus_longitud: z.string().optional(),
  metodo_validacion_ubicacion: z.enum(['gps_o_wifi', 'solo_wifi', 'solo_gps']),
  dia_corte_mensual: z.coerce.number().int().min(1).max(31),
});

type FormData = z.infer<typeof schema>;

export default function ConfiguracionTab() {
  const qc = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ['configuracion'],
    queryFn: configuracionApi.get,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: config
      ? {
          red_wifi_campus: config.red_wifi_campus ?? '',
          campus_radio_metros: config.campus_radio_metros,
          campus_latitud: config.campus_latitud ?? '',
          campus_longitud: config.campus_longitud ?? '',
          metodo_validacion_ubicacion: config.metodo_validacion_ubicacion,
          dia_corte_mensual: config.dia_corte_mensual,
        }
      : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: (d: Partial<Configuracion>) => configuracionApi.update(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['configuracion'] });
      toast.success('Configuración actualizada');
    },
    onError: () => toast.error('Error al guardar la configuración'),
  });

  const onSubmit = (d: FormData) => {
    const payload: Partial<Configuracion> = {
      red_wifi_campus: d.red_wifi_campus || null,
      campus_radio_metros: d.campus_radio_metros,
      campus_latitud: d.campus_latitud || null,
      campus_longitud: d.campus_longitud || null,
      metodo_validacion_ubicacion: d.metodo_validacion_ubicacion,
      dia_corte_mensual: d.dia_corte_mensual,
    };
    updateMutation.mutate(payload);
  };

  if (isLoading) {
    return <div className="flex justify-center py-10"><Spinner /></div>;
  }

  return (
    <div className="max-w-xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <section className="rounded-lg border border-gray-200 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Red WiFi</h3>
          <Input
            label="SSID / CIDR de red permitida"
            placeholder="Ej: 192.168.1.0/24"
            {...register('red_wifi_campus')}
            error={errors.red_wifi_campus?.message}
            hint="Ingrese el CIDR de la red del campus (ej. 192.168.0.0/16) o déjelo en blanco para deshabilitar."
          />
        </section>

        <section className="rounded-lg border border-gray-200 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Geolocalización GPS</h3>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Latitud del campus"
              placeholder="-24.185200"
              {...register('campus_latitud')}
              error={errors.campus_latitud?.message}
            />
            <Input
              label="Longitud del campus"
              placeholder="-65.299500"
              {...register('campus_longitud')}
              error={errors.campus_longitud?.message}
            />
          </div>
          <Input
            label="Radio de tolerancia (metros)"
            type="number"
            min={1}
            max={5000}
            {...register('campus_radio_metros')}
            error={errors.campus_radio_metros?.message}
          />
        </section>

        <section className="rounded-lg border border-gray-200 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Método de validación</h3>
          <Select
            label="Método de validación de ubicación"
            {...register('metodo_validacion_ubicacion')}
            error={errors.metodo_validacion_ubicacion?.message}
            options={[
              { value: 'gps_o_wifi', label: 'GPS o WiFi (cualquiera válido)' },
              { value: 'solo_gps', label: 'Solo GPS' },
              { value: 'solo_wifi', label: 'Solo WiFi' },
            ]}
          />
        </section>

        <section className="rounded-lg border border-gray-200 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Período mensual</h3>
          <Input
            label="Día de corte mensual"
            type="number"
            min={1}
            max={31}
            {...register('dia_corte_mensual')}
            error={errors.dia_corte_mensual?.message}
            hint="El reporte mensual se cierra en este día de cada mes."
          />
        </section>

        {config && (
          <p className="text-xs text-gray-400">
            Última actualización: {new Date(config.actualizado_en).toLocaleString('es-AR')}
          </p>
        )}

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting || updateMutation.isPending || !isDirty}
          >
            Guardar cambios
          </Button>
        </div>
      </form>
    </div>
  );
}
