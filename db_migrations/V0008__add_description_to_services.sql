-- Добавление поля description в таблицу services
ALTER TABLE services ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';