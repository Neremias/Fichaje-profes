import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, CalendarDays } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { calendarioApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import type { EventoCalendario } from '@/types';

const schema = z
  .object({
    fecha: z.string().min(1, 'Requerido'),
    fecha_fin: z.string().optional(),
    descripcion: z.string().min(1, 'Requerido').max(200),
  })
  .refine(
    (d) => !d.fecha_fin || d.fecha_fin >= d.fecha,
    { message: 'La fecha fin no puede ser anterior a la fecha inicio', path: ['fecha_fin'] }
  );

type FormData = z.infer<typeof schema>;

export default function CalendarioTab() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EventoCalendario | null>(null);

  const { data: eventos = [], isLoading } = useQuery({
    queryKey: ['calendario'],
    queryFn: () => calendarioApi.list(),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const createMutation = useMutation({
    mutationFn: (d: FormData) =>
      calendarioApi.create({ ...d, fecha_fin: d.fecha_fin || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendario'] });
      toast.success('Evento creado');
      setModalOpen(false);
      reset();
    },
    onError: () => toast.error('Error al crear el evento'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => calendarioApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendario'] });
      toast.success('Evento eliminado');
      setDeleteTarget(null);
    },
    onError: () => toast.error('Error al eliminar'),
  });

  const openCreate = () => {
    reset({ fecha: new Date().toISOString().slice(0, 10) });
    setModalOpen(true);
  };

  const formatRange = (e: EventoCalendario) =>
    e.fecha_fin && e.fecha_fin !== e.fecha ? `${e.fecha} → ${e.fecha_fin}` : e.fecha;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Nuevo evento
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : eventos.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p>No hay eventos en el calendario.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Rango de fechas', 'Descripción', 'Creado por', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {eventos.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-gray-700">{formatRange(e)}</td>
                  <td className="px-4 py-3 text-gray-900">{e.descripcion}</td>
                  <td className="px-4 py-3 text-gray-500">{e.creado_por_nombre ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setDeleteTarget(e)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo Evento de Calendario" size="md">
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Fecha inicio"
              type="date"
              {...register('fecha')}
              error={errors.fecha?.message}
            />
            <Input
              label="Fecha fin (opcional)"
              type="date"
              {...register('fecha_fin')}
              error={errors.fecha_fin?.message}
            />
          </div>
          <Input
            label="Descripción"
            placeholder="Ej: Feriado nacional, Receso invernal…"
            {...register('descripcion')}
            error={errors.descripcion?.message}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || createMutation.isPending}>
              Guardar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Eliminar evento" size="sm">
        <p className="text-sm text-gray-600 mb-4">
          ¿Eliminar el evento <strong>"{deleteTarget?.descripcion}"</strong>?
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
          <Button
            variant="danger"
            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            disabled={deleteMutation.isPending}
          >
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
