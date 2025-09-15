# backend/Dockerfile
FROM php:8.2-apache

# libs pour Symfony + PostgreSQL
RUN apt-get update && apt-get install -y \
    libicu-dev libzip-dev libpq-dev git unzip \
 && docker-php-ext-install intl zip pdo pdo_pgsql

# Apache -> /public + mod_rewrite
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/000-default.conf \
 && printf "<Directory /var/www/html/public>\n\tAllowOverride All\n</Directory>\n" >> /etc/apache2/apache2.conf \
 && a2enmod rewrite \
 && echo "ServerName localhost" >> /etc/apache2/apache2.conf

# Composer
RUN curl -sS https://getcomposer.org/installer \
 | php -- --install-dir=/usr/local/bin --filename=composer

WORKDIR /var/www/html

# (build time) on copie seulement les manifest pour cache Composer
COPY composer.json composer.lock* ./

# (optionnel en dev, utile en prod si pas de volume)
# RUN composer install --no-interaction --prefer-dist --no-progress

# code Symfony
COPY . .

EXPOSE 80
