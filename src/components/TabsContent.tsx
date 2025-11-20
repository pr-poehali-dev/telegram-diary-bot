import { useAppContext } from '@/contexts/AppContext';
import BookingsTab from './BookingsTab';
import ClientsTab from './ClientsTab';
import ServicesTab from './ServicesTab';
import SettingsTab from './SettingsTab';

const TabsContentComponent = () => {
  const { activeTab } = useAppContext();
  return (
    <>
      {activeTab === 'bookings' && <BookingsTab />}
      {activeTab === 'clients' && <ClientsTab />}
      {activeTab === 'services' && <ServicesTab />}
      {activeTab === 'settings' && <SettingsTab />}
    </>
  );
};

export default TabsContentComponent;
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Записи</h2>
              <p className="text-gray-500 mt-1">Управление заявками клиентов</p>
            </div>
            <Button className="gap-2">
              <Icon name="Plus" size={16} />
              Новая запись
            </Button>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="all">Все</TabsTrigger>
              <TabsTrigger value="pending">Ожидают</TabsTrigger>
              <TabsTrigger value="confirmed">Подтверждены</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-6">
              <Card>
                <CardContent className="pt-6 space-y-3">
                  {mockBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-6">
                        <div className="text-center min-w-[80px]">
                          <p className="text-2xl font-bold text-primary">{booking.time}</p>
                          <p className="text-xs text-gray-500">{booking.duration} мин</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-lg">{booking.client}</p>
                          <p className="text-gray-600">{booking.service}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(booking.status)}>
                          {getStatusText(booking.status)}
                        </Badge>
                        {booking.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="default" className="gap-2">
                              <Icon name="Check" size={16} />
                              Подтвердить
                            </Button>
                            <Button size="sm" variant="outline" className="gap-2">
                              <Icon name="X" size={16} />
                              Отклонить
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {activeTab === 'clients' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Клиенты</h2>
              <p className="text-gray-500 mt-1">База ваших клиентов</p>
            </div>
            <Button className="gap-2">
              <Icon name="UserPlus" size={16} />
              Добавить клиента
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-3">
              {mockClients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-5 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-primary text-white text-lg">
                        {client.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-gray-900 text-lg">{client.name}</p>
                      <p className="text-sm text-gray-500">
                        {client.visits} визитов • Последний: {client.lastVisit}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Icon name="Eye" size={16} />
                    Подробнее
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'services' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Услуги</h2>
              <p className="text-gray-500 mt-1">Управление прайс-листом</p>
            </div>
            <Button className="gap-2">
              <Icon name="Plus" size={16} />
              Добавить услугу
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockServices.map((service) => (
              <Card key={service.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{service.name}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">{service.duration}</p>
                    </div>
                    <Switch checked={service.active} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-3xl font-bold text-primary">{service.price}</div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 gap-2">
                        <Icon name="Pencil" size={16} />
                        Изменить
                      </Button>
                      <Button variant="outline" size="icon">
                        <Icon name="Trash2" size={16} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Настройки</h2>
            <p className="text-gray-500 mt-1">Конфигурация системы</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Clock" size={20} />
                  Рабочее время
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Начало работы</Label>
                    <Input type="time" defaultValue="10:00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Конец работы</Label>
                    <Input type="time" defaultValue="20:00" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Timer" size={20} />
                  Буферы времени
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Время подготовки (мин)</Label>
                  <Input type="number" defaultValue="10" min="0" max="30" />
                </div>
                <div className="space-y-2">
                  <Label>Буфер между сеансами (мин)</Label>
                  <Input type="number" defaultValue="15" min="0" max="30" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Bell" size={20} />
                  Уведомления
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Время напоминания (за день)</Label>
                  <Input type="time" defaultValue="09:00" />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Напоминание за 90 минут</Label>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Zap" size={20} />
                  Дополнительно
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Приоритет времени работы</Label>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Автоподтверждение записей</Label>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Link" size={20} />
                Интеграция с Telegram
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Токен бота</Label>
                  <Input placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz" />
                </div>
                <Button className="gap-2">
                  <Icon name="Save" size={16} />
                  Сохранить настройки
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default TabsContentComponent;