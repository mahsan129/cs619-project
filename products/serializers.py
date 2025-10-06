from rest_framework import serializers
from .models import Category, Material, PriceTier

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
        fields = ["id","title","sku","category","category_name","unit",
                  "stock_qty","min_stock","description","prices","created_at","updated_at"]

# add at bottom (keep existing imports)
from rest_framework import serializers
from .models import Category, Material, PriceTier

class MaterialCatalogSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source="category.name")
    price = serializers.SerializerMethodField()
    price_type = serializers.SerializerMethodField()

    class Meta:
        model = Material
        fields = ["id","title","sku","category","category_name","unit",
                  "stock_qty","min_stock","description","price","price_type"]

    def _pick_price(self, obj, desired):
        # returns (price, type) or (None, None)
        prices = {p.type: p.price for p in obj.prices.all()}
        if desired in prices:
            return prices[desired], desired
        # fallback order
        for t in ("RETAIL","WHOLESALE"):
            if t in prices:
                return prices[t], t
        return None, None

    def get_price(self, obj):
        role = (self.context.get("role") or "").upper()
        desired = "WHOLESALE" if role in ("WHOLESALER","ADMIN") else "RETAIL"
        price, _ = self._pick_price(obj, desired)
        return price

    def get_price_type(self, obj):
        role = (self.context.get("role") or "").upper()
        desired = "WHOLESALE" if role in ("WHOLESALER","ADMIN") else "RETAIL"
        _, t = self._pick_price(obj, desired)
        return t
