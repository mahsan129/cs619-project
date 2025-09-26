# users/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ADMIN = 'ADMIN'; WHOLESALER = 'WHOLESALER'; RETAILER = 'RETAILER'; CUSTOMER = 'CUSTOMER'
    ROLE_CHOICES = [
        (ADMIN, 'Admin'), (WHOLESALER, 'Wholesaler'),
        (RETAILER, 'Retailer'), (CUSTOMER, 'Customer'),
    ]
    role = models.CharField(
        max_length=20, choices=ROLE_CHOICES, default=CUSTOMER,
        help_text='Controls access to dashboards & prices.'
    )

    def __str__(self):
        return f"{self.username} ({self.role})"
