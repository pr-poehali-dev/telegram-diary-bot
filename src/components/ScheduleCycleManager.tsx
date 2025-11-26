import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface WeekScheduleItem {
  id?: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  cycleStartDate: string;
  weekNumber: number;
}

interface ScheduleCycle {
  startDate: string;
  week1: { [dayOfWeek: string]: { start: string; end: string } | null };
  week2: { [dayOfWeek: string]: { start: string; end: string } | null };
}

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Понедельник' },
  { key: 'tuesday', label: 'Вторник' },
  { key: 'wednesday', label: 'Среда' },
  { key: 'thursday', label: 'Четверг' },
  { key: 'friday', label: 'Пятница' },
  { key: 'saturday', label: 'Суббота' },
  { key: 'sunday', label: 'Воскресенье' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function ScheduleCycleManager({ open, onOpenChange, onSuccess }: Props) {
  const { toast } = useToast();
  const [cycles, setCycles] = useState<{ startDate: string }[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<string | null>(null);
  const [activeWeek, setActiveWeek] = useState<1 | 2>(1);
  const [scheduleData, setScheduleData] = useState<ScheduleCycle | null>(null);
  const [loading, setLoading] = useState(false);
  const [newCycleDate, setNewCycleDate] = useState('');
  const [showNewCycleInput, setShowNewCycleInput] = useState(false);

  useEffect(() => {
    if (open) {
      loadCycles();
    }
  }, [open]);

  const loadCycles = async () => {
    try {
      const response = await api.schedule.getWeek();
      const scheduleItems: WeekScheduleItem[] = response.schedule || [];
      
      const uniqueDates = Array.from(
        new Set(scheduleItems.map(item => item.cycleStartDate))
      ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      
      setCycles(uniqueDates.map(date => ({ startDate: date })));
      
      if (uniqueDates.length > 0 && !selectedCycle) {
        setSelectedCycle(uniqueDates[0]);
        loadScheduleForCycle(uniqueDates[0], scheduleItems);
      }
    } catch (error) {
      console.error('Error loading cycles:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить циклы расписания',
        variant: 'destructive',
      });
    }
  };

  const loadScheduleForCycle = (cycleDate: string, allItems?: WeekScheduleItem[]) => {
    const items = allItems || [];
    
    const week1: any = {};
    const week2: any = {};
    
    DAYS_OF_WEEK.forEach(day => {
      week1[day.key] = null;
      week2[day.key] = null;
    });
    
    items
      .filter(item => item.cycleStartDate === cycleDate)
      .forEach(item => {
        const schedule = { start: item.startTime, end: item.endTime };
        if (item.weekNumber === 1) {
          week1[item.dayOfWeek] = schedule;
        } else if (item.weekNumber === 2) {
          week2[item.dayOfWeek] = schedule;
        }
      });
    
    setScheduleData({ startDate: cycleDate, week1, week2 });
  };

  const handleCycleSelect = async (cycleDate: string) => {
    setSelectedCycle(cycleDate);
    try {
      const response = await api.schedule.getWeek();
      loadScheduleForCycle(cycleDate, response.schedule || []);
    } catch (error) {
      console.error('Error loading schedule:', error);
    }
  };

  const handleCreateNewCycle = () => {
    if (!newCycleDate) {
      toast({
        title: 'Ошибка',
        description: 'Укажите дату начала цикла',
        variant: 'destructive',
      });
      return;
    }

    const emptyWeek: any = {};
    DAYS_OF_WEEK.forEach(day => {
      emptyWeek[day.key] = null;
    });

    setScheduleData({
      startDate: newCycleDate,
      week1: { ...emptyWeek },
      week2: { ...emptyWeek },
    });
    setSelectedCycle(newCycleDate);
    setShowNewCycleInput(false);
    setNewCycleDate('');
  };

  const handleTimeChange = (dayKey: string, weekNum: 1 | 2, field: 'start' | 'end', value: string) => {
    if (!scheduleData) return;

    const weekKey = weekNum === 1 ? 'week1' : 'week2';
    const currentSchedule = scheduleData[weekKey][dayKey];

    setScheduleData({
      ...scheduleData,
      [weekKey]: {
        ...scheduleData[weekKey],
        [dayKey]: currentSchedule
          ? { ...currentSchedule, [field]: value }
          : { start: field === 'start' ? value : '', end: field === 'end' ? value : '' },
      },
    });
  };

  const handleClearDay = (dayKey: string, weekNum: 1 | 2) => {
    if (!scheduleData) return;

    const weekKey = weekNum === 1 ? 'week1' : 'week2';
    setScheduleData({
      ...scheduleData,
      [weekKey]: {
        ...scheduleData[weekKey],
        [dayKey]: null,
      },
    });
  };

  const handleSave = async () => {
    if (!scheduleData) return;

    setLoading(true);
    try {
      const response = await api.schedule.getWeek();
      const existingItems: WeekScheduleItem[] = response.schedule || [];
      
      const itemsToDelete = existingItems.filter(
        item => item.cycleStartDate === scheduleData.startDate
      );

      for (const item of itemsToDelete) {
        if (item.id) {
          await api.schedule.delete(item.id);
        }
      }

      for (const weekNum of [1, 2]) {
        const weekKey = weekNum === 1 ? 'week1' : 'week2';
        const weekData = scheduleData[weekKey];

        for (const day of DAYS_OF_WEEK) {
          const schedule = weekData[day.key];
          if (schedule && schedule.start && schedule.end) {
            await api.schedule.create({
              day_of_week: day.key,
              start_time: schedule.start,
              end_time: schedule.end,
              cycle_start_date: scheduleData.startDate,
              week_number: weekNum,
            });
          }
        }
      }

      toast({
        title: 'Успешно',
        description: 'Расписание сохранено',
      });

      onSuccess();
      loadCycles();
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить расписание',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCycle = async () => {
    if (!selectedCycle) return;

    if (!confirm(`Удалить расписание с ${new Date(selectedCycle).toLocaleDateString('ru-RU')}?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.schedule.getWeek();
      const itemsToDelete = (response.schedule || []).filter(
        (item: WeekScheduleItem) => item.cycleStartDate === selectedCycle
      );

      for (const item of itemsToDelete) {
        if (item.id) {
          await api.schedule.delete(item.id);
        }
      }

      toast({
        title: 'Успешно',
        description: 'Расписание удалено',
      });

      setSelectedCycle(null);
      setScheduleData(null);
      onSuccess();
      loadCycles();
    } catch (error) {
      console.error('Error deleting cycle:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить расписание',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const currentWeekData = scheduleData
    ? activeWeek === 1
      ? scheduleData.week1
      : scheduleData.week2
    : {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Управление расписанием учёбы (2 недели)</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Периоды расписания</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {cycles.map(cycle => (
                <div
                  key={cycle.startDate}
                  className={`flex items-center justify-between p-2 rounded border cursor-pointer hover:bg-gray-50 ${
                    selectedCycle === cycle.startDate ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => handleCycleSelect(cycle.startDate)}
                >
                  <div className="flex items-center gap-2">
                    <Icon name="Calendar" size={16} />
                    <span className="font-medium">
                      С {new Date(cycle.startDate).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  {selectedCycle === cycle.startDate && (
                    <Badge variant="secondary">Выбрано</Badge>
                  )}
                </div>
              ))}

              {showNewCycleInput ? (
                <div className="flex gap-2 items-end p-2 border border-dashed border-gray-300 rounded">
                  <div className="flex-1">
                    <Label>Дата начала нового цикла</Label>
                    <Input
                      type="date"
                      value={newCycleDate}
                      onChange={e => setNewCycleDate(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleCreateNewCycle} size="sm">
                    Создать
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowNewCycleInput(false)}>
                    <Icon name="X" size={16} />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowNewCycleInput(true)}
                >
                  <Icon name="Plus" size={16} className="mr-2" />
                  Создать новый период
                </Button>
              )}
            </CardContent>
          </Card>

          {scheduleData && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Редактирование: с {new Date(scheduleData.startDate).toLocaleDateString('ru-RU')}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={activeWeek === 1 ? 'default' : 'outline'}
                      onClick={() => setActiveWeek(1)}
                    >
                      Неделя 1
                    </Button>
                    <Button
                      size="sm"
                      variant={activeWeek === 2 ? 'default' : 'outline'}
                      onClick={() => setActiveWeek(2)}
                    >
                      Неделя 2
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {DAYS_OF_WEEK.map(day => {
                  const schedule = currentWeekData[day.key];
                  return (
                    <div key={day.key} className="flex items-center gap-2">
                      <Label className="w-32 text-sm">{day.label}</Label>
                      <Input
                        type="time"
                        value={schedule?.start || ''}
                        onChange={e => handleTimeChange(day.key, activeWeek, 'start', e.target.value)}
                        className="flex-1"
                        placeholder="Начало"
                      />
                      <Input
                        type="time"
                        value={schedule?.end || ''}
                        onChange={e => handleTimeChange(day.key, activeWeek, 'end', e.target.value)}
                        className="flex-1"
                        placeholder="Конец"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleClearDay(day.key, activeWeek)}
                      >
                        <Icon name="X" size={16} />
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between gap-2">
            <div>
              {selectedCycle && (
                <Button variant="destructive" onClick={handleDeleteCycle} disabled={loading}>
                  <Icon name="Trash2" size={16} className="mr-2" />
                  Удалить период
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Отмена
              </Button>
              <Button onClick={handleSave} disabled={loading || !scheduleData}>
                {loading ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
