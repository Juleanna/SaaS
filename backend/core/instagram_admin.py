"""
Django Admin для Instagram моделей
"""
from django.contrib import admin
from unfold.admin import ModelAdmin
from core.instagram_models import (
    InstagramAccount,
    InstagramPost,
    InstagramAutoPost,
    InstagramDMKeyword,
    InstagramDMMessage,
    InstagramStatistics,
)


@admin.register(InstagramAccount)
class InstagramAccountAdmin(ModelAdmin):
    """Admin для Instagram акаунтів"""

    list_display = [
        'instagram_username',
        'user',
        'store',
        'status',
        'account_type',
        'followers_count',
        'last_sync',
        'created_at'
    ]
    list_filter = ['status', 'account_type', 'auto_post_products', 'auto_respond_enabled']
    search_fields = ['instagram_username', 'instagram_name', 'user__username', 'store__name']
    readonly_fields = [
        'instagram_user_id',
        'access_token',
        'token_expires_at',
        'followers_count',
        'total_posts',
        'total_interactions',
        'last_sync',
        'created_at',
        'updated_at'
    ]

    fieldsets = (
        ('Основна інформація', {
            'fields': (
                'user',
                'store',
                'instagram_user_id',
                'instagram_username',
                'instagram_name',
                'profile_picture_url',
                'bio'
            )
        }),
        ('Статус та тип', {
            'fields': ('status', 'account_type')
        }),
        ('Токени доступу', {
            'fields': ('access_token', 'refresh_token', 'token_expires_at'),
            'classes': ('collapse',)
        }),
        ('Налаштування', {
            'fields': ('auto_post_products', 'hashtags', 'auto_respond_enabled')
        }),
        ('Статистика', {
            'fields': (
                'followers_count',
                'total_posts',
                'total_interactions',
                'last_sync'
            )
        }),
        ('Часові мітки', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    def has_add_permission(self, request):
        """Заборонити ручне додавання (тільки через OAuth)"""
        return False


@admin.register(InstagramPost)
class InstagramPostAdmin(ModelAdmin):
    """Admin для Instagram постів"""

    list_display = [
        'instagram_id',
        'account',
        'post_type',
        'likes_count',
        'comments_count',
        'posted_at'
    ]
    list_filter = ['post_type', 'posted_at']
    search_fields = ['instagram_id', 'caption', 'account__instagram_username']
    readonly_fields = [
        'instagram_id',
        'account',
        'post_type',
        'media_url',
        'permalink',
        'likes_count',
        'comments_count',
        'shares_count',
        'posted_at',
        'synced_at',
        'updated_at'
    ]

    fieldsets = (
        ('Основна інформація', {
            'fields': (
                'account',
                'store',
                'instagram_id',
                'post_type',
                'media_url',
                'permalink'
            )
        }),
        ('Контент', {
            'fields': ('caption',)
        }),
        ('Статистика', {
            'fields': ('likes_count', 'comments_count', 'shares_count')
        }),
        ('Пов\'язані товари', {
            'fields': ('related_products',)
        }),
        ('Дати', {
            'fields': ('posted_at', 'synced_at', 'updated_at')
        })
    )

    def has_add_permission(self, request):
        """Заборонити ручне додавання"""
        return False


@admin.register(InstagramAutoPost)
class InstagramAutoPostAdmin(ModelAdmin):
    """Admin для автопостів"""

    list_display = [
        'product',
        'account',
        'status',
        'scheduled_at',
        'posted_at'
    ]
    list_filter = ['status', 'scheduled_at']
    search_fields = ['product__name', 'account__instagram_username']
    readonly_fields = ['instagram_post_id', 'error_message', 'posted_at', 'created_at']

    fieldsets = (
        ('Основна інформація', {
            'fields': ('account', 'product', 'status')
        }),
        ('Контент', {
            'fields': ('caption_template',)
        }),
        ('Розклад', {
            'fields': ('scheduled_at', 'posted_at')
        }),
        ('Результат', {
            'fields': ('instagram_post_id', 'error_message'),
            'classes': ('collapse',)
        })
    )

    actions = ['publish_now']

    def publish_now(self, request, queryset):
        """Опублікувати негайно"""
        from core.instagram_tasks import auto_post_product_to_instagram

        for auto_post in queryset:
            if auto_post.status == 'pending':
                auto_post_product_to_instagram.delay(auto_post.id)

        self.message_user(request, f"Заплановано публікацію {queryset.count()} постів")

    publish_now.short_description = "Опублікувати негайно"


@admin.register(InstagramDMKeyword)
class InstagramDMKeywordAdmin(ModelAdmin):
    """Admin для DM ключових слів"""

    list_display = [
        'keyword',
        'account',
        'is_active',
        'times_triggered',
        'created_at'
    ]
    list_filter = ['is_active']
    search_fields = ['keyword', 'response_message', 'account__instagram_username']

    fieldsets = (
        ('Основна інформація', {
            'fields': ('account', 'keyword', 'is_active')
        }),
        ('Відповідь', {
            'fields': ('response_message',)
        }),
        ('Статистика', {
            'fields': ('times_triggered',)
        })
    )


@admin.register(InstagramDMMessage)
class InstagramDMMessageAdmin(ModelAdmin):
    """Admin для DM повідомлень"""

    list_display = [
        'sender_username',
        'account',
        'message_text_short',
        'is_processed',
        'auto_response_sent',
        'received_at'
    ]
    list_filter = ['is_processed', 'auto_response_sent', 'received_at']
    search_fields = ['sender_username', 'message_text']
    readonly_fields = [
        'instagram_message_id',
        'sender_username',
        'sender_id',
        'message_text',
        'received_at',
        'created_at'
    ]

    fieldsets = (
        ('Повідомлення', {
            'fields': (
                'account',
                'instagram_message_id',
                'sender_username',
                'sender_id',
                'message_text'
            )
        }),
        ('Обробка', {
            'fields': ('is_processed', 'auto_response_sent')
        }),
        ('Дати', {
            'fields': ('received_at', 'created_at')
        })
    )

    def message_text_short(self, obj):
        """Скорочений текст повідомлення"""
        return obj.message_text[:50] + '...' if len(obj.message_text) > 50 else obj.message_text
    message_text_short.short_description = 'Повідомлення'

    def has_add_permission(self, request):
        """Заборонити ручне додавання"""
        return False


@admin.register(InstagramStatistics)
class InstagramStatisticsAdmin(ModelAdmin):
    """Admin для статистики"""

    list_display = [
        'account',
        'date',
        'new_followers',
        'total_followers',
        'posts_published',
        'engagement_rate'
    ]
    list_filter = ['date']
    search_fields = ['account__instagram_username']
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Основна інформація', {
            'fields': ('account', 'date')
        }),
        ('Статистика підписників', {
            'fields': ('new_followers', 'total_followers')
        }),
        ('Статистика контенту', {
            'fields': ('posts_published', 'total_likes', 'total_comments')
        }),
        ('Engagement', {
            'fields': ('engagement_rate',)
        })
    )

    def has_add_permission(self, request):
        """Заборонити ручне додавання"""
        return False
