import { useAppContext } from '@/contexts/AppContext';
import BookingsTab from './BookingsTab';
import ClientsTab from './ClientsTab';
import ServicesTab from './ServicesTab';
import SettingsTab from './SettingsTab';
import MyScheduleTab from './webapp/MyScheduleTab';

const TabsContentComponent = () => {
  const { activeTab } = useAppContext();
  return (
    <>
      {activeTab === 'bookings' && <BookingsTab />}
      {activeTab === 'clients' && <ClientsTab />}
      {activeTab === 'services' && <ServicesTab />}
      {activeTab === 'settings' && <SettingsTab />}
      {activeTab === 'my-schedule' && <MyScheduleTab />}
    </>
  );
};

export default TabsContentComponent;