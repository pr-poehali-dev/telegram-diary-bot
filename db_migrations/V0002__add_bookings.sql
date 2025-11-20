
-- Добавляем записи на сегодня
INSERT INTO bookings (client_id, service_id, owner_id, booking_date, start_time, end_time, status, created_at)
VALUES
  (1, 1, 1, CURRENT_DATE, '10:00:00', '10:30:00', 'confirmed', CURRENT_TIMESTAMP),
  (2, 2, 1, CURRENT_DATE, '14:00:00', '15:00:00', 'confirmed', CURRENT_TIMESTAMP),
  (1, 4, 1, CURRENT_DATE, '16:00:00', '16:45:00', 'pending', CURRENT_TIMESTAMP);
