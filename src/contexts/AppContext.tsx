import { createContext, useContext, useState, ReactNode } from 'react';

type EventType = 'study' | 'event' | 'booking';

interface CalendarEvent {
  id: number;
  date: Date;
  type: EventType;
  title: string;
  startTime: string;
  endTime: string;
  description?: string;
}

interface WeekSchedule {
  [key: string]: { start: string; end: string } | null;
}

interface AppContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  showEventDialog: boolean;
  setShowEventDialog: (show: boolean) => void;
  showStudyDialog: boolean;
  setShowStudyDialog: (show: boolean) => void;
  blockedDates: Date[];
  setBlockedDates: (dates: Date[]) => void;
  weekSchedule: WeekSchedule;
  setWeekSchedule: (schedule: WeekSchedule) => void;
  calendarEvents: CalendarEvent[];
  setCalendarEvents: (events: CalendarEvent[]) => void;
  newEvent: {
    title: string;
    startTime: string;
    endTime: string;
    description: string;
  };
  setNewEvent: (event: any) => void;
  conflictWarning: {
    show: boolean;
    message: string;
    conflicts: CalendarEvent[];
  };
  setConflictWarning: (warning: any) => void;
  mockBookings: Array<{
    id: number;
    client: string;
    service: string;
    time: string;
    status: string;
    duration: number;
  }>;
  mockServices: Array<{
    id: number;
    name: string;
    duration: string;
    price: string;
    active: boolean;
  }>;
  mockClients: Array<{
    id: number;
    name: string;
    visits: number;
    lastVisit: string;
  }>;
  stats: {
    todayBookings: number;
    pendingApproval: number;
    totalClients: number;
    workload: number;
  };
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
  getEventTypeColor: (type: EventType) => string;
  getEventTypeText: (type: EventType) => string;
  timeToMinutes: (time: string) => number;
  checkTimeConflict: (newStart: string, newEnd: string, existingStart: string, existingEnd: string) => boolean;
  getDayOfWeek: (date: Date) => string;
  getEventsForDate: (selectedDate: Date | undefined) => CalendarEvent[];
  checkConflicts: () => void;
  addEventConfirmed: () => void;
  addEvent: () => void;
  toggleBlockedDate: () => void;
  isDayBlocked: (checkDate: Date | undefined) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showStudyDialog, setShowStudyDialog] = useState(false);
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);

  const [weekSchedule, setWeekSchedule] = useState<WeekSchedule>({
    monday: { start: '09:00', end: '15:00' },
    tuesday: { start: '10:00', end: '16:00' },
    wednesday: null,
    thursday: { start: '09:00', end: '15:00' },
    friday: { start: '10:00', end: '14:00' },
    saturday: null,
    sunday: null,
  });

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([
    {
      id: 1,
      date: new Date(),
      type: 'study',
      title: 'Учеба',
      startTime: '09:00',
      endTime: '15:00',
    },
    {
      id: 2,
      date: new Date(new Date().setDate(new Date().getDate() + 1)),
      type: 'event',
      title: 'День рождения друга',
      startTime: '18:00',
      endTime: '22:00',
      description: 'Личное мероприятие',
    },
  ]);

  const [newEvent, setNewEvent] = useState({
    title: '',
    startTime: '',
    endTime: '',
    description: '',
  });

  const [conflictWarning, setConflictWarning] = useState<{
    show: boolean;
    message: string;
    conflicts: CalendarEvent[];
  }>({ show: false, message: '', conflicts: [] });

  const mockBookings = [
    { id: 1, client: 'Анна Петрова', service: 'Маникюр', time: '10:00', status: 'confirmed', duration: 60 },
    { id: 2, client: 'Мария Иванова', service: 'Педикюр', time: '12:00', status: 'pending', duration: 90 },
    { id: 3, client: 'Елена Сидорова', service: 'Маникюр + Педикюр', time: '14:30', status: 'confirmed', duration: 120 },
    { id: 4, client: 'Ольга Смирнова', service: 'Маникюр', time: '17:00', status: 'pending', duration: 60 },
  ];

  const mockServices = [
    { id: 1, name: 'Маникюр', duration: '60 мин', price: '1500₽', active: true },
    { id: 2, name: 'Педикюр', duration: '90 мин', price: '2000₽', active: true },
    { id: 3, name: 'Комплекс', duration: '120 мин', price: '3000₽', active: false },
  ];

  const mockClients = [
    { id: 1, name: 'Анна Петрова', visits: 12, lastVisit: '15.11.2025' },
    { id: 2, name: 'Мария Иванова', visits: 8, lastVisit: '10.11.2025' },
    { id: 3, name: 'Елена Сидорова', visits: 5, lastVisit: '08.11.2025' },
  ];

  const stats = {
    todayBookings: 4,
    pendingApproval: 2,
    totalClients: 45,
    workload: 75,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Подтверждено';
      case 'pending':
        return 'Ожидает';
      default:
        return 'Неизвестно';
    }
  };

  const getEventTypeColor = (type: EventType) => {
    switch (type) {
      case 'study':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'event':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'booking':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getEventTypeText = (type: EventType) => {
    switch (type) {
      case 'study':
        return 'Учеба';
      case 'event':
        return 'Мероприятие';
      case 'booking':
        return 'Запись';
      default:
        return 'Событие';
    }
  };

  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const checkTimeConflict = (newStart: string, newEnd: string, existingStart: string, existingEnd: string) => {
    const newStartMin = timeToMinutes(newStart);
    const newEndMin = timeToMinutes(newEnd);
    const existingStartMin = timeToMinutes(existingStart);
    const existingEndMin = timeToMinutes(existingEnd);

    return (
      (newStartMin >= existingStartMin && newStartMin < existingEndMin) ||
      (newEndMin > existingStartMin && newEndMin <= existingEndMin) ||
      (newStartMin <= existingStartMin && newEndMin >= existingEndMin)
    );
  };

  const getDayOfWeek = (date: Date) => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  };

  const getEventsForDate = (selectedDate: Date | undefined) => {
    if (!selectedDate) return [];
    return calendarEvents.filter(
      (event) => event.date.toDateString() === selectedDate.toDateString()
    );
  };

  const checkConflicts = () => {
    if (!date || !newEvent.startTime || !newEvent.endTime) return;

    const conflicts: CalendarEvent[] = [];
    const dayOfWeek = getDayOfWeek(date);
    const studySchedule = weekSchedule[dayOfWeek];

    if (studySchedule) {
      const hasStudyConflict = checkTimeConflict(
        newEvent.startTime,
        newEvent.endTime,
        studySchedule.start,
        studySchedule.end
      );

      if (hasStudyConflict) {
        conflicts.push({
          id: 0,
          date: new Date(date),
          type: 'study',
          title: 'Учеба',
          startTime: studySchedule.start,
          endTime: studySchedule.end,
        });
      }
    }

    const eventsOnDate = getEventsForDate(date);
    eventsOnDate.forEach((event) => {
      if (event.type === 'booking') {
        const hasConflict = checkTimeConflict(
          newEvent.startTime,
          newEvent.endTime,
          event.startTime,
          event.endTime
        );
        if (hasConflict) {
          conflicts.push(event);
        }
      }
    });

    if (conflicts.length > 0) {
      const messages = conflicts.map((c) => {
        if (c.type === 'study') {
          return `• Учеба: ${c.startTime}-${c.endTime} (время будет вырезано)`;
        }
        return `• ${c.title}: ${c.startTime}-${c.endTime} (запись будет отменена)`;
      });

      setConflictWarning({
        show: true,
        message: messages.join('\n'),
        conflicts,
      });
    } else {
      addEventConfirmed();
    }
  };

  const addEventConfirmed = () => {
    if (!date || !newEvent.title || !newEvent.startTime || !newEvent.endTime) return;

    const event: CalendarEvent = {
      id: Date.now(),
      date: new Date(date),
      type: 'event',
      title: newEvent.title,
      startTime: newEvent.startTime,
      endTime: newEvent.endTime,
      description: newEvent.description,
    };

    const updatedEvents = calendarEvents.filter(
      (e) => !conflictWarning.conflicts.some((c) => c.id === e.id && c.type === 'booking')
    );

    setCalendarEvents([...updatedEvents, event]);
    setNewEvent({ title: '', startTime: '', endTime: '', description: '' });
    setConflictWarning({ show: false, message: '', conflicts: [] });
    setShowEventDialog(false);
  };

  const addEvent = () => {
    checkConflicts();
  };

  const toggleBlockedDate = () => {
    if (!date) return;
    
    const isBlocked = blockedDates.some(
      (d) => d.toDateString() === date.toDateString()
    );

    if (isBlocked) {
      setBlockedDates(blockedDates.filter((d) => d.toDateString() !== date.toDateString()));
    } else {
      const confirmedBookings = calendarEvents.filter(
        (e) => e.date.toDateString() === date.toDateString() && e.type === 'booking'
      );

      if (confirmedBookings.length > 0) {
        const confirmBlock = window.confirm(
          `На этот день есть ${confirmedBookings.length} записей клиентов. Заблокировать день и отменить их?`
        );
        if (!confirmBlock) return;

        setCalendarEvents(
          calendarEvents.filter(
            (e) => !(e.date.toDateString() === date.toDateString() && e.type === 'booking')
          )
        );
      }

      setBlockedDates([...blockedDates, new Date(date)]);
    }
  };

  const isDayBlocked = (checkDate: Date | undefined) => {
    if (!checkDate) return false;
    return blockedDates.some((d) => d.toDateString() === checkDate.toDateString());
  };

  const value = {
    activeTab,
    setActiveTab,
    sidebarOpen,
    setSidebarOpen,
    date,
    setDate,
    showEventDialog,
    setShowEventDialog,
    showStudyDialog,
    setShowStudyDialog,
    blockedDates,
    setBlockedDates,
    weekSchedule,
    setWeekSchedule,
    calendarEvents,
    setCalendarEvents,
    newEvent,
    setNewEvent,
    conflictWarning,
    setConflictWarning,
    mockBookings,
    mockServices,
    mockClients,
    stats,
    getStatusColor,
    getStatusText,
    getEventTypeColor,
    getEventTypeText,
    timeToMinutes,
    checkTimeConflict,
    getDayOfWeek,
    getEventsForDate,
    checkConflicts,
    addEventConfirmed,
    addEvent,
    toggleBlockedDate,
    isDayBlocked,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
