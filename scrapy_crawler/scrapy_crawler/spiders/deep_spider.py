import scrapy
from scrapy_playwright.page import PageMethod
from urllib.parse import urljoin, urlparse
from scrapy_crawler.items import WebPageItem
from w3lib.html import remove_tags
import logging
import sys


class DeepSpider(scrapy.Spider):
    name = "deep"

    custom_settings = {
        "PLAYWRIGHT_PAGE_COROUTINES": [
            PageMethod("wait_for_selector", "button.dropdown-toggle", timeout=3000),
            PageMethod("click", "button.dropdown-toggle", timeout=3000),
            PageMethod("wait_for_timeout", 1500),
            PageMethod("click", ".accordion-button", timeout=3000),
            PageMethod("wait_for_timeout", 1500),
            PageMethod("click", ".tab-link", timeout=3000),
            PageMethod("wait_for_timeout", 1500),
            PageMethod("evaluate", "window.scrollTo(0, document.body.scrollHeight)"),
            PageMethod("wait_for_timeout", 2000),
        ]
    }

    def __init__(self, start_url=None, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if not start_url:
            raise ValueError("❌ Error: No start URL provided! Use -a start_url=<YOUR_URL>")
        self.start_urls = [start_url]
        self.allowed_domain = urlparse(start_url).netloc
        self.visited_urls = set()

    async def start(self):
        for url in self.start_urls:
            self.logger.info(f"🚀 Starting crawl at: {url}")
            yield scrapy.Request(
                url,
                callback=self.parse,
                meta={
                    "playwright": True,
                    "playwright_include_page": True,
                    "playwright_page_methods": [
                        PageMethod("wait_for_load_state", "networkidle"),
                        PageMethod("wait_for_timeout", 2000),
                    ]
                }
            )

    def parse(self, response):
        content_type = response.headers.get("Content-Type", b"").decode()
        if "text/html" not in content_type:
            self.logger.warning(f"⚠️ Skipping non-HTML content: {response.url}")
            return

        if response.url in self.visited_urls:
            self.logger.info(f"🔁 Already visited: {response.url}")
            return
        self.visited_urls.add(response.url)

        self.logger.info(f"🕵️ Crawling: {response.url}")
        sys.stdout.flush()

        # Remove unnecessary tags
        for elem in response.xpath('//script | //style | //noscript'):
            root = elem.root
            if root is not None:
                root.getparent().remove(root)

        # Selectors for textual content
        selectors = [
            "header *::text", "footer *::text", "nav *::text",
            "h1::text", "h2::text", "h3::text", "h4::text", "h5::text",
            "p::text", "section *::text", "article *::text",
            "ul li::text", "ol li::text", "span::text", "a::text",
            "button::text", ".accordion-button::text", ".tab-link::text",
            "[class*='content'] *::text", "[class*='body'] *::text",
            "[class*='main'] *::text", "[class*='text'] *::text",
            "[id*='content'] *::text",
        ]

        content_list = []
        for sel in selectors:
            content_list.extend(response.css(sel).getall())

        raw_text = remove_tags(response.text)
        raw_text = ' '.join(raw_text.split())
        content_list.append(raw_text)

        # Filter and deduplicate content
        filtered_content = []
        seen = set()
        for text in content_list:
            text = text.strip()
            if len(text) < 40:
                continue
            if any(x in text for x in ["function(", "var ", "const ", "let ", "return ", "http", "{", "}", ";"]):
                continue
            if text not in seen:
                seen.add(text)
                filtered_content.append(text)

        content = " ".join(filtered_content).strip()

        # Extract links
        all_links = [urljoin(response.url, link) for link in response.css("a::attr(href)").getall() if link]
        internal_links = [link for link in all_links if urlparse(link).netloc == self.allowed_domain]
        external_links = [link for link in all_links if urlparse(link).netloc != self.allowed_domain]

        self.logger.info(f"🔗 Found {len(internal_links)} internal & {len(external_links)} external links at {response.url}")

        # Yield scraped item
        item = WebPageItem()
        item["url"] = response.url
        item["title"] = response.css("title::text").get(default="No Title Found")
        item["content"] = content or "No Extracted Content"
        item["internal_links"] = internal_links
        item["external_links"] = external_links
        yield item

        # Crawl internal links recursively
        blocked = ['login', 'register', 'admin', 'logout', '.pdf', '.zip', '.exe', '.jpg', '.jpeg', '.png', '.gif']
        for next_url in internal_links:
            if next_url not in self.visited_urls and not any(ext in next_url for ext in blocked):
                self.visited_urls.add(next_url)
                yield scrapy.Request(
                    next_url,
                    callback=self.parse,
                    meta={
                        "playwright": True,
                        "playwright_include_page": True,
                        "playwright_page_methods": [
                            PageMethod("wait_for_load_state", "networkidle"),
                            PageMethod("wait_for_timeout", 2000),
                        ]
                    },
                    dont_filter=True
                )
