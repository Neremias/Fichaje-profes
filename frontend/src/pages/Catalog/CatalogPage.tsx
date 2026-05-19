import React, { useState } from 'react';
import { BookOpen, GraduationCap, Clock } from 'lucide-react';
import CarrerasTab from './CarrerasTab';
import MateriasTab from './MateriasTab';
import SlotsTab from './SlotsTab';

type Tab = 'carreras' | 'materias' | 'slots';

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'carreras', label: 'Carreras', icon: GraduationCap },
  { id: 'materias', label: 'Materias', icon: BookOpen },
  { id: 'slots', label: 'Bloques Horarios', icon: Clock },
];

export default function CatalogPage() {
  const [activeTab, setActiveTab] = useState<Tab>('carreras');

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Catálogo Académico</h1>

      {/* Tab bar */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6" aria-label="Tabs">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={[
                'flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors',
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
      {activeTab === 'carreras' && <CarrerasTab />}
      {activeTab === 'materias' && <MateriasTab />}
      {activeTab === 'slots' && <SlotsTab />}
    </div>
  );
}
