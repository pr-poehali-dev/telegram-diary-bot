import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

interface Service {
  id: number;
  name: string;
  duration: string;
  price: string;
  active: boolean;
}

interface ClientData {
  name: string;
  phone: string;
  email: string;
}

interface ClientDataStepProps {
  selectedServiceData: Service | undefined;
  selectedDate: Date | undefined;
  selectedTime: string;
  clientData: ClientData;
  loading: boolean;
  onBackToTime: () => void;
  onClientDataChange: (data: ClientData) => void;
  onSubmit: () => void;
}

export default function ClientDataStep({
  selectedServiceData,
  selectedDate,
  selectedTime,
  clientData,
  loading,
  onBackToTime,
  onClientDataChange,
  onSubmit,
}: ClientDataStepProps) {
  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBackToTime} className="mb-4">
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
              onClientDataChange({ ...clientData, name: e.target.value })
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
              onClientDataChange({ ...clientData, phone: e.target.value })
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
              onClientDataChange({ ...clientData, email: e.target.value })
            }
            placeholder="your@email.com"
          />
        </div>
      </div>

      <Button
        onClick={onSubmit}
        disabled={loading}
        className="w-full"
        size="lg"
      >
        {loading ? 'Создание записи...' : 'Записаться'}
      </Button>
    </div>
  );
}
