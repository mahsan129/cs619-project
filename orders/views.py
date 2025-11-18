# orders/views.py
from decimal import Decimal
from django.db import transaction
from django.db.models import Prefetch, Sum, Count
from django.utils import timezone
from datetime import timedelta
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import CartItem, Address, Order, OrderItem, Review
from .serializers import CartItemSerializer, CheckoutSerializer, OrderSerializer, OrderListSerializer, ReviewSerializer, SalesRowSerializer
from products.models import PriceTier, Material

from io import BytesIO
from django.http import HttpResponse, HttpResponseForbidden
from django.template.loader import get_template
from xhtml2pdf import pisa



class CartViewSet(viewsets.ModelViewSet):
    """
    Auth required.
    Endpoints:
      GET    /api/cart/           -> list my cart
      POST   /api/cart/           -> {material, qty}
      PATCH  /api/cart/{id}/      -> {qty}
      DELETE /api/cart/{id}/
      GET    /api/cart/summary/   -> totals
    """
    permission_classes = [IsAuthenticated]
    serializer_class = CartItemSerializer

    def get_queryset(self):
        qs = (
            CartItem.objects
            .filter(user=self.request.user)
            .select_related("material")
            .prefetch_related(Prefetch("material__prices", queryset=PriceTier.objects.all()))
            .order_by("id")
        )
        # allow filtering cart items by material category slug: /api/cart/?category=<slug>
        cat = self.request.query_params.get("category")
        if cat:
            qs = qs.filter(material__category__slug=cat)
        return qs

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["role"] = getattr(self.request.user, "role", None)
        return ctx

    def create(self, request, *args, **kwargs):
        material_id = request.data.get("material")
        qty = int(request.data.get("qty", 1))
        if not material_id:
            return Response({"detail": "material is required"}, status=400)

        item, created = CartItem.objects.get_or_create(
            user=request.user, material_id=material_id, defaults={"qty": max(1, qty)}
        )
        if not created:
            item.qty = max(1, item.qty + qty)
            item.save()

        ser = self.get_serializer(item)
        return Response(ser.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"])
    def summary(self, request):
        data = self.get_serializer(self.get_queryset(), many=True).data
        subtotal = sum((x["line_total"] or 0) for x in data)
        return Response({"count": len(data), "subtotal": subtotal})
    


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def checkout_view(request):
    """
    POST /api/orders/checkout/
    Body:
    {
      "address": { "line1": "...", "city": "...", "state": "", "zip": "", "phone": "..." },
      "cart_item_ids": [1, 3, 5],  // optional: if provided, only checkout these items
      "payment_method": "card" or "cod",
      "delivery_charges": 500
    }
    Steps:
      - Validate address
      - Load cart + effective prices by role
      - Validate stock for each material
      - Create Order + OrderItems
      - Decrement stock
      - Remove checked-out items from cart
    """
    ser = CheckoutSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    addr_data = ser.validated_data["address"]
    cart_item_ids = request.data.get("cart_item_ids", [])
    payment_method = request.data.get("payment_method", "cod")
    delivery_charges = Decimal(str(request.data.get("delivery_charges", 0)))

    # load cart with prices
    cart_qs = (CartItem.objects
               .filter(user=request.user)
               .select_related("material")
               .prefetch_related(Prefetch("material__prices", queryset=PriceTier.objects.all()))
               .order_by("id"))
    
    # Filter by cart_item_ids if provided
    if cart_item_ids:
        cart_qs = cart_qs.filter(id__in=cart_item_ids)
    cart = list(cart_qs)
    if not cart:
        return Response({"detail": "Cart is empty"}, status=400)

    # helper to compute effective price by role
    role = (getattr(request.user, "role", "") or "").upper()
    def eff_price(material):
        prices = {p.type: p.price for p in material.prices.all()}
        desired = "WHOLESALE" if role in ("WHOLESALER", "ADMIN") else "RETAIL"
        return prices.get(desired) or prices.get("RETAIL") or prices.get("WHOLESALE")

    with transaction.atomic():
        # stock validation
        missing = []
        for it in cart:
            if it.qty <= 0:
                missing.append({"sku": it.material.sku, "detail": "qty must be >= 1"})
                continue
            if it.material.stock_qty < it.qty:
                missing.append({"sku": it.material.sku, "available": it.material.stock_qty, "requested": it.qty})
        if missing:
            return Response({"detail": "Insufficient stock", "items": missing}, status=400)

        # snapshot address text
        addr_text = f"{addr_data['line1']}, {addr_data['city']}"
        if addr_data.get("state"): addr_text += f", {addr_data['state']}"
        if addr_data.get("zip"): addr_text += f" {addr_data['zip']}"
        addr_text += f" • {addr_data['phone']}"

        # (optional) save address record for user history
        Address.objects.create(user=request.user, **addr_data)

        # build order
        order = Order.objects.create(
            user=request.user,
            address=addr_text,
            status="PLACED",
            subtotal=Decimal("0.00"),
            tax=Decimal("0.00"),
            delivery_charges=delivery_charges,
            total=Decimal("0.00"),
            payment_method=payment_method,
        )

        subtotal = Decimal("0.00")
        for it in cart:
            p = eff_price(it.material)
            if p is None:
                return Response({"detail": f"No price set for {it.material.sku}"}, status=400)

            line_total = (p * it.qty)
            OrderItem.objects.create(
                order=order,
                material=it.material,
                title=it.material.title,
                sku=it.material.sku,
                unit=it.material.unit,
                qty=it.qty,
                price=p,
                line_total=line_total,
            )
            # decrement stock
            it.material.stock_qty = max(0, it.material.stock_qty - it.qty)
            it.material.save(update_fields=["stock_qty"])

            subtotal += line_total

        # simple tax = 0 for now (can compute later)
        order.subtotal = subtotal
        order.tax = Decimal("0.00")
        order.total = subtotal + order.tax + delivery_charges
        order.save(update_fields=["subtotal", "tax", "total"])

        # clear only the checked-out items from cart
        CartItem.objects.filter(id__in=[it.id for it in cart]).delete()

    # return summary
    out = OrderSerializer(order)
    return Response(out.data, status=201)

class ReviewViewSet(viewsets.ModelViewSet):
    """
    Reviews for orders:
      POST /api/reviews/ -> {order, rating, comment}
      GET /api/reviews/ -> my reviews (or all if admin)
      PATCH /api/reviews/{id}/ -> update
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ReviewSerializer

    def get_queryset(self):
        qs = Review.objects.all().order_by("-created_at")
        user = self.request.user
        if getattr(user, "role", "") != "ADMIN":
            qs = qs.filter(order__user=user)
        return qs

    def create(self, request, *args, **kwargs):
        order_id = request.data.get("order")
        if Review.objects.filter(order_id=order_id).exists():
            return Response({"detail": "Review already exists for this order"}, status=400)
        try:
            order = Order.objects.get(id=order_id, user=request.user)
        except Order.DoesNotExist:
            return Response({"detail": "Order not found"}, status=404)
        return super().create(request, *args, **kwargs)


ALLOWED_STATUSES = {"PLACED", "CONFIRMED", "DISPATCHED", "DELIVERED", "CANCELLED"}

class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET    /api/orders/           -> list orders (mine if user, all if ADMIN)
    GET    /api/orders/{id}/      -> detail
    PATCH  /api/orders/{id}/status -> change status (Admin only)
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = (
            Order.objects
            .select_related("user")
            .prefetch_related("items")
            .order_by("-created_at")
        )
        user = self.request.user
        # Admin sees all, others see only their own
        if getattr(user, "role", "") != "ADMIN":
            qs = qs.filter(user=user)
        return qs

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset().annotate(item_count=Count("items"))
        ser = OrderListSerializer(qs, many=True)
        return Response(ser.data)

    def retrieve(self, request, *args, **kwargs):
        obj = self.get_object()
        ser = OrderSerializer(obj)
        return Response(ser.data)

    @action(detail=True, methods=["patch"], url_path="status")
    def set_status(self, request, pk=None):
        # Only Admin allowed
        user = request.user
        if getattr(user, "role", "") != "ADMIN":
            return Response({"detail": "Admin only"}, status=403)

        order = self.get_object()
        new_status = (request.data.get("status") or "").upper()
        if new_status not in ALLOWED_STATUSES:
            return Response({"detail": f"Invalid status. Allowed: {sorted(ALLOWED_STATUSES)}"}, status=400)

        order.status = new_status
        order.save(update_fields=["status"])
        return Response({"id": order.id, "status": order.status})
    

class ReviewViewSet(viewsets.ModelViewSet):
    """
    POST /api/reviews/      -> {order, rating, comment}
    GET  /api/reviews/mine/ -> my reviews
    Rules:
      - A user can only review their own ORDER.
      - Only once per order (OneToOne).
      - Recommended: allow review when status == DELIVERED (you can relax for dev).
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ReviewSerializer

    def get_queryset(self):
        qs = Review.objects.select_related("order", "order__user").order_by("-created_at")
        u = self.request.user
        if getattr(u, "role", "") != "ADMIN":
            qs = qs.filter(order__user=u)
        return qs

    def create(self, request, *args, **kwargs):
        order_id = request.data.get("order")
        rating = int(request.data.get("rating", 0))
        comment = request.data.get("comment", "")

        if not order_id or not (1 <= rating <= 5):
            return Response({"detail": "order and rating(1-5) required"}, status=400)

        try:
            order = Order.objects.get(pk=order_id)
        except Order.DoesNotExist:
            return Response({"detail": "Order not found"}, status=404)

        # ownership & simple status check
        if getattr(request.user, "role", "") != "ADMIN" and order.user_id != request.user.id:
            return Response({"detail": "Not your order"}, status=403)

        if Review.objects.filter(order=order).exists():
            return Response({"detail": "Review already exists for this order"}, status=400)

        # (optional) enforce delivery status
        # if order.status != "DELIVERED":
        #     return Response({"detail": "You can review only delivered orders"}, status=400)

        rev = Review.objects.create(order=order, rating=rating, comment=comment)
        ser = self.get_serializer(rev)
        return Response(ser.data, status=201)

    @action(detail=False, methods=["get"])
    def mine(self, request):
        qs = Review.objects.filter(order__user=request.user).select_related("order").order_by("-created_at")
        ser = self.get_serializer(qs, many=True)
        return Response(ser.data)

# ---------- Sales Report ----------
from rest_framework.decorators import api_view, permission_classes
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def sales_report_view(request):
    """
    GET /api/reports/sales?from=YYYY-MM-DD&to=YYYY-MM-DD
      returns rows grouped by day: {day, orders, revenue}
    Admin only (others -> 403)
    """
    if getattr(request.user, "role", "") != "ADMIN":
        return Response({"detail": "Admin only"}, status=403)

    date_from = request.query_params.get("from")
    date_to = request.query_params.get("to")
    qs = Order.objects.all()
    if date_from:
        qs = qs.filter(created_at__date__gte=date_from)
    if date_to:
        qs = qs.filter(created_at__date__lte=date_to)

    rows = (
        qs.annotate(day=TruncDate("created_at"))
          .values("day")
          .annotate(orders=Count("id"), revenue=Sum("total"))
          .order_by("day")
    )

    # serialize
    data = [{"day": r["day"], "orders": r["orders"], "revenue": r["revenue"] or 0} for r in rows]
    ser = SalesRowSerializer(data, many=True)
    return Response(ser.data)

def _render_pdf_from_template(template_name, context):
    html = get_template(template_name).render(context)
    result = BytesIO()
    pisa.CreatePDF(src=html, dest=result)  # returns pisaStatus, but result has PDF bytes
    return result.getvalue()

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def invoice_pdf_view(request, pk: int):
    """
    GET /api/orders/<id>/invoice.pdf
    - Only owner or ADMIN can download
    """
    try:
        order = Order.objects.select_related("user").prefetch_related("items").get(pk=pk)
    except Order.DoesNotExist:
        return Response({"detail": "Order not found"}, status=404)

    if getattr(request.user, "role", "") != "ADMIN" and order.user_id != request.user.id:
        return Response({"detail": "Not allowed"}, status=403)

    pdf_bytes = _render_pdf_from_template("invoice.html", {"order": order})
    resp = HttpResponse(pdf_bytes, content_type="application/pdf")
    resp["Content-Disposition"] = f'attachment; filename="invoice_{order.pk}.pdf"'
    return resp