from django.contrib import admin
from django.urls import path,include


admin.site.site_header = "E-KYC Admin"  
admin.site.site_title = "E-KYC"
admin.site.index_title = "Welcome to E-KYC admin panel "


urlpatterns = [
    path('admin/', admin.site.urls),
    path('',include('ekyc.urls')),
]
