-- Исправляем время для дублирующихся записей
UPDATE bookings SET start_time = '09:00:00', end_time = '09:30:00' WHERE id = 5;
UPDATE bookings SET start_time = '15:00:00', end_time = '16:00:00' WHERE id = 6;
UPDATE bookings SET start_time = '17:00:00', end_time = '17:45:00' WHERE id = 7;