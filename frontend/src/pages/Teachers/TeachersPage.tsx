import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit2, Trash2, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { teachersApi, institutionsApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Select } from '@/components/ui/Select';
import type { User as Teacher } from '@/types';

const schema = z.object({
  username: z.string().min(1, 'Requerido'),
  first_name: z.string().min(1, 'Requerido'),
  last_name: z.string().min(1, 'Requerido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  institution: z.coerce.number().min(1, 'Seleccioná una institución'),
  is_active: z.boolean().default(true),
  password: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function TeachersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTeacher, setEditTeacher] = useState<Teacher | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Teacher | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['teachers', search, page],
    queryFn: () => teachersApi.list({ search, page: String(page) }),
  });

  const { data: institutions } = useQuery({
    queryKey: ['institutions'],
    queryFn: () => institutionsApi.list(),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const createMutation = useMutation({
    mutationFn: (d: FormData) => teachersApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Docente creado');
      setModalOpen(false);
      reset();
    },
    onError: () => toast.error('Error al crear docente'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<FormData> }) =>
      teachersApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Docente actualizado');
      setModalOpen(false);
      reset();
    },
    onError: () => toast.error('Error al actualizar'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => teachersApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Docente eliminado');
      setDeleteTarget(null);
    },
    onError: () => toast.error('Error al eliminar'),
  });

  const openCreate = () => {
    setEditTeacher(null);
    reset({ is_active: true });
    setModalOpen(true);
  };

  const openEdit = (t: Teacher) => {
    setEditTeacher(t);
    reset({
      username: t.username,
      first_name: t.first_name,
      last_name: t.last_name,
      email: t.email || '',
      institution: t.institution?.id ?? 0,
      is_active: t.is_active,
    });
    setModalOpen(true);
  };

  const onSubmit = (d: FormData) => {
    if (editTeacher) {
      updateMutation.mutate({ id: editTeacher.id, data: d });
    } else {
      createMutation.mutate(d);
    }
  };

  const teachers = data?.results ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Docentes</h1>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Nuevo docente
        </Button>
      </div>

      {/* Search */}
      <div className="max-w-sm">
        <Input
          placeholder="Buscar por nombre o usuario..."
          leftElement={<Search className="h-4 w-4" />}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : teachers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-gray-400">
            <User className="h-10 w-10" />
            <p className="text-sm">No se encontraron docentes</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="py-3 px-4 text-left font-medium text-gray-500">Nombre</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-500 hidden sm:table-cell">
                    Usuario
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-gray-500 hidden md:table-cell">
                    Institución
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-gray-500">Estado</th>
                  <th className="py-3 px-4 text-right font-medium text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {teachers.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-semibold text-xs flex-shrink-0">
                          {t.first_name[0]}{t.last_name[0]}
                        </div>
                        <span className="font-medium text-gray-900">
                          {t.first_name} {t.last_name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell text-gray-500">{t.username}</td>
                    <td className="py-3 px-4 hidden md:table-cell text-gray-500">
                      {t.institution?.name ?? '—'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={t.is_active ? 'success' : 'default'}>
                        {t.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(t)}
                          className="p-1.5 rounded hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(t)}
                          className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.count > 10 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <p className="text-xs text-gray-400">
              {data.count} resultado{data.count !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p - 1)}
                disabled={!data.previous}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={!data.next}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); reset(); }}
        title={editTeacher ? 'Editar docente' : 'Nuevo docente'}
        size="md"
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => { setModalOpen(false); reset(); }}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              isLoading={isSubmitting || createMutation.isPending || updateMutation.isPending}
              onClick={handleSubmit(onSubmit)}
            >
              {editTeacher ? 'Guardar cambios' : 'Crear docente'}
            </Button>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nombre"
              placeholder="Juan"
              error={errors.first_name?.message}
              {...register('first_name')}
            />
            <Input
              label="Apellido"
              placeholder="Pérez"
              error={errors.last_name?.message}
              {...register('last_name')}
            />
          </div>
          <Input
            label="Usuario"
            placeholder="juan.perez"
            error={errors.username?.message}
            {...register('username')}
          />
          <Input
            label="Email"
            type="email"
            placeholder="juan@ejemplo.com"
            error={errors.email?.message}
            {...register('email')}
          />
          {!editTeacher && (
            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
          )}
          <Select
            label="Institución"
            error={errors.institution?.message}
            {...register('institution')}
          >
            <option value="">Seleccioná...</option>
            {(institutions ?? []).map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </Select>
          <div className="flex items-center gap-2">
            <input
              id="is_active"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              {...register('is_active')}
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">Activo</label>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Confirmar eliminación"
        size="sm"
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button
              variant="danger"
              isLoading={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Eliminar
            </Button>
          </div>
        }
      >
        <p className="text-sm text-gray-600">
          ¿Estás seguro de que querés eliminar a{' '}
          <strong>{deleteTarget?.first_name} {deleteTarget?.last_name}</strong>?
          Esta acción no se puede deshacer.
        </p>
      </Modal>
    </div>
  );
}
