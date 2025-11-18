# myproject/urls.py

from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from users.views import register_view, me_view
from myproject.views import health_view
from users.views_admin import (
    admin_metrics,
    recent_orders,
    low_stock_products,
    revenue_series,
)

urlpatterns = [
    # Django admin
    path("admin/", admin.site.urls),

    # 🔐 Auth endpoints
    path("api/auth/register/", register_view, name="register"),   # ✅ function, no .as_view()
    path("api/auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/me/", me_view, name="me"),

    # (Optional) agar tum ne separate users.auth_urls banaya hai:
    # path("api/auth/", include("users.auth_urls")),

    # 📊 Admin dashboard APIs
    path("api/admin/metrics/", admin_metrics),
    path("api/admin/recent-orders/", recent_orders),
    path("api/admin/low-stock/", low_stock_products),
    path("api/admin/revenue-series/", revenue_series),

    # 🩺 Health check
    path("api/health/", health_view),

    # App URLs
    path("api/", include("users.urls")),
    path("api/", include("products.urls")),
    path("api/", include("orders.urls")),
    path("api/", include("bids.urls")),
    path("api/", include("suppliers.urls")),
]

# Custom JSON error handlers
handler404 = "myproject.views.handler404"
handler500 = "myproject.views.handler500"
