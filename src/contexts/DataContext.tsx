import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/services/api';

interface DataContextType {
  bookings: any[];
  services: any[];
  clients: any[];
  settings: any;
  events: any[];
  weekSchedule: any[];
  blockedDates: any[];
  loading: boolean;
  error: string | null;
  refreshBookings: () => Promise<void>;
  refreshServices: () => Promise<void>;
  refreshClients: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  refreshEvents: () => Promise<void>;
  refreshWeekSchedule: () => Promise<void>;
  refreshBlockedDates: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [events, setEvents] = useState<any[]>([]);
  const [weekSchedule, setWeekSchedule] = useState<any[]>([]);
  const [blockedDates, setBlockedDates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshBookings = async () => {
    try {
      const response = await api.bookings.getAllData();
      setBookings(response.bookings || []);
    } catch (err) {
      console.error('Error loading bookings:', err);
    }
  };

  const refreshServices = async () => {
    try {
      const response = await api.services.getAll();
      setServices(response.services || []);
    } catch (err) {
      console.error('Error loading services:', err);
    }
  };

  const refreshClients = async () => {
    try {
      const response = await api.clients.getAll();
      setClients(response.clients || []);
    } catch (err) {
      console.error('Error loading clients:', err);
    }
  };

  const refreshSettings = async () => {
    try {
      const response = await api.settings.get();
      setSettings(response.settings || {});
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  };

  const refreshEvents = async () => {
    try {
      const response = await api.events.getAll();
      setEvents(response.events || []);
    } catch (err) {
      console.error('Error loading events:', err);
    }
  };

  const refreshWeekSchedule = async () => {
    try {
      const response = await api.schedule.getWeek();
      setWeekSchedule(response.schedule || []);
    } catch (err) {
      console.error('Error loading week schedule:', err);
    }
  };

  const refreshBlockedDates = async () => {
    try {
      const response = await api.blockedDates.getAll();
      setBlockedDates(response.blockedDates || []);
    } catch (err) {
      console.error('Error loading blocked dates:', err);
    }
  };

  const refreshAll = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        refreshBookings(),
        refreshServices(),
        refreshClients(),
        refreshSettings(),
        refreshEvents(),
        refreshWeekSchedule(),
        refreshBlockedDates(),
      ]);
    } catch (err) {
      setError('Ошибка загрузки данных');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  return (
    <DataContext.Provider
      value={{
        bookings,
        services,
        clients,
        settings,
        events,
        weekSchedule,
        blockedDates,
        loading,
        error,
        refreshBookings,
        refreshServices,
        refreshClients,
        refreshSettings,
        refreshEvents,
        refreshWeekSchedule,
        refreshBlockedDates,
        refreshAll,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
