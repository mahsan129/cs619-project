from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SupplierViewSet, MaterialSupplierViewSet

router = DefaultRouter()
router.register(r'suppliers', SupplierViewSet, basename='supplier')
router.register(r'material-suppliers', MaterialSupplierViewSet, basename='materialsupplier')

urlpatterns = [
    path('', include(router.urls)),
]
