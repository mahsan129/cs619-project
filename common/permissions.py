# common/permissions.py
from rest_framework.permissions import BasePermission, SAFE_METHODS

def _role(user):
    return (getattr(user, "role", "") or "").upper()

class AllowAnyReadAdminWrite(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user.is_authenticated and _role(request.user) == "ADMIN"

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and _role(request.user) == "ADMIN"

class IsSupplier(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and _role(request.user) in {"SUPPLIER", "ADMIN"}

class IsRetailOrWhole(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and _role(request.user) in {"RETAILER", "WHOLESALER", "ADMIN"}
