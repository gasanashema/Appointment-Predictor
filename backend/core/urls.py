from django.contrib import admin
from django.urls import path, include
from django.shortcuts import render

from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

# -------- FRONTEND VIEWS --------

def landing(request):
    return render(request, "landing.html")

def login_view(request):
    return render(request, "login.html")

def dashboard(request):
    return render(request, "dashboard.html")


urlpatterns = [
    path("admin/", admin.site.urls),

    # Landing Page
    path("", landing, name="landing"),

    # Login Page
    path("login/", login_view, name="login"),

    # Dashboard Page
    path("dashboard/", dashboard, name="dashboard"),

    # API
    path("api/", include("api.urls")),

    # Swagger Docs
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]
