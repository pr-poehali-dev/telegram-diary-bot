import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ConflictDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflictData: any;
  onForceAction: () => void;
}

export default function ConflictDialog({ open, onOpenChange, conflictData, onForceAction }: ConflictDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Конфликт с записями</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {conflictData?.message}
          </p>
          {conflictData?.bookings && (
            <div className="space-y-2">
              {conflictData.bookings.map((booking: any) => (
                <div key={booking.id} className="p-3 border rounded-lg">
                  <p className="font-medium">{booking.client}</p>
                  <p className="text-sm text-muted-foreground">
                    {booking.service} • {booking.time || booking.startTime}
                  </p>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Отмена
            </Button>
            <Button variant="destructive" onClick={onForceAction} className="flex-1">
              Отменить записи и продолжить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
