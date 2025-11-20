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
  
  const [clientData, setClientData] = useState({
    name: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const data = await api.services.getAll();
      setServices(data.services.filter((s: Service) => s.active));
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить услуги',
        variant: 'destructive',
      });
    }
  };

  const loadAvailableSlots = async (date: Date, serviceId: string) => {
    setLoading(true);
    try {
      const dateStr = date.toISOString().split('T')[0];
      const API_URL = 'https://functions.poehali.dev/11f94891-555b-485d-ba38-a93639bb439c';
      const response = await fetch(
        `${API_URL}?resource=available_slots&owner_id=${ownerId}&date=${dateStr}&service_id=${serviceId}`
      );
      const data = await response.json();
      setAvailableSlots(data.slots || []);
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
    setStep(2);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date && selectedService) {
      setSelectedDate(date);
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
      const totalMinutes = parseInt(hours) * 60 + parseInt(minutes) + durationMinutes;
      const endHours = Math.floor(totalMinutes / 60);
      const endMinutes = totalMinutes % 60;
      const endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;

      // Create client first
      const clientResponse = await api.clients.create({
        name: clientData.name,
        phone: clientData.phone,
        email: clientData.email,
        owner_id: ownerId,
      });

      // Create booking
      await api.bookings.create({
        client_id: clientResponse.id,
        service_id: selectedService,
        booking_date: selectedDate.toISOString().split('T')[0],
        start_time: selectedTime,
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
                  <h3 className="text-lg font-semibold">Выберите дату</h3>
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
                  <h3 className="text-lg font-semibold">Выберите время</h3>
                </div>
                
                <div className="ml-10 grid grid-cols-4 gap-2">
                  {loading ? (
                    <p className="col-span-4 text-center text-gray-500">Загрузка...</p>
                  ) : availableSlots.length === 0 ? (
                    <p className="col-span-4 text-center text-gray-500">Нет свободных слотов</p>
                  ) : (
                    availableSlots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => handleTimeSelect(slot.time)}
                        className={`p-3 border rounded-lg transition-all ${
                          selectedTime === slot.time
                            ? 'border-primary bg-primary text-white'
                            : 'border-gray-200 hover:border-primary/50'
                        }`}
                      >
                        {slot.time}
                      </button>
                    ))
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