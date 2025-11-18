# products/serializers.py

from rest_framework import serializers

from .models import Category, Material, PriceTier, Alert
from suppliers.models import Supplier


# ─────────── Category / PriceTier / Material ───────────

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"


class PriceTierSerializer(serializers.ModelSerializer):
    class Meta:
        model = PriceTier
        fields = "__all__"


class MaterialSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source="category.name")
    prices = PriceTierSerializer(many=True, read_only=True)
    suppliers = serializers.SerializerMethodField()

    class Meta:
        model = Material
        fields = [
            "id",
            "title",
            "sku",
            "category",
            "category_name",
            "unit",
            "stock_qty",
            "min_stock",
            "description",
            "prices",
            "suppliers",
            "created_at",
            "updated_at",
        ]

    def get_suppliers(self, obj):
        # return simple supplier info
        return [
            {"id": s.id, "name": s.name, "rating": float(s.rating) if s.rating is not None else None}
            for s in obj.suppliers.all()
        ]


# ─────────── Catalog ke liye lightweight Material ───────────

class MaterialCatalogSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source="category.name")
    price_retail = serializers.SerializerMethodField()
    price_wholesale = serializers.SerializerMethodField()
    prices = PriceTierSerializer(many=True, read_only=True)
    suppliers = serializers.SerializerMethodField()

    class Meta:
        model = Material
        fields = [
            "id",
            "title",
            "sku",
            "category",
            "category_name",
            "unit",
            "stock_qty",
            "min_stock",
            "description",
            "price_retail",
            "price_wholesale",
            "prices",
            "suppliers",
            "created_at",
            "updated_at",
        ]

    def get_price_retail(self, obj):
        prices = {p.type: p.price for p in obj.prices.all()}
        return prices.get("RETAIL")

    def get_price_wholesale(self, obj):
        prices = {p.type: p.price for p in obj.prices.all()}
        return prices.get("WHOLESALE")

    def _pick_price(self, obj, desired):
        """
        returns (price, type) or (None, None)
        """
        prices = {p.type: p.price for p in obj.prices.all()}
        if desired in prices:
            return prices[desired], desired
        # fallback order
        for t in ("RETAIL", "WHOLESALE"):
            if t in prices:
                return prices[t], t
        return None, None

    def get_price(self, obj):
        role = (self.context.get("role") or "").upper()
        desired = "WHOLESALE" if role in ("WHOLESALER", "ADMIN") else "RETAIL"
        price, _ = self._pick_price(obj, desired)
        return price

    def get_price_type(self, obj):
        role = (self.context.get("role") or "").upper()
        desired = "WHOLESALE" if role in ("WHOLESALER", "ADMIN") else "RETAIL"
        _, t = self._pick_price(obj, desired)
        return t

    def get_suppliers(self, obj):
        return [{"id": s.id, "name": s.name} for s in obj.suppliers.all()]


# ─────────── Alert Serializer (low stock alerts) ───────────

class AlertSerializer(serializers.ModelSerializer):
    material_sku = serializers.ReadOnlyField(source="material.sku")
    material_title = serializers.ReadOnlyField(source="material.title")

    class Meta:
        model = Alert
        fields = [
            "id",
            "type",
            "is_resolved",
            "note",
            "material",
            "material_sku",
            "material_title",
            "created_at",
            "updated_at",
        ]
