import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import Icon from '@/components/ui/icon';

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

interface DateTimeSelectionStepsProps {
  step: number;
  selectedServiceData: Service | undefined;
  selectedDate: Date | undefined;
  selectedTime: string;
  availableSlots: TimeSlot[];
  loading: boolean;
  onBackToServices: () => void;
  onBackToDate: () => void;
  onDateSelect: (date: Date | undefined) => void;
  onTimeSelect: (time: string) => void;
}

export default function DateTimeSelectionSteps({
  step,
  selectedServiceData,
  selectedDate,
  selectedTime,
  availableSlots,
  loading,
  onBackToServices,
  onBackToDate,
  onDateSelect,
  onTimeSelect,
}: DateTimeSelectionStepsProps) {
  if (step === 2 && selectedServiceData) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={onBackToServices} className="mb-4">
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
          onSelect={onDateSelect}
          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
          className="rounded-md border mx-auto"
        />
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={onBackToDate} className="mb-4">
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
                  onClick={() => onTimeSelect(slot.time)}
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
    );
  }

  return null;
}
