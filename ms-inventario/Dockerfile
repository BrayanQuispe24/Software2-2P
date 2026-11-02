# ==========================================
# Dockerfile - MS Inventario (PHP 8.2 / Laravel)
# ==========================================

FROM php:8.2-cli-alpine

WORKDIR /var/www/html

# Instalar dependencias del sistema y extensiones de PHP para PostgreSQL
RUN apk add --no-cache \
    postgresql-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    curl \
    oniguruma-dev \
    libxml2-dev \
    linux-headers

RUN docker-php-ext-install pdo pdo_pgsql pgsql mbstring zip bcmath

# Instalar Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copiar dependencias
COPY composer.json composer.lock ./

RUN composer install --no-interaction --no-scripts --no-progress --prefer-dist

# Copiar el resto del código
COPY . .

RUN composer dump-autoload --optimize

# Permisos para storage y bootstrap/cache
RUN chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

EXPOSE 8084

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8084"]
