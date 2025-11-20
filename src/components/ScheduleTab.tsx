import { useState, useEffect } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useBookings } from '@/hooks/useApi';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface WeekSchedule {
  [key: string]: { start: string; end: string } | null;
}

const ScheduleTab = () => {
  const { bookings, reload } = useBookings();
  const { toast } = useToast();
  
  const [date, setDate] = useState<Date>(new Date());
  const [showStudyDialog, setShowStudyDialog] = useState(false);
  const [weekSchedule, setWeekSchedule] = useState<WeekSchedule>({
    monday: { start: '09:00', end: '15:00' },
    tuesday: { start: '09:00', end: '15:00' },
    wednesday: { start: '09:00', end: '15:00' },
    thursday: { start: '09:00', end: '15:00' },
    friday: { start: '09:00', end: '15:00' },
    saturday: null,
    sunday: null,
  });

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

  const checkTimeConflict = (
    time1Start: string,
    time1End: string,
    time2Start: string,
    time2End: string
  ): boolean => {
    return time1Start < time2End && time1End > time2Start;
  };

  const getBookingsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return bookings.filter(b => b.date === dateStr);
  };

  const getConflictsForDate = (date: Date) => {
    const studySchedule = getStudyScheduleForDate(date);
    if (!studySchedule) return [];

    const dayBookings = getBookingsForDate(date);
    return dayBookings.filter(booking => 
      booking.status === 'confirmed' &&
      checkTimeConflict(
        booking.start_time || booking.time.split('-')[0],
        booking.end_time || booking.time.split('-')[1],
        studySchedule.start,
        studySchedule.end
      )
    );
  };

  const selectedDateBookings = getBookingsForDate(date);
  const selectedDateConflicts = getConflictsForDate(date);
  const studyForSelectedDate = getStudyScheduleForDate(date);

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
                  <Button variant="ghost" size="sm" title="Настроить расписание учёбы">
                    <Icon name="GraduationCap" size={16} />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Шаблон недели (Учеба)</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {Object.entries(weekSchedule).map(([day, schedule]) => (
                      <div key={day} className="flex items-center gap-2">
                        <Label className="w-28 text-sm">{getRussianDayName(day)}</Label>
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
                          placeholder="С"
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
                          placeholder="До"
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
              onSelect={(newDate) => newDate && setDate(newDate)}
              className="rounded-md"
              modifiers={{
                hasStudy: (day) => {
                  const dayName = getDayOfWeek(day);
                  return weekSchedule[dayName] !== null;
                },
                hasBookings: (day) => {
                  const dateStr = day.toISOString().split('T')[0];
                  return bookings.some(b => b.date === dateStr);
                },
                hasConflict: (day) => getConflictsForDate(day).length > 0,
              }}
              modifiersStyles={{
                hasStudy: {
                  backgroundColor: '#dbeafe',
                  color: '#1e40af',
                },
                hasBookings: {
                  backgroundColor: '#e9d5ff',
                  color: '#6b21a8',
                  fontWeight: 'bold',
                },
                hasConflict: {
                  backgroundColor: '#fee2e2',
                  color: '#991b1b',
                  fontWeight: 'bold',
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
                <span>Есть записи</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                <span>Конфликт с учёбой</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
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
            {studyForSelectedDate && (
              <Alert className="border-blue-200 bg-blue-50">
                <Icon name="GraduationCap" size={16} className="text-blue-600" />
                <AlertDescription className="ml-2">
                  <strong>Учёба:</strong> {studyForSelectedDate.start} - {studyForSelectedDate.end}
                </AlertDescription>
              </Alert>
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
                      const timeA = a.start_time || a.time.split('-')[0];
                      const timeB = b.start_time || b.time.split('-')[0];
                      return timeA.localeCompare(timeB);
                    })
                    .map((booking) => {
                      const startTime = booking.start_time || booking.time.split('-')[0];
                      const endTime = booking.end_time || booking.time.split('-')[1];
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
                                  {startTime.substring(0, 5)}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {endTime.substring(0, 5)}
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
    </div>
  );
};

export default ScheduleTab;
