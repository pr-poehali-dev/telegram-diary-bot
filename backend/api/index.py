'''
Business: Единый API для управления записями, событиями, услугами и клиентами
Args: event с httpMethod, body, queryStringParameters, pathParams; context с request_id
Returns: HTTP response с данными в зависимости от resource
'''

import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor
import urllib.request

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    # Handle CORS OPTIONS request
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    # Получаем resource из path или query параметра
    resource = event.get('queryStringParameters', {}).get('resource', 'bookings')
    
    db_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(db_url)
    
    try:
        # BOOKINGS
        if resource == 'bookings':
            if method == 'GET':
                owner_id = event.get('queryStringParameters', {}).get('owner_id')
                booking_date = event.get('queryStringParameters', {}).get('date')
                
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    if booking_date:
                        query = '''
                            SELECT b.*, c.name as client_name, s.name as service_name, s.duration_minutes
                            FROM bookings b
                            LEFT JOIN clients c ON b.client_id = c.id
                            LEFT JOIN users u ON c.user_id = u.id
                            LEFT JOIN services s ON b.service_id = s.id
                            WHERE b.owner_id = %s AND b.booking_date = %s
                            ORDER BY b.start_time
                        '''
                        cur.execute(query.replace('c.name', 'u.name'), (owner_id, booking_date))
                    else:
                        query = '''
                            SELECT b.*, u.name as client_name, s.name as service_name, s.duration_minutes
                            FROM bookings b
                            LEFT JOIN clients c ON b.client_id = c.id
                            LEFT JOIN users u ON c.user_id = u.id
                            LEFT JOIN services s ON b.service_id = s.id
                            WHERE b.owner_id = %s
                            ORDER BY b.booking_date DESC, b.start_time
                            LIMIT 100
                        '''
                        cur.execute(query, (owner_id,))
                    
                    bookings = cur.fetchall()
                    
                    result = []
                    for booking in bookings:
                        result.append({
                            'id': booking['id'],
                            'client': booking['client_name'] or 'Неизвестно',
                            'service': booking['service_name'] or 'Услуга удалена',
                            'time': booking['start_time'].strftime('%H:%M') if booking['start_time'] else '00:00',
                            'date': booking['booking_date'].strftime('%Y-%m-%d') if booking['booking_date'] else '',
                            'status': booking['status'],
                            'duration': booking['duration_minutes'] if booking['duration_minutes'] else 60
                        })
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'isBase64Encoded': False,
                        'body': json.dumps({'bookings': result})
                    }
            
            elif method == 'POST':
                body_data = json.loads(event.get('body', '{}'))
                
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    query = '''
                        INSERT INTO bookings 
                        (client_id, service_id, owner_id, booking_date, start_time, end_time, status)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                        RETURNING id
                    '''
                    cur.execute(query, (
                        body_data['client_id'],
                        body_data['service_id'],
                        body_data['owner_id'],
                        body_data['booking_date'],
                        body_data['start_time'],
                        body_data['end_time'],
                        body_data.get('status', 'pending')
                    ))
                    
                    booking_id = cur.fetchone()['id']
                    conn.commit()
                    
                    # Получаем полные данные записи для уведомления
                    cur.execute('''
                        SELECT 
                            b.id as booking_id,
                            b.booking_date,
                            b.start_time,
                            u.name as client_name,
                            u.phone as client_phone,
                            u.email as client_email,
                            s.name as service_name,
                            s.duration_minutes,
                            s.price
                        FROM bookings b
                        LEFT JOIN clients c ON b.client_id = c.id
                        LEFT JOIN users u ON c.user_id = u.id
                        LEFT JOIN services s ON b.service_id = s.id
                        WHERE b.id = %s
                    ''', (booking_id,))
                    
                    booking_data = cur.fetchone()
                    
                    # Отправляем уведомление в Telegram
                    if booking_data:
                        try:
                            telegram_bot_url = 'https://functions.poehali.dev/07b2b89b-011e-472f-b782-0f844489a891'
                            notification_payload = {
                                'booking_id': booking_data['booking_id'],
                                'client_name': booking_data['client_name'] or 'Не указано',
                                'client_phone': booking_data['client_phone'] or 'Не указан',
                                'client_email': booking_data['client_email'] or 'не указан',
                                'service_name': booking_data['service_name'],
                                'duration': booking_data['duration_minutes'],
                                'price': str(booking_data['price']).replace('₽', '').strip(),
                                'date': booking_data['booking_date'].strftime('%d.%m.%Y'),
                                'time': booking_data['start_time'].strftime('%H:%M')
                            }
                            
                            data = json.dumps(notification_payload).encode('utf-8')
                            req = urllib.request.Request(
                                telegram_bot_url,
                                data=data,
                                headers={'Content-Type': 'application/json'}
                            )
                            urllib.request.urlopen(req, timeout=5)
                        except Exception as e:
                            print(f'Failed to send Telegram notification: {e}')
                    
                    return {
                        'statusCode': 201,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'isBase64Encoded': False,
                        'body': json.dumps({'id': booking_id, 'message': 'Booking created'})
                    }
            
            elif method == 'PUT':
                body_data = json.loads(event.get('body', '{}'))
                booking_id = body_data.get('id')
                
                with conn.cursor() as cur:
                    query = '''
                        UPDATE bookings 
                        SET status = %s, updated_at = CURRENT_TIMESTAMP
                        WHERE id = %s
                    '''
                    cur.execute(query, (body_data['status'], booking_id))
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'isBase64Encoded': False,
                        'body': json.dumps({'message': 'Booking updated'})
                    }
        
        # CALENDAR EVENTS
        elif resource == 'events':
            if method == 'GET':
                owner_id = event.get('queryStringParameters', {}).get('owner_id')
                event_date = event.get('queryStringParameters', {}).get('date')
                
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    if event_date:
                        query = '''
                            SELECT * FROM calendar_events
                            WHERE owner_id = %s AND event_date = %s
                            ORDER BY start_time
                        '''
                        cur.execute(query, (owner_id, event_date))
                    else:
                        query = '''
                            SELECT * FROM calendar_events
                            WHERE owner_id = %s
                            ORDER BY event_date DESC, start_time
                            LIMIT 100
                        '''
                        cur.execute(query, (owner_id,))
                    
                    events = cur.fetchall()
                    
                    result = []
                    for evt in events:
                        result.append({
                            'id': evt['id'],
                            'type': evt['event_type'],
                            'title': evt['title'],
                            'date': evt['event_date'].strftime('%Y-%m-%d'),
                            'startTime': evt['start_time'].strftime('%H:%M'),
                            'endTime': evt['end_time'].strftime('%H:%M'),
                            'description': evt['description']
                        })
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'events': result})
                }
            
            elif method == 'POST':
                try:
                    body_data = json.loads(event.get('body', '{}'))
                    
                    # Валидация обязательных полей
                    required_fields = ['owner_id', 'event_date', 'start_time', 'end_time', 'title', 'event_type']
                    missing = [f for f in required_fields if f not in body_data or not body_data[f]]
                    if missing:
                        return {
                            'statusCode': 400,
                            'headers': {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            'isBase64Encoded': False,
                            'body': json.dumps({
                                'error': f'Missing required fields: {", ".join(missing)}'
                            })
                        }
                    
                    with conn.cursor(cursor_factory=RealDictCursor) as cur:
                        # Проверяем конфликты с подтверждёнными записями клиентов
                        cur.execute('''
                            SELECT b.id, u.name as client_name, s.name as service_name, 
                                   TO_CHAR(b.start_time, 'HH24:MI') as start_time,
                                   TO_CHAR(b.end_time, 'HH24:MI') as end_time
                            FROM bookings b
                            LEFT JOIN clients c ON b.client_id = c.id
                            LEFT JOIN users u ON c.user_id = u.id
                            LEFT JOIN services s ON b.service_id = s.id
                            WHERE b.owner_id = %s 
                            AND b.booking_date = %s 
                            AND b.status = 'confirmed'
                            AND b.start_time < %s::time 
                            AND b.end_time > %s::time
                        ''', (
                            body_data['owner_id'],
                            body_data['event_date'],
                            body_data['end_time'],
                            body_data['start_time']
                        ))
                        
                        conflicting_bookings = cur.fetchall()
                        
                        if conflicting_bookings and not body_data.get('force', False):
                            conflicts = []
                            for booking in conflicting_bookings:
                                conflicts.append({
                                    'id': booking['id'],
                                    'client': booking['client_name'],
                                    'service': booking['service_name'],
                                    'startTime': booking['start_time'],
                                    'endTime': booking['end_time']
                                })
                            
                            return {
                                'statusCode': 409,
                                'headers': {
                                    'Content-Type': 'application/json',
                                    'Access-Control-Allow-Origin': '*'
                                },
                                'isBase64Encoded': False,
                                'body': json.dumps({
                                    'conflict': True,
                                    'bookings': conflicts,
                                    'message': 'Событие конфликтует с подтверждёнными записями'
                                })
                            }
                        
                        # Если force=true, отменяем конфликтующие записи
                        if body_data.get('force', False) and conflicting_bookings:
                            booking_ids = [b['id'] for b in conflicting_bookings]
                            cur.execute('''
                                UPDATE bookings 
                                SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
                                WHERE id = ANY(%s)
                            ''', (booking_ids,))
                        
                        # Создаём событие
                        query = '''
                            INSERT INTO calendar_events 
                            (owner_id, event_type, title, event_date, start_time, end_time, description)
                            VALUES (%s, %s, %s, %s, %s, %s, %s)
                            RETURNING id
                        '''
                        cur.execute(query, (
                            body_data['owner_id'],
                            body_data['event_type'],
                            body_data['title'],
                            body_data['event_date'],
                            body_data['start_time'],
                            body_data['end_time'],
                            body_data.get('description', '')
                        ))
                        
                        result = cur.fetchone()
                        event_id = result['id'] if result else None
                    
                    conn.commit()
                    
                    return {
                        'statusCode': 201,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'isBase64Encoded': False,
                        'body': json.dumps({'id': event_id, 'message': 'Event created'})
                    }
                except Exception as e:
                    import traceback
                    error_msg = str(e) if str(e) else repr(e)
                    error_trace = traceback.format_exc()
                    return {
                        'statusCode': 500,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'isBase64Encoded': False,
                        'body': json.dumps({
                            'error': f'Server error: {error_msg}',
                            'type': type(e).__name__,
                            'trace': error_trace[:500]
                        })
                    }
            
            elif method == 'DELETE':
                event_id = event.get('queryStringParameters', {}).get('id')
                
                with conn.cursor() as cur:
                    query = 'DELETE FROM calendar_events WHERE id = %s'
                    cur.execute(query, (event_id,))
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'isBase64Encoded': False,
                        'body': json.dumps({'message': 'Event deleted'})
                    }
        
        # SERVICES
        elif resource == 'services':
            if method == 'GET':
                owner_id = event.get('queryStringParameters', {}).get('owner_id')
                
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    query = '''
                        SELECT * FROM services
                        WHERE owner_id = %s
                        ORDER BY name
                    '''
                    cur.execute(query, (owner_id,))
                    services = cur.fetchall()
                    
                    result = []
                    for service in services:
                        result.append({
                            'id': service['id'],
                            'name': service['name'],
                            'duration': f"{service['duration_minutes']} мин",
                            'price': f"{service['price']}₽",
                            'active': service['active']
                        })
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'isBase64Encoded': False,
                        'body': json.dumps({'services': result})
                    }
            
            elif method == 'POST':
                body_data = json.loads(event.get('body', '{}'))
                
                with conn.cursor() as cur:
                    query = '''
                        INSERT INTO services 
                        (owner_id, name, duration_minutes, price, active)
                        VALUES (%s, %s, %s, %s, %s)
                        RETURNING id
                    '''
                    cur.execute(query, (
                        body_data['owner_id'],
                        body_data['name'],
                        body_data['duration_minutes'],
                        body_data['price'],
                        body_data.get('active', True)
                    ))
                    
                    service_id = cur.fetchone()[0]
                    conn.commit()
                    
                    return {
                        'statusCode': 201,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'isBase64Encoded': False,
                        'body': json.dumps({'id': service_id, 'message': 'Service created'})
                    }
            
            elif method == 'PUT':
                body_data = json.loads(event.get('body', '{}'))
                service_id = body_data.get('id')
                
                with conn.cursor() as cur:
                    query = '''
                        UPDATE services 
                        SET name = %s, duration_minutes = %s, price = %s, active = %s
                        WHERE id = %s
                    '''
                    cur.execute(query, (
                        body_data['name'],
                        body_data['duration_minutes'],
                        body_data['price'],
                        body_data['active'],
                        service_id
                    ))
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'isBase64Encoded': False,
                        'body': json.dumps({'message': 'Service updated'})
                    }
            
            elif method == 'DELETE':
                service_id = event.get('queryStringParameters', {}).get('id')
                
                with conn.cursor() as cur:
                    query = 'DELETE FROM services WHERE id = %s'
                    cur.execute(query, (service_id,))
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'isBase64Encoded': False,
                        'body': json.dumps({'message': 'Service deleted'})
                    }
        
        # CLIENTS
        elif resource == 'clients':
            if method == 'GET':
                owner_id = event.get('queryStringParameters', {}).get('owner_id')
                
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    query = '''
                        SELECT c.*, u.name, u.phone, u.email
                        FROM clients c
                        JOIN users u ON c.user_id = u.id
                        WHERE c.owner_id = %s
                        ORDER BY c.total_visits DESC
                    '''
                    cur.execute(query, (owner_id,))
                    clients = cur.fetchall()
                    
                    result = []
                    for client in clients:
                        result.append({
                            'id': client['id'],
                            'name': client['name'],
                            'phone': client['phone'],
                            'email': client['email'],
                            'visits': client['total_visits'],
                            'lastVisit': client['last_visit_date'].strftime('%d.%m.%Y') if client['last_visit_date'] else 'Нет визитов'
                        })
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'isBase64Encoded': False,
                        'body': json.dumps({'clients': result})
                    }
            
            elif method == 'POST':
                body_data = json.loads(event.get('body', '{}'))
                
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    # Ищем существующего пользователя по телефону
                    cur.execute('SELECT id FROM users WHERE phone = %s', (body_data.get('phone', ''),))
                    existing_user = cur.fetchone()
                    
                    if existing_user:
                        user_id = existing_user['id']
                        
                        # Проверяем, есть ли клиент для этого владельца
                        cur.execute(
                            'SELECT id FROM clients WHERE user_id = %s AND owner_id = %s',
                            (user_id, body_data['owner_id'])
                        )
                        existing_client = cur.fetchone()
                        
                        if existing_client:
                            client_id = existing_client['id']
                        else:
                            # Создаём клиента для существующего пользователя
                            cur.execute(
                                'INSERT INTO clients (user_id, owner_id, total_visits) VALUES (%s, %s, %s) RETURNING id',
                                (user_id, body_data['owner_id'], 0)
                            )
                            client_id = cur.fetchone()['id']
                    else:
                        # Создаём нового пользователя (без telegram_id для веб-клиентов)
                        # Если email пустой, вставляем NULL чтобы избежать конфликта UNIQUE
                        email_value = body_data.get('email', '').strip()
                        email_value = email_value if email_value else None
                        
                        phone_value = body_data.get('phone', '').strip()
                        phone_value = phone_value if phone_value else None
                        
                        cur.execute('''
                            INSERT INTO users (role, name, phone, email)
                            VALUES (%s, %s, %s, %s)
                            RETURNING id
                        ''', (
                            'client',
                            body_data['name'],
                            phone_value,
                            email_value
                        ))
                        
                        user_id = cur.fetchone()['id']
                        
                        # Создаём клиента
                        cur.execute(
                            'INSERT INTO clients (user_id, owner_id, total_visits) VALUES (%s, %s, %s) RETURNING id',
                            (user_id, body_data['owner_id'], 0)
                        )
                        client_id = cur.fetchone()['id']
                    
                    conn.commit()
                    
                    return {
                        'statusCode': 201,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'isBase64Encoded': False,
                        'body': json.dumps({'id': client_id, 'message': 'Client created or found'})
                    }
        
        # SETTINGS
        elif resource == 'settings':
            if method == 'GET':
                owner_id = event.get('queryStringParameters', {}).get('owner_id', '1')
                
                with conn.cursor() as cur:
                    cur.execute('SELECT key, value FROM settings WHERE owner_id = %s', (int(owner_id),))
                    rows = cur.fetchall()
                    
                    settings = {}
                    for row in rows:
                        key, value = row
                        settings[key] = value
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'settings': settings})
                }
            
            elif method == 'PUT':
                body_data = json.loads(event.get('body', '{}'))
                owner_id = body_data.get('owner_id', '1')
                
                with conn.cursor() as cur:
                    for key, value in body_data.items():
                        if key == 'owner_id':
                            continue
                            
                        cur.execute(
                            '''
                            INSERT INTO settings (owner_id, key, value)
                            VALUES (%s, %s, %s)
                            ON CONFLICT (owner_id, key) 
                            DO UPDATE SET value = EXCLUDED.value
                            ''',
                            (int(owner_id), key, str(value))
                        )
                    conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'message': 'Settings updated'})
                }
        
        # AVAILABLE SLOTS
        elif resource == 'available_slots':
            if method == 'GET':
                owner_id = event.get('queryStringParameters', {}).get('owner_id')
                date = event.get('queryStringParameters', {}).get('date')
                service_id = event.get('queryStringParameters', {}).get('service_id')
                current_time_str = event.get('queryStringParameters', {}).get('current_time')
                
                if not all([owner_id, date, service_id]):
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'owner_id, date, and service_id required'})
                    }
                
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    # Проверяем, не заблокирована ли дата
                    cur.execute('''
                        SELECT id FROM blocked_dates 
                        WHERE owner_id = %s AND blocked_date = %s
                    ''', (int(owner_id), date))
                    
                    if cur.fetchone():
                        return {
                            'statusCode': 200,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'isBase64Encoded': False,
                            'body': json.dumps({'slots': [], 'message': 'Date is blocked'})
                        }
                    
                    # Get service duration
                    cur.execute('SELECT duration_minutes FROM services WHERE id = %s', (int(service_id),))
                    service = cur.fetchone()
                    if not service:
                        return {
                            'statusCode': 404,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'Service not found'})
                        }
                    
                    duration = service['duration_minutes']
                    
                    # Get settings
                    cur.execute('SELECT key, value FROM settings WHERE owner_id = %s', (int(owner_id),))
                    settings_rows = cur.fetchall()
                    settings = {row['key']: row['value'] for row in settings_rows}
                    
                    work_start = settings.get('work_start', '10:00')
                    work_end = settings.get('work_end', '20:00')
                    prep_time = int(settings.get('prep_time', '0'))
                    buffer_time = int(settings.get('buffer_time', '0'))
                    work_priority = settings.get('work_priority', 'False') == 'True'
                    
                    # Total time needed: prep + service + buffer
                    total_time_needed = prep_time + duration + buffer_time
                    
                    # Определяем день недели для даты
                    import datetime
                    date_obj = datetime.datetime.strptime(date, '%Y-%m-%d')
                    day_names = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                    day_of_week = day_names[date_obj.weekday()]
                    
                    # Получаем расписание учёбы для этого дня
                    cur.execute('''
                        SELECT TO_CHAR(start_time, 'HH24:MI') as start_time,
                               TO_CHAR(end_time, 'HH24:MI') as end_time
                        FROM week_schedule
                        WHERE owner_id = %s AND day_of_week = %s
                    ''', (int(owner_id), day_of_week))
                    
                    study_periods = cur.fetchall()
                    
                    # Получаем разовые события на эту дату
                    cur.execute('''
                        SELECT TO_CHAR(start_time, 'HH24:MI') as start_time,
                               TO_CHAR(end_time, 'HH24:MI') as end_time
                        FROM calendar_events
                        WHERE owner_id = %s AND event_date = %s
                    ''', (int(owner_id), date))
                    
                    events = cur.fetchall()
                    
                    # Get existing bookings for the date
                    cur.execute(
                        '''
                        SELECT 
                            TO_CHAR(start_time, 'HH24:MI') as start_time,
                            TO_CHAR(end_time, 'HH24:MI') as end_time
                        FROM bookings 
                        WHERE owner_id = %s AND booking_date = %s AND status != 'cancelled'
                        ''',
                        (int(owner_id), date)
                    )
                    bookings = cur.fetchall()
                    
                    # Generate time slots
                    slots = []
                    
                    def time_to_minutes(time_str):
                        parts = time_str.split(':')
                        return int(parts[0]) * 60 + int(parts[1])
                    
                    # ЛОГИКА ПРИОРИТЕТОВ (ТЗ п.2.7):
                    # work_priority=True: Базовое время = work_start-work_end, учёба игнорируется
                    # work_priority=False: Базовое время = (work_start-work_end) минус (учёба)
                    
                    available_periods = []
                    
                    if work_priority:
                        # Приоритет рабочего времени: используем work_start-work_end
                        # События вырезают время из рабочего периода
                        start_minutes = time_to_minutes(work_start)
                        end_minutes = time_to_minutes(work_end)
                        
                        current_start = start_minutes
                        sorted_events = sorted(events, key=lambda e: time_to_minutes(e['start_time']))
                        
                        for event in sorted_events:
                            event_start = time_to_minutes(event['start_time'])
                            event_end = time_to_minutes(event['end_time'])
                            
                            if event_start > current_start and event_start < end_minutes:
                                if event_start - current_start >= total_time_needed:
                                    available_periods.append((current_start, min(event_start, end_minutes)))
                                current_start = max(event_end, current_start)
                        
                        if current_start < end_minutes and end_minutes - current_start >= total_time_needed:
                            available_periods.append((current_start, end_minutes))
                    
                    else:
                        # Учёба имеет приоритет: доступное время = work_start-work_end МИНУС учёба МИНУС события
                        work_start_min = time_to_minutes(work_start)
                        work_end_min = time_to_minutes(work_end)
                        
                        if study_periods:
                            # Создаём свободные периоды, вычитая учёбу из рабочего времени
                            # Затем вычитаем события из оставшихся периодов
                            
                            # Шаг 1: Вычитаем учёбу из work_start-work_end
                            temp_periods = [(work_start_min, work_end_min)]
                            
                            for study in study_periods:
                                study_start = time_to_minutes(study['start_time'])
                                study_end = time_to_minutes(study['end_time'])
                                
                                new_temp_periods = []
                                for period_start, period_end in temp_periods:
                                    # Учёба полностью вне периода
                                    if study_end <= period_start or study_start >= period_end:
                                        new_temp_periods.append((period_start, period_end))
                                    # Учёба перекрывает начало
                                    elif study_start <= period_start < study_end < period_end:
                                        new_temp_periods.append((study_end, period_end))
                                    # Учёба перекрывает конец
                                    elif period_start < study_start < period_end <= study_end:
                                        new_temp_periods.append((period_start, study_start))
                                    # Учёба внутри периода
                                    elif period_start < study_start and study_end < period_end:
                                        new_temp_periods.append((period_start, study_start))
                                        new_temp_periods.append((study_end, period_end))
                                    # Учёба полностью покрывает период - ничего не добавляем
                                
                                temp_periods = new_temp_periods
                            
                            # Шаг 2: Вычитаем события из оставшихся периодов
                            sorted_events = sorted(events, key=lambda e: time_to_minutes(e['start_time'])) if events else []
                            
                            for period_start, period_end in temp_periods:
                                current_start = period_start
                                
                                for event in sorted_events:
                                    event_start = time_to_minutes(event['start_time'])
                                    event_end = time_to_minutes(event['end_time'])
                                    
                                    if event_start > current_start and event_start < period_end:
                                        if event_start - current_start >= total_time_needed:
                                            available_periods.append((current_start, event_start))
                                        current_start = max(event_end, current_start)
                                
                                if current_start < period_end and period_end - current_start >= total_time_needed:
                                    available_periods.append((current_start, period_end))
                        else:
                            # Нет учёбы - работаем как раньше с work_start-work_end
                            current_start = work_start_min
                            sorted_events = sorted(events, key=lambda e: time_to_minutes(e['start_time']))
                            
                            for event in sorted_events:
                                event_start = time_to_minutes(event['start_time'])
                                event_end = time_to_minutes(event['end_time'])
                                
                                if event_start > current_start and event_start < work_end_min:
                                    if event_start - current_start >= total_time_needed:
                                        available_periods.append((current_start, event_start))
                                    current_start = max(event_end, current_start)
                            
                            if current_start < work_end_min and work_end_min - current_start >= total_time_needed:
                                available_periods.append((current_start, work_end_min))
                    # Генерируем слоты для каждого доступного периода
                    for period_idx, (period_start, period_end) in enumerate(available_periods):
                        current = period_start
                        is_first_period = (period_idx == 0)
                        is_last_period = (period_idx == len(available_periods) - 1)
                        
                        # Для первого периода: первый слот может начинаться БЕЗ prep_time
                        first_slot_in_period = True
                        
                        while True:
                            # Определяем нужно ли prep_time для этого слота
                            current_prep = 0 if (is_first_period and first_slot_in_period) else prep_time
                            
                            # Время, необходимое для слота с учётом текущего prep
                            slot_time_needed = current_prep + duration + buffer_time
                            
                            # Проверяем, влезает ли слот в период
                            slot_fits = current + slot_time_needed <= period_end
                            
                            # Для последнего периода: последний слот может выходить за пределы на 60 мин
                            if not slot_fits and is_last_period:
                                overhang = (current + slot_time_needed) - period_end
                                if overhang <= 60:  # Допускаем выход до 60 минут
                                    slot_fits = True
                            
                            if not slot_fits:
                                break
                            
                            # Клиент видит время начала услуги (после prep_time)
                            slot_start = f"{(current + current_prep) // 60:02d}:{(current + current_prep) % 60:02d}"
                            
                            # Actual occupied time: prep BEFORE + service + buffer AFTER
                            actual_start_min = current
                            actual_end_min = current + slot_time_needed
                            
                            # Check if slot conflicts with existing bookings
                            is_available = True
                            for booking in bookings:
                                booking_start_min = time_to_minutes(booking['start_time'])
                                booking_end_min = time_to_minutes(booking['end_time'])
                                
                                if actual_start_min < booking_end_min and actual_end_min > booking_start_min:
                                    is_available = False
                                    break
                            
                            if is_available:
                                slots.append({'time': slot_start, 'available': True})
                            
                            first_slot_in_period = False
                            current += 30  # 30-minute intervals
                
                # Фильтруем прошедшие слоты если передано текущее время
                if current_time_str:
                    try:
                        current_time_parts = current_time_str.split(':')
                        current_minutes = int(current_time_parts[0]) * 60 + int(current_time_parts[1])
                        
                        filtered_slots = []
                        for slot in slots:
                            slot_time_parts = slot['time'].split(':')
                            slot_minutes = int(slot_time_parts[0]) * 60 + int(slot_time_parts[1])
                            
                            # Оставляем только будущие слоты (слот должен быть позже текущего времени)
                            if slot_minutes > current_minutes:
                                filtered_slots.append(slot)
                        
                        slots = filtered_slots
                    except:
                        pass
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'slots': slots})
                }
        
        # WEEK SCHEDULE (долгосрочное расписание учёбы)
        elif resource == 'week_schedule':
            if method == 'GET':
                owner_id = event.get('queryStringParameters', {}).get('owner_id')
                
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute('''
                        SELECT * FROM week_schedule
                        WHERE owner_id = %s
                        ORDER BY 
                            CASE day_of_week
                                WHEN 'monday' THEN 1
                                WHEN 'tuesday' THEN 2
                                WHEN 'wednesday' THEN 3
                                WHEN 'thursday' THEN 4
                                WHEN 'friday' THEN 5
                                WHEN 'saturday' THEN 6
                                WHEN 'sunday' THEN 7
                            END,
                            start_time
                    ''', (owner_id,))
                    
                    schedule = cur.fetchall()
                    
                    result = []
                    for item in schedule:
                        result.append({
                            'id': item['id'],
                            'dayOfWeek': item['day_of_week'],
                            'startTime': item['start_time'].strftime('%H:%M'),
                            'endTime': item['end_time'].strftime('%H:%M')
                        })
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'isBase64Encoded': False,
                        'body': json.dumps({'schedule': result})
                    }
            
            elif method == 'POST':
                body_data = json.loads(event.get('body', '{}'))
                
                with conn.cursor() as cur:
                    query = '''
                        INSERT INTO week_schedule 
                        (owner_id, day_of_week, start_time, end_time)
                        VALUES (%s, %s, %s, %s)
                        RETURNING id
                    '''
                    cur.execute(query, (
                        body_data['owner_id'],
                        body_data['day_of_week'],
                        body_data['start_time'],
                        body_data['end_time']
                    ))
                    
                    schedule_id = cur.fetchone()[0]
                    conn.commit()
                    
                    return {
                        'statusCode': 201,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'isBase64Encoded': False,
                        'body': json.dumps({'id': schedule_id, 'message': 'Schedule created'})
                    }
            
            elif method == 'DELETE':
                schedule_id = event.get('queryStringParameters', {}).get('id')
                
                with conn.cursor() as cur:
                    cur.execute('DELETE FROM week_schedule WHERE id = %s', (schedule_id,))
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'isBase64Encoded': False,
                        'body': json.dumps({'message': 'Schedule deleted'})
                    }
        
        # SERVICES
        elif resource == 'services':
            if method == 'GET':
                owner_id = event.get('queryStringParameters', {}).get('owner_id')
                
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute('''
                        SELECT * FROM services
                        WHERE owner_id = %s
                        ORDER BY name
                    ''', (owner_id,))
                    services_raw = cur.fetchall()
                    
                    services = []
                    for service in services_raw:
                        services.append({
                            'id': service['id'],
                            'name': service['name'],
                            'description': service['description'] if 'description' in service else '',
                            'price': service['price'],
                            'duration_minutes': service['duration_minutes'],
                            'active': service['active']
                        })
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'isBase64Encoded': False,
                        'body': json.dumps({'services': services})
                    }
            
            elif method == 'POST':
                body_data = json.loads(event.get('body', '{}'))
                
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute('''
                        INSERT INTO services 
                        (owner_id, name, description, price, duration_minutes, active)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        RETURNING id
                    ''', (
                        body_data['owner_id'],
                        body_data['name'],
                        body_data.get('description', ''),
                        body_data['price'],
                        body_data['duration_minutes'],
                        body_data.get('active', True)
                    ))
                    
                    service_id = cur.fetchone()['id']
                    conn.commit()
                    
                    return {
                        'statusCode': 201,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'isBase64Encoded': False,
                        'body': json.dumps({'id': service_id, 'message': 'Service created'})
                    }
            
            elif method == 'PUT':
                body_data = json.loads(event.get('body', '{}'))
                
                with conn.cursor() as cur:
                    cur.execute('''
                        UPDATE services 
                        SET name = %s, description = %s, price = %s, 
                            duration_minutes = %s, active = %s
                        WHERE id = %s
                    ''', (
                        body_data['name'],
                        body_data.get('description', ''),
                        body_data['price'],
                        body_data['duration_minutes'],
                        body_data.get('active', True),
                        body_data['id']
                    ))
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'isBase64Encoded': False,
                        'body': json.dumps({'message': 'Service updated'})
                    }
            
            elif method == 'DELETE':
                service_id = event.get('queryStringParameters', {}).get('id')
                
                with conn.cursor() as cur:
                    cur.execute('DELETE FROM services WHERE id = %s', (service_id,))
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'isBase64Encoded': False,
                        'body': json.dumps({'message': 'Service deleted'})
                    }
        
        # BLOCKED DATES (флаги "Занят")
        elif resource == 'blocked_dates':
            if method == 'GET':
                owner_id = event.get('queryStringParameters', {}).get('owner_id')
                
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute('''
                        SELECT * FROM blocked_dates
                        WHERE owner_id = %s
                        ORDER BY blocked_date
                    ''', (owner_id,))
                    
                    dates = cur.fetchall()
                    
                    result = []
                    for item in dates:
                        result.append({
                            'id': item['id'],
                            'date': item['blocked_date'].strftime('%Y-%m-%d')
                        })
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'isBase64Encoded': False,
                        'body': json.dumps({'blockedDates': result})
                    }
            
            elif method == 'POST':
                body_data = json.loads(event.get('body', '{}'))
                
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    # Проверяем, есть ли подтверждённые записи на эту дату
                    cur.execute('''
                        SELECT b.id, u.name as client_name, s.name as service_name, b.start_time
                        FROM bookings b
                        LEFT JOIN clients c ON b.client_id = c.id
                        LEFT JOIN users u ON c.user_id = u.id
                        LEFT JOIN services s ON b.service_id = s.id
                        WHERE b.owner_id = %s 
                        AND b.booking_date = %s 
                        AND b.status = 'confirmed'
                        ORDER BY b.start_time
                    ''', (body_data['owner_id'], body_data['date']))
                    
                    confirmed_bookings = cur.fetchall()
                    
                    if confirmed_bookings:
                        conflicts = []
                        for booking in confirmed_bookings:
                            conflicts.append({
                                'id': booking['id'],
                                'client': booking['client_name'],
                                'service': booking['service_name'],
                                'time': booking['start_time'].strftime('%H:%M')
                            })
                        
                        return {
                            'statusCode': 409,
                            'headers': {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            'isBase64Encoded': False,
                            'body': json.dumps({
                                'conflict': True,
                                'bookings': conflicts,
                                'message': 'На эту дату есть подтверждённые записи'
                            })
                        }
                    
                    # Если конфликтов нет или force=true, блокируем дату
                    if body_data.get('force', False):
                        # Отменяем все записи на эту дату
                        cur.execute('''
                            UPDATE bookings 
                            SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
                            WHERE owner_id = %s AND booking_date = %s
                        ''', (body_data['owner_id'], body_data['date']))
                    
                    # Добавляем блокировку
                    cur.execute('''
                        INSERT INTO blocked_dates (owner_id, blocked_date)
                        VALUES (%s, %s)
                        RETURNING id
                    ''', (body_data['owner_id'], body_data['date']))
                    
                    blocked_id = cur.fetchone()[0]
                    conn.commit()
                    
                    return {
                        'statusCode': 201,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'isBase64Encoded': False,
                        'body': json.dumps({'id': blocked_id, 'message': 'Date blocked'})
                    }
            
            elif method == 'DELETE':
                blocked_id = event.get('queryStringParameters', {}).get('id')
                
                with conn.cursor() as cur:
                    cur.execute('DELETE FROM blocked_dates WHERE id = %s', (blocked_id,))
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'isBase64Encoded': False,
                        'body': json.dumps({'message': 'Block removed'})
                    }
        
        # ADMIN DATA (all data in one request)
        elif resource == 'admin_data':
            if method == 'GET':
                owner_id = event.get('queryStringParameters', {}).get('owner_id', '1')
                
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    # 1. Bookings
                    cur.execute('''
                        SELECT b.*, u.name as client_name, s.name as service_name, s.duration_minutes
                        FROM bookings b
                        LEFT JOIN clients c ON b.client_id = c.id
                        LEFT JOIN users u ON c.user_id = u.id
                        LEFT JOIN services s ON b.service_id = s.id
                        WHERE b.owner_id = %s
                        ORDER BY b.booking_date DESC, b.start_time
                        LIMIT 100
                    ''', (owner_id,))
                    bookings_raw = cur.fetchall()
                    
                    bookings = []
                    for booking in bookings_raw:
                        bookings.append({
                            'id': booking['id'],
                            'client': booking['client_name'] or 'Неизвестно',
                            'service': booking['service_name'] or 'Услуга удалена',
                            'time': booking['start_time'].strftime('%H:%M') if booking['start_time'] else '00:00',
                            'date': booking['booking_date'].strftime('%Y-%m-%d') if booking['booking_date'] else '',
                            'status': booking['status'],
                            'duration': booking['duration_minutes'] if booking['duration_minutes'] else 60
                        })
                    
                    # 2. Services
                    cur.execute('SELECT * FROM services WHERE owner_id = %s ORDER BY name', (owner_id,))
                    services_raw = cur.fetchall()
                    
                    services = []
                    for service in services_raw:
                        services.append({
                            'id': service['id'],
                            'name': service['name'],
                            'description': service['description'] if 'description' in service else '',
                            'duration_minutes': service['duration_minutes'],
                            'price': service['price'],
                            'active': service['active']
                        })
                    
                    # 3. Clients
                    cur.execute('''
                        SELECT c.*, u.name, u.phone, u.email
                        FROM clients c
                        JOIN users u ON c.user_id = u.id
                        WHERE c.owner_id = %s
                        ORDER BY c.total_visits DESC
                    ''', (owner_id,))
                    clients_raw = cur.fetchall()
                    
                    clients = []
                    for client in clients_raw:
                        clients.append({
                            'id': client['id'],
                            'name': client['name'],
                            'phone': client['phone'],
                            'email': client['email'],
                            'visits': client['total_visits'],
                            'lastVisit': client['last_visit_date'].strftime('%d.%m.%Y') if client['last_visit_date'] else 'Нет визитов'
                        })
                    
                    # 4. Settings
                    cur.execute('SELECT key, value FROM settings WHERE owner_id = %s', (int(owner_id),))
                    settings_rows = cur.fetchall()
                    settings = {row['key']: row['value'] for row in settings_rows}
                    
                    # 5. Events
                    cur.execute('''
                        SELECT * FROM calendar_events
                        WHERE owner_id = %s
                        ORDER BY event_date DESC, start_time
                        LIMIT 100
                    ''', (owner_id,))
                    events_raw = cur.fetchall()
                    
                    events = []
                    for evt in events_raw:
                        events.append({
                            'id': evt['id'],
                            'type': evt['event_type'],
                            'title': evt['title'],
                            'date': evt['event_date'].strftime('%Y-%m-%d'),
                            'startTime': evt['start_time'].strftime('%H:%M'),
                            'endTime': evt['end_time'].strftime('%H:%M'),
                            'description': evt['description']
                        })
                    
                    # 6. Week Schedule
                    cur.execute('''
                        SELECT * FROM week_schedule
                        WHERE owner_id = %s
                        ORDER BY 
                            CASE day_of_week
                                WHEN 'monday' THEN 1
                                WHEN 'tuesday' THEN 2
                                WHEN 'wednesday' THEN 3
                                WHEN 'thursday' THEN 4
                                WHEN 'friday' THEN 5
                                WHEN 'saturday' THEN 6
                                WHEN 'sunday' THEN 7
                            END,
                            start_time
                    ''', (owner_id,))
                    schedule_raw = cur.fetchall()
                    
                    week_schedule = []
                    for item in schedule_raw:
                        week_schedule.append({
                            'id': item['id'],
                            'dayOfWeek': item['day_of_week'],
                            'startTime': item['start_time'].strftime('%H:%M'),
                            'endTime': item['end_time'].strftime('%H:%M')
                        })
                    
                    # 7. Blocked Dates
                    cur.execute('''
                        SELECT * FROM blocked_dates
                        WHERE owner_id = %s
                        ORDER BY blocked_date
                    ''', (owner_id,))
                    blocked_raw = cur.fetchall()
                    
                    blocked_dates = []
                    for item in blocked_raw:
                        blocked_dates.append({
                            'id': item['id'],
                            'date': item['blocked_date'].strftime('%Y-%m-%d')
                        })
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'isBase64Encoded': False,
                        'body': json.dumps({
                            'bookings': bookings,
                            'services': services,
                            'clients': clients,
                            'settings': settings,
                            'events': events,
                            'weekSchedule': week_schedule,
                            'blockedDates': blocked_dates
                        })
                    }
        
        # BOOKING DATA (public booking page - services + settings)
        elif resource == 'booking_data':
            if method == 'GET':
                owner_id = event.get('queryStringParameters', {}).get('owner_id', '1')
                
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    # 1. Active Services
                    cur.execute('''
                        SELECT * FROM services 
                        WHERE owner_id = %s AND active = true
                        ORDER BY name
                    ''', (owner_id,))
                    services_raw = cur.fetchall()
                    
                    services = []
                    for service in services_raw:
                        services.append({
                            'id': service['id'],
                            'name': service['name'],
                            'duration': f"{service['duration_minutes']} мин",
                            'price': f"{service['price']}₽",
                            'active': service['active']
                        })
                    
                    # 2. Settings (только нужные для booking page)
                    cur.execute('SELECT key, value FROM settings WHERE owner_id = %s', (int(owner_id),))
                    settings_rows = cur.fetchall()
                    settings = {row['key']: row['value'] for row in settings_rows}
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'isBase64Encoded': False,
                        'body': json.dumps({
                            'services': services,
                            'settings': settings
                        })
                    }
        
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Invalid resource or method'})
        }
    
    finally:
        conn.close()