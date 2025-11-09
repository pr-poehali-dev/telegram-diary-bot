import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { Calendar } from '@/components/ui/calendar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

const Index = () => {
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

  const addEvent = () => {
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

    setCalendarEvents([...calendarEvents, event]);
    setNewEvent({ title: '', startTime: '', endTime: '', description: '' });
    setShowEventDialog(false);
  };

  const toggleBlockedDate = () => {
    if (!date) return;
    
    const isBlocked = blockedDates.some(
      (d) => d.toDateString() === date.toDateString()
    );

    if (isBlocked) {
      setBlockedDates(blockedDates.filter((d) => d.toDateString() !== date.toDateString()));
    } else {
      setBlockedDates([...blockedDates, new Date(date)]);
    }
  };

  const getEventsForDate = (selectedDate: Date | undefined) => {
    if (!selectedDate) return [];
    return calendarEvents.filter(
      (event) => event.date.toDateString() === selectedDate.toDateString()
    );
  };

  const isDayBlocked = (checkDate: Date | undefined) => {
    if (!checkDate) return false;
    return blockedDates.some((d) => d.toDateString() === checkDate.toDateString());
  };

  const getDayOfWeek = (date: Date) => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  };

  const eventsForSelectedDate = getEventsForDate(date);

  return (
    <div className="flex h-screen bg-gray-50">
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-xl font-bold text-gray-900">Ежедневник</h1>}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hover:bg-gray-100"
          >
            <Icon name={sidebarOpen ? 'PanelLeftClose' : 'PanelLeftOpen'} size={20} />
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: 'dashboard', icon: 'LayoutDashboard', label: 'Дашборд' },
            { id: 'schedule', icon: 'Calendar', label: 'Расписание' },
            { id: 'bookings', icon: 'ClipboardList', label: 'Записи' },
            { id: 'clients', icon: 'Users', label: 'Клиенты' },
            { id: 'services', icon: 'Briefcase', label: 'Услуги' },
            { id: 'settings', icon: 'Settings', label: 'Настройки' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === item.id
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon name={item.icon} size={20} />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-4 py-3">
            <Avatar>
              <AvatarFallback className="bg-accent text-white">АД</AvatarFallback>
            </Avatar>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">Админ</p>
                <p className="text-xs text-gray-500 truncate">admin@example.com</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Дашборд</h2>
                <p className="text-gray-500 mt-1">Обзор вашего бизнеса</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Записи сегодня
                    </CardTitle>
                    <Icon name="CalendarCheck" size={20} className="text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">{stats.todayBookings}</div>
                    <p className="text-xs text-gray-500 mt-1">+2 от вчера</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Ожидают подтверждения
                    </CardTitle>
                    <Icon name="Clock" size={20} className="text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">{stats.pendingApproval}</div>
                    <p className="text-xs text-gray-500 mt-1">Требуют внимания</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Всего клиентов
                    </CardTitle>
                    <Icon name="Users" size={20} className="text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">{stats.totalClients}</div>
                    <p className="text-xs text-gray-500 mt-1">+5 за месяц</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Загрузка</CardTitle>
                    <Icon name="TrendingUp" size={20} className="text-accent" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">{stats.workload}%</div>
                    <p className="text-xs text-gray-500 mt-1">На эту неделю</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon name="CalendarDays" size={20} />
                      Записи на сегодня
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {mockBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-primary font-bold">{booking.time}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{booking.client}</p>
                            <p className="text-sm text-gray-500">
                              {booking.service} • {booking.duration} мин
                            </p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(booking.status)}>
                          {getStatusText(booking.status)}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon name="Star" size={20} />
                      Топ клиенты
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {mockClients.map((client, index) => (
                      <div
                        key={client.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                            <span className="text-accent font-bold">#{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{client.name}</p>
                            <p className="text-sm text-gray-500">
                              {client.visits} визитов • {client.lastVisit}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Расписание</h2>
                <p className="text-gray-500 mt-1">Управляйте своим временем</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Календарь</span>
                      <Dialog open={showStudyDialog} onOpenChange={setShowStudyDialog}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Icon name="GraduationCap" size={16} />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Шаблон недели (Учеба)</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            {Object.entries(weekSchedule).map(([day, schedule]) => (
                              <div key={day} className="flex items-center gap-4">
                                <Label className="w-24 capitalize">{day}</Label>
                                <Input
                                  type="time"
                                  value={schedule?.start || ''}
                                  onChange={(e) =>
                                    setWeekSchedule({
                                      ...weekSchedule,
                                      [day]: schedule
                                        ? { ...schedule, start: e.target.value }
                                        : { start: e.target.value, end: '' },
                                    })
                                  }
                                  className="flex-1"
                                />
                                <Input
                                  type="time"
                                  value={schedule?.end || ''}
                                  onChange={(e) =>
                                    setWeekSchedule({
                                      ...weekSchedule,
                                      [day]: schedule
                                        ? { ...schedule, end: e.target.value }
                                        : { start: '', end: e.target.value },
                                    })
                                  }
                                  className="flex-1"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setWeekSchedule({ ...weekSchedule, [day]: null })
                                  }
                                >
                                  <Icon name="X" size={16} />
                                </Button>
                              </div>
                            ))}
                            <Button onClick={() => setShowStudyDialog(false)} className="w-full">
                              Сохранить
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      className="rounded-md"
                      modifiers={{
                        blocked: blockedDates,
                        hasStudy: (day) => {
                          const dayName = getDayOfWeek(day);
                          return weekSchedule[dayName] !== null;
                        },
                        hasEvent: (day) =>
                          calendarEvents.some(
                            (e) => e.date.toDateString() === day.toDateString()
                          ),
                      }}
                      modifiersStyles={{
                        blocked: {
                          backgroundColor: '#fee2e2',
                          color: '#991b1b',
                          fontWeight: 'bold',
                        },
                        hasStudy: {
                          backgroundColor: '#dbeafe',
                          color: '#1e40af',
                        },
                        hasEvent: {
                          backgroundColor: '#e9d5ff',
                          color: '#6b21a8',
                        },
                      }}
                    />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
                        <span>Учеба</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded"></div>
                        <span>Мероприятия</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                        <span>Занят</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>
                      {date?.toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="gap-2">
                            <Icon name="Plus" size={16} />
                            Мероприятие
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Добавить мероприятие</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Название</Label>
                              <Input
                                value={newEvent.title}
                                onChange={(e) =>
                                  setNewEvent({ ...newEvent, title: e.target.value })
                                }
                                placeholder="День рождения друга"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Начало</Label>
                                <Input
                                  type="time"
                                  value={newEvent.startTime}
                                  onChange={(e) =>
                                    setNewEvent({ ...newEvent, startTime: e.target.value })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Конец</Label>
                                <Input
                                  type="time"
                                  value={newEvent.endTime}
                                  onChange={(e) =>
                                    setNewEvent({ ...newEvent, endTime: e.target.value })
                                  }
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Описание (опционально)</Label>
                              <Textarea
                                value={newEvent.description}
                                onChange={(e) =>
                                  setNewEvent({ ...newEvent, description: e.target.value })
                                }
                                placeholder="Дополнительная информация..."
                              />
                            </div>
                            <Button onClick={addEvent} className="w-full">
                              Добавить
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        size="sm"
                        variant={isDayBlocked(date) ? 'destructive' : 'outline'}
                        onClick={toggleBlockedDate}
                        className="gap-2"
                      >
                        <Icon name="Ban" size={16} />
                        {isDayBlocked(date) ? 'Разблокировать' : 'Занят'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isDayBlocked(date) && (
                      <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                        <Icon name="AlertCircle" size={20} className="text-red-600" />
                        <div>
                          <p className="font-medium text-red-900">День заблокирован</p>
                          <p className="text-sm text-red-700">
                            Клиенты не смогут записаться на этот день
                          </p>
                        </div>
                      </div>
                    )}

                    {date && weekSchedule[getDayOfWeek(date)] && (
                      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Icon name="GraduationCap" size={20} className="text-blue-600" />
                            <div>
                              <p className="font-medium text-blue-900">Учеба по расписанию</p>
                              <p className="text-sm text-blue-700">
                                {weekSchedule[getDayOfWeek(date)]?.start} -{' '}
                                {weekSchedule[getDayOfWeek(date)]?.end}
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                            Регулярно
                          </Badge>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      {eventsForSelectedDate.length === 0 && !weekSchedule[getDayOfWeek(date || new Date())] && !isDayBlocked(date) && (
                        <div className="text-center py-12 text-gray-400">
                          <Icon name="CalendarOff" size={48} className="mx-auto mb-3" />
                          <p>Нет событий на выбранную дату</p>
                        </div>
                      )}

                      {eventsForSelectedDate.map((event) => (
                        <div
                          key={event.id}
                          className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-primary transition-colors"
                        >
                          <div className="w-20 text-center">
                            <p className="text-lg font-bold text-primary">{event.startTime}</p>
                            <p className="text-xs text-gray-500">{event.endTime}</p>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-gray-900">{event.title}</p>
                              <Badge className={getEventTypeColor(event.type)}>
                                {getEventTypeText(event.type)}
                              </Badge>
                            </div>
                            {event.description && (
                              <p className="text-sm text-gray-500">{event.description}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Icon name="Pencil" size={16} />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setCalendarEvents(
                                  calendarEvents.filter((e) => e.id !== event.id)
                                )
                              }
                            >
                              <Icon name="Trash2" size={16} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Записи</h2>
                  <p className="text-gray-500 mt-1">Управление заявками клиентов</p>
                </div>
                <Button className="gap-2">
                  <Icon name="Plus" size={16} />
                  Новая запись
                </Button>
              </div>

              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                  <TabsTrigger value="all">Все</TabsTrigger>
                  <TabsTrigger value="pending">Ожидают</TabsTrigger>
                  <TabsTrigger value="confirmed">Подтверждены</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-6">
                  <Card>
                    <CardContent className="pt-6 space-y-3">
                      {mockBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center gap-6">
                            <div className="text-center min-w-[80px]">
                              <p className="text-2xl font-bold text-primary">{booking.time}</p>
                              <p className="text-xs text-gray-500">{booking.duration} мин</p>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-lg">{booking.client}</p>
                              <p className="text-gray-600">{booking.service}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={getStatusColor(booking.status)}>
                              {getStatusText(booking.status)}
                            </Badge>
                            {booking.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button size="sm" variant="default" className="gap-2">
                                  <Icon name="Check" size={16} />
                                  Подтвердить
                                </Button>
                                <Button size="sm" variant="outline" className="gap-2">
                                  <Icon name="X" size={16} />
                                  Отклонить
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {activeTab === 'clients' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Клиенты</h2>
                  <p className="text-gray-500 mt-1">База ваших клиентов</p>
                </div>
                <Button className="gap-2">
                  <Icon name="UserPlus" size={16} />
                  Добавить клиента
                </Button>
              </div>

              <Card>
                <CardContent className="pt-6 space-y-3">
                  {mockClients.map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center justify-between p-5 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-primary text-white text-lg">
                            {client.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-gray-900 text-lg">{client.name}</p>
                          <p className="text-sm text-gray-500">
                            {client.visits} визитов • Последний: {client.lastVisit}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Icon name="Eye" size={16} />
                        Подробнее
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Услуги</h2>
                  <p className="text-gray-500 mt-1">Управление прайс-листом</p>
                </div>
                <Button className="gap-2">
                  <Icon name="Plus" size={16} />
                  Добавить услугу
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockServices.map((service) => (
                  <Card key={service.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl">{service.name}</CardTitle>
                          <p className="text-sm text-gray-500 mt-1">{service.duration}</p>
                        </div>
                        <Switch checked={service.active} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-3xl font-bold text-primary">{service.price}</div>
                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1 gap-2">
                            <Icon name="Pencil" size={16} />
                            Изменить
                          </Button>
                          <Button variant="outline" size="icon">
                            <Icon name="Trash2" size={16} />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Настройки</h2>
                <p className="text-gray-500 mt-1">Конфигурация системы</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon name="Clock" size={20} />
                      Рабочее время
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Начало работы</Label>
                        <Input type="time" defaultValue="10:00" />
                      </div>
                      <div className="space-y-2">
                        <Label>Конец работы</Label>
                        <Input type="time" defaultValue="20:00" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon name="Timer" size={20} />
                      Буферы времени
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Время подготовки (мин)</Label>
                      <Input type="number" defaultValue="10" min="0" max="30" />
                    </div>
                    <div className="space-y-2">
                      <Label>Буфер между сеансами (мин)</Label>
                      <Input type="number" defaultValue="15" min="0" max="30" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon name="Bell" size={20} />
                      Уведомления
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Время напоминания (за день)</Label>
                      <Input type="time" defaultValue="09:00" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Напоминание за 90 минут</Label>
                      <Switch defaultChecked />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon name="Zap" size={20} />
                      Дополнительно
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Приоритет времени работы</Label>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Автоподтверждение записей</Label>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Link" size={20} />
                    Интеграция с Telegram
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Токен бота</Label>
                      <Input placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz" />
                    </div>
                    <Button className="gap-2">
                      <Icon name="Save" size={16} />
                      Сохранить настройки
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
