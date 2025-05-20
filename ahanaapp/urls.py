
from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("upload/", views.upload_file, name="upload_file"),
    path("chatbot/", views.chatbot, name="chatbot"),
]
