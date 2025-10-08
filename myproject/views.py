# myproject/views.py
from django.db import connection
from django.http import JsonResponse
from django.conf import settings

def health_view(request):
    # simple DB ping
    try:
        with connection.cursor() as cur:
            cur.execute("SELECT 1")
        db = "ok"
    except Exception as e:
        db = f"error: {e}"

    return JsonResponse({
        "ok": db == "ok",
        "app": getattr(settings, "APP_NAME", "App"),
        "version": getattr(settings, "APP_VERSION", "0.0.0"),
        "db": db,
    }, status=200 if db == "ok" else 500)

def handler404(request, exception=None):
    return JsonResponse({"ok": False, "error": "Not found"}, status=404)

def handler500(request):
    return JsonResponse({"ok": False, "error": "Server error"}, status=500)
