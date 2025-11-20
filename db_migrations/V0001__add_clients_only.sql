
-- Добавляем клиентов
INSERT INTO clients (user_id, owner_id, total_visits, created_at)
VALUES
  (2, 1, 5, CURRENT_TIMESTAMP),
  (3, 1, 2, CURRENT_TIMESTAMP);
