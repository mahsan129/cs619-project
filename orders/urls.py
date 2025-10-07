# orders/urls.py
from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import CartViewSet, checkout_view, OrderViewSet, ReviewViewSet, sales_report_view

router = DefaultRouter()
router.register(r'cart', CartViewSet, basename='cart')
router.register(r'orders', OrderViewSet, basename='orders')   # ✅ Day-7
router.register(r'reviews', ReviewViewSet, basename='reviews')


urlpatterns = router.urls + [
    path('orders/checkout/', checkout_view, name='orders-checkout'),
        path('reports/sales', sales_report_view, name='reports-sales'),     
]

