# products/views.py
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import BasePermission, SAFE_METHODS
from rest_framework.response import Response
from django.db.models import Prefetch
from .models import Category, Material, PriceTier
from .serializers import CategorySerializer, MaterialSerializer, PriceTierSerializer, MaterialCatalogSerializer

class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        u = request.user
        return bool(u and u.is_authenticated and getattr(u, "role", "") == "ADMIN")

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by("name")
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]

class MaterialViewSet(viewsets.ModelViewSet):
    queryset = Material.objects.select_related("category").all().order_by("title")
    serializer_class = MaterialSerializer
    permission_classes = [IsAdminOrReadOnly]

    @action(detail=True, methods=["post"])
    def adjust_stock(self, request, pk=None):
        m = self.get_object()
        delta = int(request.data.get("delta", 0))
        m.stock_qty = max(0, m.stock_qty + delta)
        m.save()
        return Response({"id": m.id, "stock_qty": m.stock_qty})

class PriceTierViewSet(viewsets.ModelViewSet):
    queryset = PriceTier.objects.select_related("material").all()
    serializer_class = PriceTierSerializer
    permission_classes = [IsAdminOrReadOnly]
class CatalogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public catalog endpoints:
      GET /api/catalog/?category=<slug>
      GET /api/catalog/<id>/
    """
    permission_classes = [BasePermission]
    serializer_class = MaterialCatalogSerializer

    def get_queryset(self):
        qs = Material.objects.select_related("category").prefetch_related(
            Prefetch("prices", queryset=PriceTier.objects.all())
        ).order_by("title")
        slug = self.request.query_params.get("category")
        if slug:
            qs = qs.filter(category__slug=slug)
        return qs

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        user = getattr(self.request, "user", None)
        ctx["role"] = getattr(user, "role", None) if (user and user.is_authenticated) else None
        return ctx
    
