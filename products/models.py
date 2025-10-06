from django.db import models

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
    UNIT_CHOICES = [
        ("BAG", "Bag"),
        ("TON", "Ton"),
        ("PCS", "Pieces"),
        ("PKG", "Package"),
    ]
    title = models.CharField(max_length=160)
    sku = models.CharField(max_length=64, unique=True)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="materials")
    unit = models.CharField(max_length=10, choices=UNIT_CHOICES, default="PCS")
    stock_qty = models.PositiveIntegerField(default=0)
    min_stock = models.PositiveIntegerField(default=0)
    description = models.TextField(blank=True)
    def __str__(self): return f"{self.title} ({self.sku})"

class PriceTier(Timestamped):
    RETAIL = "RETAIL"
    WHOLESALE = "WHOLESALE"
    TYPE_CHOICES = [(RETAIL, "Retail"), (WHOLESALE, "Wholesale")]
    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name="prices")
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    class Meta:
        unique_together = ("material", "type")
    def __str__(self): return f"{self.material.sku} {self.type} {self.price}"
