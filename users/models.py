# users/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = (
        ("ADMIN", "Admin"),
        ("WHOLESALER", "Wholesaler"),
        ("RETAILER", "Retailer"),
        ("CUSTOMER", "Customer"),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="CUSTOMER")

    def __str__(self):
        return self.username


class Supplier(models.Model):
    name = models.CharField(max_length=200)
    contact = models.CharField(max_length=200, blank=True)
    rating = models.FloatField(default=0)            # avg rating 0-5
    ratings_count = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.name


class Product(models.Model):
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=100, blank=True)
    sku = models.CharField(max_length=50, unique=True)
    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="products",
    )
    stock = models.PositiveIntegerField(default=0)
    min_stock = models.PositiveIntegerField(default=10)   # low-stock threshold
    price_retail = models.DecimalField(max_digits=10, decimal_places=2)
    price_wholesale = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.name} ({self.sku})"


class BulkBid(models.Model):
    """Suppliers bid on buyer's large order requests"""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="bids")
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name="bids")
    quantity = models.PositiveIntegerField()
    offered_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, default="OPEN")  # OPEN/ACCEPTED/REJECTED
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Bid #{self.id} on {self.product} by {self.supplier}"
