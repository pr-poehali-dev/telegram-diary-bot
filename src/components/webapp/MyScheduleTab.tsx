import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import EventsCard from './schedule/EventsCard';
import BlockedDatesCard from './schedule/BlockedDatesCard';
import ConflictDialog from './schedule/ConflictDialog';
import ScheduleCycleManager from '@/components/ScheduleCycleManager';



interface CalendarEvent {
  id: number;
  type: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  description?: string;
}

interface BlockedDate {
  id: number;
  date: string;
}

export default function MyScheduleTab() {
  const { 
    events, 
    blockedDates, 
    refreshWeekSchedule, 
    refreshEvents, 
    refreshBlockedDates 
  } = useData();
  
  const [showConflict, setShowConflict] = useState(false);
  const [conflictData, setConflictData] = useState<any>(null);
  const [forceCallback, setForceCallback] = useState<(() => void) | null>(null);
  const [showCycleManager, setShowCycleManager] = useState(false);

  const loadData = async () => {
    await Promise.all([
      refreshWeekSchedule(),
      refreshEvents(),
      refreshBlockedDates(),
    ]);
  };

  const handleConflict = (data: any, callback: () => void) => {
    setConflictData(data);
    setForceCallback(() => callback);
    setShowConflict(true);
  };

  const handleForceAction = () => {
    setShowConflict(false);
    if (forceCallback) {
      forceCallback();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Моё расписание</h2>
          <p className="text-muted-foreground">
            Управление учебой, событиями и выходными днями
          </p>
        </div>
        <Button 
          variant="outline" 
          size="lg"
          onClick={() => setShowCycleManager(true)}
          title="Настроить расписание учёбы"
        >
          <Icon name="GraduationCap" size={20} className="mr-2" />
          Расписание учёбы
        </Button>
      </div>

      <EventsCard 
        events={events} 
        onDataChange={loadData} 
        onConflict={handleConflict}
      />

      <BlockedDatesCard 
        blockedDates={blockedDates} 
        onDataChange={loadData} 
        onConflict={handleConflict}
      />

      <ConflictDialog 
        open={showConflict}
        onOpenChange={setShowConflict}
        conflictData={conflictData}
        onForceAction={handleForceAction}
      />

      <ScheduleCycleManager
        open={showCycleManager}
        onOpenChange={setShowCycleManager}
        onSuccess={() => {
          refreshWeekSchedule();
        }}
      />
    </div>
  );
}