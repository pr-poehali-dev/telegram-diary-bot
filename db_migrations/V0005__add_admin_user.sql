-- Add admin user for demo
INSERT INTO users (telegram_id, role, name, phone)
VALUES (999999999, 'admin', 'Администратор Системы', '+79991111111')
ON CONFLICT DO NOTHING;
