FROM php:8.2-apache

RUN apt-get update && apt-get install -y \
    libicu-dev libzip-dev libpq-dev git unzip \
 && docker-php-ext-install intl zip pdo pdo_pgsql

ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/000-default.conf \
 && printf "<Directory /var/www/html/public>\n\tAllowOverride All\n</Directory>\n" >> /etc/apache2/apache2.conf \
 && a2enmod rewrite \
 && echo "ServerName localhost" >> /etc/apache2/apache2.conf

RUN curl -sS https://getcomposer.org/installer \
 | php -- --install-dir=/usr/local/bin --filename=composer

WORKDIR /var/www/html


COPY composer.json composer.lock* ./

COPY . .

EXPOSE 80
