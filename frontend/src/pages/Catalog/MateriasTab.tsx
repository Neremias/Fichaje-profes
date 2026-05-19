import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit2, Trash2, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { materiasApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import type { Materia } from '@/types';

const schema = z.object({
  codigo_siu: z.string().min(1, 'Requerido').max(20),
  nombre: z.string().min(1, 'Requerido').max(200),
  anio: z.coerce.number().int().min(1, 'Mínimo 1').max(6, 'Máximo 6'),
});

type FormData = z.infer<typeof schema>;

export default function MateriasTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Materia | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Materia | null>(null);

  const { data: materias = [], isLoading } = useQuery({
    queryKey: ['materias', search],
    queryFn: () => materiasApi.list({ search: search || undefined }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const createMutation = useMutation({
    mutationFn: (d: FormData) => materiasApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['materias'] });
      toast.success('Materia creada');
      setModalOpen(false);
      reset();
    },
    onError: () => toast.error('Error al crear la materia'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<FormData> }) =>
      materiasApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['materias'] });
      toast.success('Materia actualizada');
      setModalOpen(false);
      reset();
    },
    onError: () => toast.error('Error al actualizar'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => materiasApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['materias'] });
      toast.success('Materia desactivada');
      setDeleteTarget(null);
    },
    onError: () => toast.error('Error al desactivar'),
  });

  const openCreate = () => {
    setEditItem(null);
    reset({ anio: 1 });
    setModalOpen(true);
  };

  const openEdit = (m: Materia) => {
    setEditItem(m);
    reset({ codigo_siu: m.codigo_siu, nombre: m.nombre, anio: m.anio });
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
    ? materias.filter(
        (m) =>
          m.nombre.toLowerCase().includes(search.toLowerCase()) ||
          m.codigo_siu.toLowerCase().includes(search.toLowerCase())
      )
    : materias;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="max-w-sm w-full">
          <Input
            placeholder="Buscar por nombre o código SIU..."
            leftElement={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Nueva materia
        </Button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-gray-400">
            <BookOpen className="h-10 w-10" />
            <p className="text-sm">No se encontraron materias</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Código SIU</th>
                  <th className="px-4 py-3">Año</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{m.nombre}</td>
                    <td className="px-4 py-3 text-gray-600">{m.codigo_siu}</td>
                    <td className="px-4 py-3 text-gray-600">{m.anio}°</td>
                    <td className="px-4 py-3">
                      <Badge variant={m.activa ? 'success' : 'default'}>
                        {m.activa ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(m)}
                          className="rounded p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {m.activa && (
                          <button
                            onClick={() => setDeleteTarget(m)}
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
        title={editItem ? 'Editar Materia' : 'Nueva Materia'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Código SIU"
            placeholder="Ej: SIS101"
            error={errors.codigo_siu?.message}
            {...register('codigo_siu')}
          />
          <Input
            label="Nombre"
            placeholder="Ej: Algoritmos y Estructuras de Datos"
            error={errors.nombre?.message}
            {...register('nombre')}
          />
          <Input
            label="Año"
            type="number"
            min={1}
            max={6}
            error={errors.anio?.message}
            {...register('anio')}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => { setModalOpen(false); reset(); }}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              {editItem ? 'Guardar cambios' : 'Crear materia'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Soft-delete confirm modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Desactivar Materia"
      >
        <p className="text-sm text-gray-600 mb-6">
          ¿Desactivar la materia <strong>{deleteTarget?.nombre}</strong>? No estará disponible para
          nuevos horarios ni asignaciones.
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
