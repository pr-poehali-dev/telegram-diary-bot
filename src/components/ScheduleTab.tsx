import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Calendar } from '@/components/ui/calendar';
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

interface ScheduleTabProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  showEventDialog: boolean;
  setShowEventDialog: (show: boolean) => void;
  showStudyDialog: boolean;
  setShowStudyDialog: (show: boolean) => void;
  blockedDates: Date[];
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
  addEvent: () => void;
  addEventConfirmed: () => void;
  toggleBlockedDate: () => void;
  getEventsForDate: (date: Date | undefined) => CalendarEvent[];
  isDayBlocked: (date: Date | undefined) => boolean;
  getDayOfWeek: (date: Date) => string;
  getEventTypeColor: (type: EventType) => string;
  getEventTypeText: (type: EventType) => string;
}

const ScheduleTab = ({
  date,
  setDate,
  showEventDialog,
  setShowEventDialog,
  showStudyDialog,
  setShowStudyDialog,
  blockedDates,
  weekSchedule,
  setWeekSchedule,
  calendarEvents,
  setCalendarEvents,
  newEvent,
  setNewEvent,
  conflictWarning,
  setConflictWarning,
  addEvent,
  addEventConfirmed,
  toggleBlockedDate,
  getEventsForDate,
  isDayBlocked,
  getDayOfWeek,
  getEventTypeColor,
  getEventTypeText,
}: ScheduleTabProps) => {
  const eventsForSelectedDate = getEventsForDate(date);

  return (
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
                    {conflictWarning.show && (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Icon name="AlertTriangle" size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium text-yellow-900 mb-2">
                              Обнаружены конфликты:
                            </p>
                            <div className="text-sm text-yellow-800 whitespace-pre-line mb-3">
                              {conflictWarning.message}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={addEventConfirmed}
                                variant="default"
                                size="sm"
                              >
                                Продолжить
                              </Button>
                              <Button
                                onClick={() =>
                                  setConflictWarning({
                                    show: false,
                                    message: '',
                                    conflicts: [],
                                  })
                                }
                                variant="outline"
                                size="sm"
                              >
                                Отмена
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {!conflictWarning.show && (
                      <Button onClick={addEvent} className="w-full">
                        Добавить
                      </Button>
                    )}
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
  );
};

export default ScheduleTab;
