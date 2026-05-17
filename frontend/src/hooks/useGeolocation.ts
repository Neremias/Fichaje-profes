import { useCallback, useEffect, useRef, useState } from 'react';
import { attendanceApi } from '@/lib/api';

export interface GeolocationState {
  coords: GeolocationCoordinates | null;
  error: string | null;
  isLoading: boolean;
  isSupported: boolean;
  accuracy: number | null;
  locationValid: boolean | null;
  locationMessage: string;
}

export function useGeolocation(classroomId?: number) {
  const [state, setState] = useState<GeolocationState>({
    coords: null,
    error: null,
    isLoading: false,
    isSupported: 'geolocation' in navigator,
    accuracy: null,
    locationValid: null,
    locationMessage: '',
  });

  const watchIdRef = useRef<number | null>(null);

  const validateWithServer = useCallback(
    async (lat: number, lng: number) => {
      try {
        const result = await attendanceApi.validateLocation(lat, lng, classroomId);
        setState((prev) => ({
          ...prev,
          locationValid: result.valid,
          locationMessage: result.message,
        }));
      } catch {
        setState((prev) => ({
          ...prev,
          locationValid: null,
          locationMessage: 'No se pudo verificar la ubicación',
        }));
      }
    },
    [classroomId]
  );

  const requestLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setState((prev) => ({
        ...prev,
        error: 'Geolocalización no soportada en este dispositivo',
        isSupported: false,
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setState((prev) => ({
          ...prev,
          coords: position.coords,
          accuracy: position.coords.accuracy,
          isLoading: false,
          error: null,
        }));
        validateWithServer(position.coords.latitude, position.coords.longitude);
      },
      (err) => {
        let message = 'Error al obtener ubicación';
        if (err.code === 1) message = 'Permiso de ubicación denegado';
        else if (err.code === 2) message = 'Ubicación no disponible';
        else if (err.code === 3) message = 'Tiempo de espera agotado';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
          locationValid: false,
          locationMessage: message,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }, [validateWithServer]);

  useEffect(() => {
    requestLocation();
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [requestLocation]);

  return { ...state, requestLocation };
}
