import jwt
from django.conf import settings
from django.http import JsonResponse
from functools import wraps

def jwt_required(role=None):
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return JsonResponse({'error': 'Unauthorized: Missing or invalid token'}, status=401)
            
            token = auth_header.split(' ')[1]
            try:
                # The C# backend uses this secret for development
                # In production, read this from env variables
                secret = getattr(settings, 'JWT_SECRET', 'ThisIsADevelopmentSecretKeyThatIsAtLeast32Characters!!')
                
                # Decode the token (Algorithms usually HS256)
                decoded = jwt.decode(token, secret, algorithms=['HS256'], audience='assignment-system-client')
                
                # Attach user info to request
                request.user_info = decoded
                
                # If a specific role is required, check it
                if role:
                    user_role = decoded.get('role', '')
                    if user_role != role:
                        return JsonResponse({'error': 'Forbidden: Insufficient role'}, status=403)
                        
            except jwt.ExpiredSignatureError:
                return JsonResponse({'error': 'Unauthorized: Token expired'}, status=401)
            except jwt.InvalidTokenError:
                return JsonResponse({'error': 'Unauthorized: Invalid token'}, status=401)
                
            return view_func(request, *args, **kwargs)
        return _wrapped_view
    return decorator
