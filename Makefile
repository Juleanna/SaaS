# Makefile для SaaS Mini-Store Platform

.PHONY: help
help:
	@echo "SaaS Mini-Store Platform - Доступні команди:"
	@echo ""
	@echo "  make install          - Встановити всі залежності"
	@echo "  make install-dev      - Встановити залежності для розробки"
	@echo "  make migrate          - Застосувати міграції БД"
	@echo "  make migrations       - Створити нові міграції"
	@echo "  make test             - Запустити всі тести"
	@echo "  make test-cov         - Запустити тести з coverage"
	@echo "  make lint             - Перевірити код (flake8)"
	@echo "  make format           - Форматувати код (black + isort)"
	@echo "  make security         - Перевірити безпеку (bandit)"
	@echo "  make hooks-install    - Встановити pre-commit hooks"
	@echo "  make hooks-run        - Запустити pre-commit hooks вручну"
	@echo "  make run              - Запустити dev server"
	@echo "  make celery           - Запустити Celery worker"
	@echo "  make celery-beat      - Запустити Celery beat"
	@echo "  make clean            - Очистити кеш та тимчасові файли"
	@echo ""

.PHONY: install
install:
	pip install -r backend/requirements.txt

.PHONY: install-dev
install-dev:
	pip install -r backend/requirements.txt -r backend/requirements-dev.txt

.PHONY: migrate
migrate:
	cd backend && python manage.py migrate

.PHONY: migrations
migrations:
	cd backend && python manage.py makemigrations

.PHONY: test
test:
	cd backend && pytest

.PHONY: test-cov
test-cov:
	cd backend && pytest --cov=. --cov-report=html --cov-report=term-missing

.PHONY: lint
lint:
	cd backend && flake8 . --max-line-length=120

.PHONY: format
format:
	cd backend && black .
	cd backend && isort .

.PHONY: security
security:
	cd backend && bandit -r . -c pyproject.toml

.PHONY: run
run:
	cd backend && python manage.py runserver

.PHONY: celery
celery:
	cd backend && celery -A core worker -l info

.PHONY: celery-beat
celery-beat:
	cd backend && celery -A core beat -l info

.PHONY: hooks-install
hooks-install:
	pip install pre-commit
	pre-commit install
	@echo "✅ Pre-commit hooks встановлено!"

.PHONY: hooks-run
hooks-run:
	pre-commit run --all-files

.PHONY: clean
clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type f -name "*.pyo" -delete 2>/dev/null || true
	find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name ".coverage" -delete 2>/dev/null || true
	find . -type d -name "htmlcov" -exec rm -rf {} + 2>/dev/null || true
