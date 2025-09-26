# users/views.py
from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .serializers import RegisterSerializer
from .models import User

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]  # public register

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def me_view(request):
    u: User = request.user
    return Response({'id': u.id, 'username': u.username, 'email': u.email, 'role': u.role})
