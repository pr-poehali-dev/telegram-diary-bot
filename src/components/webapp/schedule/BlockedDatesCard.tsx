import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { api } from '@/services/api';

interface BlockedDate {
  id: number;
  date: string;
}

interface BlockedDatesCardProps {
  blockedDates: BlockedDate[];
  onDataChange: () => void;
  onConflict: (conflictData: any, forceCallback: () => void) => void;
}

export default function BlockedDatesCard({ blockedDates, onDataChange, onConflict }: BlockedDatesCardProps) {
  const [showBlockDate, setShowBlockDate] = useState(false);
  const [blockDate, setBlockDate] = useState('');

  const handleBlockDate = async (force = false) => {
    try {
      const response = await api.blockedDates.add(blockDate, force);
      
      if (response.conflict) {
        onConflict(response, () => handleBlockDate(true));
        return;
      }
      
      setShowBlockDate(false);
      setBlockDate('');
      onDataChange();
    } catch (error) {
      console.error('Ошибка блокировки даты:', error);
    }
  };

  const handleUnblockDate = async (id: number) => {
    try {
      await api.blockedDates.remove(id);
      onDataChange();
    } catch (error) {
      console.error('Ошибка разблокировки даты:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle>Заблокированные даты</CardTitle>
            <CardDescription>Дни, помеченные как "Занят"</CardDescription>
          </div>
          <Dialog open={showBlockDate} onOpenChange={setShowBlockDate}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto">
                <Icon name="Ban" size={16} />
                <span className="ml-2">Заблокировать день</span>
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Заблокировать дату</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Дата</Label>
                <Input
                  type="date"
                  value={blockDate}
                  onChange={(e) => setBlockDate(e.target.value)}
                />
              </div>
              <Button onClick={() => handleBlockDate()} className="w-full">
                Заблокировать
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 md:grid-cols-3">
          {blockedDates.length === 0 ? (
            <p className="text-sm text-muted-foreground col-span-3">Нет заблокированных дат</p>
          ) : (
            blockedDates.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Icon name="Ban" size={16} className="text-destructive" />
                  <span className="text-sm font-medium">{item.date}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUnblockDate(item.id)}
                >
                  <Icon name="X" size={16} />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}