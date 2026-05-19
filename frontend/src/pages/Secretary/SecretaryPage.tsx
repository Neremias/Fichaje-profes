import React, { useState } from 'react';
import { UserCheck, CalendarDays, Settings, AlertCircle } from 'lucide-react';
import AsignacionesTab from './AsignacionesTab';
import CalendarioTab from './CalendarioTab';
import ConfiguracionTab from './ConfiguracionTab';
import ExcepcionesTab from './ExcepcionesTab';

type Tab = 'asignaciones' | 'calendario' | 'configuracion' | 'excepciones';

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'asignaciones', label: 'Asignaciones', icon: UserCheck },
  { id: 'calendario', label: 'Calendario Académico', icon: CalendarDays },
  { id: 'configuracion', label: 'Configuración', icon: Settings },
  { id: 'excepciones', label: 'Excepciones', icon: AlertCircle },
];

export default function SecretaryPage() {
  const [activeTab, setActiveTab] = useState<Tab>('asignaciones');

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Secretaría</h1>

      {/* Tab bar */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="-mb-px flex gap-4 min-w-max" aria-label="Tabs">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={[
                'flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                activeTab === id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              ].join(' ')}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'asignaciones' && <AsignacionesTab />}
      {activeTab === 'calendario' && <CalendarioTab />}
      {activeTab === 'configuracion' && <ConfiguracionTab />}
      {activeTab === 'excepciones' && <ExcepcionesTab />}
    </div>
  );
}
