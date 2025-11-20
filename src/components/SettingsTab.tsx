import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const SettingsTab = () => {
  return (
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
                <Input type="time" defaultValue="09:00" />
              </div>
              <div className="space-y-2">
                <Label>Конец работы</Label>
                <Input type="time" defaultValue="20:00" />
              </div>
            </div>
            <Button>Сохранить</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Timer" size={20} />
              Интервалы записи
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Длина слота (минут)</Label>
              <Input type="number" defaultValue="30" />
            </div>
            <div className="space-y-2">
              <Label>Буфер между записями (минут)</Label>
              <Input type="number" defaultValue="10" />
            </div>
            <Button>Сохранить</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="User" size={20} />
              Профиль
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Имя</Label>
              <Input defaultValue="Администратор" />
            </div>
            <div className="space-y-2">
              <Label>Телефон</Label>
              <Input defaultValue="+7 (999) 123-45-67" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" defaultValue="admin@example.com" />
            </div>
            <Button>Сохранить</Button>
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
              <p className="text-sm text-gray-600">
                Настройка Telegram бота для уведомлений будет доступна в следующей версии
              </p>
            </div>
            <Button variant="outline" disabled>
              <Icon name="MessageCircle" size={16} className="mr-2" />
              Подключить Telegram Bot
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsTab;
