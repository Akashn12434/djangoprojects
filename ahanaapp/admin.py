from django.contrib import admin
from .models import Chat, FileUpload,WebPage

@admin.register(Chat)
class ChatAdmin(admin.ModelAdmin):
    list_display = ('session_id', 'timestamp', 'user_message', 'short_bot_response')
    search_fields = ('session_id', 'user_message', 'bot_response')
    list_filter = ('timestamp',)
    ordering = ('-timestamp',)
    list_per_page = 10

    def short_bot_response(self, obj):
        return obj.bot_response[:400] + "..." if len(obj.bot_response) > 400 else obj.bot_response
    short_bot_response.short_description = 'Bot Response'

@admin.register(FileUpload)
class FileUploadAdmin(admin.ModelAdmin):
    list_display = ('file_name', 'timestamp', 'short_bot_response')
    search_fields = ('file_name', 'bot_response')
    list_filter = ('timestamp',)
    ordering = ('-timestamp',)
    list_per_page = 10

    def short_bot_response(self, obj):
        return obj.bot_response[:400] + "..." if len(obj.bot_response) > 400 else obj.bot_response
    short_bot_response.short_description = 'Bot Response'

@admin.register(WebPage)
class WebPageAdmin(admin.ModelAdmin):
    list_display = ('url', 'title', 'short_content')
    search_fields = ('url', 'title')
    ordering = ('url',)
    list_per_page = 10

    def short_content(self, obj):
        return obj.content[:400] + "..." if len(obj.content) > 400 else obj.content
    short_content.short_description = 'Content Preview'