import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';
import { useAppContext } from '@/contexts/AppContext';

const Sidebar = () => {
  const { sidebarOpen, setSidebarOpen, activeTab, setActiveTab } = useAppContext();
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
        {[
          { id: 'dashboard', icon: 'LayoutDashboard', label: 'Дашборд' },
          { id: 'schedule', icon: 'Calendar', label: 'Расписание' },
          { id: 'bookings', icon: 'ClipboardList', label: 'Записи' },
          { id: 'clients', icon: 'Users', label: 'Клиенты' },
          { id: 'services', icon: 'Briefcase', label: 'Услуги' },
          { id: 'settings', icon: 'Settings', label: 'Настройки' },
        ].map((item) => (
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
            <AvatarFallback className="bg-accent text-white">АД</AvatarFallback>
          </Avatar>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">Админ</p>
              <p className="text-xs text-gray-500 truncate">admin@example.com</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;