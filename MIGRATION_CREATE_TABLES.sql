-- =====================================================
-- SQL миграция для создания таблиц Ежедневника
-- Для проекта: access-bars-service
-- =====================================================

-- 1. Таблица users (если её нет в проекте, иначе пропустить)
-- ВНИМАНИЕ: Если у вас уже есть таблица users, пропустите этот блок!
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для users
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- =====================================================
-- 2. Таблица services - услуги
-- =====================================================
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для services
CREATE INDEX IF NOT EXISTS idx_services_owner ON services(owner_id);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(active);

-- =====================================================
-- 3. Таблица clients - клиенты
-- =====================================================
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_visits INTEGER DEFAULT 0,
    last_visit_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для clients
CREATE INDEX IF NOT EXISTS idx_clients_user ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_owner ON clients(owner_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_user_owner ON clients(user_id, owner_id);

-- =====================================================
-- 4. Таблица calendar_events - мероприятия
-- =====================================================
CREATE TABLE IF NOT EXISTS calendar_events (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для calendar_events
CREATE INDEX IF NOT EXISTS idx_calendar_events_owner ON calendar_events(owner_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(event_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_owner_date ON calendar_events(owner_id, event_date);

-- =====================================================
-- 5. Таблица bookings - записи клиентов
-- =====================================================
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES calendar_events(id) ON DELETE SET NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для bookings
CREATE INDEX IF NOT EXISTS idx_bookings_client ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_owner ON bookings(owner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_owner_date ON bookings(owner_id, booking_date);

-- =====================================================
-- 6. Таблица week_schedule - расписание учёбы
-- =====================================================
CREATE TABLE IF NOT EXISTS week_schedule (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_of_week VARCHAR(20) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    cycle_start_date DATE NOT NULL,
    week_number INTEGER NOT NULL CHECK (week_number IN (1, 2)),
    CONSTRAINT week_schedule_unique_entry UNIQUE (owner_id, cycle_start_date, week_number, day_of_week)
);

-- Индексы для week_schedule
CREATE INDEX IF NOT EXISTS idx_week_schedule_owner ON week_schedule(owner_id);
CREATE INDEX IF NOT EXISTS idx_week_schedule_cycle_date ON week_schedule(owner_id, cycle_start_date, week_number);

-- =====================================================
-- 7. Таблица blocked_dates - заблокированные даты
-- =====================================================
CREATE TABLE IF NOT EXISTS blocked_dates (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_date DATE NOT NULL,
    CONSTRAINT blocked_dates_owner_id_blocked_date_key UNIQUE (owner_id, blocked_date)
);

-- Индексы для blocked_dates
CREATE INDEX IF NOT EXISTS idx_blocked_dates_owner ON blocked_dates(owner_id);
CREATE INDEX IF NOT EXISTS idx_blocked_dates_date ON blocked_dates(blocked_date);

-- =====================================================
-- 8. Таблица settings - настройки системы
-- =====================================================
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key VARCHAR(255) NOT NULL,
    value TEXT,
    CONSTRAINT settings_owner_key_unique UNIQUE (owner_id, key)
);

-- Индексы для settings
CREATE INDEX IF NOT EXISTS idx_settings_owner ON settings(owner_id);

-- =====================================================
-- КОНЕЦ МИГРАЦИИ
-- =====================================================
