from django.conf import settings
from django.db import models
from django.utils import timezone
from products.models import Material

class BulkRequest(models.Model):
    STATUS = [
        ("OPEN", "Open"),
        ("CLOSED", "Closed"),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="bulk_requests")
    material = models.ForeignKey(Material, on_delete=models.PROTECT, related_name="bulk_requests")
    qty = models.PositiveIntegerField()
    deadline = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS, default="OPEN")
    accepted_bid = models.ForeignKey("Bid", null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"BR#{self.id} {self.material.sku} x {self.qty} ({self.status})"

class Bid(models.Model):
    STATUS = [
        ("PENDING", "Pending"),
        ("ACCEPTED", "Accepted"),
        ("REJECTED", "Rejected"),
    ]
    bulk_request = models.ForeignKey(BulkRequest, on_delete=models.CASCADE, related_name="bids")
    supplier = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="bids")
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    note = models.CharField(max_length=250, blank=True)
    status = models.CharField(max_length=10, choices=STATUS, default="PENDING")
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ("bulk_request", "supplier")  # one bid per supplier per request

    def __str__(self):
        return f"Bid#{self.id} on BR#{self.bulk_request_id} by {self.supplier_id} ({self.status})"

