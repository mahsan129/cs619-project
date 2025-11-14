# orders/views_cart.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Order, OrderItem
from products.models import Material, PriceTier
from .serializers import CartSerializer


def pick_price_for_user(material, user):
    # same logic as MaterialCatalogSerializer
    role = getattr(user, "role", "").upper()
    desired = "WHOLESALE" if role in ("WHOLESALER", "ADMIN") else "RETAIL"

    prices = {p.type: p.price for p in material.prices.all()}
    if desired in prices:
        return prices[desired]
    # fallback
    for t in ("RETAIL", "WHOLESALE"):
        if t in prices:
            return prices[t]
    return 0


def get_or_create_cart(user):
    cart, _ = Order.objects.get_or_create(user=user, status="CART")
    return cart


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def cart_detail(request):
    cart = get_or_create_cart(request.user)
    return Response(CartSerializer(cart).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def cart_add(request):
    """
    POST /api/cart/add/
    { "material_id": 5, "quantity": 2 }
    """
    material_id = request.data.get("material_id")
    qty = int(request.data.get("quantity", 1) or 1)

    if not material_id:
        return Response({"detail": "material_id required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        material = Material.objects.prefetch_related("prices").get(pk=material_id)
    except Material.DoesNotExist:
        return Response({"detail": "Material not found"}, status=status.HTTP_404_NOT_FOUND)

    if qty <= 0:
        return Response({"detail": "Quantity must be > 0"}, status=status.HTTP_400_BAD_REQUEST)

    cart = get_or_create_cart(request.user)
    price = pick_price_for_user(material, request.user)

    item, created = OrderItem.objects.get_or_create(
        order=cart,
        material=material,
        defaults={"quantity": qty, "price": price},
    )
    if not created:
        item.quantity += qty
        item.save(update_fields=["quantity"])

    return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)
