interface Service {
  id: number;
  name: string;
  duration: string;
  price: string;
  active: boolean;
}

interface ServiceSelectionStepProps {
  services: Service[];
  onServiceSelect: (serviceId: string) => void;
}

export default function ServiceSelectionStep({ services, onServiceSelect }: ServiceSelectionStepProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Выберите услугу</h3>
      <div className="grid gap-3">
        {services.filter(s => s.active).map((service) => (
          <button
            key={service.id}
            onClick={() => onServiceSelect(String(service.id))}
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
  );
}
