import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { api } from '@/services/api';

interface WeekScheduleItem {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

interface CalendarEvent {
  id: number;
  type: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  description?: string;
}

interface BlockedDate {
  id: number;
  date: string;
}

const DAYS = [
  { value: 'monday', label: 'Понедельник' },
  { value: 'tuesday', label: 'Вторник' },
  { value: 'wednesday', label: 'Среда' },
  { value: 'thursday', label: 'Четверг' },
  { value: 'friday', label: 'Пятница' },
  { value: 'saturday', label: 'Суббота' },
  { value: 'sunday', label: 'Воскресенье' },
];

export default function MyScheduleTab() {
  const [weekSchedule, setWeekSchedule] = useState<WeekScheduleItem[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showBlockDate, setShowBlockDate] = useState(false);
  const [showConflict, setShowConflict] = useState(false);
  const [conflictData, setConflictData] = useState<any>(null);
  
  const [newSchedule, setNewSchedule] = useState({
    day_of_week: 'monday',
    start_time: '09:00',
    end_time: '15:00',
  });
  
  const [newEvent, setNewEvent] = useState({
    event_type: 'personal',
    title: '',
    event_date: '',
    start_time: '10:00',
    end_time: '11:00',
    description: '',
  });
  
  const [blockDate, setBlockDate] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [scheduleRes, eventsRes, blockedRes] = await Promise.all([
        api.schedule.getWeek(),
        api.events.getAll(),
        api.blockedDates.getAll(),
      ]);
      
      setWeekSchedule(scheduleRes.schedule || []);
      setEvents(eventsRes.events || []);
      setBlockedDates(blockedRes.blockedDates || []);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    }
  };

  const handleAddSchedule = async () => {
    try {
      await api.schedule.create(newSchedule);
      setShowAddSchedule(false);
      setNewSchedule({ day_of_week: 'monday', start_time: '09:00', end_time: '15:00' });
      loadData();
    } catch (error) {
      console.error('Ошибка создания расписания:', error);
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    try {
      await api.schedule.delete(id);
      loadData();
    } catch (error) {
      console.error('Ошибка удаления расписания:', error);
    }
  };

  const handleAddEvent = async (force = false) => {
    // Валидация
    if (!newEvent.title.trim()) {
      alert('Введите название мероприятия');
      return;
    }
    if (!newEvent.event_date) {
      alert('Выберите дату');
      return;
    }
    if (!newEvent.start_time || !newEvent.end_time) {
      alert('Укажите время начала и окончания');
      return;
    }
    
    try {
      const response = await api.events.create({ ...newEvent, force });
      
      if (response.conflict) {
        setConflictData(response);
        setShowConflict(true);
        return;
      }
      
      setShowAddEvent(false);
      setNewEvent({
        event_type: 'personal',
        title: '',
        event_date: '',
        start_time: '10:00',
        end_time: '11:00',
        description: '',
      });
      loadData();
    } catch (error) {
      console.error('Ошибка создания события:', error);
      alert('Не удалось создать мероприятие. Проверьте данные.');
    }
  };

  const handleDeleteEvent = async (id: number) => {
    try {
      await api.events.delete(id);
      loadData();
    } catch (error) {
      console.error('Ошибка удаления события:', error);
    }
  };

  const handleBlockDate = async (force = false) => {
    try {
      const response = await api.blockedDates.add(blockDate, force);
      
      if (response.conflict) {
        setConflictData(response);
        setShowConflict(true);
        return;
      }
      
      setShowBlockDate(false);
      setBlockDate('');
      loadData();
    } catch (error) {
      console.error('Ошибка блокировки даты:', error);
    }
  };

  const handleUnblockDate = async (id: number) => {
    try {
      await api.blockedDates.remove(id);
      loadData();
    } catch (error) {
      console.error('Ошибка разблокировки даты:', error);
    }
  };

  const handleForceAction = () => {
    setShowConflict(false);
    if (conflictData?.bookings) {
      handleAddEvent(true);
    } else {
      handleBlockDate(true);
    }
  };

  const getDayLabel = (day: string) => {
    return DAYS.find(d => d.value === day)?.label || day;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Моё расписание</h2>
          <p className="text-muted-foreground">
            Управление учебой, событиями и выходными днями
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Расписание учёбы</CardTitle>
              <CardDescription>Шаблон недели для постоянного расписания</CardDescription>
            </div>
            <Dialog open={showAddSchedule} onOpenChange={setShowAddSchedule}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Icon name="Plus" size={16} />
                  Добавить
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Добавить расписание учёбы</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>День недели</Label>
                    <Select
                      value={newSchedule.day_of_week}
                      onValueChange={(value) => setNewSchedule({ ...newSchedule, day_of_week: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS.map(day => (
                          <SelectItem key={day.value} value={day.value}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Время начала</Label>
                    <Input
                      type="time"
                      value={newSchedule.start_time}
                      onChange={(e) => setNewSchedule({ ...newSchedule, start_time: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Время окончания</Label>
                    <Input
                      type="time"
                      value={newSchedule.end_time}
                      onChange={(e) => setNewSchedule({ ...newSchedule, end_time: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleAddSchedule} className="w-full">
                    Добавить
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {weekSchedule.length === 0 ? (
                <p className="text-sm text-muted-foreground">Нет расписания</p>
              ) : (
                weekSchedule.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{getDayLabel(item.dayOfWeek)}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.startTime} - {item.endTime}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSchedule(item.id)}
                    >
                      <Icon name="Trash2" size={16} />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Мероприятия</CardTitle>
              <CardDescription>Разовые события и личные дела</CardDescription>
            </div>
            <Dialog open={showAddEvent} onOpenChange={setShowAddEvent}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Icon name="Plus" size={16} />
                  Добавить
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Добавить мероприятие</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Название</Label>
                    <Input
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      placeholder="Конференция, встреча..."
                    />
                  </div>
                  <div>
                    <Label>Дата</Label>
                    <Input
                      type="date"
                      value={newEvent.event_date}
                      onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Начало</Label>
                      <Input
                        type="time"
                        value={newEvent.start_time}
                        onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Конец</Label>
                      <Input
                        type="time"
                        value={newEvent.end_time}
                        onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Описание</Label>
                    <Textarea
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      placeholder="Дополнительные детали..."
                    />
                  </div>
                  <Button onClick={() => handleAddEvent()} className="w-full">
                    Добавить
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground">Нет мероприятий</p>
              ) : (
                events.map(event => (
                  <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{event.title}</p>
                        <Badge variant="secondary">{event.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {event.date} • {event.startTime} - {event.endTime}
                      </p>
                      {event.description && (
                        <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteEvent(event.id)}
                    >
                      <Icon name="Trash2" size={16} />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Заблокированные даты</CardTitle>
            <CardDescription>Дни, помеченные как "Занят"</CardDescription>
          </div>
          <Dialog open={showBlockDate} onOpenChange={setShowBlockDate}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Icon name="Ban" size={16} />
                Заблокировать день
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Заблокировать дату</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Дата</Label>
                  <Input
                    type="date"
                    value={blockDate}
                    onChange={(e) => setBlockDate(e.target.value)}
                  />
                </div>
                <Button onClick={() => handleBlockDate()} className="w-full">
                  Заблокировать
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-3">
            {blockedDates.length === 0 ? (
              <p className="text-sm text-muted-foreground col-span-3">Нет заблокированных дат</p>
            ) : (
              blockedDates.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Icon name="Ban" size={16} className="text-destructive" />
                    <span className="text-sm font-medium">{item.date}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnblockDate(item.id)}
                  >
                    <Icon name="X" size={16} />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showConflict} onOpenChange={setShowConflict}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Конфликт с записями</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {conflictData?.message}
            </p>
            {conflictData?.bookings && (
              <div className="space-y-2">
                {conflictData.bookings.map((booking: any) => (
                  <div key={booking.id} className="p-3 border rounded-lg">
                    <p className="font-medium">{booking.client}</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.service} • {booking.time || booking.startTime}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowConflict(false)} className="flex-1">
                Отмена
              </Button>
              <Button variant="destructive" onClick={handleForceAction} className="flex-1">
                Отменить записи и продолжить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}