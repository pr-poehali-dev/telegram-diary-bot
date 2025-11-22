import json
import os
from typing import Dict, Any
import time

# Simple in-memory rate limiting (per process)
rate_limit_storage: Dict[str, list] = {}
MAX_ATTEMPTS = 5  # Maximum attempts
TIME_WINDOW = 300  # 5 minutes in seconds

def check_rate_limit(telegram_id: str) -> bool:
    '''
    Check if telegram_id exceeded rate limit
    Returns True if allowed, False if rate limited
    '''
    current_time = time.time()
    
    if telegram_id not in rate_limit_storage:
        rate_limit_storage[telegram_id] = []
    
    # Remove old attempts outside time window
    rate_limit_storage[telegram_id] = [
        attempt_time for attempt_time in rate_limit_storage[telegram_id]
        if current_time - attempt_time < TIME_WINDOW
    ]
    
    # Check if exceeded limit
    if len(rate_limit_storage[telegram_id]) >= MAX_ATTEMPTS:
        return False
    
    # Add current attempt
    rate_limit_storage[telegram_id].append(current_time)
    return True

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Authenticate user by Telegram ID using environment variables
    Args: event with httpMethod, queryStringParameters (telegram_id)
    Returns: User data with role (admin or owner)
    Security: Rate limited, no database queries, server-side validation only
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    params = event.get('queryStringParameters', {})
    telegram_id = params.get('telegram_id', '').strip()
    
    if not telegram_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'telegram_id is required'})
        }
    
    # Rate limiting check
    if not check_rate_limit(telegram_id):
        return {
            'statusCode': 429,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Too many attempts. Try again later'})
        }
    
    # Get allowed IDs from environment variables
    admin_id = os.environ.get('TELEGRAM_ADMIN_ID', '').strip()
    owner_id = os.environ.get('TELEGRAM_OWNER_ID', '').strip()
    group_id = os.environ.get('TELEGRAM_GROUP_ID', '').strip()
    
    # Determine role based on telegram_id
    role = None
    
    if telegram_id == admin_id and admin_id:
        role = 'admin'
    elif telegram_id == owner_id and owner_id:
        role = 'owner'
    elif telegram_id == group_id and group_id:
        role = 'owner'
    
    if not role:
        return {
            'statusCode': 403,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Access denied'})
        }
    
    # Return user data
    user_data = {
        'telegram_id': telegram_id,
        'role': role
    }
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps({'user': user_data})
    }