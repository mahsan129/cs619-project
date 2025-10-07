from rest_framework import serializers
from .models import BulkRequest, Bid

class BulkRequestSerializer(serializers.ModelSerializer):
    material_sku = serializers.ReadOnlyField(source="material.sku")
    material_title = serializers.ReadOnlyField(source="material.title")
    requester = serializers.ReadOnlyField(source="user.username")
    bids_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = BulkRequest
        fields = [
            "id", "user", "requester", "material", "material_sku", "material_title",
            "qty", "deadline", "status", "accepted_bid", "bids_count", "created_at"
        ]
        read_only_fields = ["user", "status", "accepted_bid", "bids_count", "created_at"]

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)

class BidSerializer(serializers.ModelSerializer):
    supplier_name = serializers.ReadOnlyField(source="supplier.username")
    material_sku = serializers.ReadOnlyField(source="bulk_request.material.sku")
    material_title = serializers.ReadOnlyField(source="bulk_request.material.title")

    class Meta:
        model = Bid
        fields = [
            "id", "bulk_request", "supplier", "supplier_name",
            "unit_price", "note", "status",
            "material_sku", "material_title", "created_at"
        ]
        read_only_fields = ["supplier", "status", "created_at"]

    def create(self, validated_data):
        validated_data["supplier"] = self.context["request"].user
        return super().create(validated_data)
