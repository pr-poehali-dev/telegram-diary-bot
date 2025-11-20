import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';

const SettingsTab = () => {
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [systemSettings, setSystemSettings] = useState({
    prep_time: 0,
    buffer_time: 0,
    work_start: '10:00',
    work_end: '20:00',
    work_priority: true,
    reminder_days_before: 1,
  });

  const [profile, setProfile] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await api.settings.get();
        const settings = data.settings || {};
        
        setSystemSettings({
          prep_time: Number(settings.prep_time) || 0,
          buffer_time: Number(settings.buffer_time) || 0,
          work_start: settings.work_start || '10:00',
          work_end: settings.work_end || '20:00',
          work_priority: settings.work_priority === 'true',
          reminder_days_before: Number(settings.reminder_days_before) || 1,
        });
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    if (isAdmin) {
      loadSettings();
    }
  }, [isAdmin]);

  const handleSaveSystemSettings = async () => {
    setLoading(true);
    try {
      await api.settings.update(systemSettings);
      toast({ title: 'Успешно', description: 'Системные настройки сохранены' });
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось сохранить', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Настройки</h2>
        <p className="text-gray-500 mt-1">
          {isAdmin ? 'Системные настройки и профиль' : 'Профиль и настройки'}
        </p>
      </div>

      {isAdmin ? (
        <Tabs defaultValue="system" className="space-y-6">
          <TabsList>
            <TabsTrigger value="system">Системные</TabsTrigger>
            <TabsTrigger value="profile">Профиль</TabsTrigger>
          </TabsList>

          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Clock" size={20} />
                    Время подготовки и буферы
                  </CardTitle>
                  <CardDescription>
                    Установите время на подготовку и отдых между сеансами
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Время подготовки (минут)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="30"
                      value={systemSettings.prep_time}
                      onChange={(e) => setSystemSettings({ ...systemSettings, prep_time: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Буфер между сеансами (минут)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="30"
                      value={systemSettings.buffer_time}
                      onChange={(e) => setSystemSettings({ ...systemSettings, buffer_time: Number(e.target.value) })}
                    />
                  </div>
                  <Button onClick={handleSaveSystemSettings} disabled={loading}>
                    {loading ? 'Сохранение...' : 'Сохранить'}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Clock" size={20} />
                    Рабочее время
                  </CardTitle>
                  <CardDescription>
                    Общие часы работы для всех владельцев
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Начало работы</Label>
                      <Input
                        type="time"
                        value={systemSettings.work_start}
                        onChange={(e) => setSystemSettings({ ...systemSettings, work_start: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Конец работы</Label>
                      <Input
                        type="time"
                        value={systemSettings.work_end}
                        onChange={(e) => setSystemSettings({ ...systemSettings, work_end: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button onClick={handleSaveSystemSettings} disabled={loading}>
                    {loading ? 'Сохранение...' : 'Сохранить'}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Bell" size={20} />
                    Уведомления
                  </CardTitle>
                  <CardDescription>
                    Настройка напоминаний клиентам
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Отправлять напоминание за (дней)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="7"
                      value={systemSettings.reminder_days_before}
                      onChange={(e) => setSystemSettings({ ...systemSettings, reminder_days_before: Number(e.target.value) })}
                    />
                  </div>
                  <Button onClick={handleSaveSystemSettings} disabled={loading}>
                    {loading ? 'Сохранение...' : 'Сохранить'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="profile">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

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
                    <Input
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Телефон</Label>
                    <Input
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    />
                  </div>
                  <Button>Сохранить</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                <Input
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Телефон</Label>
                <Input
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
              </div>
              <Button>Сохранить</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SettingsTab;