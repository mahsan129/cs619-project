# users/admin.py
from django.contrib import admin
from .models import User, Supplier, Product, BulkBid


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("username", "email", "role", "is_staff", "is_active")
    list_filter = ("role", "is_staff", "is_active")
    search_fields = ("username", "email")


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ("name", "contact", "rating", "ratings_count")
    search_fields = ("name", "contact")


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "sku", "category", "supplier", "stock", "min_stock",
                    "price_retail", "price_wholesale")
    list_filter = ("category", "supplier")
    search_fields = ("name", "sku")


@admin.register(BulkBid)
class BulkBidAdmin(admin.ModelAdmin):
    list_display = ("product", "supplier", "quantity", "offered_price", "status", "created_at")
    list_filter = ("status", "supplier")
