# products/serializers.py

from rest_framework import serializers

# yeh models is app (products) se
from .models import Category, Material, PriceTier, Alert

# yeh models orders app se (YAHI PEHLE GALTI THI)
from orders.models import Order, OrderItem


# ─────────── Cart serializers (Order / OrderItem ke sath) ───────────

class CartItemSerializer(serializers.ModelSerializer):
    material_title = serializers.ReadOnlyField(source="material.title")
    material_sku = serializers.ReadOnlyField(source="material.sku")

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "material",
            "material_title",
            "material_sku",
            "quantity",
            "price",
        ]


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ["id", "status", "created_at", "items", "total"]

    def get_total(self, obj):
        # Order.items related_name ke mutabiq
        return sum((i.quantity * i.price for i in obj.items.all()))


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
            "created_at",
            "updated_at",
        ]


# ─────────── Catalog ke liye lightweight Material ───────────

class MaterialCatalogSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source="category.name")
    price = serializers.SerializerMethodField()
    price_type = serializers.SerializerMethodField()

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
            "price",
            "price_type",
        ]

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
