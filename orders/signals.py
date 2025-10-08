# orders/signals.py
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from .models import Order

@receiver(pre_save, sender=Order)
def remember_old_status(sender, instance: Order, **kwargs):
    if instance.pk:
        try:
            old = Order.objects.get(pk=instance.pk)
            instance._old_status = old.status
        except Order.DoesNotExist:
            instance._old_status = None
    else:
        instance._old_status = None

@receiver(post_save, sender=Order)
def notify_status_change(sender, instance: Order, created, **kwargs):
    # Only notify on status change (not on creation)
    if created:
        return
    old = getattr(instance, "_old_status", None)
    if old and old != instance.status:
        subject = f"Your Order #{instance.pk} is now {instance.status}"
        body = (
            f"Hello,\n\n"
            f"Order #{instance.pk} status changed from {old} -> {instance.status}.\n"
            f"Total: Rs {instance.total}\n"
            f"Thanks!"
        )
        # Console backend prints this to terminal
        send_mail(subject, body, None, [instance.user.email or "demo@example.com"], fail_silently=True)
