import os
import django
import json
import logging
import sys  # ✅ Import sys for forced print flushing

# ✅ Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "djangoprojects.settings")
django.setup()

from ahanaapp.tasks import save_webpage

# ✅ Setup logger
logger = logging.getLogger(__name__)

class DjangoWriterPipeline:
    def process_item(self, item, spider):
        internal_links = json.dumps(item.get("internal_links", []))
        external_links = json.dumps(item.get("external_links", []))  # ✅ Store external links separately

        logger.info(f"📤 Sending task to Celery: {item['url']}")
        sys.stdout.flush()

        # ✅ Debugging to ensure Celery receives the task correctly
        try:
            save_webpage.delay(
                item["url"],
                item.get("title", ""),
                item.get("content", ""),
                internal_links,
                external_links  # ✅ Now sending external links as well
            )
            logger.info(f"✅ Task successfully sent for {item['url']}")
            sys.stdout.flush() 
        except Exception as e:
            logger.error(f"❌ Error sending task to Celery for {item['url']}: {e}")
            sys.stdout.flush()

        return item
