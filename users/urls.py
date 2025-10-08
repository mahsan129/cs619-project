# users/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, me_view

urlpatterns = [
    # Auth
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("auth/login/",    TokenObtainPairView.as_view(), name="auth-login"),
    path("auth/refresh/",  TokenRefreshView.as_view(),    name="auth-refresh"),

    # Current user
    path("auth/me/", me_view, name="auth-me"),
]
