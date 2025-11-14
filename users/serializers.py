# users/serializers.py
from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()

ROLE_CHOICES = ("CUSTOMER", "RETAILER", "WHOLESALER")


class RegisterSerializer(serializers.ModelSerializer):
    # Agar aapke User model me role field hai to ye use ho jayega,
    # warna backend me ignore ho jayega (hum create me handle kar rahe)
    role = serializers.ChoiceField(choices=ROLE_CHOICES, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ["username", "email", "password", "role"]
        extra_kwargs = {"password": {"write_only": True, "min_length": 6}}

    def create(self, validated_data):
        role = validated_data.pop("role", "") or "CUSTOMER"
        # create_user password ko hash karta hai
        user = User.objects.create_user(**validated_data)

        # Agar User model me 'role' field maujood hai to set kar do
        if hasattr(user, "role"):
            user.role = role
            user.save(update_fields=["role"])
        # Agar role alag Profile me hota hai to yahan create/update karein

        return user

