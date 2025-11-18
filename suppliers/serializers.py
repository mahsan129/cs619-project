from rest_framework import serializers
from .models import Supplier, MaterialSupplier
from products.models import Material
from products.serializers import MaterialSerializer


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ["id", "name", "phone", "address", "rating", "is_active", "user"]


class MaterialSupplierSerializer(serializers.ModelSerializer):
    supplier_name = serializers.ReadOnlyField(source="supplier.name")
    material = MaterialSerializer(read_only=True)
    material_id = serializers.PrimaryKeyRelatedField(
        queryset=Material.objects.all(),
        write_only=True,
        source="material"
    )

    class Meta:
        model = MaterialSupplier
        fields = ["id", "supplier", "supplier_name", "material", "material_id", "wholesale_price", "is_primary", "lead_time_days", "created_at"]
        read_only_fields = ["supplier", "created_at", "material"]

    def create(self, validated_data):
        # supplier will be set by the view's perform_create
        return super().create(validated_data)
