from rest_framework import serializers
from .models import CartItem, Address, Order, OrderItem, Review

class CartItemSerializer(serializers.ModelSerializer):
    title = serializers.ReadOnlyField(source="material.title")
    sku = serializers.ReadOnlyField(source="material.sku")
    unit = serializers.ReadOnlyField(source="material.unit")
    price = serializers.SerializerMethodField()
    line_total = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ["id", "material", "title", "sku", "unit", "qty", "price", "line_total"]

    # role-based effective price (retail for CUSTOMER/RETAILER, wholesale for WHOLESALER/ADMIN)
    def _effective_price(self, obj):
        prices = {p.type: p.price for p in obj.material.prices.all()}
        role = (self.context.get("role") or "").upper()
        desired = "WHOLESALE" if role in ("WHOLESALER", "ADMIN") else "RETAIL"
        return prices.get(desired) or prices.get("RETAIL") or prices.get("WHOLESALE")

    def get_price(self, obj):
        return self._effective_price(obj)

    def get_line_total(self, obj):
        p = self._effective_price(obj)
        return (p * obj.qty) if p is not None else None

# ---- Day 6 ----

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ["id", "line1", "city", "state", "zip", "phone"]

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ["material", "title", "sku", "unit", "qty", "price", "line_total"]

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    class Meta:
        model = Order
        fields = ["id", "status", "address", "subtotal", "tax", "total", "created_at", "items"]

class CheckoutSerializer(serializers.Serializer):
    # Either pass a new address or (optional) re-use existing by id later (not required now)
    address = AddressSerializer()

    # orders/serializers.py  (add at bottom, keep existing imports/serializers)
class OrderListSerializer(serializers.ModelSerializer):
    item_count = serializers.IntegerField(read_only=True)
    class Meta:
        model = Order
        fields = ["id", "status", "address", "subtotal", "tax", "total", "created_at", "item_count"]

class ReviewSerializer(serializers.ModelSerializer):
    order_total = serializers.ReadOnlyField(source="order.total")
    class Meta:
        model = Review
        fields = ["id", "order", "rating", "comment", "order_total", "created_at"]
        read_only_fields = ["created_at"]

class SalesRowSerializer(serializers.Serializer):
    day = serializers.DateField()
    orders = serializers.IntegerField()
    revenue = serializers.DecimalField(max_digits=14, decimal_places=2)
