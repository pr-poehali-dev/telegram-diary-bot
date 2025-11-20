import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import WeekScheduleCard from './schedule/WeekScheduleCard';
import EventsCard from './schedule/EventsCard';
import BlockedDatesCard from './schedule/BlockedDatesCard';
import ConflictDialog from './schedule/ConflictDialog';

interface WeekScheduleItem {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

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
  const [weekSchedule, setWeekSchedule] = useState<WeekScheduleItem[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  
  const [showConflict, setShowConflict] = useState(false);
  const [conflictData, setConflictData] = useState<any>(null);
  const [forceCallback, setForceCallback] = useState<(() => void) | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [scheduleRes, eventsRes, blockedRes] = await Promise.all([
        api.schedule.getWeek(),
        api.events.getAll(),
        api.blockedDates.getAll(),
      ]);
      
      setWeekSchedule(scheduleRes.schedule || []);
      setEvents(eventsRes.events || []);
      setBlockedDates(blockedRes.blockedDates || []);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    }
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
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <WeekScheduleCard 
          weekSchedule={weekSchedule} 
          onDataChange={loadData} 
        />
        
        <EventsCard 
          events={events} 
          onDataChange={loadData} 
          onConflict={handleConflict}
        />
      </div>

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
    </div>
  );
}
