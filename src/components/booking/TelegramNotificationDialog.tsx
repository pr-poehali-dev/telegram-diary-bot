import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface TelegramNotificationDialogProps {
  open: boolean;
  telegramLink: string;
  onOpenChange: (open: boolean) => void;
}

export default function TelegramNotificationDialog({
  open,
  telegramLink,
  onOpenChange,
}: TelegramNotificationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Send" className="text-blue-500" />
            Получайте уведомления в Telegram
          </DialogTitle>
          <DialogDescription>
            Нажмите на кнопку ниже, чтобы автоматически открыть бота и подключить уведомления
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900 mb-2">
              📱 После нажатия кнопки:
            </p>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Откроется Telegram бот</li>
              <li>Нажмите кнопку "Start" или "Старт"</li>
              <li>Готово! Вы будете получать уведомления о записи</li>
            </ol>
          </div>

          <Button 
            onClick={() => window.open(telegramLink, '_blank')}
            className="w-full bg-blue-500 hover:bg-blue-600"
            size="lg"
          >
            <Icon name="Send" className="mr-2" />
            Открыть Telegram бота
          </Button>

          <Button 
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Не сейчас
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
