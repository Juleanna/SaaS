from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from unfold.admin import ModelAdmin
from unfold.contrib.filters.admin import RangeDateFilter
from unfold.decorators import display
from .models import User


@admin.register(User)
class CustomUserAdmin(ModelAdmin, UserAdmin):
    list_display = ('email', 'username', 'get_full_name', 'company_name', 'subscription_plan', 'balance', 'is_subscribed', 'is_active')
    list_filter = (
        'is_active', 
        'is_subscribed', 
        'subscription_plan',
        ('date_joined', RangeDateFilter),
        'email_notifications',
        'telegram_notifications'
    )
    search_fields = ('email', 'username', 'first_name', 'last_name', 'company_name', 'telegram_username', 'instagram_username')
    ordering = ('-date_joined',)
    list_per_page = 25
    actions_on_top = True
    actions_on_bottom = False
    
    fieldsets = (
        ('Авторизація', {
            'fields': ('email', 'password'),
            'classes': ('collapse',)
        }),
        ('Особиста інформація', {
            'fields': ('username', 'first_name', 'last_name', 'phone', 'company_name', 'avatar'),
            'classes': ('tab',)
        }),
        ('Соціальні мережі', {
            'fields': ('telegram_username', 'telegram_chat_id', 'instagram_username'),
            'classes': ('tab',),
            'description': 'Налаштування соціальних мереж користувача'
        }),
        ('Фінанси', {
            'fields': ('balance', 'monthly_spending', 'total_spent', 'stripe_customer_id'),
            'classes': ('tab',),
            'description': 'Баланс та платіжна інформація'
        }),
        ('Налаштування сповіщень', {
            'fields': ('email_notifications', 'telegram_notifications'),
            'classes': ('tab',),
            'description': 'Налаштування отримання сповіщень'
        }),
        ('Підписка', {
            'fields': ('is_subscribed', 'subscription_plan'),
            'classes': ('tab',),
            'description': 'Інформація про підписку користувача'
        }),
        ('Права доступу', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
            'classes': ('collapse',),
            'description': 'Права доступу та групи користувача'
        }),
        ('Метадані', {
            'fields': ('last_login', 'date_joined'),
            'classes': ('collapse',),
            'description': 'Системна інформація'
        }),
    )
    
    add_fieldsets = (
        ('Створення користувача', {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2'),
            'description': 'Заповніть обов\'язкові поля для створення нового користувача'
        }),
    )
    
    readonly_fields = ('last_login', 'date_joined', 'avg_spending')
    
    @display(description="Повне ім'я")
    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username
    
    @display(description="Баланс", ordering="balance")
    def get_balance_display(self, obj):
        return f"{obj.balance} ₴"
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related() 