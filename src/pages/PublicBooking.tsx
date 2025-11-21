import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';

interface Service {
  id: number;
  name: string;
  duration: string;
  price: string;
  active: boolean;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

const PublicBooking = () => {
  const { toast } = useToast();
  const ownerId = '1'; // Для главной страницы используем owner_id = 1
  
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({ prep_time: 0, buffer_time: 0 });
  
  const [clientData, setClientData] = useState({
    name: '',
    phone: '',
    email: '',
  });
  const [showTelegramDialog, setShowTelegramDialog] = useState(false);
  const [telegramLink, setTelegramLink] = useState('');

  useEffect(() => {
    loadBookingData();
  }, []);

  const loadBookingData = async () => {
    const cacheKey = `booking_data_${ownerId}`;
    const cacheTimeKey = `booking_data_${ownerId}_time`;
    const CACHE_DURATION = 60 * 60 * 1000;
    
    try {
      const cachedData = localStorage.getItem(cacheKey);
      const cachedTime = localStorage.getItem(cacheTimeKey);
      
      if (cachedData && cachedTime) {
        const age = Date.now() - parseInt(cachedTime);
        if (age < CACHE_DURATION) {
          const cached = JSON.parse(cachedData);
          setServices(cached.services);
          setSettings(cached.settings);
          return;
        }
      }
      
      const data = await api.booking.getPageData();
      
      setServices(data.services || []);
      
      const settingsObj = {
        prep_time: Number(data.settings?.prep_time) || 0,
        buffer_time: Number(data.settings?.buffer_time) || 0,
      };
      setSettings(settingsObj);
      
      localStorage.setItem(cacheKey, JSON.stringify({
        services: data.services,
        settings: settingsObj
      }));
      localStorage.setItem(cacheTimeKey, String(Date.now()));
    } catch (error) {
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        const cached = JSON.parse(cachedData);
        setServices(cached.services);
        setSettings(cached.settings);
      } else {
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить данные',
          variant: 'destructive',
        });
      }
    }
  };

  const loadAvailableSlots = async (date: Date, serviceId: string) => {
    setLoading(true);
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const now = new Date();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(date);
      selectedDate.setHours(0, 0, 0, 0);
      
      const isToday = selectedDate.getTime() === today.getTime();
      
      const API_URL = 'https://functions.poehali.dev/11f94891-555b-485d-ba38-a93639bb439c';
      let url = `${API_URL}?resource=available_slots&owner_id=${ownerId}&date=${dateStr}&service_id=${serviceId}`;
      
      if (isToday) {
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        url += `&current_time=${currentTime}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      setAvailableSlots(data.slots || []);
      
      if (!data.slots || data.slots.length === 0) {
        toast({
          title: 'Нет свободных слотов',
          description: 'Выберите другую дату',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить свободные слоты',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
    setSelectedDate(undefined);
    setAvailableSlots([]);
    setSelectedTime('');
    setStep(2);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date && selectedService) {
      setSelectedDate(date);
      setAvailableSlots([]);
      setSelectedTime('');
      loadAvailableSlots(date, selectedService);
      setStep(3);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep(4);
  };

  const handleBooking = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !clientData.name || !clientData.phone) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все обязательные поля',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const service = services.find(s => s.id === Number(selectedService));
      const durationMinutes = parseInt(service?.duration || '60');
      
      const [hours, minutes] = selectedTime.split(':');
      const selectedMinutes = parseInt(hours) * 60 + parseInt(minutes);
      const actualStartMinutes = selectedMinutes - settings.prep_time;
      const actualEndMinutes = selectedMinutes + durationMinutes + settings.buffer_time;
      
      const startHours = Math.floor(actualStartMinutes / 60);
      const startMins = actualStartMinutes % 60;
      const startTime = `${String(startHours).padStart(2, '0')}:${String(startMins).padStart(2, '0')}`;
      
      const endHours = Math.floor(actualEndMinutes / 60);
      const endMins = actualEndMinutes % 60;
      const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;

      const clientResponse = await api.clients.create({
        name: clientData.name,
        phone: clientData.phone,
        email: clientData.email,
        owner_id: ownerId,
      });

      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const bookingDateStr = `${year}-${month}-${day}`;
      
      await api.bookings.create({
        client_id: clientResponse.id,
        service_id: selectedService,
        booking_date: bookingDateStr,
        start_time: startTime,
        end_time: endTime,
        status: 'pending',
      });

      // Показываем успешное сообщение с инструкцией по Telegram
      const phoneForBot = clientData.phone.replace(/\s/g, '').replace(/-/g, '').replace(/\(/g, '').replace(/\)/g, '');
      
      toast({
        title: '✅ Запись создана!',
        description: `Ваша запись ожидает подтверждения. Вы получите уведомление.`,
      });
      
      // Формируем ссылку на Telegram с командой
      const telegramUrl = `https://t.me/Calendar_record_bot?start=${phoneForBot}`;
      setTelegramLink(telegramUrl);
      
      // Показываем диалог через 1 секунду
      setTimeout(() => {
        setShowTelegramDialog(true);
      }, 1000);

      setStep(1);
      setSelectedService('');
      setSelectedDate(undefined);
      setSelectedTime('');
      setClientData({ name: '', phone: '', email: '' });
    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось создать запись',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedServiceData = services.find(s => s.id === Number(selectedService));

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 p-4">
      <div className="max-w-2xl mx-auto py-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Онлайн-запись</CardTitle>
            <CardDescription>Выберите услугу и удобное время</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-center gap-2 mb-6">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= s ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {s}
                </div>
              ))}
            </div>

            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Выберите услугу</h3>
                <div className="grid gap-3">
                  {services.filter(s => s.active).map((service) => (
                    <button
                      key={service.id}
                      onClick={() => handleServiceSelect(String(service.id))}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary transition-colors text-left"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{service.name}</p>
                          <p className="text-sm text-gray-500">{service.duration} минут</p>
                        </div>
                        <p className="text-lg font-bold text-primary">{service.price}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && selectedServiceData && (
              <div className="space-y-4">
                <Button variant="ghost" onClick={() => setStep(1)} className="mb-4">
                  <Icon name="ArrowLeft" size={16} className="mr-2" />
                  Назад к услугам
                </Button>
                
                <div className="p-4 bg-primary/5 rounded-lg">
                  <p className="text-sm text-gray-600">Выбрана услуга:</p>
                  <p className="font-semibold">{selectedServiceData.name}</p>
                  <p className="text-sm text-gray-500">
                    {selectedServiceData.duration} минут • {selectedServiceData.price}
                  </p>
                </div>

                <h3 className="text-lg font-semibold">Выберите дату</h3>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  className="rounded-md border mx-auto"
                />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <Button variant="ghost" onClick={() => setStep(2)} className="mb-4">
                  <Icon name="ArrowLeft" size={16} className="mr-2" />
                  Изменить дату
                </Button>

                <div className="p-4 bg-primary/5 rounded-lg space-y-2">
                  <p className="font-semibold">{selectedServiceData?.name}</p>
                  <p className="text-sm text-gray-600">
                    {selectedDate?.toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                <h3 className="text-lg font-semibold">Выберите время</h3>
                {loading ? (
                  <p className="text-center text-gray-500 py-8">Загрузка слотов...</p>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots
                      .filter((slot) => slot.available)
                      .map((slot) => (
                        <Button
                          key={slot.time}
                          variant={selectedTime === slot.time ? 'default' : 'outline'}
                          onClick={() => handleTimeSelect(slot.time)}
                          className="w-full"
                        >
                          {slot.time}
                        </Button>
                      ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    Нет свободных слотов на выбранную дату
                  </p>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <Button variant="ghost" onClick={() => setStep(3)} className="mb-4">
                  <Icon name="ArrowLeft" size={16} className="mr-2" />
                  Изменить время
                </Button>

                <div className="p-4 bg-primary/5 rounded-lg space-y-2">
                  <p className="font-semibold">{selectedServiceData?.name}</p>
                  <p className="text-sm text-gray-600">
                    {selectedDate?.toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                    })}{' '}
                    в {selectedTime}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedServiceData?.duration} минут • {selectedServiceData?.price}
                  </p>
                </div>

                <h3 className="text-lg font-semibold">Ваши данные</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Имя *</Label>
                    <Input
                      id="name"
                      value={clientData.name}
                      onChange={(e) =>
                        setClientData({ ...clientData, name: e.target.value })
                      }
                      placeholder="Введите ваше имя"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Телефон *</Label>
                    <Input
                      id="phone"
                      value={clientData.phone}
                      onChange={(e) =>
                        setClientData({ ...clientData, phone: e.target.value })
                      }
                      placeholder="+7 (___) ___-__-__"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={clientData.email}
                      onChange={(e) =>
                        setClientData({ ...clientData, email: e.target.value })
                      }
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleBooking}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? 'Создание записи...' : 'Записаться'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showTelegramDialog} onOpenChange={setShowTelegramDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="Send" className="text-blue-500" />
              Получайте уведомления в Telegram
            </DialogTitle>
            <DialogDescription>
              Нажмите на кнопку ниже, чтобы автоматически открыть бота и подключить уведомления
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100 mb-2">
                📱 Вы будете получать:
              </p>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 ml-4">
                <li>✅ Подтверждение записи</li>
                <li>⏰ Напоминание перед визитом</li>
                <li>📝 Информацию об изменениях</li>
              </ul>
            </div>

            <Button
              onClick={() => window.open(telegramLink, '_blank')}
              className="w-full"
              size="lg"
            >
              <Icon name="Send" className="mr-2" size={20} />
              Открыть Telegram бота
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Или скопируйте ссылку: <br />
              <a 
                href={telegramLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline break-all"
              >
                {telegramLink}
              </a>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PublicBooking;