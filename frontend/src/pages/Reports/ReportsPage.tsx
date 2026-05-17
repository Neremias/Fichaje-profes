import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { attendanceApi, teachersApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { formatDate, formatTime, formatPercent, downloadBlob } from '@/lib/utils';
import toast from 'react-hot-toast';

type StatusFilter = '' | 'present' | 'absent' | 'late';

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'danger' | 'warning' | 'default' }> = {
  present: { label: 'Presente', variant: 'success' },
  absent: { label: 'Ausente', variant: 'danger' },
  late: { label: 'Tarde', variant: 'warning' },
};

function ExpandedRows({ records }: { records: any[] }) {
  return (
    <tr>
      <td colSpan={6} className="px-4 pb-4 pt-0">
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500">
                <th className="py-1 px-2 text-left">Fecha</th>
                <th className="py-1 px-2 text-left">Aula</th>
                <th className="py-1 px-2 text-left">Entrada</th>
                <th className="py-1 px-2 text-left">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map((r: any, i: number) => {
                const cfg = STATUS_CONFIG[r.status] ?? { label: r.status, variant: 'default' };
                return (
                  <tr key={i} className="text-gray-600">
                    <td className="py-1.5 px-2">{formatDate(r.date)}</td>
                    <td className="py-1.5 px-2">{r.classroom_name ?? '—'}</td>
                    <td className="py-1.5 px-2">{r.check_in_time ? formatTime(r.check_in_time) : '—'}</td>
                    <td className="py-1.5 px-2">
                      <Badge variant={cfg.variant} className="text-xs">{cfg.label}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </td>
    </tr>
  );
}

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [teacherId, setTeacherId] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [exporting, setExporting] = useState<'csv' | 'xlsx' | null>(null);

  const { data: teachers } = useQuery({
    queryKey: ['teachers-report'],
    queryFn: () => teachersApi.list({ page_size: 200 }),
  });

  const { data: report, isLoading, refetch } = useQuery({
    queryKey: ['report', dateFrom, dateTo, teacherId, statusFilter],
    queryFn: () => attendanceApi.getReport({
      date_from: dateFrom,
      date_to: dateTo,
      teacher_id: teacherId ? Number(teacherId) : undefined,
      status: statusFilter || undefined,
    }),
    enabled: !!dateFrom && !!dateTo,
  });

  const toggleRow = (id: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleExport = async (format: 'csv' | 'xlsx') => {
    setExporting(format);
    try {
      const blob = await attendanceApi.export(format, {
        date_from: dateFrom,
        date_to: dateTo,
        teacher_id: teacherId ? Number(teacherId) : undefined,
      });
      downloadBlob(blob, `reporte_${dateFrom}_${dateTo}.${format}`);
    } catch {
      toast.error('Error al exportar');
    } finally {
      setExporting(null);
    }
  };

  const rows: any[] = Array.isArray(report) ? report : ((report as any)?.results ?? []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Reportes de asistencia</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="h-4 w-4" />}
            isLoading={exporting === 'csv'}
            onClick={() => handleExport('csv')}
          >
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="h-4 w-4" />}
            isLoading={exporting === 'xlsx'}
            onClick={() => handleExport('xlsx')}
          >
            Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filtros</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-500">Desde</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-500">Hasta</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <Select
            label="Docente"
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
          >
            <option value="">Todos</option>
            {(teachers?.results ?? []).map((t: any) => (
              <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
            ))}
          </Select>
          <Select
            label="Estado"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            <option value="">Todos</option>
            <option value="present">Presente</option>
            <option value="absent">Ausente</option>
            <option value="late">Tarde</option>
          </Select>
        </div>
        <div className="mt-3">
          <Button variant="primary" size="sm" onClick={() => refetch()}>Aplicar filtros</Button>
        </div>
      </div>

      {/* Results */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : rows.length === 0 ? (
          <div className="py-14 text-center text-sm text-gray-400">
            No se encontraron registros para el período seleccionado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="py-3 px-4 text-left font-medium text-gray-500">Docente</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-500 hidden sm:table-cell">Total clases</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-500 hidden sm:table-cell">Presentes</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-500 hidden md:table-cell">Ausentes</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-500 hidden md:table-cell">% Asistencia</th>
                  <th className="py-3 px-4 text-right font-medium text-gray-500">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row: any) => {
                  const isExpanded = expandedRows.has(row.teacher_id ?? row.id);
                  const pct = row.total_classes ? (row.present_count / row.total_classes) : 0;
                  const pctVariant = pct >= 0.9 ? 'success' : pct >= 0.7 ? 'warning' : 'danger';

                  return (
                    <React.Fragment key={row.teacher_id ?? row.id}>
                      <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 font-medium text-gray-900">{row.teacher_name}</td>
                        <td className="py-3 px-4 hidden sm:table-cell text-gray-600">{row.total_classes ?? 0}</td>
                        <td className="py-3 px-4 hidden sm:table-cell text-gray-600">{row.present_count ?? 0}</td>
                        <td className="py-3 px-4 hidden md:table-cell text-gray-600">{row.absent_count ?? 0}</td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          <Badge variant={pctVariant}>{formatPercent(pct)}</Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {row.records?.length > 0 && (
                            <button
                              onClick={() => toggleRow(row.teacher_id ?? row.id)}
                              className="flex items-center gap-1 ml-auto text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              {isExpanded ? 'Ocultar' : 'Ver'}
                            </button>
                          )}
                        </td>
                      </tr>
                      {isExpanded && row.records?.length > 0 && (
                        <ExpandedRows records={row.records} />
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
