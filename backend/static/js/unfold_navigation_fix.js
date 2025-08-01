// Unfold Admin Navigation Position Fix

document.addEventListener('DOMContentLoaded', function() {
    
    // Збереження позиції прокрутки сайдбару
    const sidebar = document.querySelector('.unfold-sidebar');
    const navigation = document.querySelector('.unfold-navigation');
    
    if (sidebar && navigation) {
        // Відновлення позиції прокрутки з localStorage
        const savedScrollPosition = localStorage.getItem('unfold-sidebar-scroll');
        if (savedScrollPosition) {
            sidebar.scrollTop = parseInt(savedScrollPosition);
        }
        
        // Збереження позиції прокрутки при зміні
        let scrollTimeout;
        sidebar.addEventListener('scroll', function() {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(function() {
                localStorage.setItem('unfold-sidebar-scroll', sidebar.scrollTop);
            }, 100);
        });
        
        // Запобігання стрибанню до початку при кліку на посилання
        const navLinks = navigation.querySelectorAll('a');
        navLinks.forEach(function(link) {
            link.addEventListener('click', function(e) {
                // Зберігаємо поточну позицію
                localStorage.setItem('unfold-sidebar-scroll', sidebar.scrollTop);
            });
        });
    }
    
    // Smooth scroll для навігації всередині сайдбару
    const navItems = document.querySelectorAll('.unfold-navigation-item');
    navItems.forEach(function(item) {
        item.addEventListener('click', function(e) {
            // Додаємо smooth scroll behavior
            if (sidebar) {
                sidebar.style.scrollBehavior = 'smooth';
                setTimeout(function() {
                    sidebar.style.scrollBehavior = 'auto';
                }, 500);
            }
        });
    });
    
    // Виправлення для випадкових стрибків при завантаженні
    window.addEventListener('load', function() {
        if (sidebar && savedScrollPosition) {
            setTimeout(function() {
                sidebar.scrollTop = parseInt(savedScrollPosition);
            }, 100);
        }
    });
    
    // Покращення для мобільних пристроїв
    if (window.innerWidth <= 768) {
        const sidebarToggle = document.querySelector('[data-unfold-sidebar-toggle]');
        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', function() {
                setTimeout(function() {
                    const savedPosition = localStorage.getItem('unfold-sidebar-scroll');
                    if (savedPosition) {
                        sidebar.scrollTop = parseInt(savedPosition);
                    }
                }, 300);
            });
        }
    }
});

// Збереження стану розгорнутих секцій
document.addEventListener('DOMContentLoaded', function() {
    const expandableItems = document.querySelectorAll('[data-unfold-expandable]');
    
    expandableItems.forEach(function(item) {
        const key = 'unfold-expanded-' + item.dataset.unfoldExpandable;
        const isExpanded = localStorage.getItem(key) === 'true';
        
        if (isExpanded) {
            item.classList.add('expanded');
        }
        
        item.addEventListener('click', function() {
            const expanded = item.classList.toggle('expanded');
            localStorage.setItem(key, expanded);
        });
    });
});