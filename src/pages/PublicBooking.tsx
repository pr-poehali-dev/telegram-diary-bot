import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';
import BookingStepIndicator from '@/components/booking/BookingStepIndicator';
import ServiceSelectionStep from '@/components/booking/ServiceSelectionStep';
import DateTimeSelectionSteps from '@/components/booking/DateTimeSelectionSteps';
import ClientDataStep from '@/components/booking/ClientDataStep';
import TelegramNotificationDialog from '@/components/booking/TelegramNotificationDialog';

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
  const ownerId = '1';
  
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

      const phoneForBot = clientData.phone.replace(/\s/g, '').replace(/-/g, '').replace(/\(/g, '').replace(/\)/g, '');
      
      toast({
        title: '✅ Запись создана!',
        description: `Ваша запись ожидает подтверждения. Вы получите уведомление.`,
      });
      
      const telegramUrl = `https://t.me/Calendar_record_bot?start=${phoneForBot}`;
      setTelegramLink(telegramUrl);
      
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
            <BookingStepIndicator currentStep={step} />

            {step === 1 && (
              <ServiceSelectionStep
                services={services}
                onServiceSelect={handleServiceSelect}
              />
            )}

            {(step === 2 || step === 3) && (
              <DateTimeSelectionSteps
                step={step}
                selectedServiceData={selectedServiceData}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                availableSlots={availableSlots}
                loading={loading}
                onBackToServices={() => setStep(1)}
                onBackToDate={() => setStep(2)}
                onDateSelect={handleDateSelect}
                onTimeSelect={handleTimeSelect}
              />
            )}

            {step === 4 && (
              <ClientDataStep
                selectedServiceData={selectedServiceData}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                clientData={clientData}
                loading={loading}
                onBackToTime={() => setStep(3)}
                onClientDataChange={setClientData}
                onSubmit={handleBooking}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <TelegramNotificationDialog
        open={showTelegramDialog}
        telegramLink={telegramLink}
        onOpenChange={setShowTelegramDialog}
      />
    </div>
  );
};

export default PublicBooking;
