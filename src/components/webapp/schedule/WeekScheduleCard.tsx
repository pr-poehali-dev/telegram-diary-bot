import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { api } from '@/services/api';

interface WeekScheduleItem {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

interface WeekScheduleCardProps {
  weekSchedule: WeekScheduleItem[];
  onDataChange: () => void;
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

export default function WeekScheduleCard({ weekSchedule, onDataChange }: WeekScheduleCardProps) {
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    day_of_week: 'monday',
    start_time: '09:00',
    end_time: '15:00',
  });

  const handleAddSchedule = async () => {
    try {
      await api.schedule.create(newSchedule);
      setShowAddSchedule(false);
      setNewSchedule({ day_of_week: 'monday', start_time: '09:00', end_time: '15:00' });
      onDataChange();
    } catch (error) {
      console.error('Ошибка создания расписания:', error);
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    try {
      await api.schedule.delete(id);
      onDataChange();
    } catch (error) {
      console.error('Ошибка удаления расписания:', error);
    }
  };

  const getDayLabel = (day: string) => {
    return DAYS.find(d => d.value === day)?.label || day;
  };

  return (
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
  );
}
