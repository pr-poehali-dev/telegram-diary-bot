'''
Business: Отправка уведомлений владельцу в Telegram о новых записях
Args: event с httpMethod, body с данными записи; context с request_id
Returns: HTTP response с результатом отправки
'''

import json
import os
from typing import Dict, Any
import urllib.request

def send_telegram_notification(chat_id: int, booking_data: Dict) -> bool:
    bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
    url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
    
    text = f'''🔔 <b>Новая запись!</b>

👤 <b>Клиент:</b> {booking_data['client_name']}
📞 <b>Телефон:</b> {booking_data['client_phone']}
✉️ <b>Email:</b> {booking_data.get('client_email', 'не указан')}

💇 <b>Услуга:</b> {booking_data['service_name']}
⏱ <b>Длительность:</b> {booking_data['duration']} мин
💰 <b>Цена:</b> {booking_data['price']}₽

📅 <b>Дата:</b> {booking_data['date']}
🕐 <b>Время:</b> {booking_data['time']}

⏳ Статус: Ожидает подтверждения'''
    
    reply_markup = {
        'inline_keyboard': [[
            {'text': '✅ Подтвердить', 'callback_data': f'confirm_{booking_data["booking_id"]}'},
            {'text': '❌ Отменить', 'callback_data': f'cancel_{booking_data["booking_id"]}'}
        ]]
    }
    
    payload = {
        'chat_id': chat_id,
        'text': text,
        'parse_mode': 'HTML',
        'reply_markup': reply_markup
    }
    
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    
    try:
        with urllib.request.urlopen(req) as response:
            return response.status == 200
    except Exception as e:
        print(f'Error sending notification: {e}')
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
        body_data = json.loads(event.get('body', '{}'))
        
        owner_telegram_id = int(os.environ.get('TELEGRAM_OWNER_ID', '0'))
        
        if owner_telegram_id == 0:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'TELEGRAM_OWNER_ID not configured'}),
                'isBase64Encoded': False
            }
        
        success = send_telegram_notification(owner_telegram_id, body_data)
        
        return {
            'statusCode': 200 if success else 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': success,
                'message': 'Notification sent' if success else 'Failed to send notification'
            }),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
