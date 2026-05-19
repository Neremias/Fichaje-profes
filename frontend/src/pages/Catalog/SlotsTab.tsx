import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit2, Trash2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { slotsApi, materiasApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Select } from '@/components/ui/Select';
import type { SlotHorario } from '@/types';

const DIAS = [
  { value: 'lunes', label: 'Lunes' },
  { value: 'martes', label: 'Martes' },
  { value: 'miercoles', label: 'Miércoles' },
  { value: 'jueves', label: 'Jueves' },
  { value: 'viernes', label: 'Viernes' },
  { value: 'sabado', label: 'Sábado' },
];

const schema = z.object({
  materia: z.coerce.number().min(1, 'Seleccioná una materia'),
  dia_semana: z.string().min(1, 'Requerido'),
  hora_inicio: z.string().min(1, 'Requerido'),
  hora_fin: z.string().min(1, 'Requerido'),
}).refine((d) => d.hora_inicio < d.hora_fin, {
  message: 'La hora de inicio debe ser anterior a la de fin',
  path: ['hora_fin'],
});

type FormData = z.infer<typeof schema>;

export default function SlotsTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<SlotHorario | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SlotHorario | null>(null);

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ['slots', search],
    queryFn: () => slotsApi.list(),
  });

  const { data: materias = [] } = useQuery({
    queryKey: ['materias-all'],
    queryFn: () => materiasApi.list(),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const createMutation = useMutation({
    mutationFn: (d: FormData) => slotsApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['slots'] });
      toast.success('Bloque horario creado');
      setModalOpen(false);
      reset();
    },
    onError: () => toast.error('Error al crear el bloque horario'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<FormData> }) =>
      slotsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['slots'] });
      toast.success('Bloque actualizado');
      setModalOpen(false);
      reset();
    },
    onError: () => toast.error('Error al actualizar'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => slotsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['slots'] });
      toast.success('Bloque desactivado');
      setDeleteTarget(null);
    },
    onError: () => toast.error('Error al desactivar'),
  });

  const openCreate = () => {
    setEditItem(null);
    reset({ dia_semana: 'lunes' });
    setModalOpen(true);
  };

  const openEdit = (s: SlotHorario) => {
    setEditItem(s);
    reset({
      materia: s.materia,
      dia_semana: s.dia_semana,
      hora_inicio: s.hora_inicio,
      hora_fin: s.hora_fin,
    });
    setModalOpen(true);
  };

  const onSubmit = (d: FormData) => {
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data: d });
    } else {
      createMutation.mutate(d);
    }
  };

  const filtered = search
    ? slots.filter((s) =>
        s.materia_nombre.toLowerCase().includes(search.toLowerCase()) ||
        s.dia_semana_display.toLowerCase().includes(search.toLowerCase())
      )
    : slots;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="max-w-sm w-full">
          <Input
            placeholder="Buscar por materia o día..."
            leftElement={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Nuevo bloque
        </Button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-gray-400">
            <Clock className="h-10 w-10" />
            <p className="text-sm">No se encontraron bloques horarios</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-3">Materia</th>
                  <th className="px-4 py-3">Día</th>
                  <th className="px-4 py-3">Inicio</th>
                  <th className="px-4 py-3">Fin</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{s.materia_nombre}</td>
                    <td className="px-4 py-3 text-gray-600">{s.dia_semana_display}</td>
                    <td className="px-4 py-3 text-gray-600">{s.hora_inicio.slice(0, 5)}</td>
                    <td className="px-4 py-3 text-gray-600">{s.hora_fin.slice(0, 5)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={s.activo ? 'success' : 'default'}>
                        {s.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(s)}
                          className="rounded p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {s.activo && (
                          <button
                            onClick={() => setDeleteTarget(s)}
                            className="rounded p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Desactivar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); reset(); }}
        title={editItem ? 'Editar Bloque Horario' : 'Nuevo Bloque Horario'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select
            label="Materia"
            error={errors.materia?.message}
            {...register('materia')}
          >
            <option value="">Seleccioná una materia</option>
            {materias.map((m) => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </Select>
          <Select
            label="Día de la semana"
            error={errors.dia_semana?.message}
            {...register('dia_semana')}
          >
            {DIAS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Hora inicio"
              type="time"
              error={errors.hora_inicio?.message}
              {...register('hora_inicio')}
            />
            <Input
              label="Hora fin"
              type="time"
              error={errors.hora_fin?.message}
              {...register('hora_fin')}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => { setModalOpen(false); reset(); }}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              {editItem ? 'Guardar cambios' : 'Crear bloque'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Soft-delete confirm modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Desactivar Bloque Horario"
      >
        <p className="text-sm text-gray-600 mb-6">
          ¿Desactivar el bloque de <strong>{deleteTarget?.materia_nombre}</strong> del{' '}
          <strong>{deleteTarget?.dia_semana_display}</strong>{' '}
          {deleteTarget?.hora_inicio.slice(0, 5)} – {deleteTarget?.hora_fin.slice(0, 5)}?
          No se eliminará del sistema.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
          <Button
            variant="danger"
            isLoading={deleteMutation.isPending}
            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
          >
            Desactivar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
