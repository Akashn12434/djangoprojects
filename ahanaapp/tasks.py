import os
import sys
import django
import json
import logging
from celery import shared_task
from django.db import transaction
import subprocess






# ✅ Set up Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "djangoprojects.settings")
django.setup()

from ahanaapp.models import WebPage

# ✅ Setup logger
logger = logging.getLogger(__name__)

@shared_task
def save_webpage(url, title, content, internal_links, external_links):
    logger.info(f"📥 Task received: Processing webpage {url}")
    sys.stdout.flush()  # ✅ Immediate log flushing

    try:
        # ✅ Ensure links are properly formatted
        internal_links = json.loads(internal_links) if isinstance(internal_links, str) else internal_links
        external_links = json.loads(external_links) if isinstance(external_links, str) else external_links

        with transaction.atomic():
            webpage, created = WebPage.objects.update_or_create(
                url=url,
                defaults={
                    "title": title,
                    "content": content,
                    "internal_links": internal_links,
                    "external_links": external_links,  # ✅ Now storing external links too
                }
            )

        logger.info(f"✅ Successfully processed webpage: {url} (Created: {created})")
        sys.stdout.flush()  # ✅ Ensures logs appear immediately

    except Exception as e:
        logger.error(f"❌ Error saving webpage {url} to database: {e}")
        sys.stdout.flush()

    if created:
        logger.info(f"✅ New webpage saved: {url}")
    else:
        logger.debug(f"🔄 Webpage updated: {url}")

    logger.info(f"🔗 Internal Links Saved: {internal_links}")
    logger.info(f"🌍 External Links Saved: {external_links}")  # ✅ New logging for external links
    logger.info("🎯 Celery task completed successfully!")
    sys.stdout.flush()  # ✅ Final log flush to ensure visibility

    return webpage




@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def run_spider_task(self, start_url):
    try:
        scrapy_path = os.path.join(sys.prefix, "Scripts", "scrapy.exe")  # Virtualenv-safe path
        scrapy_project_dir = r"C:\Users\user\djangoprojects\scrapy_crawler"  # Your scrapy.cfg directory

        logger.info(f"Starting scrapy crawl for: {start_url}")
  
        result = subprocess.run(
            [scrapy_path, "crawl", "deep", "-a", f"start_url={start_url}"],
            cwd=scrapy_project_dir,
            capture_output=True,
            text=True,
            check=True,
        )

        logger.info(f"Scrapy crawl completed successfully.\nOutput:\n{result.stdout}")
        sys.stdout.flush()
        logger.info(f"📍 Using project directory: {scrapy_project_dir}")

    except subprocess.CalledProcessError as e:
        logger.error(f"Scrapy crawl failed.\nError Output:\n{e.stderr}")
        self.retry(exc=e)
    except Exception as e:       
        logger.error(f"❌ Unexpected error in run_spider_task for {start_url}: {e}")
        self.retry(exc=e)
