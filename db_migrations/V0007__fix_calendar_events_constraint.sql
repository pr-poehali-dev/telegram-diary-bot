-- Удаляем старый constraint с неправильными значениями
ALTER TABLE calendar_events DROP CONSTRAINT IF EXISTS calendar_events_event_type_check;

-- Добавляем правильный constraint
ALTER TABLE calendar_events ADD CONSTRAINT calendar_events_event_type_check 
    CHECK (event_type IN ('study', 'event', 'booking'));

-- Создаём индексы для оптимизации, если их ещё нет
CREATE INDEX IF NOT EXISTS idx_calendar_events_owner_date ON calendar_events(owner_id, event_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(event_date);