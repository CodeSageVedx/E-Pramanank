from django.urls import path
from .import views

urlpatterns = [
    path('', views.index, name='index'),
    path('about', views.about, name='about'),
    path('register/', views.register, name='register'),

    path("generate-pdf/", views.generate_pdf, name="generate_pdf"),
    path('login/', views.login, name='login'),

]
