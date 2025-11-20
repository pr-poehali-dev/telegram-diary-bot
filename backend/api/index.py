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
                
                with conn.cursor() as cur:
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
                    
                    booking_id = cur.fetchone()[0]
                    conn.commit()
                    
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
                        
                        event_id = cur.fetchone()[0]
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
                    return {
                        'statusCode': 500,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': f'Server error: {str(e)}'})
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
                
                with conn.cursor() as cur:
                    user_query = '''
                        INSERT INTO users (telegram_id, role, name, phone, email)
                        VALUES (%s, %s, %s, %s, %s)
                        RETURNING id
                    '''
                    cur.execute(user_query, (
                        body_data.get('telegram_id', 0),
                        'client',
                        body_data['name'],
                        body_data.get('phone', ''),
                        body_data.get('email', '')
                    ))
                    
                    user_id = cur.fetchone()[0]
                    
                    client_query = '''
                        INSERT INTO clients (user_id, owner_id, total_visits)
                        VALUES (%s, %s, %s)
                        RETURNING id
                    '''
                    cur.execute(client_query, (user_id, body_data['owner_id'], 0))
                    
                    client_id = cur.fetchone()[0]
                    conn.commit()
                    
                    return {
                        'statusCode': 201,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'isBase64Encoded': False,
                        'body': json.dumps({'id': client_id, 'message': 'Client created'})
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
                    
                    # Если есть расписание учёбы, используем его, иначе work_start/work_end
                    if study_periods:
                        # Создаём доступные периоды из учёбы, "вырезая" события
                        available_periods = []
                        
                        for study in study_periods:
                            study_start = time_to_minutes(study['start_time'])
                            study_end = time_to_minutes(study['end_time'])
                            
                            # Вырезаем время событий из учёбы
                            current_start = study_start
                            
                            # Сортируем события по времени начала
                            sorted_events = sorted(events, key=lambda e: time_to_minutes(e['start_time']))
                            
                            for event in sorted_events:
                                event_start = time_to_minutes(event['start_time'])
                                event_end = time_to_minutes(event['end_time'])
                                
                                # Если событие внутри учёбы, создаём период до события
                                if event_start > current_start and event_start < study_end:
                                    if event_start - current_start >= total_time_needed:
                                        available_periods.append((current_start, min(event_start, study_end)))
                                    current_start = max(event_end, current_start)
                            
                            # Добавляем оставшееся время после последнего события
                            if current_start < study_end and study_end - current_start >= total_time_needed:
                                available_periods.append((current_start, study_end))
                    else:
                        # Используем обычные рабочие часы
                        start_minutes = time_to_minutes(work_start)
                        end_minutes = time_to_minutes(work_end)
                        
                        # Вырезаем события из рабочего времени
                        available_periods = []
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
                    
                    # Генерируем слоты для каждого доступного периода
                    for period_start, period_end in available_periods:
                        # Start from position where we have space for prep_time before the first slot
                        current = period_start + prep_time
                        
                        while current + duration + buffer_time <= period_end:
                            slot_start = f"{current // 60:02d}:{current % 60:02d}"
                            
                            # Actual occupied time: prep BEFORE + service + buffer AFTER
                            actual_start_min = current - prep_time
                            actual_end_min = current + duration + buffer_time
                            
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
                            
                            current += 30  # 30-minute intervals
                
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
        
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Invalid resource or method'})
        }
    
    finally:
        conn.close()