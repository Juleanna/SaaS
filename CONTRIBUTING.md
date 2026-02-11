# 🤝 Contributing to SaaS Mini-Store Platform

Дякуємо за інтерес до нашого проекту! Цей документ містить інструкції для розробників.

## 📋 Зміст

1. [Початок роботи](#-початок-роботи)
2. [Workflow розробки](#-workflow-розробки)
3. [Pre-commit Hooks](#-pre-commit-hooks)
4. [Code Style](#-code-style)
5. [Тестування](#-тестування)
6. [Git Flow](#-git-flow)
7. [Pull Requests](#-pull-requests)

---

## 🚀 Початок роботи

### 1. Fork та клонування

```bash
# Fork репозиторій на GitHub
# Потім клонуйте ваш fork
git clone https://github.com/YOUR_USERNAME/SaaS.git
cd SaaS

# Додайте upstream remote
git remote add upstream https://github.com/Juleanna/SaaS.git
```

### 2. Встановлення залежностей

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt -r requirements-dev.txt

# Frontend
cd ../frontend
npm install
```

### 3. Налаштування середовища

```bash
# Копіюйте .env.example та налаштуйте змінні
cd backend
cp env.example .env

# Налаштуйте БД та запустіть міграції
python manage.py migrate
```

---

## 🔄 Workflow розробки

### Основні команди (Makefile)

```bash
# Показати всі доступні команди
make help

# Встановити dev залежності
make install-dev

# Запустити тести
make test
make test-cov  # з coverage

# Форматування коду
make format    # black + isort

# Лінтинг
make lint      # flake8

# Security check
make security  # bandit

# Запустити dev server
make run

# Celery
make celery
make celery-beat

# Очистити кеш
make clean
```

---

## 🎣 Pre-commit Hooks

### Що це таке?

Pre-commit hooks автоматично перевіряють ваш код перед кожним commit. Це допомагає:
- 🔒 Запобігти commit секретних ключів
- ✨ Автоматично форматувати код
- 🐛 Виявляти помилки до CI/CD
- 📝 Підтримувати єдиний стиль коду

### Встановлення

```bash
# Опція 1: Використати Makefile
make hooks-install

# Опція 2: Вручну
pip install pre-commit
pre-commit install
```

### Запуск вручну

```bash
# Перевірити всі файли
make hooks-run

# Або
pre-commit run --all-files

# Перевірити тільки staged файли
pre-commit run
```

### Hooks що виконуються

#### 🔧 Базові перевірки
- ✂️ **trailing-whitespace** - видаляє пробіли в кінці рядків
- 📄 **end-of-file-fixer** - додає порожній рядок в кінці файлу
- ✅ **check-yaml** - перевіряє синтаксис YAML
- 📦 **check-added-large-files** - блокує великі файли (>1MB)
- 🔍 **check-json/toml** - перевіряє синтаксис
- 🚫 **check-merge-conflict** - виявляє конфлікти merge
- 🐛 **debug-statements** - знаходить debugger imports
- 🔐 **detect-private-key** - КРИТИЧНО! Блокує приватні ключі

#### 🐍 Python Hooks
- **Black** - автоматичне форматування (120 символів)
- **isort** - сортування імпортів
- **flake8** - лінтинг (з Django плагінами)
- **Bandit** - security scan

#### 🎯 Django Hooks
- **django-check** - `python manage.py check`
- **django-check-migrations** - перевіряє відсутні міграції

#### ⚛️ Frontend Hooks
- **ESLint** - JavaScript/React лінтинг
- **Prettier** - форматування JS/CSS/JSON

### Обхід hooks (тільки якщо дуже потрібно!)

```bash
# Пропустити hooks для одного commit
git commit --no-verify -m "Emergency fix"

# НЕ РЕКОМЕНДУЄТЬСЯ! Використовуйте тільки в крайніх випадках
```

### Що робити якщо hook failить?

#### 1. Auto-fix hooks (Black, isort, Prettier)
Ці hooks автоматично виправляють файли. Просто:
```bash
git add .
git commit -m "Your message"
# Hooks виправлять файли, потім:
git add .
git commit -m "Your message"
```

#### 2. Manual fix hooks (flake8, Bandit)
Читайте помилки та виправте їх:
```bash
# Приклад flake8 помилки
# backend/core/views.py:42:80: E501 line too long (95 > 120 characters)

# Виправте помилку у файлі
# Потім commit знову
```

#### 3. Django check failed
```bash
# Якщо є проблема з моделями
cd backend
python manage.py check

# Виправте помилки
# Якщо не вистачає міграцій
python manage.py makemigrations
```

---

## 📝 Code Style

### Python (Backend)

**Використовуйте Black formatter:**
```bash
cd backend
black .
```

**Налаштування:**
- Line length: 120 символів
- Python version: 3.11
- String quotes: подвійні (`"`)

**Django conventions:**
```python
# Models
class StoreName(models.Model):
    """Docstring for model"""

    field_name = models.CharField(max_length=255)

    class Meta:
        verbose_name = "Store Name"
        ordering = ["-created_at"]

    def __str__(self):
        return self.field_name

# Views
class ViewNameViewSet(viewsets.ModelViewSet):
    """Docstring for viewset"""

    queryset = Model.objects.all()
    serializer_class = ModelSerializer
    permission_classes = [IsAuthenticated]
```

**Imports order (isort):**
```python
# 1. Standard library
import os
from datetime import datetime

# 2. Django
from django.db import models
from django.contrib.auth import get_user_model

# 3. Third-party
from rest_framework import viewsets
from celery import shared_task

# 4. Local
from core.models import Store
from core.serializers import StoreSerializer
```

### JavaScript/React (Frontend)

**Використовуйте Prettier:**
```bash
cd frontend
npx prettier --write .
```

**ESLint rules:**
- React Hooks rules
- PropTypes required
- No console.log in production

**Компоненти:**
```jsx
// Functional components з hooks
import { useState, useEffect } from 'react';

export const ComponentName = ({ prop1, prop2 }) => {
  const [state, setState] = useState(initialValue);

  useEffect(() => {
    // Effect logic
  }, [dependencies]);

  return (
    <div className="component-name">
      {/* JSX */}
    </div>
  );
};

ComponentName.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.number,
};
```

### Загальні правила

✅ **DO:**
- Пишіть docstrings для класів та функцій
- Використовуйте type hints в Python
- Додавайте коментарі для складної логіки
- Пишіть тести для нового коду
- Використовуйте осмислені назви змінних

❌ **DON'T:**
- Не commit'те закоментований код
- Не використовуйте `print()` для debugging (використовуйте logging)
- Не commit'те `.env` файли
- Не пропускайте pre-commit hooks без причини
- Не додавайте великі файли (images, videos) в git

---

## 🧪 Тестування

### Написання тестів

**Backend (pytest):**
```python
# backend/app/tests/test_models.py
import pytest
from app.models import Model

@pytest.mark.unit
class TestModelName:
    """Tests for Model"""

    def test_create_model(self, db):
        """Test model creation"""
        obj = Model.objects.create(field="value")
        assert obj.field == "value"
```

**Markers:**
- `@pytest.mark.unit` - unit тести
- `@pytest.mark.integration` - integration тести
- `@pytest.mark.security` - security тести
- `@pytest.mark.slow` - повільні тести

### Запуск тестів

```bash
# Всі тести
make test

# З coverage
make test-cov

# Тільки unit тести
cd backend && pytest -m unit

# Тільки один файл
cd backend && pytest accounts/tests/test_models.py

# Тільки один тест
cd backend && pytest accounts/tests/test_models.py::TestUser::test_create_user

# Пропустити повільні тести
cd backend && pytest -m "not slow"
```

### Coverage вимоги

- Новий код має мати **>80% coverage**
- Critical код (auth, payments) - **>90% coverage**

---

## 🌿 Git Flow

### Branch naming

```
feature/short-description      # Нова функціональність
bugfix/issue-123-description   # Виправлення бага
hotfix/critical-fix            # Критичне виправлення
refactor/component-name        # Рефакторинг
docs/update-readme             # Документація
```

### Commit messages

**Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat` - нова функціональність
- `fix` - виправлення бага
- `docs` - тільки документація
- `style` - форматування, no code change
- `refactor` - рефакторинг без зміни функціональності
- `test` - додавання тестів
- `chore` - зміни в build process, tools

**Examples:**
```bash
feat(auth): add password reset functionality

- Add password reset view
- Create password reset email template
- Add tests for password reset

Closes #123
```

```bash
fix(payments): resolve Stripe webhook signature verification

The webhook was failing because of incorrect signature validation.
Updated to use latest Stripe SDK method.

Fixes #456
```

### Workflow

```bash
# 1. Створити нову branch
git checkout -b feature/new-feature

# 2. Робота над feature
# ... код ...
git add .
git commit -m "feat: add new feature"

# 3. Синхронізація з upstream
git fetch upstream
git rebase upstream/main

# 4. Push в ваш fork
git push origin feature/new-feature

# 5. Створити Pull Request на GitHub
```

---

## 📬 Pull Requests

### Checklist перед створенням PR

- [ ] ✅ Всі тести проходять (`make test`)
- [ ] 📊 Coverage не зменшився (`make test-cov`)
- [ ] 🎨 Код відформатований (`make format`)
- [ ] 🔍 Лінтинг пройшов (`make lint`)
- [ ] 🔒 Security check пройшов (`make security`)
- [ ] 🎣 Pre-commit hooks встановлені
- [ ] 📝 Додано/оновлено docstrings
- [ ] 🧪 Додано тести для нового коду
- [ ] 📚 Оновлено документацію (якщо потрібно)
- [ ] 🗃️ Міграції створені (якщо є зміни в моделях)

### PR Template

```markdown
## 📝 Description
Brief description of changes.

## 🔗 Related Issue
Closes #123

## 🧪 Testing
How to test these changes:
1. Step one
2. Step two

## 📸 Screenshots (if applicable)
![Screenshot](url)

## ✅ Checklist
- [x] Tests pass
- [x] Code formatted
- [x] Documentation updated
```

### Review Process

1. **Automated checks** - CI/CD запускає тести
2. **Code review** - принаймні 1 approval потрібен
3. **Testing** - reviewer тестує зміни локально
4. **Merge** - maintainer merge'ить PR

---

## 💡 Поради

### Debugging

**Backend:**
```python
# Використовуйте Django Debug Toolbar
# Встановлено в requirements-dev.txt

# Або ipdb для debugging
import ipdb; ipdb.set_trace()

# Або logging
import logging
logger = logging.getLogger(__name__)
logger.debug("Debug message")
```

**Frontend:**
```javascript
// React DevTools extension
// Redux DevTools extension

// Console logs (видаліть перед commit!)
console.log('debug:', variable);
```

### Performance

```bash
# Profiling Django
python -m cProfile manage.py runserver

# Database query analysis
python manage.py shell
>>> from django.db import connection
>>> print(connection.queries)

# Frontend bundle analysis
cd frontend
npm run build -- --stats
```

### Корисні ресурси

- 📚 [Django Documentation](https://docs.djangoproject.com/)
- 📚 [DRF Documentation](https://www.django-rest-framework.org/)
- 📚 [React Documentation](https://react.dev/)
- 📚 [pytest Documentation](https://docs.pytest.org/)
- 📚 [pre-commit Documentation](https://pre-commit.com/)

---

## 🆘 Питання?

Якщо у вас є питання:
1. Перевірте [Documentation](./docs/)
2. Шукайте в [Issues](https://github.com/Juleanna/SaaS/issues)
3. Створіть нове issue з тегом `question`

---

**Дякуємо за ваш внесок! 🎉**
