import os
from celery import Celery
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "djangoprojects.settings")
app = Celery("djangoprojects")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()