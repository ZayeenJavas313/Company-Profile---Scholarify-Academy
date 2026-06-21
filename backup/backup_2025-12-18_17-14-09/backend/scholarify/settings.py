from pathlib import Path
import os
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get("SECRET_KEY", "dev-only")
DEBUG = os.environ.get("DEBUG", "False") == "True"

ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third party
    'import_export',
    'rest_framework',
    'corsheaders',

    # Local apps
    'quiz',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # CORS harus sebelum CommonMiddleware
    'whitenoise.middleware.WhiteNoiseMiddleware',

    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# WhiteNoise configuration - jangan serve media files dengan WhiteNoise
# Media files akan di-serve oleh Django static() di urls.py
WHITENOISE_USE_FINDERS = False

ROOT_URLCONF = 'scholarify.urls'
WSGI_APPLICATION = 'scholarify.wsgi.application'

# ==============================
# DATABASE CONFIG FOR RENDER
# ==============================
DATABASES = {
    "default": dj_database_url.config(
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        conn_max_age=600,
        ssl_require=False
    )
}

# Static files for Render
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# ==============================
# CACHE CONFIGURATION
# ==============================
# Database Cache - Persistent, tidak hilang saat restart server
# Password user akan tersimpan di database cache sehingga tetap bisa dilihat admin
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.db.DatabaseCache',
        'LOCATION': 'cache_table',
    }
}
# 
# Opsi Alternatif (jika tidak ingin menggunakan Database Cache):
#
# Opsi 2: Redis Cache (Untuk high traffic)
# CACHES = {
#     'default': {
#         'BACKEND': 'django.core.cache.backends.redis.RedisCache',
#         'LOCATION': os.environ.get('REDIS_URL', 'redis://127.0.0.1:6379/1'),
#     }
# }
#
# Opsi 3: File-based Cache (Alternatif sederhana)
# CACHES = {
#     'default': {
#         'BACKEND': 'django.core.cache.backends.filebased.FileBasedCache',
#         'LOCATION': BASE_DIR / 'cache',
#     }
# }

# CORS
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_CREDENTIALS = True  # Penting untuk credentials: "include"

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://frontend-scholarify-zayeenjavas313s-projects.vercel.app",
    "https://scholarify.vercel.app",
]

# Allow media files to be accessed from frontend
CORS_URLS_REGEX = r'^/(api|media)/.*$'

# CSRF Trusted Origins (WAJIB untuk deploy)
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://frontend-scholarify-zayeenjavas313s-projects.vercel.app",
    "https://scholarify.vercel.app",
    "https://*.onrender.com",
    "https://*.railway.app",
]

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],  # Jika tidak punya folder templates, boleh ganti []
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]
