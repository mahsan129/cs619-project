# products/views.py

from django.db.models import Prefetch, Min, Q
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

class IsAdminOrWholesaler(BasePermission):
    """
    Allow safe methods to anyone,
    but POST/PUT/PATCH/DELETE only to ADMIN or WHOLESALER role.
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        u = request.user
        role = getattr(u, "role", "")
        return bool(
            u and u.is_authenticated and role in ("ADMIN", "WHOLESALER")
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
    permission_classes = [IsAdminOrWholesaler]


# ─────────── Material CRUD ───────────

class MaterialViewSet(viewsets.ModelViewSet):
    queryset = (
        Material.objects.select_related("category").prefetch_related("suppliers").all().order_by("title")
    )
    serializer_class = MaterialSerializer
    permission_classes = [IsAdminOrWholesaler]

    @action(detail=True, methods=["post"])
    def adjust_stock(self, request, pk=None):
        """
        POST /api/materials/{id}/adjust_stock/
        body: { "delta": -5 } ya { "delta": 10 }
        """
        m = self.get_object()
        # permission: admin or supplier of this material
        user = request.user
        is_admin = user and user.is_authenticated and (getattr(user, 'role', '') == 'ADMIN' or getattr(user, 'is_staff', False))
        is_supplier_owner = False
        try:
            supplier = getattr(user, 'supplier_profile', None)
            if supplier and m.suppliers.filter(id=supplier.id).exists():
                is_supplier_owner = True
        except Exception:
            is_supplier_owner = False

        if not (is_admin or is_supplier_owner):
            return Response({"detail": "Not allowed to adjust stock"}, status=403)

        delta = int(request.data.get("delta", 0))
        m.stock_qty = max(0, m.stock_qty + delta)
        m.save()
        return Response({"id": m.id, "stock_qty": m.stock_qty})


# ─────────── Price Tier CRUD ───────────

class PriceTierViewSet(viewsets.ModelViewSet):
    queryset = PriceTier.objects.select_related("material").all()
    serializer_class = PriceTierSerializer
    permission_classes = [IsAdminOrWholesaler]


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
        # annotate a minimum price across price tiers to enable basic price filtering/sorting
        qs = (
            Material.objects
            .select_related("category")
            .prefetch_related(
                Prefetch("prices", queryset=PriceTier.objects.all()),
                Prefetch("suppliers"),
            )
            .annotate(min_price=Min("prices__price"))
            .order_by("title")
        )

        params = self.request.query_params
        slug = params.get("category")
        search = params.get("search")
        min_price = params.get("min_price")
        max_price = params.get("max_price")
        ordering = params.get("ordering") or params.get("sortBy")

        if slug:
            qs = qs.filter(category__slug=slug)

        if search:
            qs = qs.filter(
                Q(title__icontains=search) | Q(sku__icontains=search) | Q(description__icontains=search)
            )

        if min_price:
            try:
                mq = float(min_price)
                qs = qs.filter(min_price__gte=mq)
            except ValueError:
                pass

        if max_price:
            try:
                mq = float(max_price)
                qs = qs.filter(min_price__lte=mq)
            except ValueError:
                pass

        # ordering support: accept 'price-low', 'price-high', 'newest' or raw field names
        if ordering:
            if ordering in ("price-low", "price_asc", "price_retail"):
                qs = qs.order_by("min_price")
            elif ordering in ("price-high", "price_desc", "-price_retail"):
                qs = qs.order_by("-min_price")
            elif ordering == "newest":
                qs = qs.order_by("-created_at")
            else:
                # allow passing model field ordering directly
                qs = qs.order_by(ordering)

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
