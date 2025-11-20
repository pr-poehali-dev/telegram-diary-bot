import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';
import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';

const Sidebar = () => {
  const { sidebarOpen, setSidebarOpen, activeTab, setActiveTab } = useAppContext();
  const { user, isAdmin, isOwner, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', icon: 'LayoutDashboard', label: 'Дашборд', roles: ['admin', 'owner'] },
    { id: 'schedule', icon: 'Calendar', label: 'Расписание', roles: ['owner'] },
    { id: 'bookings', icon: 'ClipboardList', label: 'Записи', roles: ['admin', 'owner'] },
    { id: 'clients', icon: 'Users', label: 'Клиенты', roles: ['admin', 'owner'] },
    { id: 'services', icon: 'Briefcase', label: 'Услуги', roles: ['admin', 'owner'] },
    { id: 'settings', icon: 'Settings', label: 'Настройки', roles: ['admin', 'owner'] },
  ];

  const visibleMenuItems = menuItems.filter(item => item.roles.includes(user?.role || ''));
  return (
    <aside
      className={`${
        sidebarOpen ? 'w-64' : 'w-20'
      } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}
    >
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        {sidebarOpen && <h1 className="text-xl font-bold text-gray-900">Ежедневник</h1>}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hover:bg-gray-100"
        >
          <Icon name={sidebarOpen ? 'PanelLeftClose' : 'PanelLeftOpen'} size={20} />
        </Button>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {visibleMenuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === item.id
                ? 'bg-primary text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Icon name={item.icon} size={20} />
            {sidebarOpen && <span className="font-medium">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 px-4 py-3">
          <Avatar>
            <AvatarFallback className="bg-accent text-white">
              {user?.name.substring(0, 2).toUpperCase() || 'ГС'}
            </AvatarFallback>
          </Avatar>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">
                {isAdmin ? 'Администратор' : isOwner ? 'Владелец' : 'Клиент'}
              </p>
            </div>
          )}
        </div>
        {sidebarOpen && (
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={logout}
          >
            <Icon name="LogOut" size={16} className="mr-2" />
            Выйти
          </Button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;