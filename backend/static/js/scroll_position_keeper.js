// Простий keeper позиції прокрутки для будь-якого сайдбару
(function() {
    'use strict';
    
    let sidebar = null;
    const storageKey = 'admin-sidebar-scroll';
    
    function findSidebarElement() {
        // Шукаємо всі можливі варіанти сайдбару
        const candidates = [
            // Unfold Admin специфічні
            document.querySelector('[data-turbo-permanent]'),
            document.querySelector('.bg-white.dark\\:bg-gray-900'),
            // Загальні селектори
            document.querySelector('aside'),
            document.querySelector('nav[role="navigation"]'),
            document.querySelector('.sidebar'),
            document.querySelector('#sidebar'),
            // Пошук по класах Bootstrap/Tailwind
            document.querySelector('.navbar-nav'),
            document.querySelector('.nav-sidebar'),
        ];
        
        // Фільтруємо тільки прокручувані елементи
        for (let candidate of candidates) {
            if (candidate && 
                candidate.scrollHeight > candidate.clientHeight &&
                candidate.getBoundingClientRect().width < window.innerWidth / 2) {
                return candidate;
            }
        }
        
        return null;
    }
    
    function savePosition() {
        if (sidebar) {
            sessionStorage.setItem(storageKey, sidebar.scrollTop);
        }
    }
    
    function restorePosition() {
        if (sidebar) {
            const saved = sessionStorage.getItem(storageKey);
            if (saved) {
                sidebar.scrollTop = parseInt(saved);
            }
        }
    }
    
    function initScrollKeeper() {
        sidebar = findSidebarElement();
        
        if (sidebar) {
            // Відновлюємо позицію
            restorePosition();
            
            // Слухаємо прокрутку
            sidebar.addEventListener('scroll', savePosition);
            
            // Зберігаємо при кліках
            sidebar.addEventListener('click', function(e) {
                if (e.target.closest('a')) {
                    savePosition();
                }
            });
            
            // Зберігаємо перед перехідом
            window.addEventListener('beforeunload', savePosition);
            
            return true;
        }
        
        return false;
    }
    
    // Пробуємо ініціалізувати кілька разів
    let attempts = 0;
    const maxAttempts = 10;
    
    function tryInit() {
        // Перевіряємо чи доступний document.body
        if (!document.body) {
            setTimeout(tryInit, 100);
            return;
        }
        
        if (initScrollKeeper() || attempts >= maxAttempts) {
            return;
        }
        
        attempts++;
        setTimeout(tryInit, 500);
    }
    
    // Запускаємо з перевіркою готовності DOM
    function startInit() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', tryInit);
        } else {
            tryInit();
        }
    }
    
    startInit();
    
    // Додаткова спроба після повного завантаження
    window.addEventListener('load', function() {
        setTimeout(function() {
            if (!sidebar) {
                tryInit();
            }
        }, 200);
    });
    
})();