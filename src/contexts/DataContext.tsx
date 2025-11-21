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
    console.log('🔄 [DataContext] API ВЫЗОВ: bookings.getAllData()');
    try {
      const response = await api.bookings.getAllData();
      setBookings(response.bookings || []);
      console.log('✅ [DataContext] Записи загружены:', response.bookings?.length || 0);
    } catch (err) {
      console.error('❌ [DataContext] Error loading bookings:', err);
    }
  };

  const refreshServices = async () => {
    console.log('🔄 [DataContext] API ВЫЗОВ: services.getAll()');
    try {
      const response = await api.services.getAll();
      setServices(response.services || []);
      console.log('✅ [DataContext] Услуги загружены:', response.services?.length || 0);
    } catch (err) {
      console.error('❌ [DataContext] Error loading services:', err);
    }
  };

  const refreshClients = async () => {
    console.log('🔄 [DataContext] API ВЫЗОВ: clients.getAll()');
    try {
      const response = await api.clients.getAll();
      setClients(response.clients || []);
      console.log('✅ [DataContext] Клиенты загружены:', response.clients?.length || 0);
    } catch (err) {
      console.error('❌ [DataContext] Error loading clients:', err);
    }
  };

  const refreshSettings = async () => {
    console.log('🔄 [DataContext] API ВЫЗОВ: settings.get()');
    try {
      const response = await api.settings.get();
      setSettings(response.settings || {});
      console.log('✅ [DataContext] Настройки загружены:', Object.keys(response.settings || {}).length, 'ключей');
    } catch (err) {
      console.error('❌ [DataContext] Error loading settings:', err);
    }
  };

  const refreshEvents = async () => {
    console.log('🔄 [DataContext] API ВЫЗОВ: events.getAll()');
    try {
      const response = await api.events.getAll();
      setEvents(response.events || []);
      console.log('✅ [DataContext] События загружены:', response.events?.length || 0);
    } catch (err) {
      console.error('❌ [DataContext] Error loading events:', err);
    }
  };

  const refreshWeekSchedule = async () => {
    console.log('🔄 [DataContext] API ВЫЗОВ: schedule.getWeek()');
    try {
      const response = await api.schedule.getWeek();
      setWeekSchedule(response.schedule || []);
      console.log('✅ [DataContext] Недельное расписание загружено:', response.schedule?.length || 0);
    } catch (err) {
      console.error('❌ [DataContext] Error loading week schedule:', err);
    }
  };

  const refreshBlockedDates = async () => {
    console.log('🔄 [DataContext] API ВЫЗОВ: blockedDates.getAll()');
    try {
      const response = await api.blockedDates.getAll();
      setBlockedDates(response.blockedDates || []);
      console.log('✅ [DataContext] Заблокированные даты загружены:', response.blockedDates?.length || 0);
    } catch (err) {
      console.error('❌ [DataContext] Error loading blocked dates:', err);
    }
  };

  const refreshAll = async () => {
    console.log('🚀 [DataContext] НАЧАЛО: Загрузка всех данных (1 оптимизированный вызов API)');
    setLoading(true);
    setError(null);
    try {
      const data = await api.admin.getAllData();
      
      setBookings(data.bookings || []);
      setServices(data.services || []);
      setClients(data.clients || []);
      setSettings(data.settings || {});
      setEvents(data.events || []);
      setWeekSchedule(data.weekSchedule || []);
      setBlockedDates(data.blockedDates || []);
      
      console.log('🎉 [DataContext] ЗАВЕРШЕНО: Все данные загружены одним запросом');
      console.log('  📊 Записи:', data.bookings?.length || 0);
      console.log('  📊 Услуги:', data.services?.length || 0);
      console.log('  📊 Клиенты:', data.clients?.length || 0);
      console.log('  📊 Настройки:', Object.keys(data.settings || {}).length, 'ключей');
      console.log('  📊 События:', data.events?.length || 0);
      console.log('  📊 Расписание:', data.weekSchedule?.length || 0);
      console.log('  📊 Блокировки:', data.blockedDates?.length || 0);
    } catch (err) {
      setError('Ошибка загрузки данных');
      console.error('❌ [DataContext] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🎬 [DataContext] DataProvider монтирован - запускаем refreshAll()');
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