# Backend Dockerfile for SaaS Mini-Store Platform
# Python 3.11 slim image
FROM python:3.11-slim

# Metadata
LABEL maintainer="SaaS Platform Team"
LABEL description="Django Backend for SaaS Mini-Store Platform"
LABEL version="2.0"

# Встановити змінні середовища
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Встановити системні залежності
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    postgresql-client \
    gettext \
    netcat-traditional \
    curl \
    wait-for-it \
    && rm -rf /var/lib/apt/lists/*

# Створити робочу директорію
WORKDIR /app

# Копіювати requirements та встановити Python залежності
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install -r requirements.txt && \
    pip install gunicorn psycopg2-binary

# Копіювати код проекту
COPY . .

# Створити директорії для статики та медіа
RUN mkdir -p /app/staticfiles /app/media

# Копіювати entrypoint скрипт
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Створити non-root користувача
RUN useradd -m -u 1000 django && \
    chown -R django:django /app

# Відкрити порт
EXPOSE 8000

# Перемкнутись на non-root користувача
USER django

# Entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]

# Команда за замовчуванням
CMD ["gunicorn", "core.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120"]
