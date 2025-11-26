-- =====================================================
-- SQL миграция с начальными данными
-- Для проекта: access-bars-service
-- =====================================================

-- ВНИМАНИЕ: Замените значения на реальные данные владельца!

-- =====================================================
-- 1. Создать пользователя-владельца (owner)
-- =====================================================
-- ВАЖНО: Если в вашем проекте уже есть пользователь,
-- используйте его ID вместо создания нового

INSERT INTO users (telegram_id, role, name, phone, email, created_at)
VALUES (123456789, 'owner', 'Владелец Access Bars', '+79001234567', 'owner@access-bars.ru', CURRENT_TIMESTAMP)
ON CONFLICT (telegram_id) DO NOTHING;

-- Получить ID владельца (для следующих запросов используйте owner_id = 1 или ID вашего владельца)

-- =====================================================
-- 2. Создать услуги
-- =====================================================
-- ЗАМЕНИТЕ owner_id=1 на реальный ID владельца!

INSERT INTO services (owner_id, name, duration_minutes, price, description, active, created_at)
VALUES 
  (1, 'Access Bars сеанс', 60, 3000, 'Полноценный сеанс Access Bars', true, CURRENT_TIMESTAMP),
  (1, 'Access Bars (сокращённый)', 30, 1500, 'Сокращённый сеанс Access Bars', true, CURRENT_TIMESTAMP),
  (1, 'Массаж', 60, 2500, 'Расслабляющий массаж', true, CURRENT_TIMESTAMP),
  (1, 'Консультация', 45, 2000, 'Консультация по Access Bars', true, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 3. Создать настройки (опционально)
-- =====================================================
-- ЗАМЕНИТЕ owner_id=1 на реальный ID владельца!

INSERT INTO settings (owner_id, key, value)
VALUES 
  (1, 'work_start_time', '09:00'),
  (1, 'work_end_time', '20:00'),
  (1, 'booking_interval_minutes', '30'),
  (1, 'max_bookings_per_day', '10'),
  (1, 'booking_buffer_minutes', '15')
ON CONFLICT (owner_id, key) DO NOTHING;

-- =====================================================
-- 4. Создать тестового клиента (опционально)
-- =====================================================
-- Сначала создаём пользователя-клиента
INSERT INTO users (telegram_id, role, name, phone, email, created_at)
VALUES (987654321, 'client', 'Тестовый Клиент', '+79009876543', 'client@test.ru', CURRENT_TIMESTAMP)
ON CONFLICT (telegram_id) DO NOTHING;

-- Затем добавляем его в таблицу clients
-- ЗАМЕНИТЕ owner_id=1 и user_id=2 на реальные ID!
INSERT INTO clients (user_id, owner_id, total_visits, created_at)
VALUES (2, 1, 0, CURRENT_TIMESTAMP)
ON CONFLICT (user_id, owner_id) DO NOTHING;

-- =====================================================
-- КОНЕЦ МИГРАЦИИ
-- =====================================================

-- Для проверки данных выполните:
-- SELECT * FROM users;
-- SELECT * FROM services;
-- SELECT * FROM settings;
-- SELECT * FROM clients;
