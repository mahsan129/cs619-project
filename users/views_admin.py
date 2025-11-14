# users/views_admin.py

from django.db.models import Sum, F
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
    
# 🔹 Models sahi apps se
from orders.models import Order, OrderItem          # orders app
from products.models import Material                # ✅ tumhara real model

# 🔹 Serializers
from orders.serializers import OrderListSerializer
from products.serializers import MaterialSerializer   # <-- yeh naam apne serializer ke mutabiq rakhna


# ─────────── Custom Admin Permission ───────────

class IsAdminRole(IsAuthenticated):
    def has_permission(self, request, view):
        ok = super().has_permission(request, view)
        return ok and getattr(request.user, "role", "") == "ADMIN"


# ─────────── Admin Metrics ───────────

@api_view(["GET"])
@permission_classes([IsAdminRole])
def admin_metrics(request):
    now = timezone.now()
    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)

    orders_today = Order.objects.filter(created_at__gte=start_of_day).count()

    revenue_today = (
        OrderItem.objects.filter(
            order__created_at__gte=start_of_day,
            order__status="PAID",
        ).aggregate(sum=Sum(F("price") * F("quantity")))["sum"]
        or 0
    )

    pending_payments = Order.objects.filter(status="PENDING").count()
    low_stock = Material.objects.filter(stock_qty__lte=F("min_stock")).count()

    return Response(
        {
            "orders_today": orders_today,
            "revenue_today": float(revenue_today),
            "pending_payments": pending_payments,
            "low_stock": low_stock,
        }
    )


# ─────────── Recent Orders ───────────

@api_view(["GET"])
@permission_classes([IsAdminRole])
def recent_orders(request):
    # Order model me FK ka naam "user" hai
    qs = (
        Order.objects.select_related("user")
        .order_by("-created_at")[:10]
    )
    data = OrderListSerializer(qs, many=True).data
    return Response(data)

# ─────────── Low Stock Materials ───────────

@api_view(["GET"])
@permission_classes([IsAdminRole])
def low_stock_products(request):
    qs = (
        Material.objects.filter(stock_qty__lte=F("min_stock"))
        .order_by("stock_qty")[:20]
    )
    data = MaterialSerializer(qs, many=True).data
    return Response(data)


# ─────────── Revenue Series (chart) ───────────

@api_view(["GET"])
@permission_classes([IsAdminRole])
def revenue_series(request):
    from django.db.models.functions import TruncDate

    days = int(request.GET.get("days", 14))

    qs = (
        OrderItem.objects.filter(order__status="PAID")
        .annotate(day=TruncDate("order__created_at"))
        .values("day")
        .annotate(value=Sum(F("price") * F("quantity")))
        .order_by("day")
    )[:days]

    payload = [
        {"date": row["day"], "value": float(row["value"] or 0)} for row in qs
    ]
    return Response(payload)
