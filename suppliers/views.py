from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import BasePermission, SAFE_METHODS

from .models import Supplier, MaterialSupplier
from .serializers import SupplierSerializer, MaterialSupplierSerializer


class IsAdminOrSupplier(BasePermission):
    """Allow safe methods to anyone, but write only to admin or the supplier owner."""

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        u = request.user
        return bool(u and u.is_authenticated and (getattr(u, 'role', '') == 'ADMIN' or getattr(u, 'is_staff', False) or getattr(u, 'supplier_profile', None)))

    def has_object_permission(self, request, view, obj):
        # Admins can do anything
        u = request.user
        if u and u.is_authenticated and (getattr(u, 'role', '') == 'ADMIN' or getattr(u, 'is_staff', False)):
            return True
        # Supplier may only modify their own supplier/profile entries
        if isinstance(obj, Supplier):
            return getattr(obj, 'user', None) == u
        if isinstance(obj, MaterialSupplier):
            return getattr(obj.supplier, 'user', None) == u
        return False


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all().order_by("name")
    serializer_class = SupplierSerializer
    permission_classes = [IsAdminOrSupplier]


class MaterialSupplierViewSet(viewsets.ModelViewSet):
    queryset = MaterialSupplier.objects.select_related('supplier', 'material').all().order_by('-created_at')
    serializer_class = MaterialSupplierSerializer
    permission_classes = [IsAdminOrSupplier]

    def perform_create(self, serializer):
        # If the authenticated user has a supplier_profile, set it as the supplier
        user = self.request.user
        supplier = getattr(user, 'supplier_profile', None)
        if supplier is None and not (getattr(user, 'role', '') == 'ADMIN' or getattr(user, 'is_staff', False)):
            raise PermissionError('Only suppliers or admins may create material links')
        serializer.save(supplier=supplier)

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        # suppliers see only their own material links (unless admin)
        if user and user.is_authenticated and not (getattr(user, 'role', '') == 'ADMIN' or getattr(user, 'is_staff', False)):
            supplier = getattr(user, 'supplier_profile', None)
            if supplier:
                qs = qs.filter(supplier=supplier)
            else:
                qs = qs.none()
        return qs
from django.shortcuts import render

# Create your views here.
