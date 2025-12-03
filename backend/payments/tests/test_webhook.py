import json
from unittest import mock

from django.test import RequestFactory, TestCase, override_settings

from accounts.models import User
from stores.models import Store
from orders.models import Order
from payments.models import Payment
from payments.views import stripe_webhook


@override_settings(STRIPE_WEBHOOK_SECRET="test-secret")
class StripeWebhookTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.user = User.objects.create_user(username="owner", password="pass", email="owner@test.com")
        self.store = Store.objects.create(owner=self.user, name="Test Store", slug="test-store")
        self.order = Order.objects.create(
            store=self.store,
            customer_name="John Doe",
            customer_email="john@example.com",
            customer_phone="123",
            shipping_address="Street 1",
            shipping_city="City",
            shipping_postal_code="00000",
            subtotal=100,
            shipping_cost=0,
            tax_amount=0,
            total_amount=100,
        )
        self.payment = Payment.objects.create(
            order=self.order,
            amount=100,
            currency="USD",
            payment_method="stripe",
            status="pending",
            external_payment_id="sess_123",
        )

    @mock.patch("payments.views.stripe.Webhook.construct_event")
    def test_webhook_marks_payment_paid(self, mock_construct_event):
        event = {
            "type": "checkout.session.completed",
            "data": {"object": {"id": "sess_123", "metadata": {"payment_id": str(self.payment.id)}}},
        }
        mock_construct_event.return_value = event

        payload = json.dumps(event)
        request = self.factory.post(
            "/api/payments/public/stripe/webhook/",
            payload,
            content_type="application/json",
            HTTP_STRIPE_SIGNATURE="t=1,v1=fake",
        )

        response = stripe_webhook(request)
        self.assertEqual(response.status_code, 200)

        self.payment.refresh_from_db()
        self.order.refresh_from_db()
        self.assertEqual(self.payment.status, "completed")
        self.assertEqual(self.order.payment_status, "paid")
