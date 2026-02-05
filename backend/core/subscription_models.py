"""
Модели для системи тарифних планів та підписок
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from accounts.models import User


class SubscriptionPlan(models.Model):
    """Тариф підписки"""

    BILLING_CYCLE_CHOICES = [
        ("monthly", _("Щомісячно")),
        ("yearly", _("Щорічно")),
    ]

    name = models.CharField(max_length=100, verbose_name=_("Назва плану"))
    slug = models.SlugField(unique=True, verbose_name=_("URL"))
    description = models.TextField(blank=True, verbose_name=_("Опис"))

    # Ціна
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name=_("Ціна"))
    billing_cycle = models.CharField(
        max_length=20,
        choices=BILLING_CYCLE_CHOICES,
        default="monthly",
        verbose_name=_("Цикл біллінгу"),
    )

    # Особливості плану
    max_stores = models.IntegerField(default=1, verbose_name=_("Максимум магазинів"))
    max_products = models.IntegerField(default=100, verbose_name=_("Максимум товарів"))
    max_monthly_orders = models.IntegerField(
        default=1000, verbose_name=_("Макс. замовлень/місяць")
    )

    # Функції
    has_analytics = models.BooleanField(default=False, verbose_name=_("Аналітика"))
    has_email_support = models.BooleanField(
        default=False, verbose_name=_("Email підтримка")
    )
    has_priority_support = models.BooleanField(
        default=False, verbose_name=_("Пріоритетна підтримка")
    )
    has_custom_domain = models.BooleanField(
        default=False, verbose_name=_("Кастомний домен")
    )
    has_api_access = models.BooleanField(default=False, verbose_name=_("API доступ"))
    has_integrations = models.BooleanField(default=False, verbose_name=_("Інтеграції"))

    # Комісія
    commission_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("5.00"),
        verbose_name=_("Комісія з продажів (%)"),
    )

    # Статус
    is_active = models.BooleanField(default=True, verbose_name=_("Активний"))
    is_featured = models.BooleanField(default=False, verbose_name=_("Рекомендований"))

    # Сортування
    order = models.PositiveIntegerField(default=0, verbose_name=_("Порядок"))

    # Дати
    created_at = models.DateTimeField(
        auto_now_add=True, verbose_name=_("Дата створення")
    )
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_("Дата оновлення"))

    class Meta:
        verbose_name = _("План підписки")
        verbose_name_plural = _("План підписки")
        ordering = ["order", "price"]

    def __str__(self):
        return f"{self.name} ({self.price} {self.billing_cycle})"

    @property
    def features_list(self):
        """Список особливостей плану"""
        features = []
        if self.has_analytics:
            features.append("Аналітика")
        if self.has_email_support:
            features.append("Email підтримка")
        if self.has_priority_support:
            features.append("Пріоритетна підтримка")
        if self.has_custom_domain:
            features.append("Кастомний домен")
        if self.has_api_access:
            features.append("API доступ")
        if self.has_integrations:
            features.append("Інтеграції")
        return features


class UserSubscription(models.Model):
    """Підписка користувача"""

    STATUS_CHOICES = [
        ("active", _("Активна")),
        ("cancelled", _("Скасована")),
        ("suspended", _("Призупинена")),
        ("expired", _("Закінчена")),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="subscription",
        verbose_name=_("Користувач"),
    )
    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.PROTECT,
        related_name="subscriptions",
        verbose_name=_("План"),
    )

    # Статус
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="active",
        verbose_name=_("Статус"),
    )

    # Дати
    started_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Дата початку"))
    expires_at = models.DateTimeField(verbose_name=_("Дата закінчення"))
    cancelled_at = models.DateTimeField(
        null=True, blank=True, verbose_name=_("Дата скасування")
    )

    # Платіж
    stripe_subscription_id = models.CharField(
        max_length=100, blank=True, verbose_name=_("Stripe Subscription ID")
    )
    next_billing_date = models.DateTimeField(
        null=True, blank=True, verbose_name=_("Наступна дата биллінгу")
    )

    class Meta:
        verbose_name = _("Підписка користувача")
        verbose_name_plural = _("Підписки користувачів")
        ordering = ["-started_at"]

    def __str__(self):
        return f"{self.user.email} - {self.plan.name}"

    @property
    def is_active(self):
        """Чи активна підписка"""
        return self.status == "active" and self.expires_at > timezone.now()

    @property
    def days_remaining(self):
        """Кількість днів до закінчення"""
        if self.is_active:
            return (self.expires_at - timezone.now()).days
        return 0

    def cancel(self):
        """Скасувати підписку"""
        self.status = "cancelled"
        self.cancelled_at = timezone.now()
        self.save()

    def renew(self, days=None):
        """Поновити підписку"""
        if days is None:
            days = 30 if self.plan.billing_cycle == "monthly" else 365

        self.expires_at = timezone.now() + timedelta(days=days)
        self.status = "active"
        self.save()


class SubscriptionPayment(models.Model):
    """Платіж за підписку"""

    STATUS_CHOICES = [
        ("pending", _("Очікує")),
        ("completed", _("Завершено")),
        ("failed", _("Помилка")),
        ("refunded", _("Повернено")),
    ]

    subscription = models.ForeignKey(
        UserSubscription,
        on_delete=models.CASCADE,
        related_name="payments",
        verbose_name=_("Підписка"),
    )

    amount = models.DecimalField(
        max_digits=10, decimal_places=2, verbose_name=_("Сума")
    )
    currency = models.CharField(max_length=3, default="UAH", verbose_name=_("Валюта"))

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending",
        verbose_name=_("Статус"),
    )

    # Зовнішні ID
    stripe_invoice_id = models.CharField(
        max_length=100, blank=True, verbose_name=_("Stripe Invoice ID")
    )
    transaction_id = models.CharField(
        max_length=100, blank=True, verbose_name=_("ID транзакції")
    )

    # Дати
    created_at = models.DateTimeField(
        auto_now_add=True, verbose_name=_("Дата створення")
    )
    paid_at = models.DateTimeField(null=True, blank=True, verbose_name=_("Дата оплати"))

    class Meta:
        verbose_name = _("Платіж за підписку")
        verbose_name_plural = _("Платежі за підписку")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.subscription.user.email} - {self.amount} {self.currency}"


class PlanFeature(models.Model):
    """Особливість плану"""

    FEATURE_TYPES = [
        ("boolean", _("Так/Ні")),
        ("numeric", _("Число")),
        ("text", _("Текст")),
    ]

    name = models.CharField(max_length=100, verbose_name=_("Назва"))
    slug = models.SlugField(unique=True, verbose_name=_("URL"))
    description = models.TextField(blank=True, verbose_name=_("Опис"))

    feature_type = models.CharField(
        max_length=20,
        choices=FEATURE_TYPES,
        default="boolean",
        verbose_name=_("Тип особливості"),
    )

    # Дефолтне значення
    default_value = models.CharField(
        max_length=255, blank=True, verbose_name=_("Значення за замовчуванням")
    )

    # Сортування
    order = models.PositiveIntegerField(default=0, verbose_name=_("Порядок"))

    class Meta:
        verbose_name = _("Особливість плану")
        verbose_name_plural = _("Особливості плану")
        ordering = ["order", "name"]

    def __str__(self):
        return self.name


class PlanFeatureValue(models.Model):
    """Значення особливості для плану"""

    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.CASCADE,
        related_name="feature_values",
        verbose_name=_("План"),
    )
    feature = models.ForeignKey(
        PlanFeature, on_delete=models.CASCADE, verbose_name=_("Особливість")
    )

    value = models.CharField(max_length=255, verbose_name=_("Значення"))

    class Meta:
        verbose_name = _("Значення особливості плану")
        verbose_name_plural = _("Значення особливостей плану")
        unique_together = ["plan", "feature"]

    def __str__(self):
        return f"{self.plan.name} - {self.feature.name}: {self.value}"
