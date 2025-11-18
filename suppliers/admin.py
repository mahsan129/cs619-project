from django.contrib import admin
from .models import Supplier, MaterialSupplier


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "user", "phone", "is_active", "rating")
    search_fields = ("name", "user__username", "phone")


@admin.register(MaterialSupplier)
class MaterialSupplierAdmin(admin.ModelAdmin):
    list_display = ("id", "supplier", "material", "wholesale_price", "is_primary", "lead_time_days")
    list_filter = ("is_primary",)
    search_fields = ("supplier__name", "material__sku", "material__title")
from django.contrib import admin

# Register your models here.
