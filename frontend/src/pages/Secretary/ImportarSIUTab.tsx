import React, { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Upload, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { importarSIUApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import type { ImportSIUResult } from '@/types';

const TEMPLATE_HEADERS = 'codigo_siu,nombre_materia,docente_username,rol,dia_semana,hora_inicio,hora_fin,fecha_inicio,fecha_fin';
const TEMPLATE_EXAMPLE = 'DS208,Diseño de Software,jdoe,titular,lunes,08:00,10:00,2025-03-01,2025-11-30';

function downloadTemplate() {
  const content = [TEMPLATE_HEADERS, TEMPLATE_EXAMPLE].join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'plantilla_siu.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function ImportarSIUTab() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportSIUResult | null>(null);

  const importMutation = useMutation({
    mutationFn: (file: File) => importarSIUApi.importar(file),
    onSuccess: (data) => {
      setResult(data);
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = '';
      if (data.errores.length === 0) {
        toast.success('Importación completada sin errores');
      } else {
        toast(`Importación completada con ${data.errores.length} error(es)`, { icon: '⚠️' });
      }
    },
    onError: () => toast.error('Error al importar el archivo'),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setResult(null);
  };

  const handleImport = () => {
    if (selectedFile) importMutation.mutate(selectedFile);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center space-y-3">
        <Upload className="h-10 w-10 mx-auto text-gray-400" />
        <p className="text-sm font-medium text-gray-700">
          Suba una planilla CSV exportada del SIU para poblar materias, horarios y asignaciones.
        </p>
        <p className="text-xs text-gray-500">
          Columnas requeridas: <code className="bg-white border border-gray-200 rounded px-1">codigo_siu</code>,{' '}
          <code className="bg-white border border-gray-200 rounded px-1">nombre_materia</code>,{' '}
          <code className="bg-white border border-gray-200 rounded px-1">docente_username</code>,{' '}
          <code className="bg-white border border-gray-200 rounded px-1">rol</code>,{' '}
          <code className="bg-white border border-gray-200 rounded px-1">dia_semana</code>,{' '}
          <code className="bg-white border border-gray-200 rounded px-1">hora_inicio</code>,{' '}
          <code className="bg-white border border-gray-200 rounded px-1">hora_fin</code>,{' '}
          <code className="bg-white border border-gray-200 rounded px-1">fecha_inicio</code>
        </p>
        <button
          type="button"
          onClick={downloadTemplate}
          className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"
        >
          <FileText className="h-3.5 w-3.5" /> Descargar plantilla de ejemplo
        </button>
      </div>

      <div className="flex items-center gap-3">
        <label className="flex-1">
          <span className="sr-only">Seleccionar archivo CSV</span>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-600
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-medium
              file:bg-indigo-50 file:text-indigo-700
              hover:file:bg-indigo-100 cursor-pointer"
          />
        </label>
        <Button
          onClick={handleImport}
          disabled={!selectedFile || importMutation.isPending}
          isLoading={importMutation.isPending}
        >
          Importar
        </Button>
      </div>

      {result && (
        <div className="rounded-lg border border-gray-200 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-800">Resultado de la importación</h3>
          <dl className="grid grid-cols-3 gap-4">
            {[
              { label: 'Materias creadas', value: result.materias_creadas },
              { label: 'Slots creados', value: result.slots_creados },
              { label: 'Asignaciones procesadas', value: result.asignaciones_creadas_o_actualizadas },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-md bg-indigo-50 px-4 py-3 text-center">
                <dd className="text-2xl font-bold text-indigo-700">{value}</dd>
                <dt className="text-xs text-indigo-500 mt-0.5">{label}</dt>
              </div>
            ))}
          </dl>

          {result.errores.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber-700">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">{result.errores.length} fila(s) con error</span>
              </div>
              <ul className="divide-y divide-gray-100 rounded-md border border-amber-200 bg-amber-50 text-xs">
                {result.errores.map((e, i) => (
                  <li key={i} className="flex gap-3 px-3 py-2">
                    <span className="font-mono text-amber-700 shrink-0">Fila {e.fila}</span>
                    <span className="text-gray-700">{e.detalle}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Sin errores</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
