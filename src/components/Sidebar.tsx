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
    { id: 'schedule', icon: 'Calendar', label: 'Календарь дел', roles: ['owner'] },
    { id: 'my-schedule', icon: 'CalendarDays', label: 'Моё расписание', roles: ['owner'] },
    { id: 'bookings', icon: 'ClipboardList', label: 'Записи', roles: ['admin', 'owner'] },
    { id: 'clients', icon: 'Users', label: 'Клиенты', roles: ['admin', 'owner'] },
    { id: 'services', icon: 'Briefcase', label: 'Услуги', roles: ['admin', 'owner'] },
    { id: 'settings', icon: 'Settings', label: 'Настройки', roles: ['admin', 'owner'] },
  ];

  const visibleMenuItems = menuItems.filter(item => item.roles.includes(user?.role || ''));
  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-16 md:w-20'
        } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col fixed md:relative h-full z-50 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
      <div className="p-4 md:p-6 border-b border-gray-200 flex items-center justify-between">
        {sidebarOpen && <h1 className="text-lg md:text-xl font-bold text-gray-900">Ежедневник</h1>}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hover:bg-gray-100"
        >
          <Icon name={sidebarOpen ? 'PanelLeftClose' : 'PanelLeftOpen'} size={18} />
        </Button>
      </div>

      <nav className="flex-1 p-2 md:p-4 space-y-1 md:space-y-2 overflow-y-auto">
        {visibleMenuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              // Закрываем sidebar на мобильных после выбора
              if (window.innerWidth < 768) setSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2 md:gap-3 px-2 md:px-4 py-2 md:py-3 rounded-lg transition-all ${
              activeTab === item.id
                ? 'bg-primary text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Icon name={item.icon} size={18} className="flex-shrink-0" />
            {sidebarOpen && <span className="text-sm md:text-base font-medium truncate">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="p-2 md:p-4 border-t border-gray-200">
        <div className="flex items-center gap-2 md:gap-3 px-2 md:px-4 py-2 md:py-3">
          <Avatar className="h-8 w-8 md:h-10 md:w-10">
            <AvatarFallback className="bg-accent text-white text-xs md:text-sm">
              {user?.role === 'admin' ? 'АД' : 'ВЛ'}
            </AvatarFallback>
          </Avatar>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-xs md:text-sm font-medium text-gray-900 truncate">ID: {user?.telegram_id}</p>
              <p className="text-xs text-gray-500 truncate">
                {isAdmin ? 'Администратор' : isOwner ? 'Владелец' : 'Клиент'}
              </p>
            </div>
          )}
        </div>
        {sidebarOpen && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 text-xs md:text-sm"
            onClick={logout}
          >
            <Icon name="LogOut" size={14} className="mr-2" />
            Выйти
          </Button>
        )}
      </div>
    </aside>
    </>
  );
};

export default Sidebar;