# backend/core/management/commands/smoke.py
from django.core.management.base import BaseCommand
from django.db import connection
from users.models import User

class Command(BaseCommand):
    help = "Quick smoke test: DB + at least one superuser exists."

    def handle(self, *args, **opts):
        # ✅ Test 1: Database
        with connection.cursor() as cur:
            cur.execute("SELECT 1")
            self.stdout.write(self.style.SUCCESS("DB connection: OK"))

        # ✅ Test 2: Superuser check
        if not User.objects.filter(is_superuser=True).exists():
            self.stdout.write(self.style.WARNING("No superuser found. Create one with createsuperuser."))
        else:
            self.stdout.write(self.style.SUCCESS("Superuser exists: OK"))

        self.stdout.write(self.style.SUCCESS("Smoke: PASS"))
