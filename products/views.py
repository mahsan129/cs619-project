# products/views.py

from django.db.models import Prefetch
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import (
    BasePermission,
    SAFE_METHODS,
    AllowAny,
)
from rest_framework.response import Response

from .models import Category, Material, PriceTier, Alert
from .serializers import (
    CategorySerializer,
    MaterialSerializer,
    PriceTierSerializer,
    MaterialCatalogSerializer,
    AlertSerializer,
)


# ─────────── Permissions ───────────

class IsAdminOrReadOnly(BasePermission):
    """
    GET/HEAD/OPTIONS sab ke liye open,
    lekin POST/PUT/PATCH/DELETE sirf ADMIN role ke liye.
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        u = request.user
        return bool(
            u and u.is_authenticated and getattr(u, "role", "") == "ADMIN"
        )


class IsAdmin(BasePermission):
    """
    Sirf ADMIN role allowed, read bhi/ write bhi.
    """

    def has_permission(self, request, view):
        u = request.user
        return bool(
            u and u.is_authenticated and getattr(u, "role", "") == "ADMIN"
        )


# ─────────── Category CRUD ───────────

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by("name")
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]


# ─────────── Material CRUD ───────────

class MaterialViewSet(viewsets.ModelViewSet):
    queryset = (
        Material.objects.select_related("category").all().order_by("title")
    )
    serializer_class = MaterialSerializer
    permission_classes = [IsAdminOrReadOnly]

    @action(detail=True, methods=["post"])
    def adjust_stock(self, request, pk=None):
        """
        POST /api/materials/{id}/adjust_stock/
        body: { "delta": -5 } ya { "delta": 10 }
        """
        m = self.get_object()
        delta = int(request.data.get("delta", 0))
        m.stock_qty = max(0, m.stock_qty + delta)
        m.save()
        return Response({"id": m.id, "stock_qty": m.stock_qty})


# ─────────── Price Tier CRUD ───────────

class PriceTierViewSet(viewsets.ModelViewSet):
    queryset = PriceTier.objects.select_related("material").all()
    serializer_class = PriceTierSerializer
    permission_classes = [IsAdminOrReadOnly]


# ─────────── Public Catalog (Landing / Catalog page) ───────────

class CatalogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public catalog endpoints:
      GET /api/catalog/           (optional ?category=<slug>)
      GET /api/catalog/{id}/
    """

    permission_classes = [AllowAny]
    serializer_class = MaterialCatalogSerializer

    def get_queryset(self):
        qs = (
            Material.objects
            .select_related("category")
            .prefetch_related(
                Prefetch("prices", queryset=PriceTier.objects.all())
            )
            .order_by("title")
        )
        slug = self.request.query_params.get("category")
        if slug:
            qs = qs.filter(category__slug=slug)
        return qs

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        user = getattr(self.request, "user", None)
        ctx["role"] = getattr(user, "role", None) if (
            user and user.is_authenticated
        ) else None
        return ctx


# ─────────── Inventory Alerts (Admin only, low stock) ───────────

class InventoryAlertViewSet(viewsets.ModelViewSet):
    """
    Admin-only inventory alerts:
      GET    /api/inventory/alerts/            -> open alerts
      GET    /api/inventory/alerts/?all=true   -> all alerts
      PATCH  /api/inventory/alerts/{id}/resolve/ -> mark resolved
    """

    queryset = Alert.objects.select_related("material").order_by("-created_at")
    serializer_class = AlertSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.query_params.get("all") not in ("1", "true", "True"):
            qs = qs.filter(is_resolved=False)
        return qs

    @action(detail=True, methods=["patch"])
    def resolve(self, request, pk=None):
        alert = self.get_object()
        alert.is_resolved = True
        alert.save(update_fields=["is_resolved"])
        return Response({"id": alert.id, "resolved": True})
