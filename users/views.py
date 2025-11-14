# users/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .serializers import RegisterSerializer


@api_view(["POST"])
@permission_classes([AllowAny])
def register_view(request):
    """
    POST: username, email, password, role? -> creates user
    """
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"detail": "Account created"}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me_view(request):
    """
    GET: Return current logged-in user details
    """
    user = request.user
    return Response(
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": getattr(user, "role", None),
        }
    )

