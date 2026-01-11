from django.contrib import admin
from django.urls import path, include
from core.views import login_view

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('core.urls')),         # Connects to your App
    path('api-token-auth/', login_view),  # Use custom login view
]