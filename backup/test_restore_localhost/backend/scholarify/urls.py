"""
URL configuration for scholarify project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from django.urls import re_path
import os

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('quiz.urls')),
]

# Serve media files (baik development maupun production)
# Di production, gunakan web server (Nginx) untuk serve media files
if settings.DEBUG:
    # Development: Django serve media files
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
else:
    # Production: Serve media files manually (fallback jika tidak ada web server)
    media_root = settings.MEDIA_ROOT
    if os.path.exists(media_root):
        urlpatterns += [
            re_path(r'^media/(?P<path>.*)$', serve, {'document_root': media_root}),
        ]
