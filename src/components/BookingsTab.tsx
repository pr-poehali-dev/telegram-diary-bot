import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useData } from '@/contexts/DataContext';
import { useAppContext } from '@/contexts/AppContext';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const BookingsTab = () => {
  const { getStatusColor, getStatusText } = useAppContext();
  const { bookings, clients, services, loading, refreshBookings } = useData();
  const { toast } = useToast();
  
  const [showDialog, setShowDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [newBooking, setNewBooking] = useState({
    client_id: '',
    service_id: '',
    date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
  });

  const handleCreate = async () => {
    try {
      await api.bookings.create({
        client_id: Number(newBooking.client_id),
        service_id: Number(newBooking.service_id),
        booking_date: newBooking.date,
        start_time: newBooking.start_time,
        end_time: newBooking.end_time,
        status: 'pending',
      });
      
      toast({
        title: 'Запись создана',
        description: 'Новая запись успешно добавлена',
      });
      
      setShowDialog(false);
      refreshBookings();
      setNewBooking({
        client_id: '',
        service_id: '',
        date: new Date().toISOString().split('T')[0],
        start_time: '',
        end_time: '',
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать запись',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await api.bookings.update(id, status);
      toast({
        title: 'Статус обновлен',
        description: 'Статус записи успешно изменен',
      });
      refreshBookings();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить статус',
        variant: 'destructive',
      });
    }
  };

  const filteredBookings = bookings.filter(b => {
    const dateMatch = selectedDate ? b.date === selectedDate : true;
    const statusMatch = selectedStatus === 'all' ? true : b.status === selectedStatus;
    return dateMatch && statusMatch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Записи</h2>
          <p className="text-gray-500 mt-1">Управление записями клиентов</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Icon name="Plus" size={16} />
              Новая запись
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Создать запись</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Клиент</Label>
                <Select
                  value={newBooking.client_id}
                  onValueChange={(value) =>
                    setNewBooking({ ...newBooking, client_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите клиента" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={String(client.id)}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Услуга</Label>
                <Select
                  value={newBooking.service_id}
                  onValueChange={(value) =>
                    setNewBooking({ ...newBooking, service_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите услугу" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={String(service.id)}>
                        {service.name} ({service.duration_minutes} мин)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Дата</Label>
                <Input
                  type="date"
                  value={newBooking.date}
                  onChange={(e) =>
                    setNewBooking({ ...newBooking, date: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Начало</Label>
                  <Input
                    type="time"
                    value={newBooking.start_time}
                    onChange={(e) =>
                      setNewBooking({ ...newBooking, start_time: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Конец</Label>
                  <Input
                    type="time"
                    value={newBooking.end_time}
                    onChange={(e) =>
                      setNewBooking({ ...newBooking, end_time: e.target.value })
                    }
                  />
                </div>
              </div>

              <Button onClick={handleCreate} className="w-full">
                Создать запись
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <CardTitle>Все записи</CardTitle>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Label className="whitespace-nowrap">Дата:</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-36 flex-1 sm:flex-none"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate('')}
                >
                  Все
                </Button>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                <Label className="whitespace-nowrap">Статус:</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-36 flex-1 sm:flex-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все</SelectItem>
                    <SelectItem value="pending">Ожидают</SelectItem>
                    <SelectItem value="confirmed">Подтверждены</SelectItem>
                    <SelectItem value="completed">Завершены</SelectItem>
                    <SelectItem value="cancelled">Отменены</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-gray-500 py-8">Загрузка...</p>
          ) : filteredBookings.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Нет записей</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Время</TableHead>
                  <TableHead>Клиент</TableHead>
                  <TableHead>Услуга</TableHead>
                  <TableHead>Длительность</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>{booking.date}</TableCell>
                    <TableCell>{booking.time}</TableCell>
                    <TableCell className="font-medium">{booking.client}</TableCell>
                    <TableCell>{booking.service}</TableCell>
                    <TableCell>{booking.duration} мин</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(booking.status)}>
                        {getStatusText(booking.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {booking.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(booking.id, 'confirmed')}
                            >
                              Подтвердить
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleStatusChange(booking.id, 'cancelled')}
                            >
                              Отменить
                            </Button>
                          </>
                        )}
                        {booking.status === 'confirmed' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(booking.id, 'completed')}
                            >
                              Завершить
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleStatusChange(booking.id, 'cancelled')}
                            >
                              Отменить
                            </Button>
                          </>
                        )}
                        {booking.status === 'completed' && (
                          <span className="text-sm text-gray-500">Завершена</span>
                        )}
                        {booking.status === 'cancelled' && (
                          <span className="text-sm text-gray-500">Отменена</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingsTab;