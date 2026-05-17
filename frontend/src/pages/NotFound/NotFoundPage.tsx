import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-sm">
        <p className="text-7xl font-extrabold text-indigo-600">404</p>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Página no encontrada</h1>
        <p className="mt-2 text-gray-500 text-sm">
          La página que buscás no existe o fue movida.
        </p>
        <div className="mt-7 flex items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <Home className="h-4 w-4" />
            Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
