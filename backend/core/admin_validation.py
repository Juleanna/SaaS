from django.urls import reverse_lazy, NoReverseMatch
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def validate_admin_navigation():
    """Валідація всіх URL в навігації Unfold Admin"""
    errors = []
    
    if not hasattr(settings, 'UNFOLD') or 'SIDEBAR' not in settings.UNFOLD:
        return ['UNFOLD SIDEBAR not configured']
    
    navigation = settings.UNFOLD['SIDEBAR'].get('navigation', [])
    
    for section in navigation:
        section_title = section.get('title', 'Unknown section')
        items = section.get('items', [])
        
        for item in items:
            item_title = item.get('title', 'Unknown item')
            link_func = item.get('link')
            
            if link_func and callable(link_func):
                try:
                    # Створюємо мок request
                    class MockRequest:
                        def __init__(self):
                            self.user = None
                    
                    mock_request = MockRequest()
                    url = link_func(mock_request)
                    
                    if isinstance(url, str):
                        logger.info(f"✓ {section_title} -> {item_title}: {url}")
                    else:
                        errors.append(f"✗ {section_title} -> {item_title}: URL function returned non-string")
                        
                except NoReverseMatch as e:
                    errors.append(f"✗ {section_title} -> {item_title}: {str(e)}")
                except Exception as e:
                    errors.append(f"✗ {section_title} -> {item_title}: Unexpected error - {str(e)}")
    
    return errors

def check_admin_registrations():
    """Перевірити реєстрацію моделей в admin"""
    from django.contrib import admin
    from django.apps import apps
    
    registered_models = set()
    unregistered_models = []
    
    # Отримати всі зареєстровані моделі
    for model, model_admin in admin.site._registry.items():
        app_label = model._meta.app_label
        model_name = model._meta.model_name
        registered_models.add(f"{app_label}.{model_name}")
    
    # Перевірити моделі з наших додатків
    our_apps = ['accounts', 'stores', 'products', 'orders', 'payments', 
                'warehouse', 'pricelists', 'notifications', 'telegram_bot']
    
    for app_name in our_apps:
        try:
            app_config = apps.get_app_config(app_name)
            for model in app_config.get_models():
                model_key = f"{app_name}.{model._meta.model_name}"
                if model_key not in registered_models:
                    unregistered_models.append(model_key)
        except LookupError:
            continue
    
    return {
        'registered': sorted(registered_models),
        'unregistered': sorted(unregistered_models)
    }

def run_admin_diagnostics():
    """Запустити повну діагностику admin налаштувань"""
    print("🔍 Діагностика Unfold Admin...")
    print("=" * 50)
    
    # Валідація навігації
    print("\n📋 Перевірка навігації:")
    nav_errors = validate_admin_navigation()
    if nav_errors:
        print("❌ Знайдено помилки в навігації:")
        for error in nav_errors:
            print(f"  - {error}")
    else:
        print("✅ Навігація валідна")
    
    # Перевірка реєстрацій
    print("\n📝 Перевірка реєстрації моделей:")
    registrations = check_admin_registrations()
    
    print(f"✅ Зареєстровано моделей: {len(registrations['registered'])}")
    for model in registrations['registered']:
        print(f"  ✓ {model}")
    
    if registrations['unregistered']:
        print(f"\n⚠️  Не зареєстровано моделей: {len(registrations['unregistered'])}")
        for model in registrations['unregistered']:
            print(f"  - {model}")
    else:
        print("\n✅ Всі моделі зареєстровані")
    
    return {
        'navigation_errors': nav_errors,
        'registrations': registrations
    }

if __name__ == "__main__":
    import django
    import os
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
    django.setup()
    run_admin_diagnostics()