from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Subscription
from .serializers import SubscriptionSerializer
from core.permissions import IsOwner

class SubscriptionViewSet(viewsets.GenericViewSet):
    queryset = Subscription.objects.all()
    serializer_class = SubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def status(self, request):
        from accounts.models import GlobalSetting
        subscription, created = Subscription.objects.get_or_create(user=request.user)
        
        # Check if subscription is active based on end_date
        from django.utils import timezone
        is_active = False
        if subscription.end_date and subscription.end_date > timezone.now():
            is_active = True
        elif subscription.plan_name == 'pro' and not subscription.end_date:
            is_active = True
            
        # Get free mode status from global settings
        free_mode = False
        try:
            settings_obj = GlobalSetting.objects.get(key='global')
            free_mode = settings_obj.value.get('isFreeMode', False)
        except GlobalSetting.DoesNotExist:
            pass
            
        return Response({
            "plan": subscription.plan_name,
            "isActive": is_active or free_mode,
            "endDate": subscription.end_date,
            "isFreeMode": free_mode
        })

    @action(detail=False, methods=['post'], url_path='create-checkout')
    def create_checkout(self, request):
        # Placeholder for Stripe/Razorpay integration
        return Response({
            "message": "Checkout session creation placeholder",
            "url": "https://checkout.stripe.com/pay/placeholder"
        })
