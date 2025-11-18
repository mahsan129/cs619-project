from django.conf import settings
from django.db import models


class Supplier(models.Model):
    """Represents a supplier/wholesaler account."""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="supplier_profile", null=True, blank=True)
    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=40, blank=True)
    address = models.TextField(blank=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name or (self.user.username if self.user else "Supplier")


class MaterialSupplier(models.Model):
    """Linking table for supplier-specific info on materials."""
    supplier = models.ForeignKey("suppliers.Supplier", on_delete=models.CASCADE, related_name="material_links")
    material = models.ForeignKey("products.Material", on_delete=models.CASCADE, related_name="supplier_links")
    wholesale_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    is_primary = models.BooleanField(default=False)
    lead_time_days = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("supplier", "material")

    def __str__(self):
        return f"{self.supplier} -> {self.material.sku}"
from django.db import models

# Create your models here.
