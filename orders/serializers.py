# orders/serializers.py

# orders/serializers.py

from rest_framework import serializers
from .models import Order, OrderItem, CartItem, Address, Review


# ─────────── CART (current user) ───────────

class CartItemSerializer(serializers.ModelSerializer):
    material_title = serializers.ReadOnlyField(source="material.title", default=None)
    material_sku = serializers.ReadOnlyField(source="material.sku", default=None)
    unit = serializers.ReadOnlyField(source="material.unit", default=None)

    class Meta:
        model = CartItem
        fields = [
            "id",
            "material",
            "material_title",
            "material_sku",
            "unit",
            "qty",
        ]


class CartSerializer(serializers.Serializer):
    """
    Simple cart summary:
      items: list of CartItemSerializer
      subtotal, tax, total: numbers
    """
    items = CartItemSerializer(many=True)
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2)
    tax = serializers.DecimalField(max_digits=12, decimal_places=2)
    total = serializers.DecimalField(max_digits=12, decimal_places=2)


# ─────────── ADDRESS / CHECKOUT ───────────

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ["id", "line1", "city", "state", "zip", "phone"]


class CheckoutSerializer(AddressSerializer):
    """
    Checkout form ke fields (shipping address).
    Views mein:
        s = CheckoutSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        data = s.validated_data
    """
    pass


# ─────────── ORDERS (detail + items) ───────────

class OrderItemSerializer(serializers.ModelSerializer):
    material_title = serializers.ReadOnlyField(source="material.title", default=None)
    material_sku = serializers.ReadOnlyField(source="material.sku", default=None)
    unit = serializers.ReadOnlyField(source="material.unit", default=None)

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "material",
            "material_title",
            "material_sku",
            "unit",
            "qty",
            "price",
            "line_total",
        ]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "status",
            "subtotal",
            "tax",
            "total",
            "created_at",
            "items",
        ]


# ─────────── ORDER LIST (MyOrders / Admin Orders) ───────────

class OrderListSerializer(serializers.ModelSerializer):
    user_username = serializers.ReadOnlyField(source="user.username", default=None)
    items_count = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id",
            "user",
            "user_username",
            "status",
            "subtotal",
            "tax",
            "total",
            "created_at",
            "items_count",
        ]

    def get_items_count(self, obj):
        return obj.items.count()


# ─────────── REVIEW (Order review) ───────────

class ReviewSerializer(serializers.ModelSerializer):
    order_id = serializers.ReadOnlyField(source="order.id")

    class Meta:
        model = Review
        fields = ["id", "order", "order_id", "rating", "comment", "created_at"]


# ─────────── SALES REPORT (Admin chart/report) ───────────
# NOTE: agar tumhare views me field names different hon (e.g. "day" instead of "date"),
# to sirf yahan field names adjust kar lena.

class SalesRowSerializer(serializers.Serializer):
    """
    Admin sales report ke liye generic row.
    Typical pattern:
      {"date": <date>, "orders": <int>, "revenue": <decimal>}
    """
    date = serializers.DateField()
    orders = serializers.IntegerField()
    revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
