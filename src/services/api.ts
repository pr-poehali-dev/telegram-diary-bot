const API_URL = 'https://functions.poehali.dev/11f94891-555b-485d-ba38-a93639bb439c';
const OWNER_ID = '1';

interface ApiResponse<T> {
  [key: string]: T;
}

async function apiRequest<T>(
  resource: string,
  method: string = 'GET',
  body?: any
): Promise<T> {
  let url = `${API_URL}?resource=${resource}&owner_id=${OWNER_ID}`;
  
  // Для DELETE добавляем id в URL, если есть
  if (method === 'DELETE' && body?.id) {
    url += `&id=${body.id}`;
  }
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  
  // Для 409 (конфликт) и 500 (ошибка с деталями) возвращаем JSON
  if (response.status === 409 || response.status === 500 || response.status === 400) {
    try {
      return await response.json();
    } catch {
      // Если не JSON, бросаем ошибку
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }
  }
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status} : ${url}\nResponse: ${text}`);
  }

  return response.json();
}

export const api = {
  bookings: {
    getAll: `${API_URL}?resource=bookings&owner_id=${OWNER_ID}`,
    getAllData: () => apiRequest<ApiResponse<any[]>>('bookings', 'GET'),
    getByDate: (date: string) => 
      apiRequest<ApiResponse<any[]>>(`bookings&date=${date}`, 'GET'),
    create: (booking: any) => 
      apiRequest('bookings', 'POST', { ...booking, owner_id: OWNER_ID }),
    update: (id: number, status: string) => 
      apiRequest('bookings', 'PUT', { id, status }),
  },

  events: {
    getAll: () => apiRequest<ApiResponse<any[]>>('events', 'GET'),
    getByDate: (date: string) => 
      apiRequest<ApiResponse<any[]>>(`events&date=${date}`, 'GET'),
    create: (event: any) => 
      apiRequest('events', 'POST', { ...event, owner_id: OWNER_ID }),
    delete: (id: number) => 
      apiRequest('events', 'DELETE', { id }),
  },

  clients: {
    getAll: () => apiRequest<ApiResponse<any[]>>('clients', 'GET'),
    create: (client: any) => 
      apiRequest('clients', 'POST', { ...client, owner_id: OWNER_ID }),
    update: (id: number, data: any) => 
      apiRequest('clients', 'PUT', { id, ...data }),
  },

  services: {
    getAll: () => apiRequest<ApiResponse<any[]>>('services', 'GET'),
    create: (service: any) => 
      apiRequest('services', 'POST', { ...service, owner_id: OWNER_ID }),
    update: (id: number, data: any) => 
      apiRequest('services', 'PUT', { id, ...data }),
    delete: (id: number) => 
      apiRequest('services', 'DELETE', { id }),
  },

  schedule: {
    getWeek: () => apiRequest<ApiResponse<any[]>>('week_schedule', 'GET'),
    create: (schedule: any) => 
      apiRequest('week_schedule', 'POST', { ...schedule, owner_id: OWNER_ID }),
    delete: (id: number) => 
      apiRequest('week_schedule', 'DELETE', { id }),
  },

  blockedDates: {
    getAll: () => apiRequest<ApiResponse<any[]>>('blocked_dates', 'GET'),
    add: (date: string, force?: boolean) => 
      apiRequest('blocked_dates', 'POST', { date, force, owner_id: OWNER_ID }),
    remove: (id: number) => 
      apiRequest('blocked_dates', 'DELETE', { id }),
  },

  settings: {
    get: () => apiRequest<ApiResponse<any>>('settings', 'GET'),
    update: (data: any) => 
      apiRequest('settings', 'PUT', { ...data, owner_id: OWNER_ID }),
  },

  auth: {
    login: async (telegramId: number) => {
      const response = await fetch(
        `https://functions.poehali.dev/3d742e4e-d51f-4527-8f32-f371d030cdcf?telegram_id=${telegramId}`
      );
      if (!response.ok) throw new Error('Auth failed');
      return response.json();
    },
  },
};