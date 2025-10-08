# myproject/exceptions.py
from rest_framework.views import exception_handler as drf_exception_handler
from rest_framework.response import Response
from django.utils.datastructures import MultiValueDictKeyError

def custom_exception_handler(exc, context):
    # let DRF build the standard response first
    response = drf_exception_handler(exc, context)

    if response is None:
        # Non-DRF exceptions -> 500-ish
        return Response({"ok": False, "error": str(exc), "detail": "Server error"}, status=500)

    # Normalize DRF errors to a single shape
    data = response.data
    # Example: {"field":["err"]} -> turn into list of strings
    if isinstance(data, dict):
        messages = []
        for k, v in data.items():
            if isinstance(v, (list, tuple)):
                messages.extend([f"{k}: {x}" for x in v])
            else:
                messages.append(f"{k}: {v}")
        data = {"ok": False, "errors": messages, "status_code": response.status_code}
    elif isinstance(data, list):
        data = {"ok": False, "errors": data, "status_code": response.status_code}
    else:
        data = {"ok": False, "error": str(data), "status_code": response.status_code}

    response.data = data
    return response
