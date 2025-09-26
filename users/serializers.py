# users/serializers.py
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    class Meta:
        model = User
        fields = ('id','username','email','password','role')
    def create(self, validated_data):
        pwd = validated_data.pop('password')
        user = User(**validated_data)
        validate_password(pwd, user)
        user.set_password(pwd)
        user.save()
        return user
