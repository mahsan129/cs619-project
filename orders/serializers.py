# orders/serializers.py

# orders/serializers.py

from rest_framework import serializers
from .models import Order, OrderItem, CartItem, Address, Review


# ─────────── CART (current user) ───────────

class CartItemSerializer(serializers.ModelSerializer):
    material_title = serializers.ReadOnlyField(source="material.title", default=None)
    material_sku = serializers.ReadOnlyField(source="material.sku", default=None)
    unit = serializers.ReadOnlyField(source="material.unit", default=None)
    material_category = serializers.ReadOnlyField(source="material.category.name", default=None)
    material_category_slug = serializers.ReadOnlyField(source="material.category.slug", default=None)
    price = serializers.SerializerMethodField()
    line_total = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = [
            "id",
            "material",
            "material_title",
            "material_sku",
            "unit",
            "material_category",
            "material_category_slug",
            "qty",
            "price",
            "line_total",
        ]

    def get_price(self, obj):
        # Determine effective price based on serializer context role
        role = self.context.get("role")
        # material.prices is a related name to PriceTier
        prices = {p.type: p.price for p in obj.material.prices.all()}
        desired = "WHOLESALE" if (role or "").upper() in ("WHOLESALER", "ADMIN") else "RETAIL"
        price = prices.get(desired) or prices.get("RETAIL") or prices.get("WHOLESALE")
        return price or 0

    def get_line_total(self, obj):
        try:
            p = self.get_price(obj)
            return p * obj.qty
        except Exception:
            return 0


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


class CheckoutSerializer(serializers.Serializer):
    """
    Wrapper serializer expecting a nested `address` object:

    {
      "address": { "line1": "...", "city": "...", "phone": "..." }
    }

    This matches what the frontend sends in `Checkout.jsx`.
    """
    address = AddressSerializer()


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
            "delivery_charges",
            "total",
            "payment_method",
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
            "delivery_charges",
            "total",
            "payment_method",
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
