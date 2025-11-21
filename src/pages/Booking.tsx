import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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

const Booking = () => {
  const { ownerId } = useParams<{ ownerId: string }>();
  const { toast } = useToast();
  
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
          console.log('📦 [Booking] Загружено из кеша');
          return;
        }
      }
      
      console.log('🔄 [Booking] API ВЫЗОВ: booking.getPageData()');
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
      
      console.log('✅ [Booking] Данные загружены:', data.services?.length || 0, 'услуг');
    } catch (error) {
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        const cached = JSON.parse(cachedData);
        setServices(cached.services);
        setSettings(cached.settings);
        console.log('⚠️ [Booking] Ошибка API, используем кеш');
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
      // Форматируем дату в местном часовом поясе (YYYY-MM-DD)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      // Добавляем текущее время для фильтрации прошедших слотов
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      const API_URL = 'https://functions.poehali.dev/11f94891-555b-485d-ba38-a93639bb439c';
      const url = `${API_URL}?resource=available_slots&owner_id=${ownerId}&date=${dateStr}&service_id=${serviceId}&current_time=${currentTime}`;
      
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
      console.error('Error loading slots:', error);
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
      
      // Calculate actual start time (selected time - prep_time)
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

      // Create client first
      const clientResponse = await api.clients.create({
        name: clientData.name,
        phone: clientData.phone,
        email: clientData.email,
        owner_id: ownerId,
      });

      // Форматируем дату в местном часовом поясе
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const bookingDateStr = `${year}-${month}-${day}`;
      
      // Create booking with prep and buffer time included
      await api.bookings.create({
        client_id: clientResponse.id,
        service_id: selectedService,
        booking_date: bookingDateStr,
        start_time: startTime,
        end_time: endTime,
        status: 'pending',
      });

      toast({
        title: 'Успешно!',
        description: 'Ваша запись создана и ожидает подтверждения',
      });

      // Reset form
      setStep(1);
      setSelectedService('');
      setSelectedDate(undefined);
      setSelectedTime('');
      setClientData({ name: '', phone: '', email: '' });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать запись',
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
            <CardTitle className="text-3xl">Онлайн запись</CardTitle>
            <CardDescription>Выберите услугу, дату и время</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Select Service */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                  1
                </div>
                <h3 className="text-lg font-semibold">Выберите услугу</h3>
              </div>
              
              {step >= 1 && (
                <div className="grid grid-cols-1 gap-3 ml-10">
                  {services.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => handleServiceSelect(String(service.id))}
                      className={`p-4 border rounded-lg text-left transition-all ${
                        selectedService === String(service.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-primary/50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm text-gray-500">{service.duration}</p>
                        </div>
                        <p className="text-lg font-bold text-primary">{service.price}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Step 2: Select Date */}
            {step >= 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">Выберите дату</h3>
                    {selectedDate && (
                      <p className="text-sm text-gray-500 mt-1">
                        {selectedDate.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="ml-10 flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    className="rounded-md border"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Select Time */}
            {step >= 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                    3
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Выберите время</h3>
                    {!loading && availableSlots.length > 0 && (
                      <span className="text-sm text-gray-500">
                        {availableSlots.length} {availableSlots.length === 1 ? 'свободный слот' : availableSlots.length < 5 ? 'свободных слота' : 'свободных слотов'}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="ml-10">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-2">Нет свободных слотов на эту дату</p>
                      <p className="text-sm text-gray-400">Попробуйте выбрать другую дату</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.time}
                          onClick={() => handleTimeSelect(slot.time)}
                          className={`p-3 border rounded-lg transition-all ${
                            selectedTime === slot.time
                              ? 'border-primary bg-primary text-white'
                              : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Client Info */}
            {step >= 4 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary text-white">
                    4
                  </div>
                  <h3 className="text-lg font-semibold">Ваши данные</h3>
                </div>
                
                <div className="ml-10 space-y-4">
                  <div className="space-y-2">
                    <Label>Имя *</Label>
                    <Input
                      value={clientData.name}
                      onChange={(e) => setClientData({ ...clientData, name: e.target.value })}
                      placeholder="Иван Петров"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Телефон *</Label>
                    <Input
                      value={clientData.phone}
                      onChange={(e) => setClientData({ ...clientData, phone: e.target.value })}
                      placeholder="+7 (999) 123-45-67"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email (необязательно)</Label>
                    <Input
                      type="email"
                      value={clientData.email}
                      onChange={(e) => setClientData({ ...clientData, email: e.target.value })}
                      placeholder="example@mail.com"
                    />
                  </div>

                  <div className="pt-4 border-t">
                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-gray-600">Сводка записи:</p>
                      <p className="font-medium">{selectedServiceData?.name}</p>
                      <p className="text-sm text-gray-600">
                        {selectedDate?.toLocaleDateString('ru-RU')} в {selectedTime}
                      </p>
                      <p className="text-lg font-bold text-primary">{selectedServiceData?.price}</p>
                    </div>

                    <Button onClick={handleBooking} className="w-full" disabled={loading}>
                      {loading ? 'Создание...' : 'Записаться'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Booking;