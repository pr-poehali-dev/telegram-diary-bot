import { useState, useEffect } from 'react';
import { api } from '@/services/api';

export const useBookings = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBookings = async (date?: string) => {
    try {
      setLoading(true);
      const response = date 
        ? await api.bookings.getByDate(date)
        : await api.bookings.getAll();
      setBookings(response.bookings || []);
      setError(null);
    } catch (err) {
      setError('Ошибка загрузки записей');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  return { bookings, loading, error, reload: loadBookings };
};

export const useServices = () => {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadServices = async () => {
    try {
      setLoading(true);
      const response = await api.services.getAll();
      setServices(response.services || []);
      setError(null);
    } catch (err) {
      setError('Ошибка загрузки услуг');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  return { services, loading, error, reload: loadServices };
};

export const useClients = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadClients = async () => {
    try {
      setLoading(true);
      const response = await api.clients.getAll();
      setClients(response.clients || []);
      setError(null);
    } catch (err) {
      setError('Ошибка загрузки клиентов');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  return { clients, loading, error, reload: loadClients };
};

export const useEvents = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = async (date?: string) => {
    try {
      setLoading(true);
      const response = date 
        ? await api.events.getByDate(date)
        : await api.events.getAll();
      setEvents(response.events || []);
      setError(null);
    } catch (err) {
      setError('Ошибка загрузки событий');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (event: any) => {
    try {
      await api.events.create(event);
      await loadEvents();
      return true;
    } catch (err) {
      setError('Ошибка создания события');
      console.error(err);
      return false;
    }
  };

  const deleteEvent = async (id: number) => {
    try {
      await api.events.delete(id);
      await loadEvents();
      return true;
    } catch (err) {
      setError('Ошибка удаления события');
      console.error(err);
      return false;
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  return { events, loading, error, reload: loadEvents, createEvent, deleteEvent };
};