import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit2, Trash2, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { carrerasApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Select } from '@/components/ui/Select';
import type { Carrera } from '@/types';

const INSTITUCIONES = [
  { value: 'ices', label: 'ICES' },
  { value: 'ucse', label: 'UCSE' },
  { value: 'otro_convenio', label: 'Otro Convenio' },
];

const schema = z.object({
  institucion: z.string().min(1, 'Requerido'),
  codigo: z.string().min(1, 'Requerido').max(10),
  nombre: z.string().min(1, 'Requerido').max(200),
  duracion_anios: z.coerce.number().int().min(1, 'Debe ser al menos 1').max(10),
});

type FormData = z.infer<typeof schema>;

export default function CarrerasTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Carrera | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Carrera | null>(null);

  const { data: carreras = [], isLoading } = useQuery({
    queryKey: ['carreras', search],
    queryFn: () => carrerasApi.list({ search: search || undefined }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const createMutation = useMutation({
    mutationFn: (d: FormData) => carrerasApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['carreras'] });
      toast.success('Carrera creada');
      setModalOpen(false);
      reset();
    },
    onError: () => toast.error('Error al crear la carrera'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<FormData> }) =>
      carrerasApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['carreras'] });
      toast.success('Carrera actualizada');
      setModalOpen(false);
      reset();
    },
    onError: () => toast.error('Error al actualizar'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => carrerasApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['carreras'] });
      toast.success('Carrera desactivada');
      setDeleteTarget(null);
    },
    onError: () => toast.error('Error al desactivar'),
  });

  const openCreate = () => {
    setEditItem(null);
    reset({ institucion: 'ices', duracion_anios: 4 });
    setModalOpen(true);
  };

  const openEdit = (c: Carrera) => {
    setEditItem(c);
    reset({
      institucion: c.institucion,
      codigo: c.codigo,
      nombre: c.nombre,
      duracion_anios: c.duracion_anios,
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
    ? carreras.filter(
        (c) =>
          c.nombre.toLowerCase().includes(search.toLowerCase()) ||
          c.codigo.toLowerCase().includes(search.toLowerCase())
      )
    : carreras;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="max-w-sm w-full">
          <Input
            placeholder="Buscar por nombre o código..."
            leftElement={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Nueva carrera
        </Button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-gray-400">
            <GraduationCap className="h-10 w-10" />
            <p className="text-sm">No se encontraron carreras</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Institución</th>
                  <th className="px-4 py-3">Duración</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{c.nombre}</td>
                    <td className="px-4 py-3 text-gray-600">{c.codigo}</td>
                    <td className="px-4 py-3 text-gray-600">{c.institucion_display}</td>
                    <td className="px-4 py-3 text-gray-600">{c.duracion_anios} año{c.duracion_anios !== 1 ? 's' : ''}</td>
                    <td className="px-4 py-3">
                      <Badge variant={c.activo ? 'success' : 'default'}>
                        {c.activo ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(c)}
                          className="rounded p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {c.activo && (
                          <button
                            onClick={() => setDeleteTarget(c)}
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
        title={editItem ? 'Editar Carrera' : 'Nueva Carrera'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select
            label="Institución"
            error={errors.institucion?.message}
            {...register('institucion')}
          >
            {INSTITUCIONES.map((i) => (
              <option key={i.value} value={i.value}>{i.label}</option>
            ))}
          </Select>
          <Input
            label="Código"
            placeholder="Ej: SIS"
            error={errors.codigo?.message}
            {...register('codigo')}
          />
          <Input
            label="Nombre"
            placeholder="Ej: Ingeniería en Sistemas"
            error={errors.nombre?.message}
            {...register('nombre')}
          />
          <Input
            label="Duración (años)"
            type="number"
            min={1}
            max={10}
            error={errors.duracion_anios?.message}
            {...register('duracion_anios')}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => { setModalOpen(false); reset(); }}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              {editItem ? 'Guardar cambios' : 'Crear carrera'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Soft-delete confirm modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Desactivar Carrera"
      >
        <p className="text-sm text-gray-600 mb-6">
          ¿Desactivar la carrera <strong>{deleteTarget?.nombre}</strong>? Permanecerá en el sistema
          pero no estará disponible para nuevas asignaciones.
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
