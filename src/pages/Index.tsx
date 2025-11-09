import Sidebar from '@/components/Sidebar';
import DashboardTab from '@/components/DashboardTab';
import ScheduleTab from '@/components/ScheduleTab';
import TabsContentComponent from '@/components/TabsContent';
import { AppProvider, useAppContext } from '@/contexts/AppContext';

const IndexContent = () => {
  const { activeTab } = useAppContext();

  return (
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
  );
};

const Index = () => {
  return (
    <AppProvider>
      <IndexContent />
    </AppProvider>
  );
};

export default Index;
