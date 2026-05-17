import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { schedulesApi, subjectsApi, classroomsApi, teachersApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { getDayName } from '@/lib/utils';

const DAYS = [
  { value: 'monday', label: 'Lunes' },
  { value: 'tuesday', label: 'Martes' },
  { value: 'wednesday', label: 'Miércoles' },
  { value: 'thursday', label: 'Jueves' },
  { value: 'friday', label: 'Viernes' },
  { value: 'saturday', label: 'Sábado' },
];

type Tab = 'schedules' | 'subjects' | 'classrooms';

/* ─────────── SCHEDULES ─────────── */
const scheduleSchema = z.object({
  teacher: z.coerce.number().min(1, 'Requerido'),
  subject: z.coerce.number().min(1, 'Requerido'),
  classroom: z.coerce.number().min(1, 'Requerido'),
  day_of_week: z.string().min(1, 'Requerido'),
  start_time: z.string().min(1, 'Requerido'),
  end_time: z.string().min(1, 'Requerido'),
  is_active: z.boolean().default(true),
});
type ScheduleForm = z.infer<typeof scheduleSchema>;

function SchedulesTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [del, setDel] = useState<any>(null);

  const { data, isLoading } = useQuery({ queryKey: ['schedules'], queryFn: () => schedulesApi.list() });
  const { data: teachers } = useQuery({ queryKey: ['teachers-all'], queryFn: () => teachersApi.list({ page_size: 200 }) });
  const { data: subjects } = useQuery({ queryKey: ['subjects-all'], queryFn: () => subjectsApi.list() });
  const { data: classrooms } = useQuery({ queryKey: ['classrooms-all'], queryFn: () => classroomsApi.listAll() });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ScheduleForm>({ resolver: zodResolver(scheduleSchema) });

  const create = useMutation({ mutationFn: (d: ScheduleForm) => schedulesApi.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['schedules'] }); toast.success('Horario creado'); setOpen(false); reset(); }, onError: () => toast.error('Error') });
  const update = useMutation({ mutationFn: ({ id, d }: any) => schedulesApi.update(id, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['schedules'] }); toast.success('Actualizado'); setOpen(false); reset(); }, onError: () => toast.error('Error') });
  const remove = useMutation({ mutationFn: (id: number) => schedulesApi.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['schedules'] }); toast.success('Eliminado'); setDel(null); }, onError: () => toast.error('Error') });

  const openCreate = () => { setEdit(null); reset({ is_active: true }); setOpen(true); };
  const openEdit = (s: any) => { setEdit(s); reset({ ...s, teacher: s.teacher.id ?? s.teacher, subject: s.subject.id ?? s.subject, classroom: s.classroom.id ?? s.classroom }); setOpen(true); };
  const onSubmit = (d: ScheduleForm) => edit ? update.mutate({ id: edit.id, d }) : create.mutate(d);

  const rows = data?.results ?? [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>Nuevo horario</Button>
      </div>
      {isLoading ? <div className="flex justify-center py-10"><Spinner /></div> : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50">
              <th className="py-3 px-4 text-left font-medium text-gray-500">Docente</th>
              <th className="py-3 px-4 text-left font-medium text-gray-500 hidden sm:table-cell">Materia</th>
              <th className="py-3 px-4 text-left font-medium text-gray-500 hidden md:table-cell">Aula</th>
              <th className="py-3 px-4 text-left font-medium text-gray-500">Día</th>
              <th className="py-3 px-4 text-left font-medium text-gray-500 hidden sm:table-cell">Horario</th>
              <th className="py-3 px-4 text-right font-medium text-gray-500">Acciones</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((s: any) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 font-medium text-gray-900">{s.teacher_name ?? s.teacher}</td>
                  <td className="py-3 px-4 hidden sm:table-cell text-gray-500">{s.subject_name ?? s.subject}</td>
                  <td className="py-3 px-4 hidden md:table-cell text-gray-500">{s.classroom_name ?? s.classroom}</td>
                  <td className="py-3 px-4 text-gray-500">{getDayName(s.day_of_week)}</td>
                  <td className="py-3 px-4 hidden sm:table-cell text-gray-500">{s.start_time?.slice(0,5)} – {s.end_time?.slice(0,5)}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-indigo-50 text-gray-400 hover:text-indigo-600"><Edit2 className="h-4 w-4" /></button>
                      <button onClick={() => setDel(s)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => { setOpen(false); reset(); }} title={edit ? 'Editar horario' : 'Nuevo horario'} size="md"
        footer={<div className="flex gap-2 justify-end"><Button variant="ghost" onClick={() => { setOpen(false); reset(); }}>Cancelar</Button><Button variant="primary" isLoading={create.isPending || update.isPending} onClick={handleSubmit(onSubmit)}>{edit ? 'Guardar' : 'Crear'}</Button></div>}>
        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <Select label="Docente" error={errors.teacher?.message} {...register('teacher')}>
            <option value="">Seleccioná...</option>
            {(teachers?.results ?? []).map((t: any) => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
          </Select>
          <Select label="Materia" error={errors.subject?.message} {...register('subject')}>
            <option value="">Seleccioná...</option>
            {(subjects?.results ?? []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          <Select label="Aula" error={errors.classroom?.message} {...register('classroom')}>
            <option value="">Seleccioná...</option>
            {(classrooms ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select label="Día" error={errors.day_of_week?.message} {...register('day_of_week')}>
            <option value="">Seleccioná...</option>
            {DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Hora inicio" type="time" error={errors.start_time?.message} {...register('start_time')} />
            <Input label="Hora fin" type="time" error={errors.end_time?.message} {...register('end_time')} />
          </div>
        </form>
      </Modal>

      <Modal open={!!del} onClose={() => setDel(null)} title="Confirmar eliminación" size="sm"
        footer={<div className="flex gap-2 justify-end"><Button variant="ghost" onClick={() => setDel(null)}>Cancelar</Button><Button variant="danger" isLoading={remove.isPending} onClick={() => del && remove.mutate(del.id)}>Eliminar</Button></div>}>
        <p className="text-sm text-gray-600">¿Eliminar este horario?</p>
      </Modal>
    </div>
  );
}

/* ─────────── SUBJECTS ─────────── */
const subjectSchema = z.object({ name: z.string().min(1, 'Requerido'), code: z.string().optional(), description: z.string().optional() });
type SubjectForm = z.infer<typeof subjectSchema>;

function SubjectsTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [del, setDel] = useState<any>(null);
  const { data, isLoading } = useQuery({ queryKey: ['subjects'], queryFn: () => subjectsApi.list() });
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SubjectForm>({ resolver: zodResolver(subjectSchema) });
  const create = useMutation({ mutationFn: (d: SubjectForm) => subjectsApi.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['subjects'] }); toast.success('Materia creada'); setOpen(false); reset(); } });
  const update = useMutation({ mutationFn: ({ id, d }: any) => subjectsApi.update(id, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['subjects'] }); toast.success('Actualizado'); setOpen(false); reset(); } });
  const remove = useMutation({ mutationFn: (id: number) => subjectsApi.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['subjects'] }); toast.success('Eliminado'); setDel(null); } });
  const openCreate = () => { setEdit(null); reset(); setOpen(true); };
  const openEdit = (s: any) => { setEdit(s); reset(s); setOpen(true); };
  const onSubmit = (d: SubjectForm) => edit ? update.mutate({ id: edit.id, d }) : create.mutate(d);
  const rows = data?.results ?? [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>Nueva materia</Button></div>
      {isLoading ? <div className="flex justify-center py-10"><Spinner /></div> : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50">
              <th className="py-3 px-4 text-left font-medium text-gray-500">Nombre</th>
              <th className="py-3 px-4 text-left font-medium text-gray-500 hidden sm:table-cell">Código</th>
              <th className="py-3 px-4 text-right font-medium text-gray-500">Acciones</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((s: any) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{s.name}</td>
                  <td className="py-3 px-4 hidden sm:table-cell text-gray-500">{s.code ?? '—'}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-indigo-50 text-gray-400 hover:text-indigo-600"><Edit2 className="h-4 w-4" /></button>
                      <button onClick={() => setDel(s)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={open} onClose={() => { setOpen(false); reset(); }} title={edit ? 'Editar materia' : 'Nueva materia'} size="sm"
        footer={<div className="flex gap-2 justify-end"><Button variant="ghost" onClick={() => { setOpen(false); reset(); }}>Cancelar</Button><Button variant="primary" isLoading={create.isPending || update.isPending} onClick={handleSubmit(onSubmit)}>{edit ? 'Guardar' : 'Crear'}</Button></div>}>
        <form className="space-y-3"><Input label="Nombre" error={errors.name?.message} {...register('name')} /><Input label="Código" error={errors.code?.message} {...register('code')} /></form>
      </Modal>
      <Modal open={!!del} onClose={() => setDel(null)} title="Confirmar eliminación" size="sm"
        footer={<div className="flex gap-2 justify-end"><Button variant="ghost" onClick={() => setDel(null)}>Cancelar</Button><Button variant="danger" isLoading={remove.isPending} onClick={() => del && remove.mutate(del.id)}>Eliminar</Button></div>}>
        <p className="text-sm text-gray-600">¿Eliminar la materia <strong>{del?.name}</strong>?</p>
      </Modal>
    </div>
  );
}

/* ─────────── CLASSROOMS ─────────── */
const classroomSchema = z.object({ name: z.string().min(1, 'Requerido'), building: z.string().optional(), capacity: z.coerce.number().optional(), gps_latitude: z.coerce.number().optional(), gps_longitude: z.coerce.number().optional(), gps_radius_meters: z.coerce.number().optional() });
type ClassroomForm = z.infer<typeof classroomSchema>;

function ClassroomsTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [del, setDel] = useState<any>(null);
  const { data, isLoading } = useQuery({ queryKey: ['classrooms'], queryFn: () => classroomsApi.list() });
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ClassroomForm>({ resolver: zodResolver(classroomSchema) });
  const create = useMutation({ mutationFn: (d: ClassroomForm) => classroomsApi.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['classrooms'] }); toast.success('Aula creada'); setOpen(false); reset(); } });
  const update = useMutation({ mutationFn: ({ id, d }: any) => classroomsApi.update(id, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['classrooms'] }); toast.success('Actualizado'); setOpen(false); reset(); } });
  const remove = useMutation({ mutationFn: (id: number) => classroomsApi.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['classrooms'] }); toast.success('Eliminado'); setDel(null); } });
  const openCreate = () => { setEdit(null); reset(); setOpen(true); };
  const openEdit = (c: any) => { setEdit(c); reset(c); setOpen(true); };
  const onSubmit = (d: ClassroomForm) => edit ? update.mutate({ id: edit.id, d }) : create.mutate(d);
  const rows = (data as any)?.results ?? (Array.isArray(data) ? data : []);

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>Nueva aula</Button></div>
      {isLoading ? <div className="flex justify-center py-10"><Spinner /></div> : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50">
              <th className="py-3 px-4 text-left font-medium text-gray-500">Nombre</th>
              <th className="py-3 px-4 text-left font-medium text-gray-500 hidden sm:table-cell">Edificio</th>
              <th className="py-3 px-4 text-left font-medium text-gray-500 hidden md:table-cell">GPS</th>
              <th className="py-3 px-4 text-right font-medium text-gray-500">Acciones</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((c: any) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{c.name}</td>
                  <td className="py-3 px-4 hidden sm:table-cell text-gray-500">{c.building ?? '—'}</td>
                  <td className="py-3 px-4 hidden md:table-cell text-gray-500">{c.gps_latitude ? `${c.gps_latitude}, ${c.gps_longitude}` : '—'}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-indigo-50 text-gray-400 hover:text-indigo-600"><Edit2 className="h-4 w-4" /></button>
                      <button onClick={() => setDel(c)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={open} onClose={() => { setOpen(false); reset(); }} title={edit ? 'Editar aula' : 'Nueva aula'} size="md"
        footer={<div className="flex gap-2 justify-end"><Button variant="ghost" onClick={() => { setOpen(false); reset(); }}>Cancelar</Button><Button variant="primary" isLoading={create.isPending || update.isPending} onClick={handleSubmit(onSubmit)}>{edit ? 'Guardar' : 'Crear'}</Button></div>}>
        <form className="space-y-3">
          <Input label="Nombre" error={errors.name?.message} {...register('name')} />
          <Input label="Edificio" error={errors.building?.message} {...register('building')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Latitud GPS" type="number" step="any" {...register('gps_latitude')} />
            <Input label="Longitud GPS" type="number" step="any" {...register('gps_longitude')} />
          </div>
          <Input label="Radio GPS (metros)" type="number" {...register('gps_radius_meters')} />
        </form>
      </Modal>
      <Modal open={!!del} onClose={() => setDel(null)} title="Confirmar eliminación" size="sm"
        footer={<div className="flex gap-2 justify-end"><Button variant="ghost" onClick={() => setDel(null)}>Cancelar</Button><Button variant="danger" isLoading={remove.isPending} onClick={() => del && remove.mutate(del.id)}>Eliminar</Button></div>}>
        <p className="text-sm text-gray-600">¿Eliminar el aula <strong>{del?.name}</strong>?</p>
      </Modal>
    </div>
  );
}

/* ─────────── MAIN PAGE ─────────── */
export default function SchedulesPage() {
  const [tab, setTab] = useState<Tab>('schedules');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'schedules', label: 'Horarios' },
    { id: 'subjects', label: 'Materias' },
    { id: 'classrooms', label: 'Aulas' },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Gestión de horarios</h1>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-white shadow text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'schedules' && <SchedulesTab />}
      {tab === 'subjects' && <SubjectsTab />}
      {tab === 'classrooms' && <ClassroomsTab />}
    </div>
  );
}
