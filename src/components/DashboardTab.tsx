import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface DashboardTabProps {
  stats: {
    todayBookings: number;
    pendingApproval: number;
    totalClients: number;
    workload: number;
  };
  mockBookings: Array<{
    id: number;
    client: string;
    service: string;
    time: string;
    status: string;
    duration: number;
  }>;
  mockClients: Array<{
    id: number;
    name: string;
    visits: number;
    lastVisit: string;
  }>;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
}

const DashboardTab = ({
  stats,
  mockBookings,
  mockClients,
  getStatusColor,
  getStatusText,
}: DashboardTabProps) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Дашборд</h2>
        <p className="text-gray-500 mt-1">Обзор вашего бизнеса</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Записи сегодня
            </CardTitle>
            <Icon name="CalendarCheck" size={20} className="text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.todayBookings}</div>
            <p className="text-xs text-gray-500 mt-1">+2 от вчера</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Ожидают подтверждения
            </CardTitle>
            <Icon name="Clock" size={20} className="text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.pendingApproval}</div>
            <p className="text-xs text-gray-500 mt-1">Требуют внимания</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Всего клиентов
            </CardTitle>
            <Icon name="Users" size={20} className="text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.totalClients}</div>
            <p className="text-xs text-gray-500 mt-1">+5 за месяц</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Загрузка</CardTitle>
            <Icon name="TrendingUp" size={20} className="text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.workload}%</div>
            <p className="text-xs text-gray-500 mt-1">На эту неделю</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="CalendarDays" size={20} />
              Записи на сегодня
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-bold">{booking.time}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{booking.client}</p>
                    <p className="text-sm text-gray-500">
                      {booking.service} • {booking.duration} мин
                    </p>
                  </div>
                </div>
                <Badge className={getStatusColor(booking.status)}>
                  {getStatusText(booking.status)}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Star" size={20} />
              Топ клиенты
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockClients.map((client, index) => (
              <div
                key={client.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                    <span className="text-accent font-bold">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{client.name}</p>
                    <p className="text-sm text-gray-500">
                      {client.visits} визитов • {client.lastVisit}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardTab;
