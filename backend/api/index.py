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
                body_data = json.loads(event.get('body', '{}'))
                
                with conn.cursor() as cur:
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
        
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Invalid resource or method'})
        }
    
    finally:
        conn.close()