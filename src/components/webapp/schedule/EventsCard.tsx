import { useState } from 'react';
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

interface CalendarEvent {
  id: number;
  type: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  description?: string;
}

interface EventsCardProps {
  events: CalendarEvent[];
  onDataChange: () => void;
  onConflict: (conflictData: any, forceCallback: () => void) => void;
}

export default function EventsCard({ events, onDataChange, onConflict }: EventsCardProps) {
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    event_type: 'event',
    title: '',
    event_date: '',
    start_time: '10:00',
    end_time: '11:00',
    description: '',
  });

  const handleAddEvent = async (force = false) => {
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
      console.log('POST response:', response);
      
      if (response.conflict) {
        onConflict(response, () => handleAddEvent(true));
        return;
      }
      
      if (response.error) {
        alert(`Ошибка: ${response.error}`);
        return;
      }
      
      setShowAddEvent(false);
      setNewEvent({
        event_type: 'event',
        title: '',
        event_date: '',
        start_time: '10:00',
        end_time: '11:00',
        description: '',
      });
      
      console.log('Calling loadData...');
      await onDataChange();
      console.log('loadData completed');
    } catch (error: any) {
      console.error('Ошибка создания события:', error);
      const message = error?.message || 'Не удалось создать мероприятие';
      alert(message);
    }
  };

  const handleDeleteEvent = async (id: number) => {
    try {
      await api.events.delete(id);
      onDataChange();
    } catch (error) {
      console.error('Ошибка удаления события:', error);
    }
  };

  return (
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
                <Label>Тип события</Label>
                <Select
                  value={newEvent.event_type}
                  onValueChange={(value) => setNewEvent({ ...newEvent, event_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="event">Мероприятие</SelectItem>
                    <SelectItem value="study">Учёба</SelectItem>
                    <SelectItem value="booking">Бронирование</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                    <Badge variant="secondary">
                      {event.type === 'event' ? 'Мероприятие' : 
                       event.type === 'study' ? 'Учёба' : 
                       event.type === 'booking' ? 'Бронирование' : event.type}
                    </Badge>
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
  );
}