import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';

function getTimeString() {
  return new Date().toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getDateString() {
  return new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function QRDisplayPage() {
  const ficharUrl = `${window.location.origin}/fichar`;
  const [time, setTime] = useState(getTimeString());
  const [date, setDate] = useState(getDateString());

  useEffect(() => {
    const id = setInterval(() => {
      setTime(getTimeString());
      setDate(getDateString());
    }, 10_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-indigo-900 flex flex-col items-center justify-center gap-8 px-4">
      {/* Header */}
      <div className="text-center text-white">
        <h1 className="text-3xl font-bold tracking-wide uppercase">
          Registro de Asistencia
        </h1>
        <p className="mt-2 text-indigo-200 text-lg capitalize">{date}</p>
      </div>

      {/* QR Card */}
      <div className="bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center gap-6">
        <QRCode
          value={ficharUrl}
          size={280}
          bgColor="#ffffff"
          fgColor="#1e1b4b"
          level="M"
        />
        <p className="text-indigo-400 text-xs font-mono break-all max-w-xs text-center">
          {ficharUrl}
        </p>
      </div>

      {/* Instruction */}
      <p className="text-indigo-100 text-xl font-medium text-center max-w-md">
        Escaneá el QR para registrar tu asistencia
      </p>

      {/* Clock */}
      <div className="text-white text-6xl font-mono font-bold tracking-widest tabular-nums">
        {time}
      </div>
    </div>
  );
}
