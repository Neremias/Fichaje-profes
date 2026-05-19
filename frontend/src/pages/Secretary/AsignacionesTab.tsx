import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { asignacionesApi, materiasApi, teachersApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Select } from '@/components/ui/Select';
import type { AsignacionDocente } from '@/types';

const schema = z.object({
  docente: z.coerce.number().min(1, 'Requerido'),
  materia: z.coerce.number().min(1, 'Requerido'),
  rol: z.enum(['titular', 'adjunto']),
  fecha_inicio: z.string().min(1, 'Requerido'),
  fecha_fin: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function AsignacionesTab() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AsignacionDocente | null>(null);

  const { data: asignaciones = [], isLoading } = useQuery({
    queryKey: ['asignaciones'],
    queryFn: () => asignacionesApi.list(),
  });

  const { data: materias = [] } = useQuery({
    queryKey: ['materias'],
    queryFn: () => materiasApi.list(),
  });

  const { data: docentesData } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => teachersApi.list({ page_size: 200 }),
  });
  const docentes = docentesData?.results ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const createMutation = useMutation({
    mutationFn: (d: FormData) =>
      asignacionesApi.create({
        ...d,
        fecha_fin: d.fecha_fin || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asignaciones'] });
      toast.success('Asignación creada');
      setModalOpen(false);
      reset();
    },
    onError: () => toast.error('Error al crear la asignación'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => asignacionesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asignaciones'] });
      toast.success('Asignación eliminada');
      setDeleteTarget(null);
    },
    onError: () => toast.error('Error al eliminar'),
  });

  const onSubmit = (d: FormData) => createMutation.mutate(d);

  const openCreate = () => {
    reset({ rol: 'titular', fecha_inicio: new Date().toISOString().slice(0, 10) });
    setModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Nueva asignación
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : asignaciones.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <UserCheck className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p>No hay asignaciones registradas.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Docente', 'Materia (SIU)', 'Rol', 'Inicio', 'Fin', 'Estado', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {asignaciones.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{a.docente_nombre}</td>
                  <td className="px-4 py-3 text-gray-600">{a.materia_nombre}</td>
                  <td className="px-4 py-3">
                    <Badge variant={a.rol === 'titular' ? 'info' : 'default'}>{a.rol_display}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{a.fecha_inicio}</td>
                  <td className="px-4 py-3 text-gray-600">{a.fecha_fin ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={a.activa ? 'success' : 'default'}>{a.activa ? 'Activa' : 'Inactiva'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setDeleteTarget(a)}
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
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nueva Asignación" size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Docente</label>
            <select
              {...register('docente')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Seleccionar docente…</option>
              {docentes.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.first_name} {d.last_name} ({d.username})
                </option>
              ))}
            </select>
            {errors.docente && <p className="text-red-500 text-xs mt-1">{errors.docente.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Materia</label>
            <select
              {...register('materia')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Seleccionar materia…</option>
              {materias.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.codigo_siu} — {m.nombre}
                </option>
              ))}
            </select>
            {errors.materia && <p className="text-red-500 text-xs mt-1">{errors.materia.message}</p>}
          </div>

          <Select
            label="Rol"
            {...register('rol')}
            error={errors.rol?.message}
            options={[
              { value: 'titular', label: 'Titular' },
              { value: 'adjunto', label: 'Adjunto' },
            ]}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Fecha inicio"
              type="date"
              {...register('fecha_inicio')}
              error={errors.fecha_inicio?.message}
            />
            <Input
              label="Fecha fin (opcional)"
              type="date"
              {...register('fecha_fin')}
              error={errors.fecha_fin?.message}
            />
          </div>

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
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirmar eliminación" size="sm">
        <p className="text-sm text-gray-600 mb-4">
          ¿Eliminar la asignación de <strong>{deleteTarget?.docente_nombre}</strong> a{' '}
          <strong>{deleteTarget?.materia_nombre}</strong>?
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
