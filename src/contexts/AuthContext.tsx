import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/services/api';

interface User {
  telegram_id: string;
  role: 'admin' | 'owner';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (telegramId: number) => Promise<void>;
  loginByGroupId: (groupId: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isOwner: boolean;
  isClient: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const groupId = urlParams.get('groupId');
      
      if (groupId) {
        try {
          const response = await fetch(`https://functions.poehali.dev/22e2b938-d28c-4bb0-b268-8ccb03bbac16?groupId=${groupId}`);
          const data = await response.json();
          
          if (data.authorized) {
            const adminUser = {
              telegram_id: groupId,
              role: 'owner' as const
            };
            setUser(adminUser);
            localStorage.setItem('user', JSON.stringify(adminUser));
            localStorage.setItem('groupId', groupId);
          }
        } catch (error) {
          console.error('Auth by groupId failed:', error);
        }
      } else {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      }
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  const login = async (telegramId: number) => {
    setLoading(true);
    try {
      const response = await api.auth.login(telegramId);
      const userData = {
        telegram_id: String(telegramId),
        role: response.user.role
      };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginByGroupId = async (groupId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`https://functions.poehali.dev/22e2b938-d28c-4bb0-b268-8ccb03bbac16?groupId=${groupId}`);
      const data = await response.json();
      
      if (data.authorized) {
        const adminUser = {
          telegram_id: groupId,
          role: 'owner' as const
        };
        setUser(adminUser);
        localStorage.setItem('user', JSON.stringify(adminUser));
        localStorage.setItem('groupId', groupId);
      } else {
        throw new Error('Access denied');
      }
    } catch (error) {
      console.error('Login by groupId failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('groupId');
  };

  const isAdmin = user?.role === 'admin';
  const isOwner = user?.role === 'owner';
  const isClient = user?.role === 'client';

  return (
    <AuthContext.Provider value={{ user, loading, login, loginByGroupId, logout, isAdmin, isOwner, isClient }}>
      {children}
    </AuthContext.Provider>
  );
};