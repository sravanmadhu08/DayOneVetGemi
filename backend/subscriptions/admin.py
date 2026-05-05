from django.contrib import admin
from .models import Subscription

@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ('user', 'plan_name', 'is_active', 'end_date')
    list_filter = ('is_active', 'plan_name')
    search_fields = ('user__username', 'stripe_customer_id', 'stripe_subscription_id')
