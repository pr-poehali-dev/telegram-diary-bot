'''
Business: Проверка доступа к админ-панели владельца по groupId
Args: event с queryStringParameters (groupId)
Returns: Статус доступа (authorized/unauthorized)
'''

import json
import os
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    # Handle CORS OPTIONS request
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    params = event.get('queryStringParameters', {})
    group_id = params.get('groupId')
    
    if not group_id:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'authorized': False, 'error': 'groupId is required'}),
            'isBase64Encoded': False
        }
    
    # Получаем разрешённый TELEGRAM_GROUP_ID из секретов
    allowed_group_id = os.environ.get('TELEGRAM_GROUP_ID', '')
    
    if not allowed_group_id:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'authorized': False, 'error': 'TELEGRAM_GROUP_ID not configured'}),
            'isBase64Encoded': False
        }
    
    # Проверяем совпадение groupId
    if str(group_id) == str(allowed_group_id):
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'authorized': True}),
            'isBase64Encoded': False
        }
    else:
        return {
            'statusCode': 403,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'authorized': False, 'error': 'Access denied'}),
            'isBase64Encoded': False
        }
