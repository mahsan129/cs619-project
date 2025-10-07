from rest_framework.routers import DefaultRouter
from .views import BulkRequestViewSet, BidViewSet

router = DefaultRouter()
router.register(r'bulk-requests', BulkRequestViewSet, basename='bulk-requests')
router.register(r'bids', BidViewSet, basename='bids')

urlpatterns = router.urls
