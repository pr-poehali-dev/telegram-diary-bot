import Sidebar from '@/components/Sidebar';
import DashboardTab from '@/components/DashboardTab';
import ScheduleTab from '@/components/ScheduleTab';
import TabsContentComponent from '@/components/TabsContent';
import LoginPage from '@/components/LoginPage';
import { AppProvider, useAppContext } from '@/contexts/AppContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { DataProvider } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const AdminPanelContent = () => {
  const { activeTab, sidebarOpen, setSidebarOpen } = useAppContext();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-lg text-gray-600">Загрузка...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <DataProvider>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-auto">
          {/* Mobile header with hamburger */}
          <div className="md:hidden sticky top-0 z-30 bg-white border-b border-gray-200 p-4 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hover:bg-gray-100"
            >
              <Icon name="Menu" size={20} />
            </Button>
            <h1 className="text-lg font-bold text-gray-900">Ежедневник</h1>
          </div>

          <div className="p-4 md:p-8">
            {activeTab === 'dashboard' && <DashboardTab />}
            {activeTab === 'schedule' && <ScheduleTab />}
            <TabsContentComponent />
          </div>
        </main>
      </div>
    </DataProvider>
  );
};

const AdminPanel = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <AdminPanelContent />
      </AppProvider>
    </AuthProvider>
  );
};

export default AdminPanel;