"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.1/topics/http/urls/
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
import os
from django.conf import settings
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.static import serve

SOUNDS_DIR = os.path.join(settings.BASE_DIR, 'quiz', 'static', 'quiz', 'sounds')

urlpatterns = [
    path('admin/', admin.site.urls),
    re_path(r'^sounds/(?P<path>.*)$', serve, {'document_root': SOUNDS_DIR}),
    path('', include('quiz.urls')),
]
