-- Удаляем старое уникальное ограничение, которое конфликтует с 2-недельным циклом
-- Старое: UNIQUE (owner_id, day_of_week) - не позволяло создать несколько записей для одного дня
ALTER TABLE week_schedule 
DROP CONSTRAINT IF EXISTS week_schedule_owner_id_day_of_week_key;

-- Создаём новое уникальное ограничение с учётом цикла и номера недели
-- Теперь: UNIQUE (owner_id, cycle_start_date, week_number, day_of_week)
-- Это позволяет иметь разные расписания для разных циклов и недель
ALTER TABLE week_schedule
ADD CONSTRAINT week_schedule_unique_entry 
UNIQUE (owner_id, cycle_start_date, week_number, day_of_week);