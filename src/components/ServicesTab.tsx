import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

const ServicesTab = () => {
  const { services, loading } = useData();

  const activeServices = services.filter(s => s.active);
  const totalRevenue = services.reduce((sum, s) => {
    const priceNum = parseFloat(String(s.price).replace(/[^\d.]/g, ''));
    return sum + (isNaN(priceNum) ? 0 : priceNum);
  }, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Услуги</h2>
        <p className="text-gray-500 mt-1">Управление услугами и ценами</p>
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
                  <TableHead>Популярность</TableHead>
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
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Icon name="TrendingUp" size={14} className="text-blue-500" />
                        <span className="text-sm text-gray-600">-</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ServicesTab;