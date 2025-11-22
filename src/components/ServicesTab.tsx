import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Icon from '@/components/ui/icon';
import { useData } from '@/contexts/DataContext';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface Service {
  id?: number;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  active: boolean;
}

const ServicesTab = () => {
  const { services, loading, refreshServices } = useData();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<Service>({
    name: '',
    description: '',
    price: 0,
    duration_minutes: 60,
    active: true
  });
  const [saving, setSaving] = useState(false);

  const handleAdd = () => {
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      duration_minutes: 60,
      active: true
    });
    setDialogOpen(true);
  };

  const handleEdit = (service: any) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      price: parseFloat(String(service.price).replace(/[^\d.]/g, '')),
      duration_minutes: service.duration_minutes,
      active: service.active
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите название услуги',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      if (editingService) {
        await api.services.update(editingService.id!, formData);
        toast({
          title: 'Успешно',
          description: 'Услуга обновлена'
        });
      } else {
        await api.services.create(formData);
        toast({
          title: 'Успешно',
          description: 'Услуга добавлена'
        });
      }
      await refreshServices();
      setDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось сохранить услугу',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить услугу?')) return;

    try {
      await api.services.delete(id);
      toast({
        title: 'Успешно',
        description: 'Услуга удалена'
      });
      await refreshServices();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось удалить услугу',
        variant: 'destructive'
      });
    }
  };

  const activeServices = services.filter(s => s.active);
  const totalRevenue = services.reduce((sum, s) => {
    const priceNum = parseFloat(String(s.price).replace(/[^\d.]/g, ''));
    return sum + (isNaN(priceNum) ? 0 : priceNum);
  }, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Услуги</h2>
          <p className="text-gray-500 mt-1">Управление услугами и ценами</p>
        </div>
        <Button onClick={handleAdd}>
          <Icon name="Plus" size={16} className="mr-2" />
          Добавить услугу
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Всего услуг
            </CardTitle>
            <Icon name="Briefcase" size={20} className="text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{services.length}</div>
            <p className="text-xs text-gray-500 mt-1">В прайс-листе</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Активные
            </CardTitle>
            <Icon name="CheckCircle" size={20} className="text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{activeServices.length}</div>
            <p className="text-xs text-gray-500 mt-1">Доступны для записи</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Средний чек
            </CardTitle>
            <Icon name="DollarSign" size={20} className="text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {services.length > 0 ? Math.round(totalRevenue / services.length) : 0}₽
            </div>
            <p className="text-xs text-gray-500 mt-1">За услугу</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Прайс-лист</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-gray-500 py-8">Загрузка...</p>
          ) : services.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Нет услуг</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Длительность</TableHead>
                  <TableHead>Цена</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon name="Clock" size={14} className="text-gray-400" />
                        {service.duration_minutes} мин
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {service.price}
                    </TableCell>
                    <TableCell>
                      {service.active ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          Активна
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-700 border-gray-200">
                          Неактивна
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(service)}
                        >
                          <Icon name="Pencil" size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(service.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Icon name="Trash2" size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingService ? 'Редактировать услугу' : 'Добавить услугу'}
            </DialogTitle>
            <DialogDescription>
              Заполните информацию об услуге
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Например: Стрижка"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Краткое описание услуги"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Цена (₽)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  placeholder="1000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Длительность (мин)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
                  placeholder="60"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
              <Label htmlFor="active">Активна (доступна для записи)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServicesTab;