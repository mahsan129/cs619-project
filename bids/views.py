from django.db.models import Count, Prefetch
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import BulkRequest, Bid
from .serializers import BulkRequestSerializer, BidSerializer
from .permissions import IsRetailOrWhole, IsSupplier

class BulkRequestViewSet(viewsets.ModelViewSet):
    """
    Retailer/Wholesaler create & see their own requests.
    Admin sees all.
      GET /api/bulk-requests/
      POST /api/bulk-requests/
      GET /api/bulk-requests/mine/
      GET /api/bulk-requests/{id}/
      PATCH /api/bulk-requests/{id}/close/
    """
    permission_classes = [IsAuthenticated, IsRetailOrWhole]
    serializer_class = BulkRequestSerializer

    def get_queryset(self):
        qs = BulkRequest.objects.select_related("user","material").annotate(bids_count=Count("bids")).order_by("-created_at")
        u = self.request.user
        if getattr(u, "role","") != "ADMIN":
            qs = qs.filter(user=u)
        return qs

    @action(detail=False, methods=["get"])
    def mine(self, request):
        qs = BulkRequest.objects.filter(user=request.user).select_related("material").annotate(bids_count=Count("bids")).order_by("-created_at")
        ser = self.get_serializer(qs, many=True)
        return Response(ser.data)

    @action(detail=True, methods=["patch"])
    def close(self, request, pk=None):
        br = self.get_object()
        if getattr(request.user,"role","") != "ADMIN" and br.user_id != request.user.id:
            return Response({"detail":"Not owner"}, status=403)
        br.status = "CLOSED"
        br.save(update_fields=["status"])
        return Response({"id": br.id, "status": br.status})

class BidViewSet(viewsets.ModelViewSet):
    """
      Supplier places bids.
        GET  /api/bids/           -> my bids (supplier) / all (admin)
        POST /api/bids/           -> {bulk_request, unit_price, note}
        GET  /api/bids/mine/
        PATCH /api/bids/{id}/accept/   (request owner/admin)
    """
    permission_classes = [IsAuthenticated]
    serializer_class = BidSerializer

    def get_permissions(self):
        if self.action in ("create",):
            return [IsAuthenticated(), IsSupplier()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = Bid.objects.select_related("bulk_request","supplier","bulk_request__material").order_by("-created_at")
        u = self.request.user
        role = getattr(u,"role","")
        if role == "SUPPLIER":
            qs = qs.filter(supplier=u)
        elif role == "ADMIN":
            pass
        else:
            # requester can see bids on their own bulk requests
            qs = qs.filter(bulk_request__user=u)
        return qs

    @action(detail=False, methods=["get"])
    def mine(self, request):
        # supplier's own bids
        qs = Bid.objects.filter(supplier=request.user).select_related("bulk_request","bulk_request__material").order_by("-created_at")
        ser = self.get_serializer(qs, many=True)
        return Response(ser.data)

    @action(detail=True, methods=["patch"])
    def accept(self, request, pk=None):
        """
        Only the bulk request owner (or admin) can accept a bid.
        Accepting: set this bid ACCEPTED, set others REJECTED, close bulk request.
        """
        bid = self.get_object()
        br = bid.bulk_request
        u = request.user
        if getattr(u,"role","") != "ADMIN" and br.user_id != u.id:
            return Response({"detail":"Not owner"}, status=403)
        if br.status == "CLOSED":
            return Response({"detail":"Bulk request already closed"}, status=400)

        # accept chosen bid
        bid.status = "ACCEPTED"
        bid.save(update_fields=["status"])
        # reject others
        Bid.objects.filter(bulk_request=br).exclude(id=bid.id).update(status="REJECTED")
        # close BR
        br.status = "CLOSED"
        br.accepted_bid = bid
        br.save(update_fields=["status","accepted_bid"])
        return Response({"accepted_bid": bid.id, "bulk_request": br.id, "status": br.status})
