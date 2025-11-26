import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/hooks/use-toast';
import ScheduleCycleManager from './ScheduleCycleManager';

interface WeekSchedule {
  [key: string]: { start: string; end: string } | null;
}

interface ScheduleForDate {
  schedule: any[];
  cycleStartDate: string | null;
  weekNumber: number | null;
}

const ScheduleTab = () => {
  const { 
    bookings, 
    events: contextEvents, 
    blockedDates: contextBlockedDates,
    refreshBookings,
    getScheduleForDate,
    refreshWeekSchedule
  } = useData();
  const { toast } = useToast();
  
  const [date, setDate] = useState<Date>(new Date());
  const [showCycleManager, setShowCycleManager] = useState(false);
  const [weekSchedule, setWeekSchedule] = useState<WeekSchedule>({});
  const [currentCycleInfo, setCurrentCycleInfo] = useState<{ startDate: string | null; weekNumber: number | null }>({ startDate: null, weekNumber: null });

  useEffect(() => {
    loadScheduleForDate(date);
  }, [date]);

  const loadScheduleForDate = async (selectedDate: Date) => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    try {
      const response: ScheduleForDate = await getScheduleForDate(dateStr);
      
      const scheduleMap: WeekSchedule = {};
      (response.schedule || []).forEach((item: any) => {
        scheduleMap[item.dayOfWeek] = {
          start: item.startTime,
          end: item.endTime,
        };
      });
      
      setWeekSchedule(scheduleMap);
      setCurrentCycleInfo({
        startDate: response.cycleStartDate,
        weekNumber: response.weekNumber
      });
    } catch (error) {
      console.error('Error loading schedule for date:', error);
      setWeekSchedule({});
      setCurrentCycleInfo({ startDate: null, weekNumber: null });
    }
  };

  const getDayOfWeek = (date: Date): string => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  };

  const getRussianDayName = (dayKey: string): string => {
    const names: { [key: string]: string } = {
      monday: 'Понедельник',
      tuesday: 'Вторник',
      wednesday: 'Среда',
      thursday: 'Четверг',
      friday: 'Пятница',
      saturday: 'Суббота',
      sunday: 'Воскресенье',
    };
    return names[dayKey] || dayKey;
  };

  const getStudyScheduleForDate = (date: Date) => {
    const dayName = getDayOfWeek(date);
    return weekSchedule[dayName];
  };

  const parseTime = (timeStr: string): string => {
    if (!timeStr) return '00:00';
    if (timeStr.includes(':')) return timeStr.substring(0, 5);
    return timeStr;
  };

  const calculateEndTime = (startTime: string, duration: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  };

  const checkTimeConflict = (
    time1Start: string,
    time1End: string,
    time2Start: string,
    time2End: string
  ): boolean => {
    return time1Start < time2End && time1End > time2Start;
  };

  const getBookingsForDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return bookings.filter(b => b.date === dateStr && b.status !== 'cancelled');
  };

  const getConflictsForDate = (date: Date) => {
    const studySchedule = getStudyScheduleForDate(date);
    if (!studySchedule) return [];

    const dayBookings = getBookingsForDate(date);
    return dayBookings.filter(booking => {
      if (booking.status !== 'confirmed') return false;
      
      const startTime = parseTime(booking.time);
      const endTime = calculateEndTime(startTime, booking.duration || 60);
      
      return checkTimeConflict(
        startTime,
        endTime,
        studySchedule.start,
        studySchedule.end
      );
    });
  };

  const getEventsForDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return (contextEvents || []).filter(e => e.date === dateStr);
  };

  const isDateBlocked = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const blockedDateStrings = (contextBlockedDates || []).map((b: any) => b.date);
    return blockedDateStrings.includes(dateStr);
  };

  const selectedDateBookings = getBookingsForDate(date);
  const selectedDateConflicts = getConflictsForDate(date);
  const studyForSelectedDate = getStudyScheduleForDate(date);
  const selectedDateEvents = getEventsForDate(date);
  const isSelectedDateBlocked = isDateBlocked(date);

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Календарь дел</h2>
        <p className="text-sm md:text-base text-gray-500 mt-1">Управляйте своим временем</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
        <Card className="lg:min-w-[320px] lg:max-w-[400px] lg:flex-shrink-0">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base md:text-lg">
              <span>Календарь</span>
              <Button 
                variant="ghost" 
                size="sm" 
                title="Настроить расписание учёбы"
                onClick={() => setShowCycleManager(true)}
              >
                <Icon name="GraduationCap" size={16} />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentCycleInfo.startDate && (
              <div className="text-xs text-gray-600 space-y-1">
                <div>📅 Цикл с: {new Date(currentCycleInfo.startDate).toLocaleDateString('ru-RU')}</div>
                <div>📊 Текущая неделя: {currentCycleInfo.weekNumber}</div>
              </div>
            )}
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate) => newDate && setDate(newDate)}
              className="rounded-md text-sm md:text-base w-full"
              modifiers={{
                hasStudy: (day) => {
                  const dayName = getDayOfWeek(day);
                  return weekSchedule[dayName] !== null;
                },
                hasBookings: (day) => {
                  const year = day.getFullYear();
                  const month = String(day.getMonth() + 1).padStart(2, '0');
                  const dayNum = String(day.getDate()).padStart(2, '0');
                  const dateStr = `${year}-${month}-${dayNum}`;
                  return bookings.some(b => b.date === dateStr) && getEventsForDate(day).length === 0;
                },
                hasEvents: (day) => getEventsForDate(day).length > 0 && !(() => {
                  const year = day.getFullYear();
                  const month = String(day.getMonth() + 1).padStart(2, '0');
                  const dayNum = String(day.getDate()).padStart(2, '0');
                  const dateStr = `${year}-${month}-${dayNum}`;
                  return bookings.some(b => b.date === dateStr);
                })(),
                hasBoth: (day) => {
                  const year = day.getFullYear();
                  const month = String(day.getMonth() + 1).padStart(2, '0');
                  const dayNum = String(day.getDate()).padStart(2, '0');
                  const dateStr = `${year}-${month}-${dayNum}`;
                  return bookings.some(b => b.date === dateStr) && getEventsForDate(day).length > 0;
                },
                isBlocked: (day) => isDateBlocked(day),
                hasConflict: (day) => getConflictsForDate(day).length > 0,
              }}
              modifiersStyles={{
                hasStudy: {
                  backgroundColor: '#dbeafe',
                  color: '#1e40af',
                },
                hasBookings: {
                  backgroundColor: '#bbf7d0',
                  color: '#166534',
                  fontWeight: 'bold',
                },
                hasEvents: {
                  backgroundColor: '#1e3a8a',
                  color: '#ffffff',
                  fontWeight: 'bold',
                },
                hasBoth: {
                  backgroundColor: '#0891b2',
                  color: '#ffffff',
                  fontWeight: 'bold',
                },
                isBlocked: {
                  backgroundColor: '#fecaca',
                  color: '#7f1d1d',
                  fontWeight: 'bold',
                  textDecoration: 'line-through',
                },
                hasConflict: {
                  backgroundColor: '#fed7aa',
                  color: '#9a3412',
                  fontWeight: 'bold',
                },
              }}
            />
            <div className="space-y-1.5 md:space-y-2">
              <div className="text-xs font-medium text-gray-500 mb-2">Легенда:</div>
              <div className="flex items-center gap-2 text-xs md:text-sm">
                <div className="w-3 h-3 md:w-4 md:h-4 rounded flex-shrink-0" style={{backgroundColor: '#dbeafe'}}></div>
                <span>Учёба</span>
              </div>
              <div className="flex items-center gap-2 text-xs md:text-sm">
                <div className="w-3 h-3 md:w-4 md:h-4 rounded flex-shrink-0" style={{backgroundColor: '#bbf7d0'}}></div>
                <span>Есть записи</span>
              </div>
              <div className="flex items-center gap-2 text-xs md:text-sm">
                <div className="w-3 h-3 md:w-4 md:h-4 rounded flex-shrink-0" style={{backgroundColor: '#1e3a8a'}}></div>
                <span>Мероприятия</span>
              </div>
              <div className="flex items-center gap-2 text-xs md:text-sm">
                <div className="w-3 h-3 md:w-4 md:h-4 rounded flex-shrink-0" style={{backgroundColor: '#0891b2'}}></div>
                <span>Запись + Мероприятие</span>
              </div>
              <div className="flex items-center gap-2 text-xs md:text-sm">
                <div className="w-3 h-3 md:w-4 md:h-4 rounded flex-shrink-0" style={{backgroundColor: '#fecaca'}}></div>
                <span>Заблокирован</span>
              </div>
              <div className="flex items-center gap-2 text-xs md:text-sm">
                <div className="w-3 h-3 md:w-4 md:h-4 rounded flex-shrink-0" style={{backgroundColor: '#fed7aa'}}></div>
                <span>Конфликт с учёбой</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:flex-1">
          <CardHeader>
            <CardTitle>
              {date.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                weekday: 'long',
              })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isSelectedDateBlocked && (
              <Alert className="border-red-200 bg-red-50">
                <Icon name="Ban" size={16} className="text-red-600" />
                <AlertDescription className="ml-2">
                  <strong>День заблокирован!</strong> Новые записи недоступны
                </AlertDescription>
              </Alert>
            )}

            {studyForSelectedDate && (
              <Alert className="border-blue-200 bg-blue-50">
                <Icon name="GraduationCap" size={16} className="text-blue-600" />
                <AlertDescription className="ml-2">
                  <strong>Учёба:</strong> {studyForSelectedDate.start} - {studyForSelectedDate.end}
                </AlertDescription>
              </Alert>
            )}

            {selectedDateEvents.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-700">Мероприятия:</h4>
                {selectedDateEvents.map((event) => (
                  <Alert key={event.id} className="border-purple-200 bg-purple-50">
                    <Icon name="Calendar" size={16} className="text-purple-600" />
                    <AlertDescription className="ml-2">
                      <strong>{event.title}:</strong> {event.startTime} - {event.endTime}
                      {event.description && <p className="text-xs mt-1">{event.description}</p>}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            {selectedDateConflicts.length > 0 && (
              <Alert className="border-red-200 bg-red-50">
                <Icon name="AlertTriangle" size={16} className="text-red-600" />
                <AlertDescription className="ml-2">
                  <strong>Внимание!</strong> {selectedDateConflicts.length} записей пересекаются с учёбой
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <h3 className="font-semibold text-lg">
                Записи на этот день ({selectedDateBookings.length})
              </h3>
              
              {selectedDateBookings.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Нет записей на этот день</p>
              ) : (
                <div className="space-y-3">
                  {selectedDateBookings
                    .sort((a, b) => {
                      const timeA = parseTime(a.time);
                      const timeB = parseTime(b.time);
                      return timeA.localeCompare(timeB);
                    })
                    .map((booking) => {
                      const startTime = parseTime(booking.time);
                      const endTime = calculateEndTime(startTime, booking.duration || 60);
                      const hasConflict = selectedDateConflicts.some(c => c.id === booking.id);
                      
                      return (
                        <div
                          key={booking.id}
                          className={`p-4 rounded-lg border-2 ${
                            hasConflict 
                              ? 'bg-red-50 border-red-300' 
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-16 h-16 rounded-lg flex flex-col items-center justify-center ${
                                hasConflict ? 'bg-red-100' : 'bg-primary/10'
                              }`}>
                                <span className={`text-lg font-bold ${
                                  hasConflict ? 'text-red-600' : 'text-primary'
                                }`}>
                                  {startTime}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {endTime}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{booking.client}</p>
                                <p className="text-sm text-gray-600">
                                  {booking.service} • {booking.duration} мин
                                </p>
                                {hasConflict && (
                                  <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                                    <Icon name="AlertTriangle" size={14} />
                                    <span>Пересечение с учёбой</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <Badge className={
                              booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                              booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }>
                              {booking.status === 'confirmed' ? 'Подтверждено' :
                               booking.status === 'pending' ? 'Ожидает' :
                               booking.status === 'completed' ? 'Завершено' :
                               'Отменено'}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <ScheduleCycleManager
        open={showCycleManager}
        onOpenChange={setShowCycleManager}
        onSuccess={() => {
          refreshWeekSchedule();
          loadScheduleForDate(date);
        }}
      />
    </div>
  );
};

export default ScheduleTab;