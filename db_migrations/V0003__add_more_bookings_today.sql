
-- Добавляем еще записи на сегодня для тестирования
INSERT INTO bookings (client_id, service_id, owner_id, booking_date, start_time, end_time, status, created_at)
VALUES
  (2, 1, 1, CURRENT_DATE, '11:30:00', '12:00:00', 'confirmed', CURRENT_TIMESTAMP),
  (1, 2, 1, CURRENT_DATE, '13:00:00', '14:00:00', 'pending', CURRENT_TIMESTAMP);
