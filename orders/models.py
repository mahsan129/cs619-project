from django.conf import settings
from django.db import models
from django.utils import timezone
from products.models import Material
from django.core.validators import MinValueValidator, MaxValueValidator

class CartItem(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="cart_items"
    )
    material = models.ForeignKey(
        Material, on_delete=models.CASCADE, related_name="cart_items"
    )
    qty = models.PositiveIntegerField(default=1)

    class Meta:
        unique_together = ("user", "material")

    def __str__(self):
        return f"{self.user.username} - {self.material.sku} x {self.qty}"


class Address(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="addresses")
    line1 = models.CharField(max_length=200)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100, blank=True)
    zip = models.CharField(max_length=20, blank=True)
    phone = models.CharField(max_length=30)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self): return f"{self.user.username} - {self.line1}, {self.city}"

class Order(models.Model):
    STATUS = [
        ("PLACED", "Placed"),
        ("CONFIRMED", "Confirmed"),
        ("DISPATCHED", "Dispatched"),
        ("DELIVERED", "Delivered"),
        ("CANCELLED", "Cancelled"),
    ]
    PAYMENT_METHODS = [
        ("card", "Credit/Debit Card"),
        ("cod", "Cash on Delivery"),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="orders")
    address = models.TextField()  # snapshot text of shipping address
    status = models.CharField(max_length=20, choices=STATUS, default="PLACED")
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    delivery_charges = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, default="cod")
    created_at = models.DateTimeField(default=timezone.now)
    def __str__(self): return f"Order #{self.pk} - {self.user.username} - {self.status}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    material = models.ForeignKey(Material, on_delete=models.PROTECT, related_name="order_items")
    title = models.CharField(max_length=160)  # snapshot to keep history
    sku = models.CharField(max_length=64)
    unit = models.CharField(max_length=10)
    qty = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=12, decimal_places=2)  # effective price at time of order
    line_total = models.DecimalField(max_digits=12, decimal_places=2)
    def __str__(self): return f"{self.order_id} - {self.sku} x {self.qty}"

class Review(models.Model):
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name="review")
    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.CharField(max_length=300, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review of Order #{self.order_id} = {self.rating}"