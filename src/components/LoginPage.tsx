import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const LoginPage = () => {
  const [telegramId, setTelegramId] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!telegramId) {
      toast({
        title: 'Ошибка',
        description: 'Введите Telegram ID',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await login(Number(telegramId));
      toast({
        title: 'Успешно',
        description: 'Вы вошли в систему',
      });
    } catch (error) {
      toast({
        title: 'Ошибка входа',
        description: 'Пользователь не найден',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (id: number, role: string) => {
    setTelegramId(String(id));
    toast({
      title: 'Демо-вход',
      description: `Вход как ${role}`,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Вход в систему</CardTitle>
          <CardDescription>Введите ваш Telegram ID для входа</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              type="number"
              placeholder="Telegram ID"
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
          
          <Button 
            onClick={handleLogin} 
            className="w-full" 
            disabled={loading}
          >
            {loading ? 'Вход...' : 'Войти'}
          </Button>

          <div className="pt-4 border-t">
            <p className="text-sm text-gray-500 mb-3 text-center">Быстрый вход (демо):</p>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => quickLogin(123456789, 'Владелец')}
              >
                Войти как Владелец
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => quickLogin(999999999, 'Администратор')}
              >
                Войти как Администратор
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
