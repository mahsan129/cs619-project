# products/models.py
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver

class Timestamped(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        abstract = True

class Category(Timestamped):
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=140, unique=True)
    def __str__(self): return self.name

class Material(Timestamped):
    UNIT_CHOICES = [("BAG","Bag"),("TON","Ton"),("PCS","Pieces"),("PKG","Package")]
    title = models.CharField(max_length=160)
    sku = models.CharField(max_length=64, unique=True)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="materials")
    unit = models.CharField(max_length=10, choices=UNIT_CHOICES, default="PCS")
    stock_qty = models.PositiveIntegerField(default=0)
    min_stock = models.PositiveIntegerField(default=0)
    description = models.TextField(blank=True)
    def __str__(self): return f"{self.title} ({self.sku})"

class PriceTier(Timestamped):
    RETAIL, WHOLESALE = "RETAIL", "WHOLESALE"
    TYPE_CHOICES = [(RETAIL,"Retail"), (WHOLESALE,"Wholesale")]
    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name="prices")
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    class Meta:
        unique_together = ("material","type")
    def __str__(self): return f"{self.material.sku} {self.type} {self.price}"

# ---- Day 8: Alerts ----
class Alert(Timestamped):
    LOW_STOCK = "LOW_STOCK"
    TYPES = [(LOW_STOCK, "Low stock")]
    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name="alerts")
    type = models.CharField(max_length=20, choices=TYPES, default=LOW_STOCK)
    is_resolved = models.BooleanField(default=False)
    note = models.CharField(max_length=200, blank=True)

    class Meta:
        indexes = [models.Index(fields=["type","is_resolved"])]
        constraints = [
            # only one open LOW_STOCK alert per material
            models.UniqueConstraint(fields=["material","type","is_resolved"], name="uniq_open_lowstock", condition=models.Q(is_resolved=False))
        ]
    def __str__(self): return f"{self.material.sku} - {self.type} ({'resolved' if self.is_resolved else 'open'})"

@receiver(post_save, sender=Material)
def create_or_resolve_low_stock_alert(sender, instance: Material, **kwargs):
    # if at/below threshold → ensure one OPEN alert exists
    if instance.stock_qty <= instance.min_stock:
        Alert.objects.get_or_create(material=instance, type=Alert.LOW_STOCK, is_resolved=False)
    else:
        # above threshold → resolve any open alerts
        Alert.objects.filter(material=instance, type=Alert.LOW_STOCK, is_resolved=False).update(is_resolved=True)
