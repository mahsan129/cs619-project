# products/urls.py
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, MaterialViewSet, PriceTierViewSet, CatalogViewSet, InventoryAlertViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'materials',  MaterialViewSet, basename='material')
router.register(r'prices',     PriceTierViewSet, basename='pricetier')
router.register(r'catalog',    CatalogViewSet, basename='catalog')
router.register(r'inventory/alerts', InventoryAlertViewSet, basename='inventory-alerts')  # ✅


urlpatterns = router.urls
