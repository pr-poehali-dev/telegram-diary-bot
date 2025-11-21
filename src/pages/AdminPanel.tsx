import Sidebar from '@/components/Sidebar';
import DashboardTab from '@/components/DashboardTab';
import ScheduleTab from '@/components/ScheduleTab';
import TabsContentComponent from '@/components/TabsContent';
import LoginPage from '@/components/LoginPage';
import { AppProvider, useAppContext } from '@/contexts/AppContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { DataProvider } from '@/contexts/DataContext';

const AdminPanelContent = () => {
  const { activeTab } = useAppContext();
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
      <div className="flex h-screen bg-gray-50">
        <Sidebar />

        <main className="flex-1 overflow-auto">
          <div className="p-8">
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
