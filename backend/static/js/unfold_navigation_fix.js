// Unfold Admin Navigation Position Fix - Enhanced Version

(function() {
    'use strict';
    
    const STORAGE_KEY = 'unfold-sidebar-scroll-position';
    let sidebar = null;
    let isRestoring = false;
    
    // Функція для знаходження сайдбару з різними можливими селекторами
    function findSidebar() {
        const selectors = [
            '[data-turbo-permanent]', // Turbo permanent element
            '.bg-white.dark\\:bg-gray-900', // Tailwind classes що використовує Unfold
            '[data-controller="sidebar"]',
            '.unfold-sidebar',
            '#main-sidebar',
            '.sidebar',
            'nav[role="navigation"]',
            '.navigation-container'
        ];
        
        for (let selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.scrollHeight > element.clientHeight) {
                return element;
            }
        }
        
        // Якщо не знайшли, шукаємо будь-який прокручуваний контейнер в лівій частині
        const allElements = document.querySelectorAll('*');
        for (let el of allElements) {
            const rect = el.getBoundingClientRect();
            const style = window.getComputedStyle(el);
            
            if (rect.left < 100 && // Лівий бік екрану
                rect.width > 200 && rect.width < 400 && // Розмір як у сайдбару
                rect.height > 400 && // Достатньо високий
                (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
                el.scrollHeight > el.clientHeight) {
                return el;
            }
        }
        
        return null;
    }
    
    // Збереження позиції
    function saveScrollPosition() {
        if (sidebar && !isRestoring) {
            sessionStorage.setItem(STORAGE_KEY, sidebar.scrollTop.toString());
        }
    }
    
    // Відновлення позиції
    function restoreScrollPosition() {
        const savedPosition = sessionStorage.getItem(STORAGE_KEY);
        if (sidebar && savedPosition && !isNaN(savedPosition)) {
            isRestoring = true;
            sidebar.scrollTop = parseInt(savedPosition);
            
            // Додаткова перевірка через короткий інтервал
            setTimeout(() => {
                if (sidebar.scrollTop !== parseInt(savedPosition)) {
                    sidebar.scrollTop = parseInt(savedPosition);
                }
                isRestoring = false;
            }, 100);
        }
    }
    
    // Ініціалізація
    function init() {
        sidebar = findSidebar();
        
        if (sidebar) {
            console.log('Sidebar знайдено:', sidebar);
            
            // Відновлюємо позицію
            restoreScrollPosition();
            
            // Слухаємо прокрутку з debouncing
            let scrollTimeout;
            sidebar.addEventListener('scroll', function() {
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(saveScrollPosition, 50);
            }, { passive: true });
            
            // Зберігаємо при кліку на посилання
            sidebar.addEventListener('click', function(e) {
                if (e.target.tagName === 'A' || e.target.closest('a')) {
                    saveScrollPosition();
                }
            });
            
            // Зберігаємо перед виходом зі сторінки
            window.addEventListener('beforeunload', saveScrollPosition);
            
            // Для SPA навігації
            if (window.Turbo) {
                document.addEventListener('turbo:before-visit', saveScrollPosition);
                document.addEventListener('turbo:load', function() {
                    setTimeout(restoreScrollPosition, 50);
                });
            }
            
        } else {
            console.warn('Sidebar не знайдено, спробуємо пізніше...');
            // Якщо не знайшли, спробуємо ще раз через 1 секунду
            setTimeout(init, 1000);
        }
    }
    
    // Запуск при завантаженні DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Запуск при повному завантаженні
    window.addEventListener('load', function() {
        setTimeout(init, 100);
    });
    
    // Для випадків динамічного контенту
    function setupObserver() {
        if (document.body) {
            const observer = new MutationObserver(function(mutations) {
                if (!sidebar) {
                    mutations.forEach(function(mutation) {
                        if (mutation.addedNodes.length > 0) {
                            const newSidebar = findSidebar();
                            if (newSidebar && !sidebar) {
                                sidebar = newSidebar;
                                init();
                            }
                        }
                    });
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        } else {
            // Якщо body ще не доступний, спробуємо пізніше
            setTimeout(setupObserver, 100);
        }
    }
    
    // Запускаємо observer тільки після того, як body буде доступний
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupObserver);
    } else {
        setupObserver();
    }
    
})();