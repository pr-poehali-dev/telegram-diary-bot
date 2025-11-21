'''
Business: Telegram-бот для владельца - управление записями, мероприятиями и блокировками
Args: event с httpMethod, body от Telegram webhook; context с request_id
Returns: HTTP response 200 для Telegram
'''

import json
import os
from typing import Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
import urllib.request
import urllib.parse

def send_telegram_message(chat_id: int, text: str, reply_markup: Optional[Dict] = None) -> bool:
    bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
    url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
    
    payload = {
        'chat_id': chat_id,
        'text': text,
        'parse_mode': 'HTML'
    }
    
    if reply_markup:
        payload['reply_markup'] = reply_markup
    
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    
    try:
        with urllib.request.urlopen(req) as response:
            return response.status == 200
    except Exception as e:
        print(f'Error sending message: {e}')
        return False

def get_calendar_for_date(conn, owner_id: int, date_str: str) -> str:
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        date_obj = datetime.strptime(date_str, '%Y-%m-%d')
        day_names_ru = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
        day_name = day_names_ru[date_obj.weekday()]
        
        formatted_date = date_obj.strftime('%d.%m.%Y')
        
        text = f'📅 <b>{day_name} {formatted_date}</b>\n\n'
        
        # Проверка блокировки
        cur.execute('SELECT id FROM blocked_dates WHERE owner_id = %s AND blocked_date = %s', 
                   (owner_id, date_str))
        if cur.fetchone():
            text += '🚫 <b>День заблокирован</b>\n\n'
        
        # Учёба
        day_names_en = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        day_of_week = day_names_en[date_obj.weekday()]
        
        cur.execute('''
            SELECT start_time, end_time FROM week_schedule
            WHERE owner_id = %s AND day_of_week = %s
        ''', (owner_id, day_of_week))
        
        study = cur.fetchone()
        if study:
            text += f'📚 <b>Учёба:</b> {study["start_time"].strftime("%H:%M")} - {study["end_time"].strftime("%H:%M")}\n\n'
        
        # Мероприятия
        cur.execute('''
            SELECT title, start_time, end_time, event_type, description
            FROM calendar_events
            WHERE owner_id = %s AND event_date = %s
            ORDER BY start_time
        ''', (owner_id, date_str))
        
        events = cur.fetchall()
        if events:
            text += '🎯 <b>Мероприятия:</b>\n'
            for event in events:
                text += f'  • {event["start_time"].strftime("%H:%M")}-{event["end_time"].strftime("%H:%M")} {event["title"]}\n'
            text += '\n'
        
        # Записи клиентов
        cur.execute('''
            SELECT b.id, b.status, b.start_time, b.end_time,
                   u.name as client_name, u.phone as client_phone,
                   s.name as service_name, s.price
            FROM bookings b
            LEFT JOIN clients c ON b.client_id = c.id
            LEFT JOIN users u ON c.user_id = u.id
            LEFT JOIN services s ON b.service_id = s.id
            WHERE b.owner_id = %s AND b.booking_date = %s
            ORDER BY b.start_time
        ''', (owner_id, date_str))
        
        bookings = cur.fetchall()
        if bookings:
            text += '📌 <b>Записи клиентов:</b>\n\n'
            for booking in bookings:
                status_emoji = {
                    'pending': '⏳',
                    'confirmed': '✅',
                    'completed': '✔️',
                    'cancelled': '❌'
                }
                emoji = status_emoji.get(booking['status'], '❓')
                
                text += f'{emoji} <b>{booking["start_time"].strftime("%H:%M")}</b> - {booking["service_name"]}\n'
                text += f'👤 {booking["client_name"]}\n'
                text += f'📞 {booking["client_phone"]}\n'
                text += f'💰 {booking["price"]}₽\n\n'
        else:
            text += '📭 Нет записей на этот день\n'
        
        return text

def handle_command(conn, chat_id: int, command: str, owner_id: int) -> str:
    if command == '/start':
        return '''👋 <b>Добро пожаловать в бот управления записями!</b>

📅 <b>Просмотр календаря:</b>
/today - Сегодня
/tomorrow - Завтра
/week - Неделя вперёд
/pending - Ожидающие подтверждения

🎯 <b>Мероприятия:</b>
/event_add - Добавить мероприятие
/event_list - Список мероприятий
/event_delete - Удалить мероприятие

🚫 <b>Блокировки дат:</b>
/block_date - Заблокировать дату
/unblock_date - Разблокировать дату
/blocked_list - Список заблокированных дат'''
    
    elif command == '/today':
        today = datetime.now().strftime('%Y-%m-%d')
        return get_calendar_for_date(conn, owner_id, today)
    
    elif command == '/tomorrow':
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        return get_calendar_for_date(conn, owner_id, tomorrow)
    
    elif command == '/week':
        text = '📅 <b>Календарь на неделю:</b>\n\n'
        for i in range(7):
            date = (datetime.now() + timedelta(days=i)).strftime('%Y-%m-%d')
            text += get_calendar_for_date(conn, owner_id, date)
            text += '━━━━━━━━━━━━━━━━\n\n'
        return text
    
    elif command == '/pending':
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute('''
                SELECT b.id, b.booking_date, b.start_time,
                       u.name as client_name, u.phone as client_phone,
                       s.name as service_name, s.price
                FROM bookings b
                LEFT JOIN clients c ON b.client_id = c.id
                LEFT JOIN users u ON c.user_id = u.id
                LEFT JOIN services s ON b.service_id = s.id
                WHERE b.owner_id = %s AND b.status = 'pending'
                ORDER BY b.booking_date, b.start_time
                LIMIT 20
            ''', (owner_id,))
            
            bookings = cur.fetchall()
            
            if not bookings:
                return '✅ Нет записей, ожидающих подтверждения'
            
            text = f'⏳ <b>Ожидают подтверждения ({len(bookings)}):</b>\n\n'
            
            for booking in bookings:
                date_obj = booking['booking_date']
                formatted_date = date_obj.strftime('%d.%m.%Y')
                
                text += f'📅 {formatted_date} в {booking["start_time"].strftime("%H:%M")}\n'
                text += f'👤 {booking["client_name"]}\n'
                text += f'📞 {booking["client_phone"]}\n'
                text += f'💇 {booking["service_name"]}\n'
                text += f'💰 {booking["price"]}₽\n'
                
                # Добавляем кнопки для управления
                reply_markup = {
                    'inline_keyboard': [[
                        {'text': '✅ Подтвердить', 'callback_data': f'confirm_{booking["id"]}'},
                        {'text': '❌ Отменить', 'callback_data': f'cancel_{booking["id"]}'}
                    ]]
                }
                send_telegram_message(chat_id, text, reply_markup)
                text = ''
            
            return text if text else None
    
    elif command == '/event_list':
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute('''
                SELECT id, title, event_date, start_time, end_time, event_type, description
                FROM calendar_events
                WHERE owner_id = %s AND event_date >= CURRENT_DATE
                ORDER BY event_date, start_time
                LIMIT 20
            ''', (owner_id,))
            
            events = cur.fetchall()
            
            if not events:
                return '📭 Нет предстоящих мероприятий'
            
            text = f'🎯 <b>Мероприятия ({len(events)}):</b>\n\n'
            
            for event in events:
                date_obj = event['event_date']
                formatted_date = date_obj.strftime('%d.%m.%Y')
                
                text += f'📅 {formatted_date}\n'
                text += f'🕐 {event["start_time"].strftime("%H:%M")}-{event["end_time"].strftime("%H:%M")}\n'
                text += f'📌 <b>{event["title"]}</b>\n'
                if event['description']:
                    text += f'📝 {event["description"]}\n'
                text += f'🔑 ID: {event["id"]}\n\n'
            
            return text
    
    elif command == '/blocked_list':
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute('''
                SELECT id, blocked_date
                FROM blocked_dates
                WHERE owner_id = %s AND blocked_date >= CURRENT_DATE
                ORDER BY blocked_date
            ''', (owner_id,))
            
            dates = cur.fetchall()
            
            if not dates:
                return '✅ Нет заблокированных дат'
            
            text = f'🚫 <b>Заблокированные даты ({len(dates)}):</b>\n\n'
            
            for date in dates:
                date_obj = date['blocked_date']
                formatted_date = date_obj.strftime('%d.%m.%Y')
                text += f'• {formatted_date} (ID: {date["id"]})\n'
            
            return text
    
    elif command == '/event_add':
        return '''🎯 <b>Добавить мероприятие</b>

Формат: <code>/event_add ДАТА ВРЕМЯ_С ВРЕМЯ_ДО НАЗВАНИЕ</code>

Пример:
<code>/event_add 2025-11-25 14:00 16:00 Встреча с поставщиком</code>'''
    
    elif command == '/event_delete':
        return '''🗑 <b>Удалить мероприятие</b>

Сначала посмотрите список: /event_list
Затем используйте: <code>/event_delete ID</code>

Пример: <code>/event_delete 5</code>'''
    
    elif command == '/block_date':
        return '''🚫 <b>Заблокировать дату</b>

Формат: <code>/block_date ДАТА</code>

Пример: <code>/block_date 2025-11-25</code>'''
    
    elif command == '/unblock_date':
        return '''✅ <b>Разблокировать дату</b>

Сначала посмотрите список: /blocked_list
Затем используйте: <code>/unblock_date ID</code>

Пример: <code>/unblock_date 3</code>'''
    
    return '❓ Неизвестная команда. Используйте /start для списка команд.'

def handle_callback(conn, callback_data: str, chat_id: int, message_id: int, owner_id: int) -> str:
    parts = callback_data.split('_')
    action = parts[0]
    
    if action == 'confirm':
        booking_id = int(parts[1])
        with conn.cursor() as cur:
            cur.execute('UPDATE bookings SET status = %s WHERE id = %s AND owner_id = %s',
                       ('confirmed', booking_id, owner_id))
            conn.commit()
        return f'✅ Запись #{booking_id} подтверждена!'
    
    elif action == 'cancel':
        booking_id = int(parts[1])
        with conn.cursor() as cur:
            cur.execute('UPDATE bookings SET status = %s WHERE id = %s AND owner_id = %s',
                       ('cancelled', booking_id, owner_id))
            conn.commit()
        return f'❌ Запись #{booking_id} отменена'
    
    return '❓ Неизвестное действие'

def is_access_allowed(chat_id: int) -> bool:
    owner_telegram_id = int(os.environ.get('TELEGRAM_OWNER_ID', '0'))
    group_id = os.environ.get('TELEGRAM_GROUP_ID', '')
    
    if chat_id == owner_telegram_id:
        return True
    
    if group_id and str(chat_id) == group_id:
        return True
    
    return False

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        body = json.loads(event.get('body', '{}'))
        
        # Telegram webhook update
        if 'message' in body:
            message = body['message']
            chat_id = message['chat']['id']
            text = message.get('text', '')
            
            # Проверяем доступ (владелец или группа)
            if not is_access_allowed(chat_id):
                send_telegram_message(chat_id, '❌ У вас нет доступа к этому боту')
                return {'statusCode': 200, 'body': 'OK', 'isBase64Encoded': False}
            
            db_url = os.environ.get('DATABASE_URL')
            conn = psycopg2.connect(db_url)
            
            try:
                # Обработка команд с параметрами
                if text.startswith('/event_add '):
                    parts = text[11:].split(' ', 3)
                    if len(parts) >= 4:
                        date, time_start, time_end, title = parts
                        
                        with conn.cursor() as cur:
                            cur.execute('''
                                INSERT INTO calendar_events (owner_id, event_date, start_time, end_time, title, event_type)
                                VALUES (%s, %s, %s, %s, %s, %s)
                            ''', (1, date, time_start, time_end, title, 'custom'))
                            conn.commit()
                        
                        response_text = f'✅ Мероприятие "{title}" добавлено на {date}'
                    else:
                        response_text = '❌ Неверный формат. Используйте: /event_add ДАТА ВРЕМЯ_С ВРЕМЯ_ДО НАЗВАНИЕ'
                
                elif text.startswith('/event_delete '):
                    event_id = int(text[14:])
                    with conn.cursor() as cur:
                        cur.execute('DELETE FROM calendar_events WHERE id = %s AND owner_id = %s', (event_id, 1))
                        conn.commit()
                    response_text = f'✅ Мероприятие #{event_id} удалено'
                
                elif text.startswith('/block_date '):
                    date = text[12:].strip()
                    with conn.cursor() as cur:
                        cur.execute('INSERT INTO blocked_dates (owner_id, blocked_date) VALUES (%s, %s)', (1, date))
                        conn.commit()
                    response_text = f'🚫 Дата {date} заблокирована'
                
                elif text.startswith('/unblock_date '):
                    block_id = int(text[14:])
                    with conn.cursor() as cur:
                        cur.execute('DELETE FROM blocked_dates WHERE id = %s AND owner_id = %s', (block_id, 1))
                        conn.commit()
                    response_text = f'✅ Блокировка #{block_id} снята'
                
                else:
                    # Обычные команды
                    response_text = handle_command(conn, chat_id, text, 1)
                
                if response_text:
                    send_telegram_message(chat_id, response_text)
            
            finally:
                conn.close()
        
        elif 'callback_query' in body:
            callback = body['callback_query']
            chat_id = callback['message']['chat']['id']
            message_id = callback['message']['message_id']
            callback_data = callback['data']
            
            if not is_access_allowed(chat_id):
                return {'statusCode': 200, 'body': 'OK', 'isBase64Encoded': False}
            
            db_url = os.environ.get('DATABASE_URL')
            conn = psycopg2.connect(db_url)
            
            try:
                response_text = handle_callback(conn, callback_data, chat_id, message_id, 1)
                send_telegram_message(chat_id, response_text)
            finally:
                conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'ok': True}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }