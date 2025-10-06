from django.contrib import admin
from .models import Category, Material, PriceTier

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "created_at")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}

@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ("title", "sku", "category", "unit", "stock_qty", "min_stock")
    list_filter = ("category", "unit")
    search_fields = ("title", "sku")

@admin.register(PriceTier)
class PriceTierAdmin(admin.ModelAdmin):
    list_display = ("material", "type", "price")
    list_filter = ("type",)
    search_fields = ("material__title", "material__sku")

