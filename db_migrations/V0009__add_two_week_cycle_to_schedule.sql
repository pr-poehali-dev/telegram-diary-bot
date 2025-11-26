-- Добавляем поддержку двухнедельного расписания
-- cycle_start_date - дата начала цикла расписания (например, 01.09.2025 или 17.11.2025)
-- week_number - номер недели в цикле (1 или 2)

ALTER TABLE week_schedule 
ADD COLUMN cycle_start_date DATE,
ADD COLUMN week_number INTEGER;

-- Проверка: week_number может быть только 1 или 2
ALTER TABLE week_schedule 
ADD CONSTRAINT week_number_check CHECK (week_number IN (1, 2));

-- Для существующих записей устанавливаем значения по умолчанию
-- Все текущие записи относятся к первой неделе цикла, начавшегося 1 сентября 2025
UPDATE week_schedule 
SET cycle_start_date = '2025-09-01', 
    week_number = 1 
WHERE cycle_start_date IS NULL;

-- Теперь делаем поля обязательными
ALTER TABLE week_schedule 
ALTER COLUMN cycle_start_date SET NOT NULL,
ALTER COLUMN week_number SET NOT NULL;

-- Создаём индекс для быстрого поиска расписания по дате цикла
CREATE INDEX idx_week_schedule_cycle_date ON week_schedule(owner_id, cycle_start_date, week_number);