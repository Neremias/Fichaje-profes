import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { solicitudesApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import type { SolicitudEmergencia } from '@/types';

type RevisionFormData = {
  estado: 'aprobada' | 'rechazada';
  nota_secretaria: string;
};

const estadoVariant: Record<SolicitudEmergencia['estado'], 'warning' | 'success' | 'danger'> = {
  pendiente: 'warning',
  aprobada: 'success',
  rechazada: 'danger',
};

export default function ExcepcionesTab() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<SolicitudEmergencia | null>(null);
  const [decision, setDecision] = useState<'aprobada' | 'rechazada' | null>(null);
  const [nota, setNota] = useState('');

  const { data: solicitudes = [], isLoading } = useQuery({
    queryKey: ['solicitudes'],
    queryFn: () => solicitudesApi.list(),
  });

  const revisarMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: RevisionFormData }) =>
      solicitudesApi.revisar(id, data),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['solicitudes'] });
      const accion = updated.estado === 'aprobada' ? 'aprobada' : 'rechazada';
      toast.success(`Solicitud ${accion}`);
      if (updated.estado === 'aprobada') {
        toast('Se generó el registro de asistencia automáticamente.', { icon: '✅' });
      }
      setSelected(null);
      setDecision(null);
      setNota('');
    },
    onError: () => toast.error('Error al procesar la solicitud'),
  });

  const pending = solicitudes.filter((s) => s.estado === 'pendiente');
  const reviewed = solicitudes.filter((s) => s.estado !== 'pendiente');

  const handleConfirm = () => {
    if (!selected || !decision) return;
    revisarMutation.mutate({
      id: selected.id,
      data: { estado: decision, nota_secretaria: nota },
    });
  };

  const openDecision = (s: SolicitudEmergencia, d: 'aprobada' | 'rechazada') => {
    setSelected(s);
    setDecision(d);
    setNota('');
  };

  return (
    <div className="space-y-6">
      {/* Pending */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Solicitudes pendientes{' '}
          {pending.length > 0 && (
            <span className="ml-1 inline-flex items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs font-bold w-5 h-5">
              {pending.length}
            </span>
          )}
        </h3>

        {isLoading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : pending.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <AlertCircle className="h-8 w-8 mx-auto mb-1 opacity-40" />
            <p className="text-sm">No hay solicitudes pendientes.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((s) => (
              <SolicitudCard
                key={s.id}
                solicitud={s}
                onApprove={() => openDecision(s, 'aprobada')}
                onReject={() => openDecision(s, 'rechazada')}
              />
            ))}
          </div>
        )}
      </div>

      {/* Reviewed */}
      {reviewed.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 mb-3">Historial revisado</h3>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Docente', 'Fecha', 'Estado', 'Nota secretaría', 'Revisado en'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {reviewed.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{s.docente_nombre}</td>
                    <td className="px-4 py-3 text-gray-600">{s.fecha}</td>
                    <td className="px-4 py-3">
                      <Badge variant={estadoVariant[s.estado]}>{s.estado_display}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{s.nota_secretaria || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {s.revisado_en ? new Date(s.revisado_en).toLocaleString('es-AR') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <Modal
        isOpen={!!selected && !!decision}
        onClose={() => { setSelected(null); setDecision(null); }}
        title={decision === 'aprobada' ? 'Aprobar solicitud' : 'Rechazar solicitud'}
        size="md"
      >
        {selected && (
          <div className="space-y-4">
            <div className="rounded-md bg-gray-50 border border-gray-200 p-3 text-sm space-y-1">
              <p><span className="font-medium">Docente:</span> {selected.docente_nombre}</p>
              <p><span className="font-medium">Fecha:</span> {selected.fecha}</p>
              {selected.nota_docente && (
                <p><span className="font-medium">Nota docente:</span> {selected.nota_docente}</p>
              )}
            </div>

            {decision === 'aprobada' && (
              <p className="text-xs text-green-700 bg-green-50 rounded-md border border-green-200 p-2">
                Al aprobar, se generará automáticamente un registro de asistencia para este docente.
              </p>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nota (opcional)
              </label>
              <textarea
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                rows={3}
                placeholder="Justificación o comentario…"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => { setSelected(null); setDecision(null); }}>
                Cancelar
              </Button>
              <Button
                variant={decision === 'aprobada' ? 'primary' : 'danger'}
                onClick={handleConfirm}
                disabled={revisarMutation.isPending}
              >
                {decision === 'aprobada' ? 'Aprobar' : 'Rechazar'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function SolicitudCard({
  solicitud,
  onApprove,
  onReject,
}: {
  solicitud: SolicitudEmergencia;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex-1 space-y-1">
        <p className="font-medium text-gray-900">{solicitud.docente_nombre}</p>
        <p className="text-sm text-gray-600">
          Fecha: <span className="font-mono">{solicitud.fecha}</span>
        </p>
        {solicitud.nota_docente && (
          <p className="text-sm text-gray-500 italic">"{solicitud.nota_docente}"</p>
        )}
        <p className="text-xs text-gray-400">
          Recibida: {new Date(solicitud.creado_en).toLocaleString('es-AR')}
        </p>
      </div>
      <div className="flex gap-2 shrink-0">
        <Button size="sm" onClick={onApprove}>
          <CheckCircle className="h-4 w-4 mr-1" /> Aprobar
        </Button>
        <Button size="sm" variant="danger" onClick={onReject}>
          <XCircle className="h-4 w-4 mr-1" /> Rechazar
        </Button>
      </div>
    </div>
  );
}
