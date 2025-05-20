from django.db import models
import uuid

class Chat(models.Model):
    session_id = models.UUIDField(db_index=True)  # ✅ Faster lookups
    timestamp = models.DateTimeField(auto_now_add=True)
    user_message = models.TextField()
    bot_response = models.TextField()

    def __str__(self):
        return f"Session {self.session_id} - {self.timestamp}"

class FileUpload(models.Model):
    session_id = models.UUIDField(db_index=True)  # ✅ Faster file retrieval
    timestamp = models.DateTimeField(auto_now_add=True)
    file_name = models.CharField(max_length=255)
    extracted_text = models.TextField()
    bot_response = models.TextField()

    def __str__(self):
        return f"File {self.file_name} - {self.timestamp}"



from django.db import models

class WebPage(models.Model):
    url = models.URLField(unique=True)
    title = models.CharField(max_length=255, blank=True)
    content = models.TextField(blank=True)
    summary = models.TextField(blank=True)  # ✅ New field for summaries
    internal_links = models.JSONField(default=list)
    external_links = models.JSONField(default=list)

    def __str__(self):
        return self.title or self.url
