import os
import ssl
import logging
from flask import Flask, jsonify, render_template, request
import feedparser
import requests
from bs4 import BeautifulSoup
import urllib3

# Suppress insecure request warnings if we bypass SSL verification in fallback
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

app = Flask(__name__)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Bypass SSL verification for macOS Python environment issues
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

FEED_URL = 'https://docs.cloud.google.com/feeds/bigquery-release-notes.xml'

# In-memory cache
cache = {
    'data': None
}

def parse_release_notes():
    logger.info(f"Fetching release notes from {FEED_URL}")
    
    feed = feedparser.parse(FEED_URL)
    
    # If feedparser fails (e.g. SSL verify issues), retry with requests
    if feed.bozo:
        logger.warning(f"Feedparser returned bozo=True ({feed.get('bozo_exception')}). Retrying with requests...")
        try:
            response = requests.get(FEED_URL, timeout=10, verify=False)
            response.raise_for_status()
            feed = feedparser.parse(response.text)
        except Exception as e:
            logger.error(f"Failed to fetch feed with requests: {e}")
            if cache['data']:
                logger.info("Returning cached data due to fetch failure")
                return cache['data'], True
            raise e

    if not feed.entries:
        logger.warning("No entries found in the parsed feed")
        if cache['data']:
            return cache['data'], True
        return [], False

    parsed_updates = []
    
    for entry_idx, entry in enumerate(feed.entries):
        date_str = entry.get('title', 'Unknown Date')
        updated_str = entry.get('updated', '')
        link_str = entry.get('link', 'https://docs.cloud.google.com/bigquery/docs/release-notes')
        summary_html = entry.get('summary', '')
        
        soup = BeautifulSoup(summary_html, 'html.parser')
        
        current_type = None
        current_content = []
        sub_idx = 0
        
        def add_update(update_type, html_content_list, sub_index):
            content_html = ''.join(str(c) for c in html_content_list).strip()
            if not content_html:
                return
            
            # Parse text details
            text_soup = BeautifulSoup(content_html, 'html.parser')
            text_content = text_soup.get_text()
            text_content = " ".join(text_content.split())
            
            unique_id = f"{date_str.replace(' ', '-').replace(',', '').lower()}-{sub_index}"
            
            final_link = link_str
            if '#' not in link_str:
                final_link = f"{link_str}#{date_str.replace(' ', '_').replace(',', '')}"
                
            parsed_updates.append({
                'id': unique_id,
                'date': date_str,
                'updated': updated_str,
                'type': update_type,
                'html_content': content_html,
                'text_content': text_content,
                'link': final_link
            })

        for child in soup.contents:
            if child.name == 'h3':
                if current_type:
                    add_update(current_type, current_content, sub_idx)
                    sub_idx += 1
                current_type = child.get_text().strip()
                current_content = []
            else:
                if current_type:
                    current_content.append(child)
        
        if current_type:
            add_update(current_type, current_content, sub_idx)
            
    # Cache the updates
    cache['data'] = parsed_updates
    return parsed_updates, False

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def get_release_notes():
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    
    if not force_refresh and cache['data'] is not None:
        return jsonify({
            'status': 'success',
            'source': 'cache',
            'updates': cache['data']
        })
        
    try:
        updates, was_cached = parse_release_notes()
        return jsonify({
            'status': 'success',
            'source': 'cache' if was_cached else 'live',
            'updates': updates
        })
    except Exception as e:
        logger.exception("Error fetching release notes")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    # Bind to localhost
    app.run(debug=True, port=8080)
