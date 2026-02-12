# Multi-stage build для оптимізації розміру image

# ============================================
# Stage 1: Builder - Збірка React додатку
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Встановити залежності (кешується окремо від коду)
COPY package*.json ./
RUN npm ci --only=production=false && npm cache clean --force

# Копіювати код та зібрати production build
COPY . .
RUN npm run build

# Результат: /app/dist/ містить оптимізовані статичні файли

# ============================================
# Stage 2: Development - Vite dev server
# ============================================
FROM node:20-alpine AS development

WORKDIR /app

# Встановити залежності
COPY package*.json ./
RUN npm install && npm cache clean --force

# Копіювати код
COPY . .

# Expose порт для Vite dev server
EXPOSE 3000

# Команда для development (з hot reload)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]

# ============================================
# Stage 3: Production - Nginx для serving
# ============================================
FROM nginx:1.25-alpine AS production

# Копіювати build з builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Копіювати Nginx конфігурацію
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Створити non-root user для безпеки
RUN adduser -D -u 1000 frontend && \
    chown -R frontend:frontend /usr/share/nginx/html /var/cache/nginx /var/run /var/log/nginx && \
    chmod -R 755 /usr/share/nginx/html

# Додати healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1

# Expose порт
EXPOSE 3000

# Запустити Nginx
USER frontend
CMD ["nginx", "-g", "daemon off;"]
