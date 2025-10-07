from rest_framework.permissions import BasePermission

class IsRetailOrWhole(BasePermission):
    def has_permission(self, request, view):
        role = getattr(request.user, "role", "")
        return bool(request.user and request.user.is_authenticated and role in ("RETAILER","WHOLESALER","ADMIN"))

class IsSupplier(BasePermission):
    def has_permission(self, request, view):
        role = getattr(request.user, "role", "")
        return bool(request.user and request.user.is_authenticated and role in ("SUPPLIER","ADMIN"))
