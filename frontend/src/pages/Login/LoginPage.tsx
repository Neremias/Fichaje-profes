import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GraduationCap, Eye, EyeOff, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const schema = z.object({
  username: z.string().min(1, 'El usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
  remember: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPass, setShowPass] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await login({ username: data.username, password: data.password });
      const next = searchParams.get('next') || null;
      if (next) {
        navigate(next, { replace: true });
      } else {
        // will be handled by App.tsx redirect
        navigate('/', { replace: true });
      }
    } catch {
      toast.error('Usuario o contraseña incorrectos');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl bg-white shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-8 py-8 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
              <GraduationCap className="h-9 w-9 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Fichaje Docente</h1>
            <p className="mt-1 text-sm text-indigo-200">ICES &amp; UCSE</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="px-8 py-7 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Iniciar sesión</h2>
              <p className="text-sm text-gray-500">Ingresá tus credenciales para continuar</p>
            </div>

            <Input
              label="Usuario"
              placeholder="nombre.apellido"
              autoComplete="username"
              autoFocus
              error={errors.username?.message}
              leftElement={<User className="h-4 w-4" />}
              {...register('username')}
            />

            <Input
              label="Contraseña"
              type={showPass ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              error={errors.password?.message}
              leftElement={<Lock className="h-4 w-4" />}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              {...register('password')}
            />

            <div className="flex items-center gap-2">
              <input
                id="remember"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                {...register('remember')}
              />
              <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
                Recordarme
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              className="w-full"
            >
              Ingresar
            </Button>
          </form>

          <div className="border-t border-gray-100 px-8 py-4 text-center">
            <p className="text-xs text-gray-400">
              ¿Olvidaste tu contraseña? Contactá al administrador.
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-indigo-300">
          Sistema de Fichaje Docente &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
